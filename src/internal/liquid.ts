import { useLayoutEffect, useRef, type RefObject } from 'react'
import { easing, motionMs, prefersReducedMotion } from './motion'

// Liquid: a panel grows out of what opened it. It starts as the opener's own shape (its width and its
// corners) at the panel's edge nearest the opener, then fills out to the whole panel; on close it
// folds back. Only a clip changes, so nothing inside the panel is stretched and text stays sharp.
// Where the browser cannot clip or animate this way, or with reduced motion, the part's own CSS fade
// runs instead.

/** What the panel grows from: the opener element, or a rectangle (such as the point of a right click). */
export type LiquidOrigin = RefObject<HTMLElement | null> | (() => DOMRect | null)

const able = () =>
  typeof CSS !== 'undefined' &&
  CSS.supports('clip-path', 'inset(0px round 1px)') &&
  CSS.supports('animation-timing-function', 'linear(0, 1)') &&
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

/**
 * Plays the growth when `state` turns open (once `ready`, that is, once the panel is in its place) and
 * the fold when it turns closed. Marks the panel with data-liquid while it runs, so the part's CSS can
 * stand its own enter and exit animation down.
 */
export function useLiquid(panel: RefObject<HTMLElement | null>, origin: LiquidOrigin, state: 'open' | 'closed', ready: boolean) {
  useLayoutEffect(() => {
    const p = panel.current
    if (!p || !ready || prefersReducedMotion() || !able()) return
    const opener = typeof origin === 'function' ? null : origin.current
    const from = typeof origin === 'function' ? origin() : (opener?.getBoundingClientRect() ?? null)
    if (!from) return
    // Never rounder than half the opener's height: a pill's 999px corner would keep a tall panel a
    // capsule for most of the growth.
    const cap = Math.min(from.width, from.height) / 2
    const radius = `${Math.min(cap, opener ? parseFloat(getComputedStyle(opener).borderRadius) || 0 : cap)}px`
    const start = startShape(p.getBoundingClientRect(), from, radius)
    const room = shadowReach(p)
    const end = `inset(${-room}px round calc(${getComputedStyle(p).borderRadius || '0px'} + ${room}px))`
    // Stays set while the panel is open: taking it off would restart the part's CSS enter animation.
    p.dataset.liquid = ''
    const run =
      state === 'open'
        ? p.animate({ clipPath: [start, end] }, { duration: motionMs('liquid'), easing: easing('liquid') })
        : p.animate({ clipPath: [end, start] }, { duration: motionMs('fast'), easing: easing('in'), fill: 'forwards' })
    return () => run.cancel()
    // Plays once per open and once per close; the origin is read fresh each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready])
}

/** A highlight's place in its row: its left edge, width, and (for rows that wrap) its top. */
export type StretchBox = { x: number; w: number; y?: number }

/**
 * Liquid highlight: when the choice changes, the edge nearest the new choice leaves first and the far
 * edge follows, so the highlight stretches toward the choice, then settles there like a drop. Runs
 * only on a change of choice, never when the row is resized, and only along one row. `place` turns a
 * box into the highlight's transform, as the part draws it.
 */
export function useStretch(el: RefObject<HTMLElement | null>, box: StretchBox | null, choice: unknown, ready: boolean, place: (b: StretchBox) => string) {
  const last = useRef<{ box: StretchBox; choice: unknown } | null>(null)
  const current = useRef<Animation | null>(null)
  useLayoutEffect(() => {
    const node = el.current
    const prev = last.current
    // A part often renders the new choice before it has measured its new place, so only a moved box
    // counts; it then stretches if the choice behind it changed, and simply follows a resize.
    // No highlight (nothing chosen): forget the old place, so the next one appears rather than stretching from it.
    if (!box) {
      last.current = null
      return
    }
    if (prev && prev.box.x === box.x && prev.box.w === box.w && prev.box.y === box.y) return
    last.current = { box, choice }
    if (!node || !prev || !ready || prev.choice === choice || prefersReducedMotion() || !able()) return
    const from = prev.box
    if ((from.y ?? 0) !== (box.y ?? 0)) return
    const right = box.x > from.x
    const lead = right ? box.x + box.w : box.x
    const trail = right ? from.x + (box.x - from.x) * 0.2 : from.x + from.w - (from.x + from.w - (box.x + box.w)) * 0.2
    const mid = right ? { x: trail, w: lead - trail, y: box.y } : { x: lead, w: trail - lead, y: box.y }
    node.dataset.liquid = ''
    const run = node.animate(
      [
        { transform: place(from), width: `${from.w}px`, easing: easing('out') },
        { transform: place(mid), width: `${mid.w}px`, offset: 0.3, easing: easing('liquid') },
        { transform: place(box), width: `${box.w}px` },
      ],
      { duration: motionMs('liquid') },
    )
    current.current = run
    // Only the latest stretch takes the mark off: a cancelled one settles later, mid-way through the next.
    const done = () => {
      if (current.current === run) delete node.dataset.liquid
    }
    run.finished.then(done, done)
    return () => run.cancel()
    // Keyed on the choice and the box; `place` is a pure formatter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, box?.x, box?.w, box?.y, ready])
}
