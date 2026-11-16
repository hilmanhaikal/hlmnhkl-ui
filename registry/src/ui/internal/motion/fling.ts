// Gooee UI, MIT licence. https://gooee.dev
import { morphTo, rubber, speedTracker } from '../feel'
import { morphCurve, readMotionMs } from '../motion'

/** An element, or a function that returns it, for frameworks that hand it over later (a React ref). */
export type Target = HTMLElement | (() => HTMLElement | null)
const resolve = (t: Target) => (typeof t === 'function' ? t() : t)

/** What a drag needs from a pointer event: native and React events both have these. */
export type PointerLike = Pick<PointerEvent, 'clientY' | 'pointerId' | 'pointerType' | 'button' | 'type'> & { target: EventTarget | null; currentTarget: EventTarget | null }

/**
 * A let-go: runs from `from` to `to` on the morph curve, starting at `velocity` (units per second), so
 * it carries on at the hand's speed. From rest it takes --gooee-motion-morph-out: Retime slows it,
 * reduced motion (0ms) jumps. Returns a stop function.
 */
export function release(from: number, to: number, velocity: number, onFrame: (value: number) => void, onDone?: () => void) {
  return morphTo({ from, to, velocity, duration: readMotionMs('morph-out'), curve: morphCurve(), onFrame, onDone })
}

/**
 * A panel that the hand drags along one axis and lets go of. `fling` glides it to a place at the hand's
 * speed. While it runs, data-fluid on the panel turns its CSS motion off; once it closes on the way out,
 * the CSS close keyframes stay off too, so they do not start over. Call `opened` and `closed` as the
 * panel opens and closes.
 */
export function createFling(target: Target, axis: 'x' | 'y') {
  let at = 0
  let to = 0
  let stop = () => {}

  const paint = (v: number) => {
    at = v
    const el = resolve(target)
    if (el) el.style.transform = v ? `translate${axis === 'x' ? 'X' : 'Y'}(${v}px)` : ''
  }

  return {
    get at() {
      return at
    },
    paint,
    fling(place: number, speed: number) {
      const el = resolve(target)
      if (!el) return
      stop()
      to = place
      el.setAttribute('data-fluid', '')
      stop = release(at, place, speed, paint, () => {
        if (place === 0) el.removeAttribute('data-fluid')
      })
    },
    stop: () => stop(),
    // Opened again, even mid-close on the same panel: it starts at rest, not where the old glide was going.
    opened() {
      stop()
      to = 0
      paint(0)
      resolve(target)?.removeAttribute('data-fluid')
    },
    // Closed by Esc or a tap while gliding back: the CSS close takes over from where it is.
    closed() {
      if (to !== 0) return
      stop()
      resolve(target)?.removeAttribute('data-fluid')
    },
  }
}

export type Fling = ReturnType<typeof createFling>

// Past this share of its height, or flicked down this fast (px per second), a let-go closes the sheet.
const CLOSE_RATIO = 0.3
const CLOSE_SPEED = 500

export type DragCloseOptions = {
  /** Asked to close. If the panel is still open a frame later, it glides back. */
  onClose: () => void
  isOpen: () => boolean
  /** Asked at each press, so a part can take hold only in its phone layout, or only by its header. */
  can?: (e: PointerLike) => boolean
}

/**
 * A bottom sheet the hand drags down to close. Feed it the pointer events of the part it is held by, or
 * call `listen` on that part. A let-go past a third of its height, or a flick down, closes it; any other
 * let-go glides it back.
 */
export function createDragClose(target: Target, { onClose, isOpen, can = () => true }: DragCloseOptions) {
  const fling = createFling(target, 'y')
  let drag: { y: number; dy: number; pointer: number; speed: ReturnType<typeof speedTracker> } | null = null

  const down = (e: PointerLike) => {
    if ((e.target as HTMLElement).closest('button') || !can(e)) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    fling.stop()
    // Caught mid-glide, it carries on from where it is.
    drag = { y: e.clientY - fling.at, dy: fling.at, pointer: e.pointerId, speed: speedTracker() }
    drag.speed.add(fling.at)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    resolve(target)?.setAttribute('data-dragging', '')
  }

  const move = (e: PointerLike) => {
    const panel = resolve(target)
    if (!drag || !panel || drag.pointer !== e.pointerId) return
    const raw = e.clientY - drag.y
    drag.dy = raw >= 0 ? raw : rubber(raw, panel.offsetHeight)
    drag.speed.add(drag.dy)
    fling.paint(drag.dy)
  }

  const up = (e: PointerLike) => {
    const d = drag
    const panel = resolve(target)
    drag = null
    if (!d || !panel) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(d.pointer)
    panel.removeAttribute('data-dragging')
    const cancelled = e.type === 'pointercancel'
    const speed = cancelled ? 0 : d.speed.speed()
    const h = panel.offsetHeight
    if (!cancelled && (d.dy > h * CLOSE_RATIO || (speed > CLOSE_SPEED && d.dy > 24))) {
      fling.fling(h, speed)
      onClose()
      requestAnimationFrame(() => {
        if (isOpen()) fling.fling(0, 0)
      })
    } else fling.fling(0, speed)
  }

  return {
    fling,
    down,
    move,
    up,
    /** Listens on the part it is held by. Returns a function that stops listening. */
    listen(handle: HTMLElement) {
      const ac = new AbortController()
      const opts = { signal: ac.signal }
      handle.addEventListener('pointerdown', down, opts)
      handle.addEventListener('pointermove', move, opts)
      handle.addEventListener('pointerup', up, opts)
      handle.addEventListener('pointercancel', up, opts)
      return () => ac.abort()
    },
  }
}
