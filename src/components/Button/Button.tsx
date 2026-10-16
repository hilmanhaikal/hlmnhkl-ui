'use client'

import type { ComponentPropsWithRef, MouseEvent, ReactNode, Ref } from 'react'
import { cx } from '../../internal/cx'
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
  'aria-disabled': ariaDisabledProp,
  ref,
  ...rest
}: ButtonProps) {
  const inert = loading || Boolean(rest.disabled) || ariaDisabledProp === true || ariaDisabledProp === 'true'
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
  }
  const inner = (
    <>
      <span className={styles.content}>
        {leadingIcon && <span className={styles.icon}>{leadingIcon}</span>}
        <span className={styles.label}>{children}</span>
        {trailingIcon && <span className={styles.icon}>{trailingIcon}</span>}
      </span>
      <span className={styles.spinner} aria-hidden={!loading}>
        {loading && <Spinner size="sm" label={loadingLabel} />}
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
