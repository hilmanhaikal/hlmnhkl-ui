// Gooee UI, MIT licence. https://gooee.dev
import { pour, type Pour } from './liquidMore'

export type CheckState = 'unchecked' | 'checked' | 'indeterminate'

/**
 * A checkbox's cup fill: ink pours in from the side that was pressed (a key fills it evenly from below),
 * levels, and then the mark draws. Clearing drains it the same way. Call `press` on a pointer down,
 * `key` on a key down, and `set` with the state each time it may have changed.
 */
export function createCheckboxPour(box: () => HTMLElement | null, cls: string, state: CheckState) {
  let pressedAt: { x: number; t: number } | null = null
  let run: Pour | null = null
  let was = state
  return {
    press(x: number) {
      pressedAt = { x, t: performance.now() }
    },
    key() {
      pressedAt = null
    },
    set(state: CheckState) {
      const prev = was
      was = state
      const filled = state !== 'unchecked'
      if ((prev !== 'unchecked') === filled) return
      const el = box()
      const at = pressedAt
      pressedAt = null
      if (!el) return
      const r = el.getBoundingClientRect()
      const side = at && performance.now() - at.t < 1000 ? Math.max(-1, Math.min(1, (at.x - r.left - r.width / 2) / (r.width / 2))) : 0
      const mark = el.querySelector<SVGPathElement>(prev === 'indeterminate' || state === 'indeterminate' ? '[data-mark="dash"]' : '[data-mark="tick"]')
      run = pour(el, mark, filled ? 1 : 0, side, cls, run)
    },
    destroy() {
      run?.stop()
    },
  }
}
