'use client'

import { useId, useRef, type PointerEvent, type ReactNode, type RefObject } from 'react'
import { cx } from '../../internal/cx'
import { useFocusTrap } from '../../internal/focus'
import { XIcon } from '../../internal/icons'
import { useDismiss, useScrollLock } from '../../internal/layers'
import { Portal } from '../../internal/Portal'
import { usePresence } from '../../internal/usePresence'
import styles from './Sheet.module.css'

export type SheetProps = {
  /** Whether the sheet is open. You always control it. */
  open: boolean
  /** Called when the sheet asks to close, by Esc, outside tap, drag or close button, with false. */
  onOpenChange: (open: boolean) => void
  /** Visible heading, also the dialog's accessible name. */
  title: ReactNode
  /** Text under the title, also read as the dialog's description. */
  description?: ReactNode
  /** Main content of the sheet. */
  children?: ReactNode
  /** Sticky actions at the bottom of the sheet. */
  footer?: ReactNode
  /** Screen reader name for the close button. */
  closeLabel?: string
  /** Element to focus first. Defaults to the first focusable element in the content. */
  initialFocus?: RefObject<HTMLElement | null>
  /** Extra class for the panel. */
  className?: string
}

const CLOSE_RATIO = 0.3
const CLOSE_VELOCITY = 0.5

export function Sheet({ open, onOpenChange, title, description, children, footer, closeLabel = 'Close', initialFocus, className }: SheetProps) {
  const id = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number; t: number; dy: number; pointer: number } | null>(null)
  const { mounted, state } = usePresence(open, 'slow')
  const openRef = useRef(open)
  openRef.current = open

  useScrollLock(open)
  useDismiss(open, [panelRef], () => onOpenChange(false))
  useFocusTrap(panelRef, open && mounted, { initialFocus })

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { y: e.clientY, t: performance.now(), dy: 0, pointer: e.pointerId }
    e.currentTarget.setPointerCapture(e.pointerId)
    panelRef.current?.setAttribute('data-dragging', '')
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const panel = panelRef.current
    if (!d || !panel || d.pointer !== e.pointerId) return
    const raw = e.clientY - d.y
    d.dy = raw > 0 ? raw : raw * 0.15
    panel.style.transform = `translateY(${d.dy}px)`
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const panel = panelRef.current
    drag.current = null
    if (!d || !panel) return
    e.currentTarget.releasePointerCapture(d.pointer)
    panel.removeAttribute('data-dragging')
    const velocity = d.dy / Math.max(1, performance.now() - d.t)
    if (d.dy > panel.offsetHeight * CLOSE_RATIO || (velocity > CLOSE_VELOCITY && d.dy > 24)) {
      onOpenChange(false)
      // The close animation starts from the dragged spot. If the parent keeps it open, spring back.
      requestAnimationFrame(() => {
        if (openRef.current) panel.style.transform = ''
      })
    } else {
      panel.style.transform = ''
    }
  }

  if (!mounted) return null
  return (
    <Portal>
      <div className={styles.overlay} data-state={state} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        className={cx(styles.sheet, className)}
        data-state={state}
        onAnimationEnd={(e) => {
          if (e.target === panelRef.current && state === 'open') panelRef.current.style.transform = ''
        }}
      >
        <div
          className={styles.grab}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className={styles.handle} aria-hidden="true" />
          <header className={styles.header}>
            <div className={styles.titles}>
              <h2 id={`${id}-title`} className={styles.title}>{title}</h2>
              {description && <p id={`${id}-desc`} className={styles.description}>{description}</p>}
            </div>
            <button type="button" className={styles.close} aria-label={closeLabel} data-skip-initial-focus onClick={() => onOpenChange(false)}>
              <XIcon />
            </button>
          </header>
        </div>
        {children && <div className={styles.body}>{children}</div>}
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </Portal>
  )
}
