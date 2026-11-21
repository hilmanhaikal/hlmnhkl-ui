// Gooee UI, MIT licence. https://gooee.dev
import { createScrub, type ScrubOptions } from '../feel'
import { morphCurve, motionMs } from '../motion'

// Pointer, keys and wheel in, the drawn position out, for Dial, RulerScrubber and PickerWheel. The
// motion itself lives in feel.ts (createScrub).

type Last = { x: number; y: number }

/** What the scrubber reads from a pointer event: native and React events both have these. */
export type PointerLike = Pick<PointerEvent, 'button' | 'clientX' | 'clientY' | 'pointerId' | 'pointerType' | 'timeStamp' | 'type'> & { currentTarget: EventTarget | null }
type KeyLike = Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'preventDefault'>

export type ScrubberOptions<P extends PointerLike = PointerEvent> = Pick<ScrubOptions, 'min' | 'max' | 'edge' | 'land' | 'coast' | 'maxSpeed'> & {
  /** The value it starts at, and later the value from outside: `sync` glides there. */
  value: number
  /** It came to rest on a new value. `from` is where it rested before. */
  onSettle: (value: number, from: number) => void
  /** A new resting value came under it while it moves. */
  onMark?: (value: number) => void
  /** How far a pointer move turns the value, in its units. */
  move: (e: P, last: Last, el: HTMLElement) => number
  /** The value a key goes to, or null to leave the key alone. */
  key: (key: string, target: number) => number | null
  /** The value a plain tap goes to, or null to land where it is. */
  tap?: (e: P, at: number) => number | null
  /** The value a wheel turn goes to, or null to let the page scroll. */
  wheel?: (e: WheelEvent, target: number, focused: boolean) => number | null
  /** A short buzz on each new value under the hand, where the phone can (Android). */
  haptics?: boolean
  /** Where it is drawn now, each frame. */
  onFrame?: (at: number) => void
  /** True while it moves, false once it rests. */
  onMoving?: (moving: boolean) => void
}

type Press = { id: number; sx: number; sy: number; x: number; y: number; moved: boolean }

// A press is not a drag until it moves this far, so a tap stays a tap.
const SLOP = 4

/**
 * A scrubbed value: feed it the control's events, or call `listen` on the control. `update` takes new
 * options. `destroy` stops the glide and every listener.
 */
export function createScrubber<P extends PointerLike = PointerEvent>(options: ScrubberOptions<P>) {
  let o = options
  let press: Press | null = null
  let ac = new AbortController()
  let wheelEl: HTMLElement | null = null
  // Where it last rested. The value from outside can move on while it moves (a parent that follows each
  // new value), so a landing is compared with this, not with that value.
  let rest = o.value
  const s = createScrub({
    value: o.value,
    land: (p) => o.land(p),
    duration: () => motionMs('morph-out'),
    curve: morphCurve,
    onFrame: (v) => o.onFrame?.(v),
    onMoving: (m) => o.onMoving?.(m),
    onMark: (v) => {
      o.onMark?.(v)
      if (o.haptics) navigator.vibrate?.(5)
    },
    // Only a new value is news: a tap, Home at the start, or a drag back to where it was says nothing.
    onSettle: (v) => {
      if (v === rest) return
      const from = rest
      rest = v
      o.onSettle(v, from)
    },
  })
  const update = (next: ScrubberOptions<P>) => {
    o = next
    s.update({ min: o.min, max: o.max, edge: o.edge, coast: o.coast, maxSpeed: o.maxSpeed })
  }
  update(o)

  const down = (e: P) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      // A pointer the browser no longer knows (a synthetic one) cannot be captured, and needs no capture.
    }
    s.grab(e.timeStamp)
    press = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, moved: false }
  }
  const move = (e: P) => {
    const p = press
    if (!p || p.id !== e.pointerId) return
    if (!p.moved) {
      if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < SLOP) return
      p.moved = true
    }
    const delta = o.move(e, p, e.currentTarget as HTMLElement)
    p.x = e.clientX
    p.y = e.clientY
    s.drag(delta, e.timeStamp)
  }
  const up = (e: P) => {
    const p = press
    if (!p || p.id !== e.pointerId) return
    press = null
    if (e.type === 'pointercancel') return s.cancel()
    if (p.moved) return s.release(e.timeStamp)
    const t = o.tap?.(e, s.at)
    if (t === null || t === undefined) s.release(e.timeStamp)
    else s.go(t)
  }
  const keyDown = (e: KeyLike) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const t = o.key(e.key, s.target)
    if (t === null) return
    e.preventDefault()
    s.go(t)
  }

  /** Lets the wheel turn it, when `wheel` is set, until `destroy`. */
  const listenWheel = (el: HTMLElement) => {
    if (wheelEl === el) return
    wheelEl = el
    const onWheel = (e: WheelEvent) => {
      const t = o.wheel?.(e, s.target, document.activeElement === el) ?? null
      if (t === null) return
      e.preventDefault()
      if (t !== s.target) s.go(t)
    }
    el.addEventListener('wheel', onWheel, { passive: false, signal: ac.signal })
  }

  return {
    down,
    move,
    up,
    keyDown,
    listenWheel,
    /** A value set from outside (a controlled prop, a reset) glides there, unless the hand holds it. */
    sync(value: number) {
      if (press || s.moving || value === s.target) return
      rest = value
      s.go(value)
    },
    update,
    get at() {
      return s.at
    },
    get moving() {
      return s.moving
    },
    target: () => s.target,
    go: (to: number) => s.go(to),
    place: (to: number) => {
      rest = to
      s.place(to)
    },
    destroy() {
      s.stop()
      ac.abort()
      ac = new AbortController()
      wheelEl = null
    },
    /** Listens on the control (pointer, keys, and the wheel when `wheel` is set), until `destroy`. */
    listen(el: HTMLElement) {
      const opts = { signal: ac.signal }
      el.addEventListener('pointerdown', (e) => down(e as unknown as P), opts)
      el.addEventListener('pointermove', (e) => move(e as unknown as P), opts)
      el.addEventListener('pointerup', (e) => up(e as unknown as P), opts)
      el.addEventListener('pointercancel', (e) => up(e as unknown as P), opts)
      el.addEventListener('keydown', keyDown, opts)
      if (o.wheel) listenWheel(el)
    },
  }
}
