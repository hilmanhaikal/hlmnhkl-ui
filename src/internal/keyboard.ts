// A phone's keyboard covers the bottom of the window, and Safari scrolls a field into view only when
// you tap the field itself. Parts move focus from code without scrolling (so their morph never jumps),
// which leaves the field under the keyboard. While a keyboard is up, this keeps the focused field in
// view: the page scrolls just enough, or a fixed layer (a sheet, a dialog) lifts, then drops back
// when the keyboard goes. A layer that places itself over the keyboard opts out with data-own-keyboard.

const GAP = 16
const FIELD = 'input:not([type="checkbox"], [type="radio"], [type="range"], [type="button"], [type="submit"], [type="reset"], [type="color"], [type="file"]), textarea, [contenteditable=""], [contenteditable="true"]'

let watching = false
let lifted: { layer: HTMLElement; by: number } | null = null
let probe: HTMLElement | null = null

function fixedLayer(el: HTMLElement) {
  for (let a: HTMLElement | null = el; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') return a
  return null
}

function drop() {
  if (!lifted) return
  lifted.layer.style.removeProperty('translate')
  lifted = null
}

function reveal() {
  const vv = window.visualViewport!
  const field = document.activeElement
  // A pinch zoom also shrinks the visual viewport; only a keyboard does it at scale 1.
  const keyboard = vv.scale < 1.01 && innerHeight - vv.height > 120
  if (!keyboard || !(field instanceof HTMLElement) || !field.matches(FIELD) || field.closest('[data-own-keyboard]')) return drop()
  const layer = fixedLayer(field)
  if (lifted && lifted.layer !== layer) drop()
  // The visible bottom, in the same terms as measured boxes: on iPhone those move with the visible area
  // when it pans, elsewhere they stay on the page. A marker fixed to the floor shows which.
  const floor = probe!.getBoundingClientRect().top
  const over = field.getBoundingClientRect().bottom + GAP - (floor - (innerHeight - vv.offsetTop - vv.height))
  if (!layer) {
    if (over > 0) window.scrollBy({ top: over, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    return
  }
  // Never lifted past the top of what is visible.
  const now = lifted?.by ?? 0
  const room = layer.getBoundingClientRect().top - (floor - innerHeight + vv.offsetTop) - GAP + now
  const by = Math.max(0, Math.min(now + over, room))
  if (by === now) return
  layer.style.translate = `0 ${-by}px`
  lifted = { layer, by }
}

/** Starts watching once per page. Only touch screens get a keyboard, so a mouse never sees it act. */
export function watchKeyboard() {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null
  if (watching || !vv || !matchMedia('(pointer: coarse)').matches) return
  watching = true
  probe = document.createElement('div')
  probe.setAttribute('aria-hidden', 'true')
  Object.assign(probe.style, { position: 'fixed', bottom: '0', left: '0', width: '0', height: '0', pointerEvents: 'none' })
  document.body.append(probe)
  vv.addEventListener('resize', reveal)
  document.addEventListener('focusin', () => requestAnimationFrame(reveal))
  document.addEventListener('focusout', () => requestAnimationFrame(reveal))
}
