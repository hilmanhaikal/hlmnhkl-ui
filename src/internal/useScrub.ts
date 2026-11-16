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
    if (!el || !wheels) return
    return s.wheelOn(el)
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

/** A colour between two tokens by the pull, so ink fills in as a mark is drawn in. */
export const ink = (p: number, from = 'var(--gooee-color-fg-muted)', to = 'var(--gooee-color-fg)') => `color-mix(in srgb, ${to} ${Math.round(p * 100)}%, ${from})`

/** A number token read from `el`, such as a px size or a share. */
export const tokenNumber = (el: Element | null, name: string) => (el ? parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0 : 0)

/** A wheel turn's sideways part in px: a sideways swipe, or Shift and the wheel. Null when it is mostly up and down, so the page scrolls. */
export function sideways(e: WheelEvent) {
  const line = e.deltaMode === 1 ? 40 : 1
  const dx = (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * line
  const dy = e.shiftKey ? 0 : e.deltaY * line
  return Math.abs(dx) > Math.abs(dy) ? dx : null
}

/** Calls `fn` each time `value` changes (by `key`), but not for the value it starts with. */
export function useOnChange<T>(value: T, fn: ((value: T) => void) | undefined, key = String(value)) {
  const latest = useRef(fn)
  latest.current = fn
  const seen = useRef(key)
  useEffect(() => {
    if (seen.current === key) return
    seen.current = key
    latest.current?.(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
