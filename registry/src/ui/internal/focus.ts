// Gooee UI, MIT licence. https://gooee.dev
import { useEffect, type RefObject } from 'react'
import { focusables, returnTarget } from './motion/focus'

export { focusables, returnTarget } from './motion/focus'

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
