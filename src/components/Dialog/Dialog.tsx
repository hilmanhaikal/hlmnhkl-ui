'use client'

import { useId, useRef, type ReactNode, type RefObject } from 'react'
import { cx } from '../../internal/cx'
import { useDragClose } from '../../internal/fling'
import { useFocusTrap } from '../../internal/focus'
import { XIcon } from '../../icons/icons'
import { useDismiss, useScrollLock } from '../../internal/layers'
import { useDialogMorph } from '../../internal/liquid'
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
  /** Text for the dialog's controls, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<DialogLabels>
  /** Element to focus first. Defaults to the first focusable element. */
  initialFocus?: RefObject<HTMLElement | null>
  /** Extra class for the dialog panel. */
  className?: string
}

export type DialogLabels = {
  /** Screen reader name for the close button. */
  close: string
}

const defaultLabels: DialogLabels = { close: 'Close' }

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissOnOverlay = true,
  labels: labelsProp,
  initialFocus,
  className,
}: DialogProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const id = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const { mounted, state } = usePresence(open, 'morph-out')
  useDialogMorph(panelRef, open, mounted, state)
  // On a phone the dialog is a bottom sheet, and the hand can pull it down to close, as it can a Sheet.
  const grab = useDragClose(
    panelRef,
    open,
    () => onOpenChange(false),
    (e) => window.matchMedia('(max-width: 520px)').matches && !!(e.target as HTMLElement).closest(`.${styles.handle}, .${styles.header}`),
  )

  useScrollLock(open)
  useDismiss(open, [panelRef], () => onOpenChange(false), { outside: dismissOnOverlay })
  useFocusTrap(panelRef, open && mounted, { initialFocus })

  if (!mounted) return null
  return (
    <Portal>
      <div data-slot="dialog-overlay" className={styles.overlay} data-state={state} aria-hidden="true" />
      <div data-slot="dialog" className={styles.positioner}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          aria-describedby={description ? `${id}-desc` : undefined}
          tabIndex={-1}
          data-slot="dialog-content"
          className={cx(styles.panel, styles[size], className)}
          data-state={state}
          {...(dismissOnOverlay ? grab : {})}
        >
          {dismissOnOverlay && <span data-slot="dialog-handle" className={styles.handle} aria-hidden="true" />}
          <header data-slot="dialog-header" className={styles.header}>
            <div className={styles.titles}>
              <h2 id={`${id}-title`} data-slot="dialog-title" className={styles.title}>{title}</h2>
              {description && <p id={`${id}-desc`} data-slot="dialog-description" className={styles.description}>{description}</p>}
            </div>
            <button type="button" data-slot="dialog-close" className={styles.close} aria-label={labels.close} data-skip-initial-focus onClick={() => onOpenChange(false)}>
              <XIcon />
            </button>
          </header>
          {children && <div data-slot="dialog-body" className={styles.body}>{children}</div>}
          {footer && <footer data-slot="dialog-footer" className={styles.footer}>{footer}</footer>}
        </div>
      </div>
    </Portal>
  )
}
