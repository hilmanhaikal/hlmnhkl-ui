'use client'

import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { createScrollArea, type ScrollAxis } from '../../internal/motion/scrollArea'
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

export function ScrollArea({ label, maxHeight, orientation = 'vertical', className, children }: ScrollAreaProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const thumbs = useRef<Record<ScrollAxis, HTMLDivElement | null>>({ x: null, y: null })
  const showY = orientation !== 'horizontal'
  const showX = orientation !== 'vertical'

  // The thumbs, their idle fade and drags (motion/scrollArea.ts): direct style writes, so scrolling never re-renders React.
  const area = useRef<ReturnType<typeof createScrollArea>>(null)
  area.current ??= createScrollArea({ root: () => rootRef.current, viewport: () => viewportRef.current, thumb: (axis) => thumbs.current[axis] })
  const a = area.current

  useLayoutEffect(() => a.observe(), [a])
  useEffect(() => a.destroy, [a])

  const track = (axis: ScrollAxis) => (
    <div className={styles.track} data-axis={axis} aria-hidden="true" onPointerDown={(e) => a.trackDown(axis, e)}>
      <div
        ref={(el) => {
          thumbs.current[axis] = el
        }}
        className={styles.thumb}
        onPointerDown={(e) => a.thumbDown(axis, e)}
        onPointerMove={a.thumbMove}
        onPointerUp={a.thumbUp}
        onPointerCancel={a.thumbUp}
      />
    </div>
  )

  return (
    <div ref={rootRef} className={cx(styles.root, className)} data-orientation={orientation} onPointerEnter={a.wake} onPointerMove={a.wake}>
      <div ref={viewportRef} className={styles.viewport} style={{ maxHeight }} role="region" aria-label={label} tabIndex={0} onScroll={a.onScroll}>
        <div className={styles.content}>{children}</div>
      </div>
      {showY && track('y')}
      {showX && track('x')}
    </div>
  )
}
