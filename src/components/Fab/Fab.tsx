'use client'

import { useId, useRef, useState, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useDismiss } from '../../internal/layers'
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
  /** Sits at the bottom of its nearest positioned parent instead of the screen, for a demo or a panel. */
  contained?: boolean
  /** Extra class for the root element. */
  className?: string
}

// One main action, floating in the thumb zone at the bottom of the screen.
export function Fab({ label, icon, onClick, extended = false, actions, position = 'end', contained = false, className }: FabProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const firstRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const last = useRef<number | null>(null)

  // Extended: down the page it folds to the icon, back up it opens again. It reads the scroll, never a timer.
  useScrollFrame(
    () => {
      const y = window.scrollY
      const prev = last.current
      last.current = y
      if (prev === null || Math.abs(y - prev) < 4) return
      const next = y > prev && y > 80
      return () => setCompact(next)
    },
    extended,
  )

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
    <div ref={rootRef} className={cx(styles.root, styles[position], contained && styles.contained, className)} data-open={open || undefined}>
      {hasActions && (
        <ul id={`${id}-actions`} className={styles.actions} inert={!open}>
          {actions!.map((a, i) => (
            <li key={a.label} style={{ ['--i' as string]: actions!.length - 1 - i }}>
              <button
                ref={i === 0 ? firstRef : undefined}
                type="button"
                className={styles.action}
                onClick={() => {
                  setOpen(false)
                  buttonRef.current?.focus()
                  a.onSelect()
                }}
              >
                <span className={styles.actionLabel}>{a.label}</span>
                <span className={styles.actionIcon} aria-hidden="true">
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
        className={styles.fab}
        aria-label={extended ? undefined : label}
        aria-expanded={hasActions ? open : undefined}
        aria-controls={hasActions ? `${id}-actions` : undefined}
        data-extended={(extended && !compact) || undefined}
        onClick={toggle}
      >
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
        {extended && (
          <span className={styles.labelWrap}>
            <span className={styles.label}>{label}</span>
          </span>
        )}
      </button>
    </div>
  )
}
