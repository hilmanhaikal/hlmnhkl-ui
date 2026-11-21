// Gooee UI, MIT licence. https://gooee.dev
'use client'

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react'
import { useDismiss } from '../../internal/layers'
import { useLiquid } from '../../internal/liquid'
import { mergeRefs } from '../../internal/mergeRefs'
import { createTipTimer, tipEdge } from '../../internal/motion/tooltip'
import { Portal } from '../../internal/Portal'
import { useFloating, type Side } from '../../internal/useFloating'
import { usePresence } from '../../internal/usePresence'
import styles from './Tooltip.module.css'

type TriggerProps = {
  ref?: Ref<HTMLElement>
  'aria-describedby'?: string
  onPointerEnter?: (e: PointerEvent<HTMLElement>) => void
  onPointerLeave?: (e: PointerEvent<HTMLElement>) => void
  onFocus?: (e: FocusEvent<HTMLElement>) => void
  onBlur?: (e: FocusEvent<HTMLElement>) => void
  onPointerDown?: (e: PointerEvent<HTMLElement>) => void
  onPointerUp?: (e: PointerEvent<HTMLElement>) => void
}

export type TooltipProps = {
  /** Short text shown on hover and focus. It also describes the trigger to screen readers. */
  content: ReactNode
  /** Preferred side of the trigger. It flips when there is no room. */
  side?: Side
  /** One focusable element, such as a Button or IconButton. */
  children: ReactElement<TriggerProps>
  /** Delay before showing on hover. Defaults to the tooltip delay token. */
  delay?: number
}

export function Tooltip({ content, side = 'top', children, delay }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const { mounted, state } = usePresence(open, 'morph-out')
  const floating = useFloating(anchorRef, tipRef, { open: mounted, side, offset: 8 })
  // The tip grows out of the edge of the target it points to, a sliver as wide as the target, and folds back into it.
  useLiquid(tipRef, () => tipEdge(anchorRef.current, floating.side), state, mounted && floating.ready)

  const delayRef = useRef(delay)
  delayRef.current = delay
  // When it shows and hides (motion/tooltip.ts).
  const timing = useRef<ReturnType<typeof createTipTimer>>(null)
  timing.current ??= createTipTimer(setOpen, () => delayRef.current)
  const tip = timing.current

  // Esc hides it without moving focus (WCAG 1.4.13), and only it, not a dialog behind it.
  useDismiss(open, [], () => setOpen(false), { outside: false, hint: true })

  useEffect(() => tip.clear, [tip])

  if (!isValidElement(children)) return children
  const props = children.props

  const trigger = cloneElement(children, {
    ref: mergeRefs(anchorRef, props.ref),
    'aria-describedby': [props['aria-describedby'], open ? id : null].filter(Boolean).join(' ') || undefined,
    onPointerEnter: (e: PointerEvent<HTMLElement>) => {
      props.onPointerEnter?.(e)
      tip.enter(e)
    },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => {
      props.onPointerLeave?.(e)
      tip.leave(e)
    },
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      props.onPointerDown?.(e)
      tip.down(e)
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      props.onPointerUp?.(e)
      tip.up(e)
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      props.onFocus?.(e)
      tip.focus(e)
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      props.onBlur?.(e)
      tip.blur()
    },
  })

  return (
    <>
      {trigger}
      {mounted && (
        <Portal>
          <div
            ref={tipRef}
            id={id}
            role="tooltip"
            className={styles.tip}
            data-slot="tooltip-content"
            data-state={state}
            data-side={floating.side}
            style={floating.style}
            onPointerEnter={tip.clear}
            onPointerLeave={() => tip.hide()}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  )
}
