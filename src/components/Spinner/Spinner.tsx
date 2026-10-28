'use client'

import { useEffect, useState } from 'react'
import { cx } from '../../internal/cx'
import styles from './Spinner.module.css'

export type SpinnerProps = {
  /** Diameter of the spinner. */
  size?: 'sm' | 'md' | 'lg'
  /** Spoken to screen readers. Pass null when a parent already announces the busy state. */
  label?: string | null
  /** Extra class for the root element. */
  className?: string
}

export function Spinner({ size = 'md', label = 'Loading', className }: SpinnerProps) {
  // The label lands after the empty live region is mounted, so screen readers hear it.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return (
    <span className={cx(styles.root, styles[size], className)} role={label ? 'status' : undefined}>
      <svg className={styles.svg} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle className={styles.track} cx="12" cy="12" r="9.5" />
        <circle className={styles.arc} cx="12" cy="12" r="9.5" pathLength="100" />
      </svg>
      {label && <span className={styles.srOnly}>{mounted ? label : null}</span>}
    </span>
  )
}
