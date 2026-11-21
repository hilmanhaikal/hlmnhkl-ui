'use client'

import { useId, useRef, useState, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useDismiss } from '../../internal/layers'
import { foldOnScroll } from '../../internal/motion/fab'
import { useScrollFrame } from '../../internal/scrollFrame'
import styles from './Fab.module.css'

export type FabAction = {
  /** Shown beside the action's button and read as its name. */
  label: string
  icon: ReactNode
  onSelect: () => void
}

export type FabProps = {
  /** The button's name. Shown as text when extended, and always read by screen readers. */
  label: string
  /** The icon in the button, such as a plus. With actions it turns a quarter while they are open. */
  icon: ReactNode
  /** Called on tap. With actions, a tap opens them instead. */
  onClick?: () => void
  /** Shows the label beside the icon. It pours away into the icon as the page scrolls down, and back on the way up. */
  extended?: boolean
  /** A short stack of actions that pours up out of the button when it is tapped. */
  actions?: FabAction[]
  /** Where it sits along the bottom of the screen. */
  position?: 'end' | 'center'
  /** Pins it to the screen. false sits it at the bottom of its nearest positioned parent instead, for a demo or a panel. */
  fixed?: boolean
  /** Extra class for the root element. */
  className?: string
}

// One main action, floating in the thumb zone at the bottom of the screen.
export function Fab({ label, icon, onClick, extended = false, actions, position = 'end', fixed = true, className }: FabProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const firstRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  // Extended, it folds to the icon down the page and opens again on the way up (motion/fab.ts).
  const [fold] = useState(() => foldOnScroll(setCompact))
  useScrollFrame(fold, extended)

  useDismiss(open, [rootRef], (reason) => {
    setOpen(false)
    if (reason === 'escape') buttonRef.current?.focus()
  })

  const hasActions = Boolean(actions?.length)
  const toggle = () => {
    if (!hasActions) return onClick?.()
    const next = !open
    setOpen(next)
    if (next) requestAnimationFrame(() => firstRef.current?.focus())
  }

  return (
    <div ref={rootRef} data-slot="fab" className={cx(styles.root, styles[position], !fixed && styles.contained, className)} data-state={open ? 'open' : 'closed'}>
      {hasActions && (
        <ul id={`${id}-actions`} data-slot="fab-actions" className={styles.actions} inert={!open}>
          {actions!.map((a, i) => (
            <li key={a.label} style={{ ['--i' as string]: actions!.length - 1 - i }}>
              <button
                ref={i === 0 ? firstRef : undefined}
                type="button"
                data-slot="fab-action"
                className={styles.action}
                onClick={() => {
                  setOpen(false)
                  buttonRef.current?.focus()
                  a.onSelect()
                }}
              >
                <span data-slot="fab-action-label" className={styles.actionLabel}>{a.label}</span>
                <span data-slot="fab-action-icon" className={styles.actionIcon} aria-hidden="true">
                  {a.icon}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        ref={buttonRef}
        type="button"
        data-slot="fab-trigger"
        className={styles.fab}
        aria-label={extended ? undefined : label}
        aria-expanded={hasActions ? open : undefined}
        aria-controls={hasActions ? `${id}-actions` : undefined}
        data-extended={(extended && !compact) || undefined}
        onClick={toggle}
      >
        <span data-slot="fab-icon" className={styles.icon} aria-hidden="true">
          {icon}
        </span>
        {extended && (
          <span className={styles.labelWrap}>
            <span data-slot="fab-label" className={styles.label}>{label}</span>
          </span>
        )}
      </button>
    </div>
  )
}
