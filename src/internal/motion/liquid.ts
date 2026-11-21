import { returnTarget } from './focus'
import { bezier } from '../feel'
import { easing, morphCurve, motionMs, prefersReducedMotion } from '../motion'

// Liquid: a panel grows out of what opened it. It starts as the opener's own shape (its width and its
// corners) at the panel's edge nearest the opener, then fills out to the whole panel; on close it
// folds back. Only a clip changes, so nothing inside the panel is stretched and text stays sharp.
// Both ways play the morph curve forward, so a close moves from its first frame, and a move caught
// half way starts from the shape on screen.
// Where the browser cannot clip or animate this way, or with reduced motion, the part's own CSS fade
// runs instead.

/** What the panel grows from: the opener element, or one found at open time, or a rectangle (such as the point of a right click). */
export type MorphOrigin = HTMLElement | DOMRect | (() => HTMLElement | DOMRect | null)

export type MorphOptions = {
  /** Read fresh at each play. */
  origin: MorphOrigin
}

type El = HTMLElement | (() => HTMLElement | null)
const get = (t: El) => (typeof t === 'function' ? t() : t)

const able = () =>
  typeof CSS !== 'undefined' &&
  CSS.supports('clip-path', 'inset(0px round 1px)') &&
  typeof Element !== 'undefined' &&
  typeof Element.prototype.animate === 'function'

const clamp = (v: number, max: number) => Math.max(0, Math.min(max, v))

