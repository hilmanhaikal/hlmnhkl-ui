import { useEffect, useRef, type RefObject } from 'react'
import { readMotionMs } from './motion'

/**
 * Runs from `from` to `to`, starting at `velocity` (units per second), so a let-go carries on at the
 * hand's speed. One swing lasts --hl-motion-fling: Retime slows it, reduced motion (0ms) jumps.
 * Returns a stop function.
 */
export function spring(from: number, to: number, velocity: number, onFrame: (value: number) => void, onDone?: () => void, damping = 0.88) {
  const period = readMotionMs('fling') / 1000
  if (!period) {
    onFrame(to)
    onDone?.()
    return () => {}
  }
  const w = (2 * Math.PI) / period
  let x = from
  let v = velocity
  let last = performance.now()
  let raf = requestAnimationFrame(function step(now) {
    // Fixed small slices, so a slow frame does not throw the spring off.
    let dt = Math.min(0.064, (now - last) / 1000)
    last = now
    while (dt > 0) {
      const h = Math.min(dt, 1 / 240)
      v += (-w * w * (x - to) - 2 * damping * w * v) * h
      x += v * h
      dt -= h
    }
    if (Math.abs(x - to) < 0.3 && Math.abs(v) < 4) {
      onFrame(to)
      onDone?.()
      return
    }
    onFrame(x)
    raf = requestAnimationFrame(step)
  })
  return () => cancelAnimationFrame(raf)
}

/** Past an edge a drag still moves, less the further it goes, and never more than `size`. */
export function rubber(over: number, size: number) {
  if (size <= 0) return 0
  return Math.sign(over) * (1 - 1 / ((Math.abs(over) * 0.55) / size + 1)) * size
}

/** The hand's speed when it lets go, in px per second, from the last tenth of a second of moves. */
export function speedTracker() {
  let samples: { t: number; x: number }[] = []
  return {
    add(x: number, t = performance.now()) {
      samples = [...samples.filter((s) => t - s.t <= 100), { t, x }]
    },
    speed(t = performance.now()) {
      const recent = samples.filter((s) => t - s.t <= 100)
      if (recent.length < 2) return 0
      const a = recent[0]
      const b = recent[recent.length - 1]
      return b.t > a.t ? ((b.x - a.x) / (b.t - a.t)) * 1000 : 0
    },
  }
}

/**
 * A dialog panel that the hand drags along one axis and lets go of. `fling` springs it to a place at
 * the hand's speed. While it runs, data-fluid on the panel turns its CSS motion off; once the parent
 * closes it on the way out, the CSS close keyframes stay off too, so they do not start over.
 */
export function useFling(ref: RefObject<HTMLElement | null>, open: boolean, axis: 'x' | 'y') {
  const at = useRef(0)
  const target = useRef(0)
  const stop = useRef(() => {})

  const paint = (v: number) => {
    at.current = v
    if (ref.current) ref.current.style.transform = v ? `translate${axis === 'x' ? 'X' : 'Y'}(${v}px)` : ''
  }

  const fling = (to: number, speed: number) => {
    const el = ref.current
    if (!el) return
    stop.current()
    target.current = to
    el.setAttribute('data-fluid', '')
    stop.current = spring(at.current, to, speed, paint, () => {
      if (to === 0) el.removeAttribute('data-fluid')
    })
  }

  useEffect(() => () => stop.current(), [])
  useEffect(() => {
    // Opened again, even mid-close on the same panel: it starts at rest, not where the old spring was going.
    if (open) {
      stop.current()
      target.current = 0
      paint(0)
      ref.current?.removeAttribute('data-fluid')
      return
    }
    // Closed by Esc or a tap while springing back: the CSS close takes over from where it is.
    if (target.current !== 0) return
    stop.current()
    ref.current?.removeAttribute('data-fluid')
  }, [open])

  return { at, paint, fling, stop: () => stop.current() }
}
