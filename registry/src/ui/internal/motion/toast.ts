// Gooee UI, MIT licence. https://gooee.dev
import { speedTracker } from '../feel'
import { BEND, body, budScene, exitToward, loopsPath, pincher, sdBox, trace, type Box, type Pt } from '../liquidPath'
import { release } from './fling'
import { castShadow, frames, layer, morphEase, motionFor, shadowOf } from './liquidMatter'

// The toast stack, the same in every framework: where each toast sits, how long it stays, the throw
// that sends it away, and the drop it buds out of.

export type ToastVariant = 'default' | 'success' | 'error' | 'info' | 'loading'
export type ToastOrigin = HTMLElement | { x: number; y: number }
export type ToastLeaving = false | 'down' | 'left' | 'right'

const GAP = 8
export const TOAST_PEEK = 10
// px per second: a toast thrown sideways this fast goes, however short the throw.
const THROW_SPEED = 600

let nextId = 1
export const toastId = () => nextId++

/** What a screen reader hears. The same text twice is not read again, so a trailing space makes it change. */
export function toastSay(prev: string, opts: { title?: string; description?: string }) {
  const text = `${opts.title}${opts.description ? `. ${opts.description}` : ''}`
  return prev === text ? `${text} ` : text
}

/** Where each toast sits, newest first, and how tall the stack is. */
export function toastLayout<T extends { id: number; leaving: ToastLeaving }>(items: T[], heights: Record<number, number>, expanded: boolean, visible: number) {
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
  const frontHeight = live.length ? (heights[live[live.length - 1].id] ?? 64) : 0
  const stackHeight = expanded ? offset : frontHeight + Math.min(live.length - 1, visible - 1) * TOAST_PEEK
  return { layout, live: live.length, frontHeight, height: live.length ? stackHeight : 0 }
}

/** A toast's place in the stack: up by its offset when fanned out, else peeking out behind the front one. */
export const toastStack = (index: number, y: number, expanded: boolean) => ({
  y: expanded ? -y : -Math.min(index, 3) * TOAST_PEEK,
  scale: expanded ? 1 : 1 - Math.min(index, 3) * 0.05,
})

/** The toast's natural height, even while clamped behind the front toast. Calls `onHeight` as it changes. Returns a stop. */
export function watchToastHeight(el: HTMLElement, onHeight: (h: number) => void) {
  const measure = () => onHeight(el.scrollHeight + el.offsetHeight - el.clientHeight)
  const ro = new ResizeObserver(measure)
  ro.observe(el)
  measure()
  return () => ro.disconnect()
}

/**
 * Counts down `left.current` ms, then calls `done`. While the tab is hidden it waits. Returns a stop
 * that keeps what is left in `left.current`, so the count goes on where it paused.
 */
export function toastTimer(left: { current: number }, done: () => void) {
  let start = performance.now()
  let t = window.setTimeout(done, left.current)
  const onVis = () => {
    if (document.hidden) {
      window.clearTimeout(t)
      left.current -= performance.now() - start
    } else {
      start = performance.now()
      t = window.setTimeout(done, left.current)
    }
  }
  document.addEventListener('visibilitychange', onVis)
  return () => {
    window.clearTimeout(t)
    if (!document.hidden) left.current -= performance.now() - start
    document.removeEventListener('visibilitychange', onVis)
  }
}

type PointerLike = { clientX: number; pointerId: number; type: string; target: EventTarget | null; currentTarget: EventTarget | null }

/**
 * A toast the hand throws sideways. Where it is drawn goes straight on --dx, so a glide does not render
 * every frame. A let-go past 80px, or a throw, sends it off the way it went; any other let-go glides it back.
 */
