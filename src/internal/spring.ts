import { useEffect, useRef, type RefObject } from 'react'
import { rubber, speedTracker, springTo } from './feel'
import { readMotionMs } from './motion'

export { rubber, speedTracker }

/**
 * Runs from `from` to `to`, starting at `velocity` (units per second), so a let-go carries on at the
 * hand's speed. One swing lasts --hl-motion-fling: Retime slows it, reduced motion (0ms) jumps.
 * Returns a stop function.
 */
export function spring(from: number, to: number, velocity: number, onFrame: (value: number) => void, onDone?: () => void, damping = 0.88) {
  return springTo({ from, to, velocity, period: readMotionMs('fling'), damping, onFrame, onDone })
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
