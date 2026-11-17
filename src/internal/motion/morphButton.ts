// The morph button's measuring and placing: the panel grows out of the button toward the side with room,
// and never past the box it sits in.

export type MorphCorner = 'tl' | 'tr' | 'bl' | 'br'
export type MorphBox = { tw: number; th: number; pw: number; ph: number }

// The space kept between the panel and the edge of the screen.
const EDGE = 16

// The box it opens in: the nearest ancestor that clips (a card, a scroller, a demo frame), else the
// window. The panel never grows past its sides, so it fits whatever it sits in, not only the screen.
function sides(anchor: HTMLElement | null) {
  let clip: Element | null = null
  for (let e = anchor?.parentElement; e && e !== document.body; e = e.parentElement)
    if (getComputedStyle(e).overflowX !== 'visible') {
      clip = e
      break
    }
  const c = clip?.getBoundingClientRect()
  return { clip, left: Math.max(0, c?.left ?? 0), right: Math.min(window.innerWidth, c?.right ?? window.innerWidth), top: c?.top ?? 0, bottom: c?.bottom ?? window.innerHeight }
}

/**
 * Measures the button and the panel now and on every resize (`measure`), and while shut keeps the panel's
 * box no wider than the room it has (`fit`), so it never overflows its box. Returns the function that stops.
 */
export function observeMorphButton(anchor: HTMLElement, trigger: HTMLElement, shell: HTMLElement, measure: (box: MorphBox) => void, fit: (room: number) => void) {
  const read = () => {
    measure({ tw: trigger.offsetWidth, th: trigger.offsetHeight, pw: shell.offsetWidth, ph: shell.offsetHeight })
    if (shell.dataset.open !== undefined) return
    const a = anchor.getBoundingClientRect(),
      { left, right } = sides(anchor)
    fit(Math.max(trigger.offsetWidth, shell.dataset.corner?.endsWith('r') ? a.right - left - EDGE : right - EDGE - a.left))
  }
  read()
  const ro = new ResizeObserver(read)
  ro.observe(trigger)
  ro.observe(shell)
  const clip = sides(anchor).clip
  if (clip) ro.observe(clip)
  return () => ro.disconnect()
}

/** It grows toward the side with room, decided before the move starts and never during it. */
export function placeMorphButton(anchor: HTMLElement | null, box: MorphBox): { corner: MorphCorner; room: number } | null {
  const a = anchor?.getBoundingClientRect()
  if (!a) return null
  const { left: L, right: R, top: T, bottom: B } = sides(anchor)
  const right = R - EDGE - a.left
  const left = a.right - L - EDGE
  // Up or down: first the way that fits both its box and the screen, then the way that fits its box
  // (a card that clips it would cut it; the page can still scroll), then the way with more room.
  const below = { box: B - a.top, screen: window.innerHeight - EDGE - a.top }
  const above = { box: a.bottom - T, screen: a.bottom - EDGE }
  const fits = (r: { box: number; screen: number }, both: boolean) => r.box >= box.ph && (!both || r.screen >= box.ph)
  const up = fits(below, true) ? false : fits(above, true) ? true : fits(below, false) ? false : fits(above, false) ? true : above.box > below.box
  const flipX = right < box.pw && left > right
  return { corner: `${up ? 'b' : 't'}${flipX ? 'r' : 'l'}` as MorphCorner, room: Math.max(box.tw, flipX ? left : right) }
}

/** Shut, the surface is cut back to the button's own box in the chosen corner. Open, it is whole. */
export function morphInsets(corner: MorphCorner, box: MorphBox, open: boolean) {
  const dx = Math.max(0, box.pw - box.tw)
  const dy = Math.max(0, box.ph - box.th)
  const shut = { tl: [0, dx, dy, 0], tr: [0, 0, dy, dx], bl: [dy, dx, 0, 0], br: [dy, 0, 0, dx] }[corner]
  const [t, r, b, l] = open ? [0, 0, 0, 0] : shut
  return { '--t': `${t}px`, '--r': `${r}px`, '--b': `${b}px`, '--l': `${l}px`, '--pill': `${box.th / 2}px` }
}

/** A press outside that lands on something that takes focus itself keeps it; anything else gives focus back to the button. */
export const takesFocus = (target: EventTarget | null) => target instanceof Element && !!target.closest('a[href], button, input, select, textarea, label, [tabindex]:not([tabindex="-1"])')
