// Gooee UI, MIT licence. https://gooee.dev
import { useEffect, type RefObject } from 'react'
import { createBead, createEdgeFlow } from './motion/liquidMore'

export { type Cup, cupLevel, cupPath, type Pour, pour, edgeLoops, type CheckMorph, checkLoops, type CopyState, copyRun, type CopyRun, beadLoops } from './motion/liquidMore'

/** React's hold on createEdgeFlow (motion/liquidMore.ts): the field's focus edge flows round from where it was pressed. */
export function useEdgeFlow(target: RefObject<HTMLElement | null>, host: RefObject<HTMLElement | null>, when: string, cls: string) {
  useEffect(() => {
    const el = target.current
    const root = host.current
    if (!el || !root) return
    return createEdgeFlow(el, { root, when, className: cls }).destroy
  }, [target, host, when, cls])
}

/** React's hold on createBead (motion/liquidMore.ts): the menu's hover fill follows focus from item to item. */
export function useBead(panel: RefObject<HTMLElement | null>, on: boolean, cls: string) {
  useEffect(() => {
    const root = panel.current
    if (!root || !on) return
    return createBead(root, { className: cls }).destroy
  }, [panel, on, cls])
}
