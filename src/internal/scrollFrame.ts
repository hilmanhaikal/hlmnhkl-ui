import { useLayoutEffect, useRef } from 'react'
import { createScrollFrame, type ScrollReader } from './motion/scrollFrame'

export { bandProgress, easeToward, readScrollTokens, scrollTokens, type ScrollFrame, type ScrollReader, type ScrollTokens } from './motion/scrollFrame'

/** React's hold on createScrollFrame (motion/scrollFrame.ts): calls the latest `read` on mount and every frame while the page moves. */
export function useScrollFrame(read: ScrollReader, active = true) {
  const ref = useRef(read)
  useLayoutEffect(() => {
    ref.current = read
  })
  useLayoutEffect(() => {
    if (!active) return
    return createScrollFrame((f) => ref.current(f)).destroy
  }, [active])
}
