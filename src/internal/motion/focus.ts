import { watchKeyboard } from '../keyboard'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

export function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('inert') && el.getClientRects().length > 0,
  )
}

// Safari, on iPhone and on Mac, does not focus a button when it is tapped or clicked. So the control
// that opened a layer is often not the focused element; remember the last one pressed instead.
// Watched from the moment this file loads, since a layer only mounts after the press that opens it.
let lastPressed: HTMLElement | null = null
if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    (e) => {
      lastPressed = (e.target instanceof Element ? e.target.closest<HTMLElement>(FOCUSABLE) : null) ?? null
    },
    true,
  )
  // Focus moved from code stays above a phone keyboard.
  watchKeyboard()
}

// Where focus should go back to: the focused element, unless it is the page or a box around the
// control that was just pressed. Then that control.
export function returnTarget(): HTMLElement | null {
  const active = document.activeElement as HTMLElement | null
  const pressed = lastPressed && lastPressed.isConnected ? lastPressed : null
  if (pressed && (!active || active === document.body || (active !== pressed && active.contains(pressed)))) return pressed
  return active
}
