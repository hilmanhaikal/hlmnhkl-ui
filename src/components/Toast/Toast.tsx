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
import { frames, layer, morphEase, motionFor, shadowOf } from '../../internal/liquidMatter'
import { BEND, body, budScene, exitToward, loopsPath, pincher, sdBox, trace, type Box, type Pt } from '../../internal/liquidPath'
import { motionMs } from '../../internal/motion'
import { release, speedTracker } from '../../internal/fling'
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
  /** Where the action happened: the element pressed, or a point on screen. Within 240px of the toast, the drop buds out of it and a dismiss flows back into it. Further away, or without it, the drop buds out of the window's edge. */
  origin?: HTMLElement | { x: number; y: number }
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
// px per second: a toast thrown sideways this fast goes, however short the throw.
const THROW_SPEED = 600

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
    // The same text twice is not read again, so a trailing space makes it change.
    const fresh = (prev: string) => (prev === text ? `${text} ` : text)
    if (variant === 'error') setUrgent(fresh)
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

const onScreen = (r: DOMRect) => r.width > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth
const gapBetween = (a: DOMRect, b: DOMRect) => Math.hypot(Math.max(0, a.left - b.right, b.left - a.right), Math.max(0, a.top - b.bottom, b.top - a.bottom))
// An origin further than this from the toast would send the drop across the screen.
const NEAR = 240

/**
 * Bud: a drop buds out of `origin`, hangs on a neck that breaks, and grows into the toast (`way` in),
 * or the toast flows back into it (out). With no origin, or one far away, the drop buds out of the
 * window's edge nearest the stack, under the toast. An SVG over the page draws it; the toast itself
 * shows only at the end. Returns a stop, or null when motion is reduced.
 */
