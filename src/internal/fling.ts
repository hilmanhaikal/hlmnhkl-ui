import { useEffect, useRef, type PointerEvent, type RefObject } from 'react'
import { rubber, speedTracker } from './feel'
import { createDragClose, createFling, release } from './motion/fling'

export { rubber, speedTracker, release }

/** React's hold on createFling (motion/fling.ts): the panel's ref and its open state. */
export function useFling(ref: RefObject<HTMLElement | null>, open: boolean, axis: 'x' | 'y') {
  const core = useRef<ReturnType<typeof createFling>>(null)
  core.current ??= createFling(() => ref.current, { axis })
  const fling = core.current

  useEffect(() => () => fling.destroy(), [fling])
  useEffect(() => {
    if (open) fling.opened()
    else fling.closed()
  }, [open, fling])

  return { at: { get current() { return fling.at } }, paint: fling.paint, fling: fling.fling, stop: fling.stop }
}

/** React's hold on createDragClose (motion/fling.ts). Returns pointer handlers for the part it is held by. */
export function useDragClose(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void, can: (e: PointerEvent<HTMLElement>) => boolean = () => true) {
  const latest = useRef({ open, onClose, can })
  latest.current = { open, onClose, can }
  const core = useRef<ReturnType<typeof createDragClose>>(null)
  core.current ??= createDragClose(() => ref.current, {
    onClose: () => latest.current.onClose(),
    isOpen: () => latest.current.open,
    can: (e) => latest.current.can(e as PointerEvent<HTMLElement>),
  })
  const drag = core.current

  useEffect(() => () => drag.destroy(), [drag])
  useEffect(() => {
    if (open) drag.fling.opened()
    else drag.fling.closed()
  }, [open, drag])

  return { onPointerDown: drag.down, onPointerMove: drag.move, onPointerUp: drag.up, onPointerCancel: drag.up }
}
