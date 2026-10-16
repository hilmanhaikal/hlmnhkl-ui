'use client'

import { useId } from 'react'
import { cx } from '../../internal/cx'
import styles from './ProgressBar.module.css'

export type ProgressBarProps = {
  /** Says what is in progress. Shown above the bar and read by screen readers. */
  label: string
  /** 0 to max. Leave undefined for an indeterminate bar. */
  value?: number
  /** The value that means done. */
  max?: number
  /** Shows the percentage next to the label. */
  showValue?: boolean
  /** Hides the label visually but keeps it for screen readers. */
  hideLabel?: boolean
  /** Thickness of the bar. */
  size?: 'sm' | 'md'
  /** Extra class for the root element. */
  className?: string
}

export function ProgressBar({ label, value, max = 100, showValue = true, hideLabel, size = 'md', className }: ProgressBarProps) {
  const id = useId()
  const determinate = value !== undefined
  const ratio = determinate ? Math.min(Math.max(value / max, 0), 1) : 0
  const pct = Math.round(ratio * 100)
  return (
    <div className={cx(styles.root, className)}>
      <div className={cx(styles.head, hideLabel && styles.srOnly)}>
        <span id={id} className={styles.label}>{label}</span>
        {determinate && showValue && <span className={styles.value} aria-hidden="true">{pct}%</span>}
      </div>
      <div
        role="progressbar"
        aria-labelledby={id}
        aria-valuemin={determinate ? 0 : undefined}
        aria-valuemax={determinate ? max : undefined}
        aria-valuenow={determinate ? value : undefined}
        className={cx(styles.track, styles[size])}
        data-indeterminate={!determinate || undefined}
      >
        <span className={styles.fill} style={determinate ? { transform: `scaleX(${ratio})` } : undefined} />
      </div>
    </div>
  )
}