export function createToastSwipe(
  target: () => HTMLElement | null,
  { leaving, dragging, dismiss }: { leaving: () => boolean; dragging: (on: boolean) => void; dismiss: (way: 'left' | 'right') => void },
) {
  let at = 0
  let stop = () => {}
  let swipe: { x: number; dx: number; speed: ReturnType<typeof speedTracker> } | null = null
  const paint = (v: number) => {
    at = v
    target()?.style.setProperty('--dx', `${v}px`)
  }
  const fling = (to: number, speed: number) => {
    const el = target()
    stop()
    el?.setAttribute('data-fluid', '')
    stop = release(at, to, speed, paint, () => {
      if (to === 0) el?.removeAttribute('data-fluid')
    })
  }
  return {
    stop: () => stop(),
    down(e: PointerLike) {
      if ((e.target as HTMLElement).closest('button') || leaving()) return
      stop()
      // Caught mid-glide, it carries on from where it is.
      swipe = { x: e.clientX - at, dx: at, speed: speedTracker() }
      swipe.speed.add(at)
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      dragging(true)
    },
    move(e: PointerLike) {
      const s = swipe
      if (!s) return
      s.dx = e.clientX - s.x
      s.speed.add(s.dx)
      paint(s.dx)
    },
    up(e: PointerLike) {
      const s = swipe
      swipe = null
      dragging(false)
      if (!s) return
      const speed = e.type === 'pointercancel' ? 0 : s.speed.speed()
      const thrown = Math.abs(speed) > THROW_SPEED && Math.abs(s.dx) > 20
      if (e.type !== 'pointercancel' && (Math.abs(s.dx) > 80 || thrown)) {
        // It leaves the way it was thrown, or the way it was pulled when let go slowly.
        const way = Math.sign(thrown ? speed : s.dx)
        fling(way * (target()?.offsetWidth ?? 0) * 1.1, speed)
        dismiss(way < 0 ? 'left' : 'right')
      } else fling(0, speed)
    },
  }
}

const onScreen = (r: DOMRect) => r.width > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth
const gapBetween = (a: DOMRect, b: DOMRect) => Math.hypot(Math.max(0, a.left - b.right, b.left - a.right), Math.max(0, a.top - b.bottom, b.top - a.bottom))
// An origin further than this from the toast would send the drop across the screen.
const NEAR = 240

/**
 * Bud: a drop buds out of `origin`, hangs on a neck that breaks, and grows into the toast (`way` in),
 * or the toast flows back into it (out). With no origin, or one far away, the drop buds out of the
 * window's edge nearest the stack, under the toast. An SVG over the page, with the class `cls`, draws
 * it; the toast itself shows only at the end. Returns a stop, or null when motion is reduced.
 */
export function bud(toast: HTMLElement, origin: ToastOrigin | undefined, way: 'in' | 'out', cls: string) {
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
  const { svg, paths } = layer(document.body, cls, null)
  const path = paths[0]
  // The toast's own fill, edge and shadow. The edge is drawn on the outline, so the outline sits half
  // its width inside the toast's box, and the last frame lands on the box exactly.
  path.style.fill = look.backgroundColor
  path.style.stroke = look.borderTopColor
  path.style.strokeWidth = `${line}px`
  castShadow(svg, shadowOf(toast).shadows)
  const inset = line / 2
  const T2: Box = { cx: T.cx, cy: T.cy, hw: T.hw - inset, hh: T.hh - inset, r: Math.max(0, T.r - inset) }
  // The origin keeps its own look: the drawing is cut out where it is.
  if (O && cut) {
    const ns = 'http://www.w3.org/2000/svg'
    const clip = svg.appendChild(document.createElementNS(ns, 'clipPath'))
    const id = `gooee-bud-${Math.random().toString(36).slice(2)}`
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

/**
 * The bud of one toast. It plays once going in and once going out; going out it runs on after the toast
 * is gone, so only an entry is stopped on `destroy`. Only the front toast flows out: one behind it folds
 * away under it, and one thrown sideways keeps its throw. Call `place` on each render while it is not
 * leaving, and `change` when it starts or stops leaving.
 */
export function createToastBud(target: () => HTMLElement | null, origin: () => ToastOrigin | undefined, cls: string) {
  let budding: false | 'in' | 'out' = false
  let stopBud: (() => void) | null = null
  let front = false
  return {
    place: (index: number) => (front = index === 0),
    change(leaving: ToastLeaving) {
      const el = target()
      if (!el) return
      const thrown = leaving && leaving !== 'down'
      if (thrown || (leaving && !front)) {
        if (budding === 'in') stopBud?.()
        budding = false
        if (!thrown) delete el.dataset.liquid
        return
      }
      stopBud?.()
      const way = leaving ? 'out' : 'in'
      // The bud stands in for the part's CSS entry and exit; marked first, so the toast is measured in its place.
      el.dataset.liquid = ''
      stopBud = bud(el, origin(), way, cls)
      budding = stopBud ? way : false
    },
    destroy() {
      if (budding === 'in') stopBud?.()
    },
  }
}
