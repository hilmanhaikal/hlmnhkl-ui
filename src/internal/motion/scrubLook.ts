// Small helpers the scrubbed parts (Dial, RulerScrubber, PickerWheel) share in React and Vue.

/** A colour between two tokens by the pull, so ink fills in as a mark is drawn in. */
export const ink = (p: number, from = 'var(--gooee-color-fg-muted)', to = 'var(--gooee-color-fg)') => `color-mix(in srgb, ${to} ${Math.round(p * 100)}%, ${from})`

/** A number token read from `el`, such as a px size or a share. */
export const tokenNumber = (el: Element | null, name: string) => (el ? parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0 : 0)

/** A wheel turn's sideways part in px: a sideways swipe, or Shift and the wheel. Null when it is mostly up and down, so the page scrolls. */
export function sideways(e: WheelEvent) {
  const line = e.deltaMode === 1 ? 40 : 1
  const dx = (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * line
  const dy = e.shiftKey ? 0 : e.deltaY * line
  return Math.abs(dx) > Math.abs(dy) ? dx : null
}
