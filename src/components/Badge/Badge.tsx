import type { ComponentPropsWithRef } from 'react'
import { cx } from '../../internal/cx'
import styles from './Badge.module.css'

export type BadgeProps = ComponentPropsWithRef<'span'> & {
  /** Visual weight: filled, outlined or a soft tint. */
  variant?: 'solid' | 'outline' | 'subtle'
  /** Status colour. Use it only for a real status, and keep a word in the badge. */
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
  /** A small dot before the text. "pulse" makes it breathe, for live states. */
  dot?: boolean | 'pulse'
}

export function Badge({ variant = 'subtle', tone = 'neutral', dot, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx(styles.root, styles[variant], className)} data-tone={tone === 'neutral' ? undefined : tone} {...rest}>
      {dot && <span className={styles.dot} data-pulse={dot === 'pulse' || undefined} aria-hidden="true" />}
      {/* Keyed on content, so a new value pops in instead of swapping silently. */}
      <span key={typeof children === 'string' || typeof children === 'number' ? String(children) : undefined} className={styles.text}>
        {children}
      </span>
    </span>
  )
}
