'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { prefersReducedMotion } from '../../internal/motion'
import styles from './ScrollArea.module.css'

export type ScrollAreaProps = {
  /** Name of the scrollable region. Required, because the region takes keyboard focus. */
  label: string
  /** Any CSS length, such as 320 or "50vh". */
  maxHeight?: CSSProperties['maxHeight']
  /** Which ways the content can scroll, and which scrollbars show. */
  orientation?: 'vertical' | 'horizontal' | 'both'
  /** Extra class for the root element. */
  className?: string
  /** Content that scrolls. */
  children: ReactNode
}

type Axis = 'y' | 'x'
const IDLE_MS = 900

export function ScrollArea({ label, maxHeight, orientation = 'vertical', className, children }: ScrollAreaProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const thumbs = useRef<Record<Axis, HTMLDivElement | null>>({ x: null, y: null })
  const idle = useRef<number | undefined>(undefined)
  const drag = useRef<{ axis: Axis; start: number; scroll: number; ratio: number; pointer: number } | null>(null)
  const showY = orientation !== 'horizontal'
  const showX = orientation !== 'vertical'

  // Direct style writes, so scrolling never re-renders React
  const update = useCallback(() => {
    const vp = viewportRef.current
    const root = rootRef.current
    if (!vp || !root) return
    const place = (axis: Axis) => {
      const thumb = thumbs.current[axis]
      if (!thumb) return
      const track = thumb.parentElement as HTMLElement
      const size = axis === 'y' ? vp.clientHeight : vp.clientWidth
      const full = axis === 'y' ? vp.scrollHeight : vp.scrollWidth
      const pos = axis === 'y' ? vp.scrollTop : vp.scrollLeft
      const overflow = full > size + 1
      track.toggleAttribute('data-hidden', !overflow)
      if (!overflow) return
      const pad = parseFloat(getComputedStyle(track).paddingTop) || 0
      const trackLen = (axis === 'y' ? track.clientHeight : track.clientWidth) - pad * 2
      const minThumb = parseFloat(getComputedStyle(root).getPropertyValue('--hl-scrollbar-min')) || 24
      const len = Math.max(minThumb, (size / full) * trackLen)
      const offset = (pos / (full - size)) * (trackLen - len)
      if (axis === 'y') {
        thumb.style.height = `${len}px`
        thumb.style.transform = `translateY(${offset}px)`
      } else {
        thumb.style.width = `${len}px`
        thumb.style.transform = `translateX(${offset}px)`
      }
    }
    place('y')
    place('x')
  }, [])

  const wake = () => {
    const root = rootRef.current
    if (!root) return
    root.setAttribute('data-active', '')
    window.clearTimeout(idle.current)
    idle.current = window.setTimeout(() => {
      if (!drag.current) root.removeAttribute('data-active')
    }, IDLE_MS)
  }

  useLayoutEffect(() => {
    update()
    const vp = viewportRef.current
    if (!vp) return
    const ro = new ResizeObserver(update)
    ro.observe(vp)
    if (vp.firstElementChild) ro.observe(vp.firstElementChild)
    return () => ro.disconnect()
  }, [update])

  useEffect(() => () => window.clearTimeout(idle.current), [])

  const onThumbDown = (axis: Axis) => (e: PointerEvent<HTMLDivElement>) => {
    const vp = viewportRef.current
    if (!vp || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.preventDefault()
    e.stopPropagation()
    const track = e.currentTarget.parentElement as HTMLElement
    const full = axis === 'y' ? vp.scrollHeight : vp.scrollWidth
    const trackLen = axis === 'y' ? track.clientHeight : track.clientWidth
    drag.current = {
      axis,
      start: axis === 'y' ? e.clientY : e.clientX,
      scroll: axis === 'y' ? vp.scrollTop : vp.scrollLeft,
      ratio: full / trackLen,
      pointer: e.pointerId,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    rootRef.current?.setAttribute('data-dragging', '')
  }

  const onThumbMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const vp = viewportRef.current
    if (!d || !vp || d.pointer !== e.pointerId) return
    const delta = (d.axis === 'y' ? e.clientY : e.clientX) - d.start
    if (d.axis === 'y') vp.scrollTop = d.scroll + delta * d.ratio
    else vp.scrollLeft = d.scroll + delta * d.ratio
  }

  const onThumbUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    e.currentTarget.releasePointerCapture(drag.current.pointer)
    drag.current = null
    rootRef.current?.removeAttribute('data-dragging')
    wake()
  }

  const onTrackDown = (axis: Axis) => (e: PointerEvent<HTMLDivElement>) => {
    const vp = viewportRef.current
    const thumb = thumbs.current[axis]
    if (!vp || !thumb) return
    const r = thumb.getBoundingClientRect()
    const before = axis === 'y' ? e.clientY < r.top : e.clientX < r.left
    const page = (axis === 'y' ? vp.clientHeight : vp.clientWidth) * 0.9
    vp.scrollBy({ [axis === 'y' ? 'top' : 'left']: before ? -page : page, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  const track = (axis: Axis) => (
    <div className={styles.track} data-axis={axis} aria-hidden="true" onPointerDown={onTrackDown(axis)}>
      <div
        ref={(el) => {
          thumbs.current[axis] = el
        }}
        className={styles.thumb}
        onPointerDown={onThumbDown(axis)}
        onPointerMove={onThumbMove}
        onPointerUp={onThumbUp}
        onPointerCancel={onThumbUp}
      />
    </div>
  )

  return (
    <div ref={rootRef} className={cx(styles.root, className)} data-orientation={orientation} onPointerEnter={wake} onPointerMove={wake}>
      <div
        ref={viewportRef}
        className={styles.viewport}
        style={{ maxHeight }}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={() => {
          update()
          wake()
        }}
      >
        <div className={styles.content}>{children}</div>
      </div>
      {showY && track('y')}
      {showX && track('x')}
    </div>
  )
}
