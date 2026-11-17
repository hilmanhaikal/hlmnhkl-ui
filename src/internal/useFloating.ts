import { useCallback, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'
import { floatingStyle, follow, place, type Align, type Place, type Side } from './motion/floating'

export type { Align, Side } from './motion/floating'

type Options = {
  open: boolean
  side?: Side
  align?: Align
  offset?: number
  matchWidth?: boolean
}

/** React's hold on place and follow (motion/floating.ts). */
export function useFloating(
  anchorRef: RefObject<HTMLElement | null>,
  floatingRef: RefObject<HTMLElement | null>,
  { open, side = 'bottom', align = 'center', offset = 8, matchWidth = false }: Options,
) {
  const [pos, setPos] = useState<Place | null>(null)
  // Measured since this open began.
  const [fresh, setFresh] = useState(false)

  const update = useCallback(() => {
    const at = place(anchorRef.current, floatingRef.current, { side, align, offset, matchWidth })
    if (!at) return
    setPos(at)
    setFresh(true)
  }, [anchorRef, floatingRef, side, align, offset, matchWidth])

  useLayoutEffect(() => {
    // Closed: the next open is not ready until it has been measured again, so nothing reads a stale
    // place. The place itself stays, so a layer that stays on screen never flashes.
    if (!open) {
      setFresh(false)
      return
    }
    return follow(anchorRef.current, floatingRef.current, update)
  }, [open, update, floatingRef, anchorRef])

  const style = floatingStyle(pos) as CSSProperties

  // ready: the layer is in its place, so a part can measure it there (for its opening animation).
  return { style, side: pos?.side ?? side, update, ready: pos !== null && fresh }
}
