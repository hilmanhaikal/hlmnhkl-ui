import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

export function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('inert') && el.getClientRects().length > 0,
  )
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
    const previous = document.activeElement as HTMLElement | null
    // Close buttons opt out of first focus, so focus lands on the content or the safe action.
    const list = focusables(root)
    const first = initialFocus?.current ?? list.find((el) => !el.hasAttribute('data-skip-initial-focus')) ?? list[0] ?? root
    first.focus({ preventScroll: true })

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
      }
    }
    root.addEventListener('keydown', onKey)
    return () => {
      root.removeEventListener('keydown', onKey)
      // Give focus back only if it is still in the layer, so a click elsewhere keeps its own focus.
      const now = document.activeElement
      const stillInside = !now || now === document.body || root.contains(now)
      if (restore && stillInside && previous && document.contains(previous)) previous.focus({ preventScroll: true })
    }
  }, [active])
}
