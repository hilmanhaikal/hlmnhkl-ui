'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { CheckCircleIcon, ErrorIcon, InfoIcon, XIcon } from '../../internal/icons'
import { motionMs } from '../../internal/motion'
import { Spinner } from '../Spinner'
import styles from './Toast.module.css'

export type ToastVariant = 'default' | 'success' | 'error' | 'info' | 'loading'

export type ToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
  /** Milliseconds before it leaves. Infinity keeps it until dismissed. */
  duration?: number
  action?: { label: string; onClick: () => void }
}

type Item = ToastOptions & { id: number; leaving: false | 'down' | 'left' | 'right' }

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

export type ToastProviderProps = {
  /** Your app. Anything inside can call useToast. */
  children: ReactNode
  /** How many toasts stay visible in the stack. */
  visible?: number
  /** Name of the notification region for screen readers. */
  label?: string
  /** Screen reader name for each close button. The toast title is added after it. */
  dismissLabel?: string
}

let nextId = 1
const GAP = 8
const PEEK = 10

export function ToastProvider({ children, visible = 3, label = 'Notifications', dismissLabel = 'Dismiss' }: ToastProviderProps) {
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

  const say = (opts: Partial<ToastOptions>, variant?: ToastVariant) => {
    const text = `${opts.title}${opts.description ? `. ${opts.description}` : ''}`
    if (variant === 'error') setUrgent(text)
    else setAnnounce(text)
  }

  const remove = useCallback((id: number, dir: Item['leaving'] = 'down') => {
    setItems((list) => list.map((t) => (t.id === id && !t.leaving ? { ...t, leaving: dir } : t)))
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      setItems((list) => list.filter((t) => t.id !== id))
      setHeights(({ [id]: _, ...rest }) => rest)
    }, motionMs('slow'))
    timers.current.add(timer)
  }, [])

  const api = useMemo<Api>(
    () => ({
      toast: (opts) => {
        const id = nextId++
        setItems((list) => [...list, { duration: 5000, variant: 'default', ...opts, id, leaving: false }])
        say(opts, opts.variant)
        return id
      },
      update: (id, opts) => {
        setItems((list) => list.map((t) => (t.id === id ? { ...t, ...opts } : t)))
        if (opts.title) say(opts, opts.variant ?? itemsRef.current.find((t) => t.id === id)?.variant)
      },
      dismiss: (id) => remove(id),
    }),
    [remove],
  )

  const live = items.filter((t) => !t.leaving)
  const order = [...items].reverse()
  let offset = 0
  const layout = order.map((t) => {
    const liveIndex = live.length - 1 - live.findIndex((x) => x.id === t.id)
    const index = t.leaving ? -1 : liveIndex
    const y = offset
    if (!t.leaving) offset += (heights[t.id] ?? 64) + GAP
    return { t, index, y }
  })
  const frontHeight = live.length ? heights[live[live.length - 1].id] ?? 64 : 0
  const stackHeight = expanded ? offset : frontHeight + Math.min(live.length - 1, visible - 1) * PEEK

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{announce}</div>
      <div className={styles.srOnly} role="alert" aria-atomic="true">{urgent}</div>
      <section
        className={styles.viewport}
        // Toasts are not part of an open dialog, but tapping one should not close it.
        data-hl-layer-ignore=""
        aria-label={label}
        style={{ height: live.length ? stackHeight : 0, ['--front-h' as string]: `${frontHeight}px` }}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setExpanded(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setExpanded(false)}
      >
        <ol className={styles.list}>
          {layout.map(({ t, index, y }) => (
            <ToastItem
              key={t.id}
              item={t}
              index={index}
              y={y}
              expanded={expanded}
              hidden={index >= visible}
              onHeight={(h) => setHeights((m) => (m[t.id] === h ? m : { ...m, [t.id]: h }))}
              onDismiss={(dir) => remove(t.id, dir)}
              dismissLabel={dismissLabel}
            />
          ))}
        </ol>
      </section>
    </ToastCtx.Provider>
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
  dismissLabel: string
}

const icons: Record<ToastVariant, ReactNode> = {
  default: null,
  success: <CheckCircleIcon />,
  error: <ErrorIcon />,
  info: <InfoIcon />,
  loading: <Spinner size="sm" label={null} />,
}

function ToastItem({ item, index, y, expanded, hidden, onHeight, onDismiss, dismissLabel }: ItemProps) {
  const ref = useRef<HTMLLIElement>(null)
  const swipe = useRef<{ x: number; t: number; dx: number } | null>(null)
  const [dx, setDx] = useState(0)
  const [hover, setHover] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // scrollHeight is the natural height, even while clamped behind the front toast
    const measure = () => onHeight(el.scrollHeight + el.offsetHeight - el.clientHeight)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [])

  const paused = expanded || hover || swipe.current !== null || item.leaving !== false
  const remaining = useRef(item.duration ?? 5000)
  useEffect(() => {
    remaining.current = item.duration ?? 5000
  }, [item.duration, item.variant])
  useEffect(() => {
    if (paused || !Number.isFinite(remaining.current) || item.variant === 'loading') return
    let start = performance.now()
    let t = window.setTimeout(() => onDismiss('down'), remaining.current)
    const onVis = () => {
      if (document.hidden) {
        window.clearTimeout(t)
        remaining.current -= performance.now() - start
      } else {
        start = performance.now()
        t = window.setTimeout(() => onDismiss('down'), remaining.current)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearTimeout(t)
      if (!document.hidden) remaining.current -= performance.now() - start
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [paused, item.variant, item.duration])

  const onPointerDown = (e: PointerEvent<HTMLLIElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    swipe.current = { x: e.clientX, t: performance.now(), dx: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent<HTMLLIElement>) => {
    if (!swipe.current) return
    swipe.current.dx = e.clientX - swipe.current.x
    setDx(swipe.current.dx)
  }
  const onPointerUp = () => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const v = Math.abs(s.dx) / Math.max(1, performance.now() - s.t)
    if (Math.abs(s.dx) > 80 || (v > 0.6 && Math.abs(s.dx) > 20)) onDismiss(s.dx < 0 ? 'left' : 'right')
    else setDx(0)
  }

  const stackedY = expanded ? -y : -Math.min(index, 3) * PEEK
  const scale = expanded ? 1 : 1 - Math.min(index, 3) * 0.05

  return (
    <li
      ref={ref}
      className={styles.toast}
      data-leaving={item.leaving || undefined}
      data-dragging={swipe.current ? true : undefined}
      data-hidden={hidden || undefined}
      data-behind={(!expanded && index > 0) || undefined}
      style={{
        ['--y' as string]: `${stackedY}px`,
        ['--s' as string]: scale,
        ['--dx' as string]: `${dx}px`,
        zIndex: 100 - Math.max(index, 0),
      }}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {icons[item.variant ?? 'default'] && <span className={styles.icon} data-variant={item.variant}>{icons[item.variant ?? 'default']}</span>}
      <div className={styles.text}>
        <p className={styles.title}>{item.title}</p>
        {item.description && <p className={styles.description}>{item.description}</p>}
      </div>
      {item.action && (
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            item.action?.onClick()
            onDismiss('down')
          }}
        >
          {item.action.label}
        </button>
      )}
      <button type="button" className={styles.close} aria-label={`${dismissLabel}: ${item.title}`} onClick={() => onDismiss('down')}>
        <XIcon />
      </button>
    </li>
  )
}
