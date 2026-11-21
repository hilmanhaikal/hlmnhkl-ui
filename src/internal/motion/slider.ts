import { bezier, nearestMark } from '../feel'
import { morphCurve, motionMs, prefersReducedMotion } from '../motion'

export type SliderRead = { value: number; min: number; max: number; step: number; marks?: number[] }

/**
 * A native range input that glides to a click and lands on a mark let go near it. `read` gives the
 * value and props now; `onValue` gets each new value; `onShown` gets where the thumb is drawn while it
 * glides (null once it is at the value); `onCommit` gets the value once the hand or key lets go of it.
 * Wire `down`, `move`, `up`, `end`, `input`, `key` and `keyUp` to the input.
 */
export function createSlider(read: () => SliderRead, onValue: (v: number) => void, onShown: (v: number | null) => void, onCommit?: (v: number) => void) {
  // `grab` is how far from the thumb's centre it was picked up, so the thumb does not jump to the pointer.
  let press: { x: number; lastX: number; moved: boolean; grab: number } | null = null
  let shown: number | null = null
  let glide = 0
  const show = (v: number | null) => {
    shown = v
    onShown(v)
  }
  const at = () => shown ?? read().value

  // The value when this touch or key began, and the last one set since. Null when nothing holds it.
  let from: number | null = null
  let last = 0
  const begin = () => {
    if (from !== null) return
    from = read().value
    last = from
  }
  const setValue = (v: number) => {
    last = v
    onValue(v)
  }
  const commit = () => {
    if (from === null) return
    const was = from
    from = null
    if (last !== was) onCommit?.(last)
  }

  const toStep = (v: number) => {
    const { min, max, step } = read()
    const decimals = (String(step).split('.')[1] ?? '').length
    return Math.min(max, Math.max(min, Number((Math.round((v - min) / step) * step + min).toFixed(decimals))))
  }

  // The thumb travels from where it is drawn to `to` on the morph curve. A click and a landing both use it.
  function glideTo(from: number, to: number) {
    cancelAnimationFrame(glide)
    const ms = motionMs('morph-out')
    if (!ms || from === to || prefersReducedMotion()) return show(null)
    const ease = bezier(morphCurve())
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      show(p < 1 ? from + (to - from) * ease(p) : null)
      if (p < 1) glide = requestAnimationFrame(tick)
    }
    glide = requestAnimationFrame(tick)
  }

  // The value under the pointer, before any step, from the input's own geometry: the thumb's centre
  // runs from half a thumb in at each end.
  function track(input: HTMLInputElement) {
    const r = input.getBoundingClientRect()
    const thumb = parseFloat(getComputedStyle(input).getPropertyValue('--thumb')) || 0
    return { left: r.left + thumb / 2, width: Math.max(1, r.width - thumb), thumb }
  }

  function fromPointer(input: HTMLInputElement, x: number) {
    const { min, max } = read()
    const t = track(input)
    return min + Math.min(1, Math.max(0, (x - t.left) / t.width)) * (max - min)
  }

  const end = () => {
    press = null
  }
  const letGo = () => {
    end()
    commit()
  }

  return {
    /** The input's "input" event, with the number the browser moved to. */
    input(input: HTMLInputElement, native: number) {
      const p = press
      const held = from !== null
      begin()
      const next = p && read().marks?.length ? toStep(fromPointer(input, p.lastX - p.grab)) : native
      // A press that has not moved is a click: the value jumps, the thumb glides there. Once it moves, the hand leads.
      if (p && !p.moved) glideTo(at(), next)
      else if (shown !== null) {
        cancelAnimationFrame(glide)
        show(null)
      }
      setValue(next)
      // A step from assistive tech, with no hand or key down, rests at once.
      if (!held) commit()
    },
    down(input: HTMLInputElement, x: number) {
      const { value, min, max, marks } = read()
      const t = track(input)
      const centre = t.left + ((value - min) / (max - min || 1)) * t.width
      const grab = marks?.length && Math.abs(x - centre) <= t.thumb / 2 ? x - centre : 0
      press = { x, lastX: x, moved: false, grab }
      begin()
    },
    move(x: number) {
      if (!press) return
      press.lastX = x
      if (Math.abs(x - press.x) > 3) press.moved = true
    },
    up() {
      end()
      // Let go near a mark: it lands on the mark. Within half of 6% of the track counts as near.
      const { value, min, max, marks } = read()
      const mark = marks?.length ? nearestMark(value, marks) : null
      if (mark !== null && mark !== value && Math.abs(mark - value) < ((max - min) * 0.06) / 2) {
        glideTo(at(), mark)
        setValue(mark)
      }
      commit()
    },
    /** The hand or the focus went away (cancel, lost capture, blur): the value rests where it is. */
    end: letGo,
    /** A key down, after the caller's own handler. Returns true when it used the key. */
    key(key: string) {
      end()
      begin()
      const { value, min, max, marks } = read()
      if (!marks?.length || (key !== 'PageUp' && key !== 'PageDown')) return false
      const sorted = [...marks].sort((a, b) => a - b)
      setValue(key === 'PageUp' ? (sorted.find((m) => m > value) ?? max) : ([...sorted].reverse().find((m) => m < value) ?? min))
      return true
    },
    /** A key up: the value rests. */
    keyUp: commit,
    destroy: () => cancelAnimationFrame(glide),
  }
}