// How far the panel's shadow reaches past its box, so the clip can end there and the shadow grows in
// with the panel instead of appearing all at once when the clip is removed.
function shadowReach(el: HTMLElement) {
  let reach = 0
  for (const shadow of getComputedStyle(el).boxShadow.split(/,(?![^(]*\))/)) {
    if (shadow.includes('inset')) continue
    const [x = 0, y = 0, blur = 0, spread = 0] = (shadow.replace(/rgba?\([^)]*\)|#[\da-f]+/gi, '').match(/-?[\d.]+px/g) ?? []).map(parseFloat)
    reach = Math.max(reach, Math.abs(x) + blur + spread, Math.abs(y) + blur + spread)
  }
  return Math.ceil(reach)
}

// The opener's footprint on the panel, as an inset from each edge. An opener above or below the panel
// lands as a strip on the nearest edge; one beside it, on the nearest side; one inside it (a click
// point), where it is.
export function startShape(panel: DOMRect, from: DOMRect, radius: string) {
  const w = panel.width
  const h = panel.height
  let top = clamp(from.top - panel.top, h)
  let bottom = clamp(panel.bottom - from.bottom, h)
  let left = clamp(from.left - panel.left, w)
  let right = clamp(panel.right - from.right, w)
  const fh = Math.min(from.height, h)
  const fw = Math.min(from.width, w)
  if (from.bottom <= panel.top + 1) [top, bottom] = [0, h - fh]
  else if (from.top >= panel.bottom - 1) [top, bottom] = [h - fh, 0]
  else if (from.right <= panel.left + 1) [left, right] = [0, w - fw]
  else if (from.left >= panel.right - 1) [left, right] = [w - fw, 0]
  // Never less than a sliver, so the shape always has somewhere to grow from.
  if (w - left - right < 2) right = Math.max(0, w - left - 2)
  if (h - top - bottom < 2) bottom = Math.max(0, h - top - 2)
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${radius})`
}

// The phone layout of Dialog and AlertDialog, as their CSS sets it.
const SHEET = '(max-width: 520px)'

const live = (run: Animation | null) => run?.playState === 'running' || run?.playState === 'paused'

// Grows the panel out of `found` (or folds it back) from wherever the last run left it.
function clipMorph(p: HTMLElement, found: HTMLElement | DOMRect, state: 'open' | 'closed', last: Animation | null) {
  const opener = found instanceof HTMLElement ? found : null
  const from = found instanceof HTMLElement ? found.getBoundingClientRect() : found
  const now = live(last) ? getComputedStyle(p).clipPath : null
  last?.cancel()
  // Set before measuring, so the part's CSS enter animation is not caught mid-scale.
  p.dataset.liquid = ''
  // Never rounder than half the opener's height: a pill's 999px corner would keep a tall panel a
  // capsule for most of the growth.
  const cap = Math.min(from.width, from.height) / 2
  const radius = `${Math.min(cap, opener ? parseFloat(getComputedStyle(opener).borderRadius) || 0 : cap)}px`
  const start = startShape(p.getBoundingClientRect(), from, radius)
  const room = shadowReach(p)
  const corner = getComputedStyle(p).borderRadius || '0px'
  const end = `inset(${-room}px round calc(${corner} + ${room}px))`
  // data-liquid stays set while the panel is open: taking it off would restart the part's CSS enter animation.
  if (state === 'open') return p.animate({ clipPath: [now ?? start, end] }, { duration: motionMs('morph'), easing: easing('morph') })
  // A close starts at the panel's own edge, not out past its shadow, so the edge moves on the first frame.
  // It also fades by 65% of the fold: when the opener sits outside the panel, the shrinking clip would
  // otherwise leave a strip of the panel on its near edge until the very end.
  return p.animate(
    [
      { clipPath: now ?? `inset(0px round ${corner})`, opacity: 1 },
      { opacity: 1, offset: 0.2 },
      { opacity: 0, offset: 0.65 },
      { clipPath: start, opacity: 0 },
    ],
    { duration: motionMs('morph-out'), easing: easing('morph'), fill: 'forwards' },
  )
}

/**
 * Plays the growth when `play('open')` is called (once the panel is in its place) and the fold on
 * `play('closed')`. Marks the panel with data-liquid while it runs, so the part's CSS can stand its own
 * enter and exit animation down. Keep the panel in the page for --gooee-motion-morph-out after a close,
 * so the fold lands as it goes. The origin is read fresh each time.
 */
export function createMorph(panel: El, { origin }: MorphOptions) {
  let run: Animation | null = null
  return {
    play(state: 'open' | 'closed') {
      const p = get(panel)
      if (!p || prefersReducedMotion() || !able()) return
      const found = typeof origin === 'function' ? origin() : origin
      if (!found) return
      run = clipMorph(p, found, state, run)
    },
    destroy: () => run?.cancel(),
  }
}

/**
 * A centred dialog grows out of the control that opened it (the one focus goes back to) and folds back
 * into it. Opened from code with no such control, it grows from the middle of the screen. On a phone
 * the dialog is a bottom sheet: it grows out of a control it covers, as one in the thumb zone is, and
 * otherwise rises from the bottom edge. A sheet the hand drags away (data-fluid) is carried by the drag.
 * Call `opening` as it starts to open, before focus moves into it; then `play` once it is in the page.
 */
export function createDialogMorph(panel: El) {
  let opener: HTMLElement | null = null
  let run: Animation | null = null
  let rise = false
  return {
    opening() {
      opener = returnTarget()
    },
    play(state: 'open' | 'closed') {
      const p = get(panel)
      if (!p || prefersReducedMotion() || !able()) return
      const el = opener
      const box = el && el !== document.body && el.isConnected ? el.getBoundingClientRect() : null
      const found = el && box && box.width > 0 && box.height > 0 ? el : null
      if (state === 'open' && !live(run)) {
        const r = p.getBoundingClientRect()
        rise = window.matchMedia(SHEET).matches && !(found && box && box.top >= r.top && box.bottom <= r.bottom + 1)
      }
      if (state === 'closed' && 'fluid' in p.dataset) return
      if (!rise) {
        run = clipMorph(p, found ?? new DOMRect(window.innerWidth / 2 - 1, window.innerHeight / 2 - 1, 2, 2), state, run)
        return
      }
      const now = live(run) ? getComputedStyle(p).transform : null
      run?.cancel()
      p.dataset.liquid = ''
      const down = 'translateY(100%)'
      run =
        state === 'open'
          ? p.animate({ transform: [now ?? down, 'none'] }, { duration: motionMs('morph'), easing: easing('morph') })
          : p.animate({ transform: [now ?? 'none', down] }, { duration: motionMs('morph-out'), easing: easing('morph'), fill: 'forwards' })
    },
    destroy: () => run?.cancel(),
  }
}

/** A highlight's place in its row: its start edge (left, or top on the y axis), its length, and (for rows that wrap) its top. */
export type StretchBox = { x: number; w: number; y?: number }

// The leading edge moves over this share of the time; the trailing edge starts the rest of the way in.
const LEAD = 0.75
const runs = new WeakMap<HTMLElement, Animation>()

// Where a stretch caught half way has the highlight now.
function placeNow(node: HTMLElement, axis: 'x' | 'y'): StretchBox {
  const s = getComputedStyle(node)
  const m = new DOMMatrixReadOnly(s.transform === 'none' ? undefined : s.transform)
  return axis === 'x' ? { x: m.m41, w: parseFloat(s.width), y: m.m42 } : { x: m.m42, w: parseFloat(s.height) }
}

/**
 * Moves a highlight with two edges: the one nearest the new place leaves first and the far one
 * catches up, both on the morph curve, so it stretches toward the choice and settles there. A move
 * caught half way turns from where it is. `place` turns a box into the highlight's transform.
 */
export function stretch(node: HTMLElement, from: StretchBox, to: StretchBox, place: (b: StretchBox) => string, axis: 'x' | 'y' = 'x') {
  const last = runs.get(node) ?? null
  const start = live(last) ? placeNow(node, axis) : from
  last?.cancel()
  const ms = motionMs('base')
  if (!ms || prefersReducedMotion() || !able()) return
  const size = axis === 'x' ? 'width' : 'height'
  const ease = bezier(morphCurve())
  const ahead = to.x + to.w / 2 >= start.x + start.w / 2
  const frames: Keyframe[] = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    const lead = ease(Math.min(1, t / LEAD))
    const trail = ease(Math.max(0, (t - 1 + LEAD) / LEAD))
    const a = start.x + (to.x - start.x) * (ahead ? trail : lead)
    const b = start.x + start.w + (to.x + to.w - start.x - start.w) * (ahead ? lead : trail)
    frames.push({ transform: place({ x: a, w: b - a, y: to.y }), [size]: `${b - a}px` })
  }
  node.dataset.liquid = ''
  const run = node.animate(frames, { duration: ms })
  runs.set(node, run)
  // Only the latest stretch takes the mark off: a cancelled one settles later, mid-way through the next.
  const done = () => {
    if (runs.get(node) === run) delete node.dataset.liquid
  }
  run.finished.then(done, done)
}

export type StretchOptions = {
  /** Turns a box into the highlight's transform. */
  place: (b: StretchBox) => string
  /** Along one row, or one column with 'y'. */
  axis?: 'x' | 'y'
}

/**
 * Liquid highlight: when the choice changes, the highlight stretches toward it (see stretch). Call
 * `update` with the highlight's box and the choice behind it whenever either may have changed; it runs
 * only on a change of choice, and a resize simply follows.
 */
export function createStretch(el: El, { place, axis = 'x' }: StretchOptions) {
  let last: { box: StretchBox; choice: unknown } | null = null
  let moved: HTMLElement | null = null
  return {
    update(box: StretchBox | null, choice: unknown, ready: boolean) {
      const node = get(el)
      const prev = last
      // A part often renders the new choice before it has measured its new place, so only a moved box
      // counts; it then stretches if the choice behind it changed, and simply follows a resize.
      // No highlight (nothing chosen): forget the old place, so the next one appears rather than stretching from it.
      if (!box) {
        last = null
        return
      }
      if (prev && prev.box.x === box.x && prev.box.w === box.w && prev.box.y === box.y) return
      last = { box, choice }
      if (!node || !prev || !ready) return
      if (prev.choice === choice || (prev.box.y ?? 0) !== (box.y ?? 0)) {
        runs.get(node)?.cancel()
        return
      }
      moved = node
      stretch(node, prev.box, box, place, axis)
    },
    destroy() {
      if (moved) runs.get(moved)?.cancel()
    },
  }
}
