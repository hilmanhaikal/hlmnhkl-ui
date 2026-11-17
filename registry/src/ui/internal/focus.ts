// Gooee UI, MIT licence. https://gooee.dev
import { useEffect, type RefObject } from 'react'
import { trapFocus } from './motion/focus'

export { focusables, returnTarget, trapFocus } from './motion/focus'

/** React's hold on trapFocus (motion/focus.ts): while `active`, Tab stays inside `ref`. */
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
    return trapFocus(root, { initialFocus: initialFocus?.current, restore })
  }, [active])
}
