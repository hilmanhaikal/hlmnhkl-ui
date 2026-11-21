import { clamp, lastStep, roundTo, stepKey, steps, type wheelSteps } from '../feel'
import type { PointerLike, ScrubberOptions } from './scrubber'
import { sideways } from './scrubLook'

// The RulerScrubber's scale, drag, tap and wheel, for the React and Vue ruler. The motion is createScrubber's.

export type RulerScale = { min: number; max: number; step: number; marks?: number[] }
/** The px between two ticks (a token), how many ticks fit either side of the needle, the ruler's width and a tag's. */
export type RulerFit = { gap: number; span: number; width: number; tag: number }

/** The steps of a ruler: the last one, every one, the numbered ones, and how a value lands on one. */
export function rulerScale({ min, max, step, marks }: RulerScale) {
  const top = lastStep(min, max, step)
  const all = steps(min, max, step)
  return {
    top,
    all,
    labelled: new Set((marks ?? all.filter((_, i) => i % 10 === 0)).map((v) => roundTo(v, step, min))),
    land: (p: number) => clamp(roundTo(p, step, min), min, top),
  }
}

/** The scrubber options for a ruler: how far a drag moves it, where keys, a tap and the wheel take it. */
export function rulerScrub(p: RulerScale, fit: RulerFit, wheel: ReturnType<typeof wheelSteps>): Pick<ScrubberOptions<PointerLike & { shiftKey: boolean }>, 'min' | 'max' | 'edge' | 'land' | 'maxSpeed' | 'move' | 'key' | 'tap' | 'wheel'> {
  const { min, max, step } = p
  const { top, labelled, land } = rulerScale(p)
  return {
    min,
    max: top,
    edge: step,
    land,
    // The hand at 4000px a second at most, so a hard throw still stops in reach.
    maxSpeed: fit.gap ? (4000 / fit.gap) * step : undefined,
    // Dragging left brings higher values in, like pulling a tape.
    move: (e, last) => (-(e.clientX - last.x) / (fit.gap || 1)) * step * (e.shiftKey ? 0.25 : 1),
    key: (k, t) => stepKey(k, t, { min, max, step, marks: [...labelled] }),
    // A tap without a drag goes to the tick under it, so the ruler works with one plain press.
    tap: (e, at) => {
      if (!fit.gap) return null
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
      return land(at + ((e.clientX - (r.left + r.width / 2)) / fit.gap) * step)
    },
    wheel: (e, t) => {
      const dx = sideways(e)
      if (dx === null || !fit.gap) return null
      const n = wheel(dx, fit.gap, e.timeStamp)
      const to = clamp(roundTo(t + n * step, step, min), min, top)
      return to === t && (t === min || t === top) ? null : to
    },
  }
}

/** Measures the ruler: the tick gap token, the ticks that fit, its width and the tag's. */
export function measureRuler(el: HTMLElement, tag: HTMLElement | null): RulerFit {
  const gap = parseFloat(getComputedStyle(el).getPropertyValue('--gooee-ruler-scrubber-tick-gap')) || 0
  return { gap, span: gap ? Math.ceil(el.clientWidth / 2 / gap) + 1 : 24, width: el.clientWidth, tag: tag?.offsetWidth ?? 0 }
}
