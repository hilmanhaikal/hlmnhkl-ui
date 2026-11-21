'use client'

import { useRef, useState, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { CheckCircleIcon, ErrorIcon, InfoIcon, WarningIcon, XIcon } from '../../icons/icons'
import { foldAway } from '../../internal/motion/alert'
import { focusPast } from '../../internal/motion/collapseOut'
import styles from './Alert.module.css'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

export type AlertLabels = {
  /** Name of the close button. */
  dismiss: string
}

const defaultLabels: AlertLabels = { dismiss: 'Dismiss' }

export type AlertProps = {
  /** Sets the colour and icon. Danger and warning are announced at once. */
  tone?: AlertTone
  /** Short bold line at the top. */
  title?: ReactNode
  /** Body text under the title. */
  children?: ReactNode
  /** Shows a close button. Called after the collapse animation. */
  onDismiss?: () => void
  /** Full-width strip for the top of a page. */
  banner?: boolean
  /** Button or link shown under the text. */
  action?: ReactNode
  /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<AlertLabels>
  /** Extra class for the root element. */
  className?: string
}

const icons = { info: InfoIcon, success: CheckCircleIcon, warning: WarningIcon, danger: ErrorIcon }

export function Alert({ tone = 'info', title, children, onDismiss, banner, action, labels: labelsProp, className }: AlertProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const ref = useRef<HTMLDivElement>(null)
  const [leaving, setLeaving] = useState(false)
  const Icon = icons[tone]
  const urgent = tone === 'danger' || tone === 'warning'

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
      data-slot="alert"
      className={cx(styles.root, styles[tone], banner && styles.banner, className)}
      data-leaving={leaving || undefined}
    >
      <Icon data-slot="alert-icon" className={styles.icon} />
      <div className={styles.text}>
        {title && <p data-slot="alert-title" className={styles.title}>{title}</p>}
        {children && <div data-slot="alert-body" className={styles.body}>{children}</div>}
        {action && <div data-slot="alert-action" className={styles.action}>{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" data-slot="alert-close" className={styles.close} aria-label={labels.dismiss} onClick={dismiss}>
          <XIcon />
        </button>
      )}
    </div>
  )
}
