import type { ReactNode } from 'react'
import { cx } from '../../internal/cx'
import styles from './Divider.module.css'

export type DividerProps = {
  /** Direction of the line. A vertical line stretches to the height of its flex row. */
  orientation?: 'horizontal' | 'vertical'
  /** Text in the middle of a horizontal line, such as "or". */
  label?: ReactNode
  /** Draws the line in from the centre when it mounts. */
  animated?: boolean
  /** Extra class for the root element. */
  className?: string
}

export function Divider({ orientation = 'horizontal', label, animated = true, className }: DividerProps) {
  if (label && orientation === 'horizontal') {
    // A separator hides its children, so the role sits on the lines and the label is still read.
    return (
      <div className={cx(styles.labelled, animated && styles.animated, className)}>
        <span className={styles.line} role="separator" aria-orientation="horizontal" />
        <span className={styles.text}>{label}</span>
        <span className={styles.line} role="separator" aria-orientation="horizontal" />
      </div>
    )
  }
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cx(styles.root, styles[orientation], animated && styles.animated, className)}
    />
  )
}
