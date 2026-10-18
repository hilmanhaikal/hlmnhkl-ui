import type { CSSProperties } from 'react'
import { cx } from '../../internal/cx'
import styles from './Skeleton.module.css'

export type SkeletonProps = {
  /** Text draws lines, rect a box, circle a round shape such as an avatar. */
  shape?: 'text' | 'rect' | 'circle'
  /** Any CSS width, such as 120 or "50%". */
  width?: CSSProperties['width']
  /** Any CSS height. Ignored for text, where lines set the height. */
  height?: CSSProperties['height']
  /** For text: number of lines. The last one is shorter, like real text. */
  lines?: number
  /** Solid grey shapes, or a sketch: the same shapes as dashed outlines, like a pencil layout. */
  variant?: 'solid' | 'sketch'
  /** Extra class for the root element. */
  className?: string
}

// Decorative only. Mark the loading container with aria-busy and a label instead.
export function Skeleton({ shape = 'rect', width, height, lines = 1, variant = 'solid', className }: SkeletonProps) {
  const look = variant === 'sketch' && styles.sketch
  if (shape === 'text') {
    return (
      <span className={cx(styles.lines, className)} style={{ width }} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className={cx(styles.bone, styles.text, look)}
            style={{ width: lines > 1 && i === lines - 1 ? '62%' : '100%', ['--i' as string]: i }}
          />
        ))}
      </span>
    )
  }
  return <span className={cx(styles.bone, styles[shape], look, className)} style={{ width, height }} aria-hidden="true" />
}
