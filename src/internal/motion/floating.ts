// Places a floating layer (a menu, popover or tooltip) next to its anchor, flipping to the other side when
// it would leave the screen and keeping a margin from the screen's edges. The same in every framework.

export type Side = 'top' | 'bottom' | 'left' | 'right'
export type Align = 'start' | 'center' | 'end'
export type FloatingOptions = { side?: Side; align?: Align; offset?: number; matchWidth?: boolean }
export type Place = { top: number; left: number; side: Side; width?: number }

const MARGIN = 8

/** Where the layer goes now, or null while either element is missing. */
export function place(anchor: HTMLElement | null, floating: HTMLElement | null, { side = 'bottom', align = 'center', offset = 8, matchWidth = false }: FloatingOptions = {}): Place | null {
  if (!anchor || !floating) return null
  const r = anchor.getBoundingClientRect()
  const width = matchWidth ? r.width : undefined
  const fw = width ?? floating.offsetWidth
  const fh = floating.offsetHeight
  const vw = window.innerWidth
  const vh = window.innerHeight

  let s = side
  if (s === 'bottom' && r.bottom + offset + fh > vh - MARGIN && r.top - offset - fh > MARGIN) s = 'top'
  else if (s === 'top' && r.top - offset - fh < MARGIN && r.bottom + offset + fh < vh - MARGIN) s = 'bottom'
  else if (s === 'right' && r.right + offset + fw > vw - MARGIN && r.left - offset - fw > MARGIN) s = 'left'
  else if (s === 'left' && r.left - offset - fw < MARGIN && r.right + offset + fw < vw - MARGIN) s = 'right'

  let top = 0
  let left = 0
  if (s === 'bottom' || s === 'top') {
    top = s === 'bottom' ? r.bottom + offset : r.top - offset - fh
    left = align === 'start' ? r.left : align === 'end' ? r.right - fw : r.left + r.width / 2 - fw / 2
  } else {
    left = s === 'right' ? r.right + offset : r.left - offset - fw
    top = align === 'start' ? r.top : align === 'end' ? r.bottom - fh : r.top + r.height / 2 - fh / 2
  }
  left = Math.min(Math.max(MARGIN, left), Math.max(MARGIN, vw - fw - MARGIN))
  top = Math.min(Math.max(MARGIN, top), Math.max(MARGIN, vh - fh - MARGIN))
  return { top, left, side: s, width }
}

/** Calls `update` now and whenever either element resizes or the page scrolls or resizes. Returns a stop. */
export function follow(anchor: HTMLElement | null, floating: HTMLElement | null, update: () => void) {
  update()
  const ro = new ResizeObserver(update)
  if (floating) ro.observe(floating)
  if (anchor) ro.observe(anchor)
  window.addEventListener('scroll', update, true)
  window.addEventListener('resize', update)
  return () => {
    ro.disconnect()
    window.removeEventListener('scroll', update, true)
    window.removeEventListener('resize', update)
  }
}

/** The layer's style: fixed in its place, or see-through (not hidden, so focus can still move in) before the first measure. */
export const floatingStyle = (at: Place | null) =>
  at ? { position: 'fixed' as const, top: at.top, left: at.left, width: at.width } : { position: 'fixed' as const, top: 0, left: 0, opacity: 0, pointerEvents: 'none' as const }
