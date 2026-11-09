'use client'

import type { ComponentPropsWithRef, FocusEvent, KeyboardEvent, MouseEvent, PointerEvent, ReactNode, Ref } from 'react'
import { cx } from '../../internal/cx'
import { useSoftPress } from '../../internal/softPress'
import { Spinner } from '../Spinner'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  /** Visual weight. Use one primary per view and danger for destructive actions. */
  variant?: ButtonVariant
  /** Height and text size. */
  size?: ButtonSize
  /** Shows a spinner and ignores clicks, but keeps focus on the button. */
  loading?: boolean
  /** Spoken while loading, for example "Saving". */
  loadingLabel?: string
  /** Icon before the label. */
  leadingIcon?: ReactNode
  /** Icon after the label. */
  trailingIcon?: ReactNode
  /** Stretches the button to fill its container. */
  fullWidth?: boolean
  /** Renders a link with the same look, for navigation. Button-only props such as type are then ignored. */
  href?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel = 'Loading',
  leadingIcon,
  trailingIcon,
  fullWidth,
  href,
  className,
  children,
  type = 'button',
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerLeave,
  onKeyDown,
  onKeyUp,
  onBlur,
  'aria-disabled': ariaDisabledProp,
  ref,
  ...rest
}: ButtonProps) {
  const inert = loading || Boolean(rest.disabled) || ariaDisabledProp === true || ariaDisabledProp === 'true'
  // The edge is soft: it dents where pressed and springs back (internal/softPress.ts).
  const soft = useSoftPress({ layer: styles.soft, fill: styles.softFill, ring: styles.softRing, wet: styles.wet }, inert, href === undefined ? [' ', 'Enter'] : ['Enter'])
  const shared = {
    className: cx(styles.root, styles[variant], styles[size], fullWidth && styles.full, className),
    'data-loading': loading || undefined,
    'aria-busy': loading || undefined,
    'aria-disabled': inert || undefined,
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      // preventDefault also stops a submit button or a link while it is inert.
      if (inert) {
        e.preventDefault()
        return
      }
      onClick?.(e)
    },
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      soft.onPointerDown(e)
      onPointerDown?.(e)
    },
    onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
      soft.onPointerMove(e)
      onPointerMove?.(e)
    },
    onPointerLeave: (e: PointerEvent<HTMLButtonElement>) => {
      soft.onPointerLeave()
      onPointerLeave?.(e)
    },
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
      soft.onKeyDown(e)
      onKeyDown?.(e)
    },
    onKeyUp: (e: KeyboardEvent<HTMLButtonElement>) => {
      soft.onKeyUp(e)
      onKeyUp?.(e)
    },
    onBlur: (e: FocusEvent<HTMLButtonElement>) => {
      soft.onBlur()
      onBlur?.(e)
    },
  }
  const inner = (
    <>
      <span className={styles.content}>
        {leadingIcon && <span className={styles.icon}>{leadingIcon}</span>}
        <span className={styles.label}>{children}</span>
        {trailingIcon && <span className={styles.icon}>{trailingIcon}</span>}
      </span>
      <span className={styles.spinner} aria-hidden="true">
        {loading && <Spinner size="sm" label={null} />}
      </span>
      {/* Stays mounted, because screen readers skip a live region that appears with its text. */}
      <span className={styles.srOnly} role="status">
        {loading ? loadingLabel : null}
      </span>
    </>
  )

  if (href !== undefined) {
    const { disabled, form, formAction, formEncType, formMethod, formNoValidate, formTarget, name, value, ...linkRest } = rest
    return (
      <a
        {...(linkRest as ComponentPropsWithRef<'a'>)}
        {...(shared as unknown as ComponentPropsWithRef<'a'>)}
        ref={ref as Ref<HTMLAnchorElement>}
        // A link has no disabled state; without href it leaves the tab order like a disabled button.
        href={disabled ? undefined : href}
        role={disabled ? 'link' : undefined}
      >
        {inner}
      </a>
    )
  }

  return (
    <button {...rest} {...shared} ref={ref} type={type}>
      {inner}
    </button>
  )
}
