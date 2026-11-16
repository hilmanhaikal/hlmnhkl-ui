import { useEffect, type RefObject } from 'react'
import { bead, edgeFlow } from './motion/liquidMore'

export { type Cup, cupLevel, cupPath, type Pour, pour, edgeLoops, type CheckMorph, checkLoops, type CopyState, copyRun, type CopyRun, beadLoops } from './motion/liquidMore'

/** React's hold on edgeFlow (motion/liquidMore.ts): the field's focus edge flows round from where it was pressed. */
export function useEdgeFlow(target: RefObject<HTMLElement | null>, host: RefObject<HTMLElement | null>, on: string, cls: string) {
  useEffect(() => {
    const el = target.current
    const root = host.current
    if (!el || !root) return
    return edgeFlow(el, root, on, cls)
  }, [target, host, on, cls])
}

/** React's hold on bead (motion/liquidMore.ts): the menu's hover fill follows focus from item to item. */
export function useBead(panel: RefObject<HTMLElement | null>, on: boolean, cls: string) {
  useEffect(() => {
    const root = panel.current
    if (!root || !on) return
    return bead(root, cls)
  }, [panel, on, cls])
}
