// Gooee UI, MIT licence. https://gooee.dev
import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { createSoftPress, type SoftLook } from './motion/softPress'

export type { SoftLook } from './motion/softPress'

/** React's hold on createSoftPress (motion/softPress.ts): returns the button's event handlers. */
export function useSoftPress(look: SoftLook, inert: boolean, keys: string[]) {
  const props = useRef({ look, inert, keys })
  props.current = { look, inert, keys }
  const soft = useRef<ReturnType<typeof createSoftPress>>(null)
  soft.current ??= createSoftPress({
    get look() {
      return props.current.look
    },
    get keys() {
      return props.current.keys
    },
    get inert() {
      return props.current.inert
    },
  })
  const p = soft.current

  useEffect(() => p.destroy, [p])
  useEffect(() => {
    if (inert) p.stop()
  }, [inert, p])

  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => p.down(e),
    onPointerMove: (e: PointerEvent<HTMLElement>) => p.hover(e),
    onPointerLeave: p.leave,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => p.keyDown(e),
    onKeyUp: (e: KeyboardEvent<HTMLElement>) => p.keyUp(e),
    onBlur: p.blur,
  }
}