function bud(toast: HTMLElement, origin: ToastOptions['origin'], way: 'in' | 'out') {
  const ms = motionFor(way === 'in' ? 'morph' : 'morph-out')
  if (!ms) return null
  const t = toast.getBoundingClientRect()
  const look = getComputedStyle(toast)
  const line = parseFloat(look.borderTopWidth) || 0
  const T: Box = { cx: t.left + t.width / 2, cy: t.top + t.height / 2, hw: t.width / 2, hh: t.height / 2, r: Math.min(t.height / 2, parseFloat(look.borderTopLeftRadius) || 0) }
  let O: Box | null = null
  let exit: Pt = [0, 0]
  let n: Pt = [0, 1]
  let rd = BEND + 3.5
  let cut = false
  const o = origin instanceof HTMLElement ? (origin.isConnected ? origin.getBoundingClientRect() : null) : origin ? new DOMRect(origin.x, origin.y, 1, 1) : null
  const near = !!o && onScreen(o) && gapBetween(o, t) <= NEAR
  if (near && origin instanceof HTMLElement) {
    const h = Math.min(o.width, o.height) / 2
    O = { cx: o.left + o.width / 2, cy: o.top + o.height / 2, hw: o.width / 2, hh: o.height / 2, r: Math.min(h, parseFloat(getComputedStyle(origin).borderTopLeftRadius) || 0) }
    rd = Math.min(rd, Math.max(BEND + 0.5, h * 0.6))
    ;({ at: exit, n } = exitToward(O, T, rd))
    cut = true
  } else if (near && origin && !(origin instanceof HTMLElement)) exit = [origin.x, origin.y]
  // Too close to hang a drop between them, or no origin to use: it buds out of the window's edge. The
  // edge is a body just past the screen, its top a stroke's width out, so only the drop and its neck show.
  if (!near || sdBox(exit[0], exit[1], T) < rd * 4) {
    const down = T.cy > window.innerHeight / 2 ? 1 : -1
    rd = BEND + 3.5
    const y = down > 0 ? window.innerHeight + line : -line
    O = { cx: T.cx, cy: y + down * rd * 2, hw: rd * 6, hh: rd * 2, r: rd * 2 }
    exit = [T.cx, y]
    n = [0, -down]
    cut = false
  }
  const { svg, paths } = layer(document.body, styles.bud, null)
  const path = paths[0]
  // The toast's own fill, edge and shadow. The edge is drawn on the outline, so the outline sits half
  // its width inside the toast's box, and the last frame lands on the box exactly.
  path.style.fill = look.backgroundColor
  path.style.stroke = look.borderTopColor
  path.style.strokeWidth = `${line}px`
  svg.style.filter = shadowOf(toast).filter
  const inset = line / 2
  const T2: Box = { cx: T.cx, cy: T.cy, hw: T.hw - inset, hh: T.hh - inset, r: Math.max(0, T.r - inset) }
  // The origin keeps its own look: the drawing is cut out where it is.
  if (O && cut) {
    const ns = 'http://www.w3.org/2000/svg'
    const clip = svg.appendChild(document.createElementNS(ns, 'clipPath'))
    const id = `hl-bud-${Math.random().toString(36).slice(2)}`
    clip.id = id
    const hole = clip.appendChild(document.createElementNS(ns, 'path'))
    const r = Math.min(O.r + 1, O.hh + 1)
    hole.setAttribute('clip-rule', 'evenodd')
    hole.setAttribute(
      'd',
      `M-1 -1H${window.innerWidth + 1}V${window.innerHeight + 1}H-1Z` +
        `M${O.cx - O.hw - 1 + r} ${O.cy - O.hh - 1}H${O.cx + O.hw + 1 - r}A${r} ${r} 0 0 1 ${O.cx + O.hw + 1} ${O.cy - O.hh - 1 + r}V${O.cy + O.hh + 1 - r}A${r} ${r} 0 0 1 ${O.cx + O.hw + 1 - r} ${O.cy + O.hh + 1}H${O.cx - O.hw - 1 + r}A${r} ${r} 0 0 1 ${O.cx - O.hw - 1} ${O.cy + O.hh + 1 - r}V${O.cy - O.hh - 1 + r}A${r} ${r} 0 0 1 ${O.cx - O.hw - 1 + r} ${O.cy - O.hh - 1}Z`,
    )
    path.setAttribute('clip-path', `url(#${id})`)
  }
  const e = morphEase()
  const recoil = motionFor('fast')
  const pin = pincher(e, recoil)
  const across: [number, number] = [n[1], n[0]]
  const anchor: Pt = O ? (n[0] === 0 ? [exit[0], O.cy] : [O.cx, exit[1]]) : exit
  // Once the drop is free it is never joined again, even where the toast sits close to the edge: going
  // in, after the broken neck has sprung back; going out, until the drop hangs again.
  let broke = 0
  // The toast shows once the drop has its shape: at the end going in, at the start going out.
  const show = toast.animate({ opacity: way === 'in' ? [0, 0, 1] : [1, 0, 0], offset: way === 'in' ? [0, 0.82, 1] : [0, 0.15, 1] }, { duration: ms, fill: 'forwards' })
  const stop = frames(
    ms,
    (k, now) => {
      const u = way === 'in' ? k : 1 - k
      const D = budScene(e, u, O, T2, exit, n, rd)
      let sdf = body(D).sdf
      if (O) {
        const free = way === 'in' ? (broke && now - broke >= recoil) || u >= 0.6 : u >= 0.4
        if (free) {
          const a = body(O).sdf
          const b = sdf
          sdf = (x, y) => Math.min(a(x, y), b(x, y))
        } else {
          const p = pin(body(O, anchor), body(D), now)
          if (p.pieces === 2 && !broke) broke = now
          sdf = p.sdf
        }
      }
      const seeds: Array<[number, number, number, number]> = [[D.cx, D.cy, ...across]]
      if (O) seeds.unshift([anchor[0], anchor[1], ...across])
      path.setAttribute('d', loopsPath(trace(sdf, seeds)))
      // A drop from a point fades in where it starts.
      if (!O) svg.style.opacity = String(Math.min(1, u / 0.1))
    },
    () => {
      svg.remove()
      if (way === 'in') show.cancel()
    },
  )
  return () => {
    stop()
    svg.remove()
    show.cancel()
  }
}

