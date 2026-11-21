'use client'

import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { cx } from '../../internal/cx'
import { useFocusTrap } from '../../internal/focus'
import { XIcon } from '../../icons/icons'
import { useDismiss } from '../../internal/layers'
import { useLiquid } from '../../internal/liquid'
import { mergeRefs } from '../../internal/mergeRefs'
import { Portal } from '../../internal/Portal'
import { useControllable } from '../../internal/useControllable'
import { useFloating, type Align, type Side } from '../../internal/useFloating'
import { usePresence } from '../../internal/usePresence'
import styles from './Popover.module.css'

type TriggerProps = {
  ref?: Ref<HTMLElement>
  onClick?: (e: MouseEvent<HTMLElement>) => void
}

export type PopoverProps = {
  /** One element, such as a Button, that opens and closes the popover on click. */
  trigger: ReactElement<TriggerProps>
  /** Visible heading, also the dialog's accessible name. */
  title: ReactNode
  /** Content of the panel, under the title. */
  children: ReactNode
  /** Whether the panel is open, when you control it. */
  open?: boolean
  /** Starting open state when you do not control it. */
  defaultOpen?: boolean
  /** Called when the panel opens or closes, with the new open state. */
  onOpenChange?: (open: boolean) => void
  /** Preferred side of the trigger. It flips when there is no room. */
  side?: Side
  /** How the panel lines up with the trigger along that side. */
  align?: Align
  /** Text for the popover's controls, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<PopoverLabels>
  /** Extra class for the panel. */
  className?: string
}

export type PopoverLabels = {
  /** Screen reader name for the close button. */
  close: string
}

const defaultLabels: PopoverLabels = { close: 'Close' }

export function Popover({
  trigger,
  title,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  side = 'bottom',
  align = 'start',
  labels: labelsProp,
  className,
}: PopoverProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const id = useId()
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const anchorRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const { mounted, state } = usePresence(open, 'morph-out')
  const floating = useFloating(anchorRef, panelRef, { open: mounted, side, align, offset: 8 })
  // The panel grows out of its trigger and folds back into it.
  useLiquid(panelRef, anchorRef, state, mounted && floating.ready)

  useDismiss(open, [anchorRef, panelRef], () => setOpen(false))
  useFocusTrap(panelRef, open && mounted)

  if (!isValidElement(trigger)) return null
  const tp = trigger.props

  return (
    <>
      {cloneElement(trigger, {
        ref: mergeRefs(anchorRef, tp.ref),
        onClick: (e: MouseEvent<HTMLElement>) => {
          tp.onClick?.(e)
          setOpen(!open)
        },
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
      } as TriggerProps)}
      {mounted && (
        <Portal>
          <div
            ref={panelRef}
            id={id}
            role="dialog"
            aria-labelledby={`${id}-title`}
            tabIndex={-1}
            className={cx(styles.panel, className)}
            data-slot="popover-content"
            data-state={state}
            data-side={floating.side}
            style={floating.style}
          >
            <div className={styles.head} data-slot="popover-header">
              <h2 id={`${id}-title`} className={styles.title} data-slot="popover-title">{title}</h2>
              <button type="button" className={styles.close} data-slot="popover-close" aria-label={labels.close} data-skip-initial-focus onClick={() => setOpen(false)}>
                <XIcon />
              </button>
            </div>
            <div className={styles.body} data-slot="popover-body">{children}</div>
          </div>
        </Portal>
      )}
    </>
  )
}
