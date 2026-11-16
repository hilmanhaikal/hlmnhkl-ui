import { useLayoutEffect, useRef, type RefObject } from 'react'
import { createFlow, type Place } from './motion/liquidMatter'

export { castShadow, frames, layer, morphEase, motionFor, shadowOf, type Place } from './motion/liquidMatter'

/** React's hold on createFlow (motion/liquidMatter.ts): runs the flow when the choice or its place changes. */
export function useFlow(
  host: RefObject<HTMLElement | null>,
  mark: RefObject<HTMLElement | null>,
  place: Place | null,
  choice: unknown,
  ready: boolean,
  cls: string,
  line = false,
  ink?: (outline: string | null) => void,
) {
  const inkRef = useRef(ink)
  inkRef.current = ink
  const flow = useRef<ReturnType<typeof createFlow>>(null)
  flow.current ??= createFlow(() => host.current, () => mark.current, { cls, line, ink: (d) => inkRef.current?.(d) })
  useLayoutEffect(() => {
    flow.current!.update(place, choice, ready)
    // Keyed on the choice and the place; the rest is read when it runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, place?.x, place?.w, ready])
  useLayoutEffect(() => () => flow.current!.destroy(), [])
}
