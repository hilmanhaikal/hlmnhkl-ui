// Gooee UI, MIT licence. https://gooee.dev
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { createScrubber, type ScrubberOptions } from './motion/scrubber'

// React's hold on createScrubber (motion/scrubber.ts) for Dial, RulerScrubber and PickerWheel.

export type UseScrubOptions = Omit<ScrubberOptions<PointerEvent<HTMLElement>>, 'onFrame' | 'onMoving'>

export function useScrub(o: UseScrubOptions) {
  const [at, setAt] = useState(o.value)
  const [moving, setMoving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const scrub = useRef<ReturnType<typeof createScrubber<PointerEvent<HTMLElement>>>>(null)
  const options = { ...o, onFrame: setAt, onMoving: setMoving }
  scrub.current ??= createScrubber(options)
  const s = scrub.current
  s.update(options)

  // A value set from outside (a controlled prop, a reset) glides there. So does one the parent kept
  // or changed when it came to rest.
  useEffect(() => s.sync(o.value), [o.value, s, moving])

  const wheels = !!o.wheel
  useEffect(() => {
    const el = ref.current
    if (el && wheels) s.listenWheel(el)
  }, [s, wheels])
  useEffect(() => () => s.destroy(), [s])

  return {
    ref,
    /** Where it is drawn now. */
    at,
    moving,
    go: s.go,
    place: s.place,
    target: s.target,
    handlers: { onPointerDown: s.down, onPointerMove: s.move, onPointerUp: s.up, onPointerCancel: s.up, onKeyDown: (e: KeyboardEvent<HTMLElement>) => s.keyDown(e) },
  }
}

export { ink, sideways, tokenNumber } from './motion/scrubLook'
