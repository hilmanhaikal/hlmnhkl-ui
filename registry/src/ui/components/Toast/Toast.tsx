// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircleIcon, ErrorIcon, InfoIcon, XIcon } from '../../icons/icons'
import { motionMs } from '../../internal/motion'
import { createToastBud, createToastSwipe, toastId, toastLayout, toastSay, toastStack, toastTimer, watchToastHeight, type ToastLeaving, type ToastOrigin, type ToastTone } from '../../internal/motion/toast'
import { Spinner } from '../Spinner'
import styles from './Toast.module.css'

export type { ToastTone }

export type ToastOptions = {
  title: string
  description?: string
  /** Sets the icon and colour. Danger is announced at once. */
  tone?: ToastTone
  /** Shows a spinner and keeps the toast until you update it with loading: false. */
  loading?: boolean
  /** Milliseconds before it leaves. Infinity keeps it until dismissed. */
  duration?: number
  action?: { label: string; onClick: () => void }
  /** Where the action happened: the element pressed, or a point on screen. Within 240px of the toast, the drop buds out of it and a dismiss flows back into it. Further away, or without it, the drop buds out of the window's edge. */
  origin?: ToastOrigin
}

type Item = ToastOptions & { id: number; leaving: ToastLeaving }

type Api = {
  toast: (opts: ToastOptions) => number
  update: (id: number, opts: Partial<ToastOptions>) => void
  dismiss: (id: number) => void
}

const ToastCtx = createContext<Api | null>(null)

export function useToast(): Api {
  const c = useContext(ToastCtx)
  if (!c) throw new Error('useToast needs a <ToastProvider> above it')
  return c
}

export type ToastLabels = {
  /** Name of each close button. The toast title is added after it. */
  dismiss: string
}

const defaultLabels: ToastLabels = { dismiss: 'Dismiss' }

export type ToastProviderProps = {
  /** Your app. Anything inside can call useToast. */
  children: ReactNode
  /** Most toasts shown in the stack at once. */
  max?: number
  /** Name of the notification region for screen readers. */
  label?: string
  /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<ToastLabels>
}

export function ToastProvider({ children, max = 3, label = 'Notifications', labels: labelsProp }: ToastProviderProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const [items, setItems] = useState<Item[]>([])
  const [heights, setHeights] = useState<Record<number, number>>({})
  const [expanded, setExpanded] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [urgent, setUrgent] = useState('')
  const itemsRef = useRef(items)
  itemsRef.current = items
  const timers = useRef(new Set<number>())

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const say = (opts: Partial<ToastOptions>, tone?: ToastTone) => {
    const fresh = (prev: string) => toastSay(prev, opts)
    if (tone === 'danger') setUrgent(fresh)
    else setAnnounce(fresh)
  }

  const remove = useCallback((id: number, dir: Item['leaving'] = 'down') => {
    setItems((list) => list.map((t) => (t.id === id && !t.leaving ? { ...t, leaving: dir } : t)))
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      setItems((list) => list.filter((t) => t.id !== id))
      setHeights(({ [id]: _, ...rest }) => rest)
    }, motionMs('morph-out'))
    timers.current.add(timer)
  }, [])

  const api = useMemo<Api>(
    () => ({
      toast: (opts) => {
        const id = toastId()
        setItems((list) => [...list, { duration: 5000, tone: 'neutral', ...opts, id, leaving: false }])
        say(opts, opts.tone)
        return id
      },
      update: (id, opts) => {
        setItems((list) => list.map((t) => (t.id === id ? { ...t, ...opts } : t)))
        if (opts.title) say(opts, opts.tone ?? itemsRef.current.find((t) => t.id === id)?.tone)
      },
      dismiss: (id) => remove(id),
    }),
    [remove],
  )

  const { layout, frontHeight, height } = toastLayout(items, heights, expanded, max)

  return (
    <ToastCtx value={api}>
      {children}
      <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{announce}</div>
      <div className={styles.srOnly} role="alert" aria-atomic="true">{urgent}</div>
      <section
        className={styles.viewport}
        data-slot="toast-viewport"
        // Toasts are not part of an open dialog, but tapping one should not close it.
        data-gooee-layer-ignore=""
        aria-label={label}
        style={{ height, ['--front-h' as string]: `${frontHeight}px` }}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setExpanded(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setExpanded(false)}
      >
        <ol className={styles.list} data-slot="toast-list">
          {layout.map(({ t, index, y }) => (
            <ToastItem
              key={t.id}
              item={t}
              index={index}
              y={y}
              expanded={expanded}
              hidden={index >= max}
              onHeight={(h) => setHeights((m) => (m[t.id] === h ? m : { ...m, [t.id]: h }))}
              onDismiss={(dir) => remove(t.id, dir)}
              labels={labels}
            />
          ))}
        </ol>
      </section>
    </ToastCtx>
  )
}

