import { useLayoutEffect, useRef, type RefObject } from 'react'
import { createDialogMorph, createLiquid, createStretch, type LiquidOrigin as Origin, type StretchBox } from './motion/liquid'

export { startShape, stretch, type StretchBox } from './motion/liquid'

/** What the panel grows from: the opener's ref, or a function that finds the opener or a rectangle at open time. */
export type LiquidOrigin = RefObject<HTMLElement | null> | (() => HTMLElement | DOMRect | null)

/** React's hold on createLiquid (motion/liquid.ts): grows when `state` turns open (once `ready`), folds when it turns closed. */
export function useLiquid(panel: RefObject<HTMLElement | null>, origin: LiquidOrigin, state: 'open' | 'closed', ready: boolean) {
  const from = useRef(origin)
  from.current = origin
  const liquid = useRef<ReturnType<typeof createLiquid>>(null)
  liquid.current ??= createLiquid(() => panel.current, (() => {
    const o = from.current
    return typeof o === 'function' ? o() : o.current
  }) satisfies Origin)
  useLayoutEffect(() => {
    if (ready) liquid.current!.play(state)
    // Plays once per open and once per close; the origin is read fresh each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready])
  useLayoutEffect(() => () => liquid.current!.destroy(), [])
}

/** React's hold on createDialogMorph (motion/liquid.ts). */
export function useDialogMorph(panel: RefObject<HTMLElement | null>, open: boolean, mounted: boolean, state: 'open' | 'closed') {
  const wasOpen = useRef(false)
  const morph = useRef<ReturnType<typeof createDialogMorph>>(null)
  morph.current ??= createDialogMorph(() => panel.current)
  // Runs before the focus trap moves focus into the dialog.
  useLayoutEffect(() => {
    if (open && !wasOpen.current) morph.current!.opening()
    wasOpen.current = open
  }, [open])
  useLayoutEffect(() => {
    if (mounted) morph.current!.play(state)
  }, [state, mounted, panel])
  useLayoutEffect(() => () => morph.current!.destroy(), [])
}

/** React's hold on createStretch (motion/liquid.ts): the highlight stretches when the choice changes. */
export function useStretch(
  el: RefObject<HTMLElement | null>,
  box: StretchBox | null,
  choice: unknown,
  ready: boolean,
  place: (b: StretchBox) => string,
  axis: 'x' | 'y' = 'x',
) {
  const fmt = useRef(place)
  fmt.current = place
  const run = useRef<ReturnType<typeof createStretch>>(null)
  run.current ??= createStretch(() => el.current, (b) => fmt.current(b), axis)
  useLayoutEffect(() => {
    run.current!.update(box, choice, ready)
    // Keyed on the choice and the box; `place` is a pure formatter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, box?.x, box?.w, box?.y, ready])
  useLayoutEffect(() => () => run.current!.destroy(), [])
}
