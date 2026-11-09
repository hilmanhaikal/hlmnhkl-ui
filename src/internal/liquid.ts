import { useLayoutEffect, useRef, type RefObject } from 'react'
import { returnTarget } from './focus'
import { easing, motionMs, prefersReducedMotion } from './motion'

// Liquid: a panel grows out of what opened it. It starts as the opener's own shape (its width and its
// corners) at the panel's edge nearest the opener, then fills out to the whole panel; on close it
// folds back. Only a clip changes, so nothing inside the panel is stretched and text stays sharp.
// Both ways play the morph curve forward, so a close moves from its first frame, and a move caught
// half way starts from the shape on screen.
// Where the browser cannot clip or animate this way, or with reduced motion, the part's own CSS fade
// runs instead.

/** What the panel grows from: the opener element, or one found at open time, or a rectangle (such as the point of a right click). */
export type LiquidOrigin = RefObject<HTMLElement | null> | (() => HTMLElement | DOMRect | null)

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
  return p.animate({ clipPath: [now ?? `inset(0px round ${corner})`, start] }, { duration: motionMs('morph-out'), easing: easing('morph'), fill: 'forwards' })
}

/**
 * Plays the growth when `state` turns open (once `ready`, that is, once the panel is in its place) and
 * the fold when it turns closed. Marks the panel with data-liquid while it runs, so the part's CSS can
 * stand its own enter and exit animation down. The part's usePresence exit is 'morph-out', so the
 * fold lands as the panel unmounts.
 */
export function useLiquid(panel: RefObject<HTMLElement | null>, origin: LiquidOrigin, state: 'open' | 'closed', ready: boolean) {
  const run = useRef<Animation | null>(null)
  useLayoutEffect(() => {
    const p = panel.current
    if (!p || !ready || prefersReducedMotion() || !able()) return
    const found = typeof origin === 'function' ? origin() : origin.current
    if (!found) return
    run.current = clipMorph(p, found, state, run.current)
    // Plays once per open and once per close; the origin is read fresh each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready])
  useLayoutEffect(() => () => run.current?.cancel(), [])
}

/**
 * A centred dialog grows out of the control that opened it (the one focus goes back to) and folds back
 * into it. Opened from code with no such control, it grows from the middle of the screen. On a phone
 * the dialog is a bottom sheet: it grows out of a control it covers, as one in the thumb zone is, and
 * otherwise rises from the bottom edge. A sheet the hand drags away (data-fluid) is carried by the drag.
 */
export function useDialogMorph(panel: RefObject<HTMLElement | null>, open: boolean, mounted: boolean, state: 'open' | 'closed') {
  const opener = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const run = useRef<Animation | null>(null)
  const rise = useRef(false)
  // Runs before the focus trap moves focus into the dialog.
  useLayoutEffect(() => {
    if (open && !wasOpen.current) opener.current = returnTarget()
    wasOpen.current = open
  }, [open])
  useLayoutEffect(() => {
    const p = panel.current
    if (!p || !mounted || prefersReducedMotion() || !able()) return
    const el = opener.current
    const box = el && el !== document.body && el.isConnected ? el.getBoundingClientRect() : null
    const found = el && box && box.width > 0 && box.height > 0 ? el : null
    if (state === 'open' && !live(run.current)) {
      const r = p.getBoundingClientRect()
      rise.current = window.matchMedia(SHEET).matches && !(found && box && box.top >= r.top && box.bottom <= r.bottom + 1)
    }
    if (state === 'closed' && 'fluid' in p.dataset) return
    if (!rise.current) {
      run.current = clipMorph(p, found ?? new DOMRect(window.innerWidth / 2 - 1, window.innerHeight / 2 - 1, 2, 2), state, run.current)
      return
    }
    const now = live(run.current) ? getComputedStyle(p).transform : null
    run.current?.cancel()
    p.dataset.liquid = ''
    const down = 'translateY(100%)'
    run.current =
      state === 'open'
        ? p.animate({ transform: [now ?? down, 'none'] }, { duration: motionMs('morph'), easing: easing('morph') })
        : p.animate({ transform: [now ?? 'none', down] }, { duration: motionMs('morph-out'), easing: easing('morph'), fill: 'forwards' })
  }, [state, mounted, panel])
  useLayoutEffect(() => () => run.current?.cancel(), [])
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
        { transform: place(mid), width: `${mid.w}px`, offset: 0.3, easing: easing('morph') },
        { transform: place(box), width: `${box.w}px` },
      ],
      { duration: motionMs('morph') },
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
