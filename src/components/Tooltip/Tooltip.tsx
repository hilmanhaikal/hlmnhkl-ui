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
import { mergeRefs } from '../../internal/mergeRefs'
import { motionMs } from '../../internal/motion'
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

// How long a tip stays after a tap on a touch screen, so it can be read.
const TOUCH_SHOW_MS = 1500
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

let lastClosedAt = 0

export function Tooltip({ content, side = 'top', children, delay }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const { mounted, state } = usePresence(open, 'fast')
  const floating = useFloating(anchorRef, tipRef, { open: mounted, side, offset: 8 })

  const clear = () => window.clearTimeout(timer.current)
  const show = (wait: number) => {
    clear()
    timer.current = window.setTimeout(() => setOpen(true), wait)
  }
  const hide = (wait = 80) => {
    clear()
    timer.current = window.setTimeout(() => {
      setOpen(false)
      lastClosedAt = Date.now()
    }, wait)
  }

  // Esc hides it without moving focus (WCAG 1.4.13), and only it, not a dialog behind it.
  useDismiss(open, [], () => setOpen(false), { outside: false, hint: true })

  useEffect(() => clear, [])

  if (!isValidElement(children)) return children
  const props = children.props

  // Right after one closes, the next shows at once
  const hoverDelay = () => (Date.now() - lastClosedAt < 400 ? 0 : (delay ?? motionMs('delay-tooltip')))

  const trigger = cloneElement(children, {
    ref: mergeRefs(anchorRef, props.ref),
    'aria-describedby': [props['aria-describedby'], open ? id : null].filter(Boolean).join(' ') || undefined,
    onPointerEnter: (e: PointerEvent<HTMLElement>) => {
      props.onPointerEnter?.(e)
      if (e.pointerType === 'mouse') show(hoverDelay())
    },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => {
      props.onPointerLeave?.(e)
      if (e.pointerType === 'mouse') hide()
    },
    // Touch has no hover: a tap shows the tip at once, and it fades a moment after the finger lifts.
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      props.onPointerDown?.(e)
      // Opened now, not on a timer: the finger lifts in the same moment, which would cancel it.
      if (e.pointerType === 'touch') {
        clear()
        setOpen(true)
      }
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      props.onPointerUp?.(e)
      if (e.pointerType === 'touch') hide(TOUCH_SHOW_MS)
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      props.onFocus?.(e)
      if (e.target.matches(':focus-visible')) show(0)
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      props.onBlur?.(e)
      hide(0)
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
            data-state={state}
            data-side={floating.side}
            style={floating.style}
            onPointerEnter={clear}
            onPointerLeave={() => hide()}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  )
}
