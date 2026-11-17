'use client'

import { useRef, useState, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { CheckCircleIcon, ErrorIcon, InfoIcon, WarningIcon, XIcon } from '../../internal/icons'
import { foldAway } from '../../internal/motion/alert'
import { focusPast } from '../../internal/motion/collapseOut'
import styles from './Alert.module.css'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export type AlertProps = {
  /** Sets the colour and icon. Error and warning are announced at once. */
  variant?: AlertVariant
  /** Short bold line at the top. */
  title?: ReactNode
  /** Body text under the title. */
  children?: ReactNode
  /** Shows a close button. Called after the collapse animation. */
  onDismiss?: () => void
  /** Screen reader name for the close button. */
  dismissLabel?: string
  /** Full-width strip for the top of a page. */
  banner?: boolean
  /** Button or link shown under the text. */
  action?: ReactNode
  /** Extra class for the root element. */
  className?: string
}

const icons = { info: InfoIcon, success: CheckCircleIcon, warning: WarningIcon, error: ErrorIcon }

export function Alert({ variant = 'info', title, children, onDismiss, dismissLabel = 'Dismiss', banner, action, className }: AlertProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [leaving, setLeaving] = useState(false)
  const Icon = icons[variant]
  const urgent = variant === 'error' || variant === 'warning'

  // Fades, then folds the height (motion/alert.ts). The close button is about to unmount, so focus moves on first.
  const dismiss = () => {
    const el = ref.current
    if (!el || leaving) return
    setLeaving(true)
    foldAway(el, () => {
      focusPast(el)
      onDismiss?.()
    })
  }

  return (
    <div
      ref={ref}
      role={urgent ? 'alert' : 'status'}
      className={cx(styles.root, styles[variant], banner && styles.banner, className)}
      data-leaving={leaving || undefined}
    >
      <Icon className={styles.icon} />
      <div className={styles.text}>
        {title && <p className={styles.title}>{title}</p>}
        {children && <div className={styles.body}>{children}</div>}
        {action && <div className={styles.action}>{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" className={styles.close} aria-label={dismissLabel} onClick={dismiss}>
          <XIcon />
        </button>
      )}
    </div>
  )
}
