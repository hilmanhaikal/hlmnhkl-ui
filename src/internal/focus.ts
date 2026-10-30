import { useEffect, type RefObject } from 'react'

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
}

// Where focus should go back to: the focused element, unless it is the page or a box around the
// control that was just pressed. Then that control.
function returnTarget(): HTMLElement | null {
  const active = document.activeElement as HTMLElement | null
  const pressed = lastPressed && lastPressed.isConnected ? lastPressed : null
  if (pressed && (!active || active === document.body || (active !== pressed && active.contains(pressed)))) return pressed
  return active
}

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  options: { initialFocus?: RefObject<HTMLElement | null>; restore?: boolean } = {},
) {
  const { initialFocus, restore = true } = options
  useEffect(() => {
    if (!active) return
    const root = ref.current
    if (!root) return
    const previous = returnTarget()
    // Close buttons opt out of first focus, so focus lands on the content or the safe action.
    const list = focusables(root)
    const first = initialFocus?.current ?? list.find((el) => !el.hasAttribute('data-skip-initial-focus')) ?? list[0] ?? root
    first.focus({ preventScroll: true })

    // Safari's plain Tab skips buttons, so it can jump from the middle of the layer to the page behind,
    // or off the page. A Tab that lands outside goes back to the end it wrapped past.
    let check = 0
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables(root)
      if (items.length === 0) {
        e.preventDefault()
        root.focus()
        return
      }
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      const current = document.activeElement
      if (e.shiftKey && (current === firstEl || current === root)) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && current === lastEl) {
        e.preventDefault()
        firstEl.focus()
      } else {
        const back = e.shiftKey
        clearTimeout(check)
        check = window.setTimeout(() => {
          if (root.contains(document.activeElement)) return
          const now = focusables(root)
          now[back ? now.length - 1 : 0]?.focus({ preventScroll: true })
        })
      }
    }
    root.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(check)
      root.removeEventListener('keydown', onKey)
      // Give focus back only if it is still in the layer, so a click elsewhere keeps its own focus.
      const now = document.activeElement
      const stillInside = !now || now === document.body || root.contains(now)
      if (restore && stillInside && previous && document.contains(previous)) previous.focus({ preventScroll: true })
    }
  }, [active])
}
