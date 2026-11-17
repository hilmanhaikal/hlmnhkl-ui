// Gooee UI, MIT licence. https://gooee.dev
import { clamp, lastStep, roundTo, stepKey, steps, type wheelSteps } from '../feel'
import type { PointerLike, ScrubberOptions } from './scrubber'
import { sideways } from './scrubLook'

// The Dial's scale, drag, tap and wheel, for the React and Vue Dial. The motion is createScrubber's.

// The printed and mercury dials sweep 270 degrees, with the dead part at the bottom.
export const SWEEP = 270

// Mercury is drawn in this box (SVG units): knob, bump and level dots.
export const W = 280
export const H = 252
export const CX = W / 2
export const CY = 128
export const KNOB = 58
export const DOT = 84
export const polar = (deg: number, r: number) => [CX + r * Math.sin((deg * Math.PI) / 180), CY - r * Math.cos((deg * Math.PI) / 180)] as const

type DialPointer = PointerLike & { shiftKey: boolean }
type Centre = (r: DOMRect) => { x: number; y: number }

/** A drag around a centre: the change in angle since the last move, never the angle itself, so a press never jumps. */
function turn(unitsPerDeg: number, centre: Centre) {
  return (e: DialPointer, last: { x: number; y: number }, el: HTMLElement) => {
    const c = centre(el.getBoundingClientRect())
    // Near the centre the angle swings wildly, so it does not count.
    if (Math.hypot(e.clientX - c.x, e.clientY - c.y) < 16) return 0
    let d = ((Math.atan2(e.clientY - c.y, e.clientX - c.x) - Math.atan2(last.y - c.y, last.x - c.x)) * 180) / Math.PI
    if (d > 180) d -= 360
    if (d < -180) d += 360
    return d * unitsPerDeg * (e.shiftKey ? 0.25 : 1)
  }
}

/** Where a tap sits around a centre, in degrees clockwise from the top, or null too near the centre to tell. */
function angleAt(e: DialPointer, centre: Centre) {
  const c = centre((e.currentTarget as HTMLElement).getBoundingClientRect())
  if (Math.hypot(e.clientX - c.x, e.clientY - c.y) < 16) return null
  return (Math.atan2(e.clientX - c.x, c.y - e.clientY) * 180) / Math.PI
}

const mercuryCentre: Centre = (r) => ({ x: r.left + r.width / 2, y: r.top + (r.height * CY) / H })
const knobCentre: Centre = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

export type DialScale = { min: number; max: number; step: number; marks?: number[]; variant: 'printed' | 'mercury' | 'arc' }
export type Rim = { r: number; gap: number }

/** The steps of a dial: the last one, every one, the labelled ones, and how a value lands on one. */
export function dialScale({ min, max, step, marks }: DialScale) {
  const top = lastStep(min, max, step)
  const all = steps(min, max, step)
  return {
    top,
    all,
    labelled: (marks ?? [min, max]).map((v) => roundTo(v, step, min)),
    land: (p: number) => clamp(roundTo(p, step, min), min, top),
    stepDeg: SWEEP / Math.max(1, all.length - 1),
  }
}

/** The scrubber options for a dial: how far a drag turns it, where keys, a tap and the wheel take it. */
export function dialScrub(p: DialScale, rim: Rim | null, wheel: ReturnType<typeof wheelSteps>): Pick<ScrubberOptions<DialPointer>, 'min' | 'max' | 'edge' | 'land' | 'coast' | 'maxSpeed' | 'move' | 'key' | 'tap' | 'wheel'> {
  const { min, max, step, variant } = p
  const { top, labelled, land, stepDeg } = dialScale(p)
  return {
    min,
    max: top,
    edge: step * (variant === 'arc' ? 0.8 : variant === 'mercury' ? 0.12 : 0.6),
    land,
    coast: variant === 'arc' ? 0.2 : 0,
    maxSpeed: 160 * step,
    move: variant === 'arc' ? (e, last) => (-(e.clientX - last.x) / (rim?.gap || 1)) * step * (e.shiftKey ? 0.25 : 1) : variant === 'mercury' ? turn(step / stepDeg, mercuryCentre) : turn((max - min) / SWEEP, knobCentre),
    key: (k, t) => stepKey(k, t, { min, max, step, marks: labelled }),
    // A tap without a drag goes to the mark under it, so the dial works with one plain press.
    tap: (e, at) => {
      if (variant === 'arc') {
        if (!rim?.gap || !rim.r) return null
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
        // The rim curves, so the tap's sideways distance becomes a length along the arc.
        const along = rim.r * Math.asin(clamp((e.clientX - (r.left + r.width / 2)) / rim.r, -1, 1))
        return land(at + (along / rim.gap) * step)
      }
      if (variant === 'mercury') {
        const a = angleAt(e, mercuryCentre)
        // Past either end of the sweep, land clamps to the nearer end (the dead part is split at the bottom).
        return a === null ? null : land(min + ((a + 135) / stepDeg) * step)
      }
      const a = angleAt(e, knobCentre)
      if (a === null) return null
      // The printed face turns, so the tap is read on the face: min at 0 and max 270 degrees back from it.
      const back = (((((at - min) / (max - min || 1)) * SWEEP - a) % 360) + 360) % 360
      if (back > SWEEP) return back < SWEEP + (360 - SWEEP) / 2 ? top : min
      return land(min + (back / SWEEP) * (max - min))
    },
    wheel:
      variant === 'arc'
        ? (e, t) => {
            const dx = sideways(e)
            if (dx === null || !rim?.gap) return null
            const n = wheel(dx, rim.gap, e.timeStamp)
            const to = clamp(roundTo(t + n * step, step, min), min, top)
            return to === t && (t === min || t === top) ? null : to
          }
        : undefined,
  }
}

/**
 * The arc lets an up-and-down swipe scroll the page, but a finger following the curve also moves up or
 * down. Once a touch moves more sideways than half its rise, it is a turn: the page stops taking it.
 * Returns a function that stops.
 */
export function arcTouch(el: HTMLElement) {
  let from: { x: number; y: number } | null = null
  let turning = false
  const start = (e: TouchEvent) => {
    from = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    turning = false
  }
  const move = (e: TouchEvent) => {
    if (!from) return
    if (!turning) {
      const dx = Math.abs(e.touches[0].clientX - from.x)
      const dy = Math.abs(e.touches[0].clientY - from.y)
      if (dx + dy < 2) return
      turning = dx > dy / 2
      if (!turning) from = null
    }
    if (turning && e.cancelable) e.preventDefault()
  }
  el.addEventListener('touchstart', start, { passive: true })
  el.addEventListener('touchmove', move, { passive: false })
  return () => {
    el.removeEventListener('touchstart', start)
    el.removeEventListener('touchmove', move)
  }
}
