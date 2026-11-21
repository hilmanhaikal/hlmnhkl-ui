// Gooee UI, MIT licence. https://gooee.dev
import { prefersReducedMotion } from '../motion'

// ScrollArea's drawn scrollbar with no framework: the thumbs follow the native scroll, fade when idle and
// can be dragged. Every write goes straight to the DOM, so scrolling never re-renders.

export type ScrollAxis = 'y' | 'x'
const IDLE_MS = 900

// A pointer event from the DOM or from React: React's own, so stopPropagation also stops React's handlers.
type Press = Pick<PointerEvent, 'pointerType' | 'button' | 'clientX' | 'clientY' | 'pointerId' | 'preventDefault' | 'stopPropagation'>

type Parts = {
  root: () => HTMLElement | null
  viewport: () => HTMLElement | null
  thumb: (axis: ScrollAxis) => HTMLElement | null
}

export function createScrollArea({ root, viewport, thumb }: Parts) {
  let idle: number | undefined
  let drag: { axis: ScrollAxis; start: number; scroll: number; ratio: number; pointer: number } | null = null

  const update = () => {
    const vp = viewport()
    const el = root()
    if (!vp || !el) return
    const place = (axis: ScrollAxis) => {
      const t = thumb(axis)
      if (!t) return
      const track = t.parentElement as HTMLElement
      const size = axis === 'y' ? vp.clientHeight : vp.clientWidth
      const full = axis === 'y' ? vp.scrollHeight : vp.scrollWidth
      const pos = axis === 'y' ? vp.scrollTop : vp.scrollLeft
      const overflow = full > size + 1
      track.toggleAttribute('data-hidden', !overflow)
      if (!overflow) return
      const pad = parseFloat(getComputedStyle(track).paddingTop) || 0
      const trackLen = (axis === 'y' ? track.clientHeight : track.clientWidth) - pad * 2
      const minThumb = parseFloat(getComputedStyle(el).getPropertyValue('--gooee-scroll-area-thumb-min')) || 24
      const len = Math.max(minThumb, (size / full) * trackLen)
      const offset = (pos / (full - size)) * (trackLen - len)
      if (axis === 'y') {
        t.style.height = `${len}px`
        t.style.transform = `translateY(${offset}px)`
      } else {
        t.style.width = `${len}px`
        t.style.transform = `translateX(${offset}px)`
      }
    }
    place('y')
    place('x')
  }

  const wake = () => {
    const el = root()
    if (!el) return
    el.setAttribute('data-scrolling', '')
    window.clearTimeout(idle)
    idle = window.setTimeout(() => {
      if (!drag) el.removeAttribute('data-scrolling')
    }, IDLE_MS)
  }

  /** Places the thumbs now and again whenever the viewport or its content changes size. Returns a cleanup. */
  const observe = () => {
    update()
    const vp = viewport()
    if (!vp) return () => {}
    const ro = new ResizeObserver(update)
    ro.observe(vp)
    if (vp.firstElementChild) ro.observe(vp.firstElementChild)
    return () => ro.disconnect()
  }

  const onScroll = () => {
    update()
    wake()
  }

  const thumbDown = (axis: ScrollAxis, e: Press) => {
    const vp = viewport()
    const t = thumb(axis)
    if (!vp || !t || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.preventDefault()
    e.stopPropagation()
    const track = t.parentElement as HTMLElement
    const size = axis === 'y' ? vp.clientHeight : vp.clientWidth
    const full = axis === 'y' ? vp.scrollHeight : vp.scrollWidth
    const pad = parseFloat(getComputedStyle(track).paddingTop) || 0
    const trackLen = (axis === 'y' ? track.clientHeight : track.clientWidth) - pad * 2
    const thumbLen = axis === 'y' ? t.offsetHeight : t.offsetWidth
    // The thumb travels the track minus its own length, which is all the scroll there is.
    drag = {
      axis,
      start: axis === 'y' ? e.clientY : e.clientX,
      scroll: axis === 'y' ? vp.scrollTop : vp.scrollLeft,
      ratio: (full - size) / Math.max(1, trackLen - thumbLen),
      pointer: e.pointerId,
    }
    t.setPointerCapture(e.pointerId)
    root()?.setAttribute('data-dragging', '')
  }

  const thumbMove = (e: Pick<PointerEvent, 'clientX' | 'clientY' | 'pointerId'>) => {
    const vp = viewport()
    if (!drag || !vp || drag.pointer !== e.pointerId) return
    const delta = (drag.axis === 'y' ? e.clientY : e.clientX) - drag.start
    if (drag.axis === 'y') vp.scrollTop = drag.scroll + delta * drag.ratio
    else vp.scrollLeft = drag.scroll + delta * drag.ratio
  }

  const thumbUp = () => {
    if (!drag) return
    thumb(drag.axis)?.releasePointerCapture(drag.pointer)
    drag = null
    root()?.removeAttribute('data-dragging')
    wake()
  }

  // A press on the track pages towards it.
  const trackDown = (axis: ScrollAxis, e: Pick<PointerEvent, 'clientX' | 'clientY'>) => {
    const vp = viewport()
    const t = thumb(axis)
    if (!vp || !t) return
    const r = t.getBoundingClientRect()
    const before = axis === 'y' ? e.clientY < r.top : e.clientX < r.left
    const page = (axis === 'y' ? vp.clientHeight : vp.clientWidth) * 0.9
    vp.scrollBy({ [axis === 'y' ? 'top' : 'left']: before ? -page : page, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  const destroy = () => window.clearTimeout(idle)

  return { update, wake, observe, onScroll, thumbDown, thumbMove, thumbUp, trackDown, destroy }
}
