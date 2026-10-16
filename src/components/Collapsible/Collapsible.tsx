'use client'

import { cloneElement, isValidElement, useId, type MouseEvent, type ReactElement, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { ChevronDownIcon } from '../../internal/icons'
import { useControllable } from '../../internal/useControllable'
import styles from './Collapsible.module.css'

type TriggerProps = {
  onClick?: (e: MouseEvent<HTMLElement>) => void
}

export type CollapsibleProps = {
  /** Text for the built-in toggle button. */
  label?: ReactNode
  /** Your own button instead of the built-in one. It gets aria-expanded and aria-controls. */
  trigger?: ReactElement<TriggerProps>
  /** Open state, when you control it. */
  open?: boolean
  /** Starting open state when you do not control it. */
  defaultOpen?: boolean
  /** Called when the open state changes, with the new state. */
  onOpenChange?: (open: boolean) => void
  /** Stops the panel from opening or closing. */
  disabled?: boolean
  /** Extra class for the root element. */
  className?: string
  /** Content shown when open. */
  children: ReactNode
}

export function Collapsible({ label, trigger, open: openProp, defaultOpen = false, onOpenChange, disabled, className, children }: CollapsibleProps) {
  const id = useId()
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const toggle = () => !disabled && setOpen(!open)

  return (
    <div className={cx(styles.root, className)} data-open={open || undefined}>
      {trigger && isValidElement(trigger) ? (
        cloneElement(trigger, {
          'aria-expanded': open,
          'aria-controls': `${id}-panel`,
          onClick: (e: MouseEvent<HTMLElement>) => {
            trigger.props.onClick?.(e)
            toggle()
          },
        } as TriggerProps)
      ) : (
        <button
          type="button"
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          disabled={disabled}
          onClick={toggle}
        >
          <span>{label}</span>
          <ChevronDownIcon className={styles.chevron} />
        </button>
      )}
      {/* Grid rows animate from 0fr to 1fr, so the height follows the content without measuring. */}
      <div id={`${id}-panel`} className={styles.panel} inert={!open}>
        <div className={styles.inner}>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </div>
  )
}
