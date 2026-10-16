'use client'

import { useRef, useState, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { focusables } from '../../internal/focus'
import { CheckCircleIcon, ErrorIcon, InfoIcon, WarningIcon, XIcon } from '../../internal/icons'
import { easing, motionMs } from '../../internal/motion'
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

  // The close button is about to unmount, so focus moves to the next control (or the one before) instead of the body.
  const finish = () => {
    const el = ref.current
    if (el?.contains(document.activeElement)) {
      const others = focusables(document.body).filter((n) => !el.contains(n))
      const next = others.find((n) => el.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING)
      const prev = [...others].reverse().find((n) => el.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING)
      ;(next ?? prev)?.focus({ preventScroll: true })
    }
    onDismiss?.()
  }

  // Folds the height to zero, so content below slides up instead of jumping.
  const dismiss = () => {
    const el = ref.current
    if (!el || leaving) return
    setLeaving(true)
    const ms = motionMs('slow')
    if (ms === 0 || !el.animate) return finish()
    const h = el.offsetHeight
    const anim = el.animate(
      [
        { height: `${h}px`, opacity: 1, transform: 'scale(1)' },
        { height: `${h}px`, opacity: 0, transform: 'scale(0.98)', offset: 0.45 },
        { height: '0px', opacity: 0, transform: 'scale(0.98)', paddingTop: '0px', paddingBottom: '0px', marginTop: '0px', marginBottom: '0px', borderWidth: '0px' },
      ],
      { duration: ms, easing: easing('in-out'), fill: 'forwards' },
    )
    anim.onfinish = finish
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
