import { useEffect, useRef, type PointerEvent, type RefObject } from 'react'
import { morphTo, rubber, speedTracker } from './feel'
import { morphCurve, readMotionMs } from './motion'

export { rubber, speedTracker }

/**
 * A let-go: runs from `from` to `to` on the morph curve, starting at `velocity` (units per second), so
 * it carries on at the hand's speed. From rest it takes --hl-motion-morph-out: Retime slows it,
 * reduced motion (0ms) jumps. Returns a stop function.
 */
export function release(from: number, to: number, velocity: number, onFrame: (value: number) => void, onDone?: () => void) {
  return morphTo({ from, to, velocity, duration: readMotionMs('morph-out'), curve: morphCurve(), onFrame, onDone })
}

/**
 * A dialog panel that the hand drags along one axis and lets go of. `fling` glides it to a place at
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
    stop.current = release(at.current, to, speed, paint, () => {
      if (to === 0) el.removeAttribute('data-fluid')
    })
  }

  useEffect(() => () => stop.current(), [])
  useEffect(() => {
    // Opened again, even mid-close on the same panel: it starts at rest, not where the old glide was going.
    if (open) {
      stop.current()
      target.current = 0
      paint(0)
      ref.current?.removeAttribute('data-fluid')
      return
    }
    // Closed by Esc or a tap while gliding back: the CSS close takes over from where it is.
    if (target.current !== 0) return
    stop.current()
    ref.current?.removeAttribute('data-fluid')
  }, [open])

  return { at, paint, fling, stop: () => stop.current() }
}

// Past this share of its height, or flicked down this fast (px per second), a let-go closes the sheet.
const CLOSE_RATIO = 0.3
const CLOSE_SPEED = 500

/**
 * A bottom sheet the hand drags down to close. Returns pointer handlers for the part it is held by. A
 * let-go past a third of its height, or a flick down, closes it; any other let-go glides it back.
 * `can` is asked at each press, so a part can take hold only in its phone layout, or only by its header.
 */
export function useDragClose(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void, can: (e: PointerEvent<HTMLElement>) => boolean = () => true) {
  const drag = useRef<{ y: number; dy: number; pointer: number; speed: ReturnType<typeof speedTracker> } | null>(null)
  const openRef = useRef(open)
  openRef.current = open
  const { at, paint, fling, stop } = useFling(ref, open, 'y')

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button') || !can(e)) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    stop()
    // Caught mid-glide, it carries on from where it is.
    drag.current = { y: e.clientY - at.current, dy: at.current, pointer: e.pointerId, speed: speedTracker() }
    drag.current.speed.add(at.current)
    e.currentTarget.setPointerCapture(e.pointerId)
    ref.current?.setAttribute('data-dragging', '')
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    const panel = ref.current
    if (!d || !panel || d.pointer !== e.pointerId) return
    const raw = e.clientY - d.y
    d.dy = raw >= 0 ? raw : rubber(raw, panel.offsetHeight)
    d.speed.add(d.dy)
    paint(d.dy)
  }

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current
    const panel = ref.current
    drag.current = null
    if (!d || !panel) return
    e.currentTarget.releasePointerCapture(d.pointer)
    panel.removeAttribute('data-dragging')
    const cancelled = e.type === 'pointercancel'
    const speed = cancelled ? 0 : d.speed.speed()
    const h = panel.offsetHeight
    if (!cancelled && (d.dy > h * CLOSE_RATIO || (speed > CLOSE_SPEED && d.dy > 24))) {
      fling(h, speed)
      onClose()
      // If the parent keeps it open, it glides back.
      requestAnimationFrame(() => {
        if (openRef.current) fling(0, 0)
      })
    } else fling(0, speed)
  }

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }
}
