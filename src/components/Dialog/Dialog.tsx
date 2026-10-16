'use client'

import { useId, useRef, type ReactNode, type RefObject } from 'react'
import { cx } from '../../internal/cx'
import { useFocusTrap } from '../../internal/focus'
import { XIcon } from '../../internal/icons'
import { useDismiss, useScrollLock } from '../../internal/layers'
import { Portal } from '../../internal/Portal'
import { usePresence } from '../../internal/usePresence'
import styles from './Dialog.module.css'

export type DialogProps = {
  /** Shows the dialog. You always control it. */
  open: boolean
  /** Called with false when the close button, Esc or an outside tap asks to close. */
  onOpenChange: (open: boolean) => void
  /** Heading of the dialog. Also its accessible name. */
  title: ReactNode
  /** Short text under the title, read out when the dialog opens. */
  description?: ReactNode
  /** Main content of the dialog. */
  children?: ReactNode
  /** Actions row. Put the primary action last, so it sits under the thumb on phones. */
  footer?: ReactNode
  /** Maximum width of the panel. */
  size?: 'sm' | 'md' | 'lg'
  /** Set false for dialogs that must not close by a stray tap, like unsaved work. */
  dismissOnOverlay?: boolean
  /** Screen reader name for the close button. */
  closeLabel?: string
  /** Element to focus first. Defaults to the first focusable element. */
  initialFocus?: RefObject<HTMLElement | null>
  /** Extra class for the dialog panel. */
  className?: string
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissOnOverlay = true,
  closeLabel = 'Close',
  initialFocus,
  className,
}: DialogProps) {
  const id = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const { mounted, state } = usePresence(open, 'base')

  useScrollLock(open)
  useDismiss(open, [panelRef], () => onOpenChange(false), { outside: dismissOnOverlay })
  useFocusTrap(panelRef, open && mounted, { initialFocus })

  if (!mounted) return null
  return (
    <Portal>
      <div className={styles.overlay} data-state={state} aria-hidden="true" />
      <div className={styles.positioner}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          aria-describedby={description ? `${id}-desc` : undefined}
          tabIndex={-1}
          className={cx(styles.panel, styles[size], className)}
          data-state={state}
        >
          <header className={styles.header}>
            <div className={styles.titles}>
              <h2 id={`${id}-title`} className={styles.title}>{title}</h2>
              {description && <p id={`${id}-desc`} className={styles.description}>{description}</p>}
            </div>
            <button type="button" className={styles.close} aria-label={closeLabel} data-skip-initial-focus onClick={() => onOpenChange(false)}>
              <XIcon />
            </button>
          </header>
          {children && <div className={styles.body}>{children}</div>}
          {footer && <footer className={styles.footer}>{footer}</footer>}
        </div>
      </div>
    </Portal>
  )
}