type ItemProps = {
  item: Item
  index: number
  y: number
  expanded: boolean
  hidden: boolean
  onHeight: (h: number) => void
  onDismiss: (dir: Item['leaving']) => void
  labels: ToastLabels
}

const icons: Record<ToastTone, ReactNode> = {
  neutral: null,
  success: <CheckCircleIcon />,
  danger: <ErrorIcon />,
  info: <InfoIcon />,
}

function ToastItem({ item, index, y, expanded, hidden, onHeight, onDismiss, labels }: ItemProps) {
  const ref = useRef<HTMLLIElement>(null)
  const [dragging, setDragging] = useState(false)
  const [hover, setHover] = useState(false)
  const latest = useRef({ item, onDismiss })
  latest.current = { item, onDismiss }
  // Thrown sideways, it flies off at the speed of the swipe (motion/toast.ts).
  const swipeRef = useRef<ReturnType<typeof createToastSwipe>>(null)
  swipeRef.current ??= createToastSwipe(() => ref.current, {
    leaving: () => latest.current.item.leaving !== false,
    dragging: setDragging,
    dismiss: (way) => latest.current.onDismiss(way),
  })
  const swipe = swipeRef.current
  useEffect(() => () => swipe.stop(), [swipe])

  // A drop buds out of the origin, or out of the window's edge, and grows into the toast; a dismiss flows back the same way.
  const budRef = useRef<ReturnType<typeof createToastBud>>(null)
  budRef.current ??= createToastBud(() => ref.current, () => latest.current.item.origin, styles.bud)
  const budding = budRef.current
  useLayoutEffect(() => {
    if (!item.leaving) budding.place(index)
  })
  useLayoutEffect(() => budding.change(item.leaving), [item.leaving])
  useEffect(() => () => budding.destroy(), [budding])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    return watchToastHeight(el, onHeight)
  }, [])

  const paused = expanded || hover || dragging || item.leaving !== false
  const remaining = useRef(item.duration ?? 5000)
  useEffect(() => {
    remaining.current = item.duration ?? 5000
  }, [item.duration, item.tone, item.loading])
  useEffect(() => {
    if (paused || !Number.isFinite(remaining.current) || item.loading) return
    return toastTimer(remaining, () => onDismiss('down'))
  }, [paused, item.tone, item.loading, item.duration])

  const { y: stackedY, scale } = toastStack(index, y, expanded)

  return (
    <li
      ref={ref}
      className={styles.toast}
      data-slot="toast"
      data-leaving={item.leaving || undefined}
      data-dragging={dragging || undefined}
      data-hidden={hidden || undefined}
      data-behind={(!expanded && index > 0) || undefined}
      style={{
        ['--y' as string]: `${stackedY}px`,
        ['--s' as string]: scale,
        zIndex: 100 - Math.max(index, 0),
      }}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onPointerDown={swipe.down}
      onPointerMove={swipe.move}
      onPointerUp={swipe.up}
      onPointerCancel={swipe.up}
    >
      {(item.loading || icons[item.tone ?? 'neutral']) && (
        <span className={styles.icon} data-slot="toast-icon" data-tone={item.loading ? undefined : item.tone}>
          {item.loading ? <Spinner size="sm" label={null} /> : icons[item.tone ?? 'neutral']}
        </span>
      )}
      <div className={styles.text} data-slot="toast-content">
        <p className={styles.title} data-slot="toast-title">{item.title}</p>
        {item.description && <p className={styles.description} data-slot="toast-description">{item.description}</p>}
      </div>
      {item.action && (
        <button
          type="button"
          className={styles.action}
          data-slot="toast-action"
          onClick={() => {
            item.action?.onClick()
            onDismiss('down')
          }}
        >
          {item.action.label}
        </button>
      )}
      <button type="button" className={styles.close} data-slot="toast-close" aria-label={`${labels.dismiss}: ${item.title}`} onClick={() => onDismiss('down')}>
        <XIcon />
      </button>
    </li>
  )
}
