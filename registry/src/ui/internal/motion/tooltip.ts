// Gooee UI, MIT licence. https://gooee.dev
import { motionMs } from '../motion'
import type { Side } from './floating'

// When a tooltip shows and hides, the same in every framework: hover after a delay, keyboard focus at
// once, a tap for a moment on touch screens.

// How long a tip stays after a tap on a touch screen, so it can be read.
const TOUCH_SHOW_MS = 1500

// Shared by every tooltip on the page: right after one closes, the next shows at once.
let lastClosedAt = 0

/** The edge of the target the tip grows out of: a sliver as wide as the target, on the tip's side. */
export function tipEdge(anchor: HTMLElement | null, side: Side) {
  const r = anchor?.getBoundingClientRect()
  if (!r) return null
  if (side === 'top') return new DOMRect(r.left, r.top, r.width, 2)
  if (side === 'bottom') return new DOMRect(r.left, r.bottom - 2, r.width, 2)
  if (side === 'left') return new DOMRect(r.left, r.top, 2, r.height)
  return new DOMRect(r.right - 2, r.top, 2, r.height)
}

type PointerLike = { pointerType: string }

/** Feed it the trigger's events; it calls `setOpen`. `delay` is the hover delay, or undefined for the token. */
export function createTipTimer(setOpen: (open: boolean) => void, delay: () => number | undefined) {
  let timer: number | undefined
  const clear = () => window.clearTimeout(timer)
  const show = (wait: number) => {
    clear()
    timer = window.setTimeout(() => setOpen(true), wait)
  }
  const hide = (wait = 80) => {
    clear()
    timer = window.setTimeout(() => {
      setOpen(false)
      lastClosedAt = Date.now()
    }, wait)
  }
  const hoverDelay = () => (Date.now() - lastClosedAt < 400 ? 0 : (delay() ?? motionMs('delay-tooltip')))

  return {
    clear,
    hide,
    enter: (e: PointerLike) => e.pointerType === 'mouse' && show(hoverDelay()),
    leave: (e: PointerLike) => e.pointerType === 'mouse' && hide(),
    // Touch has no hover: a tap shows the tip at once, and it fades a moment after the finger lifts.
    // Opened now, not on a timer: the finger lifts in the same moment, which would cancel it.
    down(e: PointerLike) {
      if (e.pointerType !== 'touch') return
      clear()
      setOpen(true)
    },
    up: (e: PointerLike) => e.pointerType === 'touch' && hide(TOUCH_SHOW_MS),
    focus: (e: { target: EventTarget | null }) => (e.target as Element).matches(':focus-visible') && show(0),
    blur: () => hide(0),
  }
}
