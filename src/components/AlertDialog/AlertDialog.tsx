'use client'

import { useId, useRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useFocusTrap } from '../../internal/focus'
import { useDismiss, useScrollLock } from '../../internal/layers'
import { useDialogMorph } from '../../internal/liquid'
import { Portal } from '../../internal/Portal'
import { usePresence } from '../../internal/usePresence'
import { Button } from '../Button'
import dialog from '../Dialog/Dialog.module.css'
import styles from './AlertDialog.module.css'

export type AlertDialogProps = {
  /** Shows the dialog. You always control it. */
  open: boolean
  /** Called with false after Confirm, Cancel or Esc. A tap outside never closes it. */
  onOpenChange: (open: boolean) => void
  /** The question, such as "Delete this project?". Also the accessible name. */
  title: ReactNode
  /** What happens if they confirm. Read out with the title when the dialog opens. */
  description: ReactNode
  /** Extra content under the description, such as a list of what goes away. */
  children?: ReactNode
  /** Text of the confirm button. Name the action, such as "Delete project", not "OK". */
  confirmLabel: string
  /** Text of the cancel button. */
  cancelLabel?: string
  /** Called when they confirm, before the dialog closes. */
  onConfirm: () => void
  /** Called when they cancel with the button or Esc, before the dialog closes. */
  onCancel?: () => void
  /** "danger" gives the confirm button the solid red look, for actions that destroy something. */
  tone?: 'default' | 'danger'
  /** Extra class for the dialog panel. */
  className?: string
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  tone = 'default',
  className,
}: AlertDialogProps) {
  const id = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const { mounted, state } = usePresence(open, 'morph-out')
  useDialogMorph(panelRef, open, mounted, state)

  const cancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  useScrollLock(open)
  useDismiss(open, [panelRef], cancel, { outside: false })
  // Focus starts on the least destructive choice, so a stray Enter never confirms.
  useFocusTrap(panelRef, open && mounted, { initialFocus: cancelRef })

  if (!mounted) return null
  return (
    <Portal>
      <div className={dialog.overlay} data-state={state} aria-hidden="true" />
      <div className={dialog.positioner}>
        <div
          ref={panelRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-desc`}
          tabIndex={-1}
          className={cx(dialog.panel, dialog.sm, className)}
          data-state={state}
        >
          <header className={cx(dialog.header, styles.header)}>
            <div className={dialog.titles}>
              <h2 id={`${id}-title`} className={dialog.title}>{title}</h2>
              <p id={`${id}-desc`} className={dialog.description}>{description}</p>
            </div>
          </header>
          {children && <div className={dialog.body}>{children}</div>}
          <footer className={dialog.footer}>
            <Button ref={cancelRef} variant="secondary" onClick={cancel}>
              {cancelLabel}
            </Button>
            <Button
              variant={tone === 'danger' ? 'danger' : 'primary'}
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
            >
              {confirmLabel}
            </Button>
          </footer>
        </div>
      </div>
    </Portal>
  )
}
