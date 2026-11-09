import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { createScrub, type ScrubOptions } from './feel'
import { morphCurve, readMotionMs } from './motion'

// The React side of feel.ts for Dial, RulerScrubber and PickerWheel: pointer, keys and wheel in, the
// drawn position out. The motion itself lives in feel.ts.

type Last = { x: number; y: number }

export type UseScrubOptions = Pick<ScrubOptions, 'min' | 'max' | 'edge' | 'land' | 'coast' | 'maxSpeed'> & {
  /** The value from props: a change from outside glides there. */
  value: number
  onSettle: (value: number) => void
  /** A new resting value came under the hand while it moves. */
  onMark?: (value: number) => void
  /** How far a pointer move turns the value, in its units. */
  move: (e: PointerEvent<HTMLElement>, last: Last, el: HTMLElement) => number
  /** The value a key goes to, or null to leave the key alone. */
  key: (key: string, target: number) => number | null
  /** The value a plain tap goes to, or null to land where it is. */
  tap?: (e: PointerEvent<HTMLElement>, at: number) => number | null
  /** The value a wheel turn goes to, or null to let the page scroll. */
  wheel?: (e: WheelEvent, target: number, focused: boolean) => number | null
  /** A short buzz on each new value under the hand, where the phone can (Android). */
  haptics?: boolean
}

type Press = { id: number; sx: number; sy: number; x: number; y: number; moved: boolean }

// A press is not a drag until it moves this far, so a tap stays a tap.
const SLOP = 4

export function useScrub(o: UseScrubOptions) {
  const opt = useRef(o)
  opt.current = o
  const [at, setAt] = useState(o.value)
  const [moving, setMoving] = useState(false)
  const press = useRef<Press | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const scrub = useRef<ReturnType<typeof createScrub> | null>(null)
  if (!scrub.current) {
    scrub.current = createScrub({
      value: o.value,
      land: (p) => opt.current.land(p),
      duration: () => readMotionMs('morph-out'),
      curve: morphCurve,
      onFrame: setAt,
      onMoving: setMoving,
      onMark: (v) => {
        opt.current.onMark?.(v)
        if (opt.current.haptics) navigator.vibrate?.(5)
      },
      // Only a new value is news: a tap, Home at the start, or a drag back to where it was says nothing.
      onSettle: (v) => v !== opt.current.value && opt.current.onSettle(v),
    })
  }
  const s = scrub.current
  s.update({ min: o.min, max: o.max, edge: o.edge, coast: o.coast, maxSpeed: o.maxSpeed })

  // A value set from outside (a controlled prop, a reset) glides there. So does one the parent kept
  // or changed when it came to rest.
  useEffect(() => {
    if (press.current || s.moving || o.value === s.target) return
    s.go(o.value)
  }, [o.value, s, moving])

  const wheels = !!o.wheel

  useEffect(() => {
    const el = ref.current
    if (!el || !wheels) return
    const onWheel = (e: WheelEvent) => {
      const t = opt.current.wheel?.(e, s.target, document.activeElement === el) ?? null
      if (t === null) return
      e.preventDefault()
      if (t !== s.target) s.go(t)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [s, wheels])
  useEffect(() => () => s.stop(), [s])

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // A pointer the browser no longer knows (a synthetic one) cannot be captured, and needs no capture.
    }
    s.grab(e.timeStamp)
    press.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, moved: false }
  }
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const p = press.current
    if (!p || p.id !== e.pointerId) return
    if (!p.moved) {
      if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < SLOP) return
      p.moved = true
    }
    const delta = opt.current.move(e, p, e.currentTarget)
    p.x = e.clientX
    p.y = e.clientY
    s.drag(delta, e.timeStamp)
  }
  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const p = press.current
    if (!p || p.id !== e.pointerId) return
    press.current = null
    if (e.type === 'pointercancel') return s.cancel()
    if (p.moved) return s.release(e.timeStamp)
    const t = opt.current.tap?.(e, s.at)
    if (t === null || t === undefined) s.release(e.timeStamp)
    else s.go(t)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    const t = opt.current.key(e.key, s.target)
    if (t === null) return
    e.preventDefault()
    s.go(t)
  }

  return {
    ref,
    /** Where it is drawn now. */
    at,
    moving,
    go: (to: number) => s.go(to),
    place: (to: number) => s.place(to),
    target: () => s.target,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onKeyDown },
  }
}

/** A colour between two tokens by the pull, so ink fills in as a mark is drawn in. */
export const ink = (p: number, from = 'var(--hl-color-fg-muted)', to = 'var(--hl-color-fg)') => `color-mix(in srgb, ${to} ${Math.round(p * 100)}%, ${from})`

/** A number token read from `el`, such as a px size or a share. */
export const tokenNumber = (el: Element | null, name: string) => (el ? parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0 : 0)

/** A wheel turn's sideways part in px: a sideways swipe, or Shift and the wheel. Null when it is mostly up and down, so the page scrolls. */
export function sideways(e: WheelEvent) {
  const line = e.deltaMode === 1 ? 40 : 1
  const dx = (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * line
  const dy = e.shiftKey ? 0 : e.deltaY * line
  return Math.abs(dx) > Math.abs(dy) ? dx : null
}

/** Calls `fn` each time `value` changes (by `key`), but not for the value it starts with. */
export function useOnChange<T>(value: T, fn: ((value: T) => void) | undefined, key = String(value)) {
  const latest = useRef(fn)
  latest.current = fn
  const seen = useRef(key)
  useEffect(() => {
    if (seen.current === key) return
    seen.current = key
    latest.current?.(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