function ToastItem({ item, index, y, expanded, hidden, onHeight, onDismiss, dismissLabel }: ItemProps) {
  const ref = useRef<HTMLLIElement>(null)
  const swipe = useRef<{ x: number; dx: number; speed: ReturnType<typeof speedTracker> } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [hover, setHover] = useState(false)
  // Where the toast is drawn sideways, set straight on --dx so a glide does not render every frame.
  const at = useRef(0)
  const stop = useRef(() => {})
  useEffect(() => () => stop.current(), [])
  const paint = (v: number) => {
    at.current = v
    ref.current?.style.setProperty('--dx', `${v}px`)
  }
  const fling = (to: number, speed: number) => {
    const el = ref.current
    stop.current()
    el?.setAttribute('data-fluid', '')
    stop.current = release(at.current, to, speed, paint, () => {
      if (to === 0) el?.removeAttribute('data-fluid')
    })
  }

  // A drop buds out of the origin, or out of the window's edge, and grows into the toast; a dismiss
  // flows back the same way. It plays once going in and once going out; going out it runs on after the
  // toast is gone, so only an entry is stopped on unmount. Only the front toast flows out: one behind
  // it folds away under it, and one thrown sideways keeps its throw.
  const budding = useRef<false | 'in' | 'out'>(false)
  const stopBud = useRef<(() => void) | null>(null)
  const front = useRef(false)
  useLayoutEffect(() => {
    if (!item.leaving) front.current = index === 0
  })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const thrown = item.leaving && item.leaving !== 'down'
    if (thrown || (item.leaving && !front.current)) {
      if (budding.current === 'in') stopBud.current?.()
      budding.current = false
      if (!thrown) delete el.dataset.liquid
      return
    }
    stopBud.current?.()
    const way = item.leaving ? 'out' : 'in'
    // The bud stands in for the part's CSS entry and exit; marked first, so the toast is measured in its place.
    el.dataset.liquid = ''
    stopBud.current = bud(el, item.origin, way)
    budding.current = stopBud.current ? way : false
  }, [item.leaving])
  useEffect(
    () => () => {
      if (budding.current === 'in') stopBud.current?.()
    },
    [],
  )

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

  const paused = expanded || hover || dragging || item.leaving !== false
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
    if ((e.target as HTMLElement).closest('button') || item.leaving) return
    stop.current()
    // Caught mid-glide, it carries on from where it is.
    swipe.current = { x: e.clientX - at.current, dx: at.current, speed: speedTracker() }
    swipe.current.speed.add(at.current)
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLLIElement>) => {
    const s = swipe.current
    if (!s) return
    s.dx = e.clientX - s.x
    s.speed.add(s.dx)
    paint(s.dx)
  }
  const onPointerUp = (e: PointerEvent<HTMLLIElement>) => {
    const s = swipe.current
    swipe.current = null
    setDragging(false)
    if (!s) return
    const speed = e.type === 'pointercancel' ? 0 : s.speed.speed()
    const thrown = Math.abs(speed) > THROW_SPEED && Math.abs(s.dx) > 20
    if (e.type !== 'pointercancel' && (Math.abs(s.dx) > 80 || thrown)) {
      // It leaves the way it was thrown, or the way it was pulled when let go slowly.
      const way = Math.sign(thrown ? speed : s.dx)
      fling(way * (ref.current?.offsetWidth ?? 0) * 1.1, speed)
      onDismiss(way < 0 ? 'left' : 'right')
    } else fling(0, speed)
  }

  const stackedY = expanded ? -y : -Math.min(index, 3) * PEEK
  const scale = expanded ? 1 : 1 - Math.min(index, 3) * 0.05

  return (
    <li
      ref={ref}
      className={styles.toast}
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
