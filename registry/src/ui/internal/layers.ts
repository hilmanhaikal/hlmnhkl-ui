// Gooee UI, MIT licence. https://gooee.dev
import { useEffect, useRef, type RefObject } from 'react'
import { dismissable, lockScroll, type DismissOptions } from './motion/layers'

export { dismissable, lockScroll, type DismissOptions } from './motion/layers'

/** React's hold on dismissable (motion/layers.ts): while `active`, Esc and a press outside `refs` call `onDismiss`. */
export function useDismiss(
  active: boolean,
  refs: Array<RefObject<HTMLElement | null>>,
  onDismiss: (reason: 'escape' | 'outside', event: Event) => void,
  options: DismissOptions = {},
) {
  const { outside = true, hint = false, focusOut = false } = options
  const cb = useRef(onDismiss)
  cb.current = onDismiss
  const refsRef = useRef(refs)
  refsRef.current = refs

  useEffect(() => {
    if (!active) return
    return dismissable(() => refsRef.current.map((r) => r.current), (reason, e) => cb.current(reason, e), { outside, hint, focusOut })
  }, [active, outside, hint, focusOut])
}

/** React's hold on lockScroll (motion/layers.ts). */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    return lockScroll()
  }, [active])
}
