'use client'

import type { ComponentPropsWithRef, MouseEvent, ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useControllable } from '../../internal/useControllable'
import styles from './Toggle.module.css'

export type ToggleProps = Omit<ComponentPropsWithRef<'button'>, 'value' | 'defaultValue'> & {
  /** Pressed state, when you control it. */
  pressed?: boolean
  /** Starting pressed state when you do not control it. */
  defaultPressed?: boolean
  /** Called when the button is pressed or let go, with the new state. */
  onPressedChange?: (pressed: boolean) => void
  /** Icon before the label. Without a label the button is round and needs an aria-label. */
  icon?: ReactNode
  /** Height and text size, the same as Button. */
  size?: 'sm' | 'md' | 'lg'
}

export function Toggle({
  pressed: pressedProp,
  defaultPressed = false,
  onPressedChange,
  icon,
  size = 'md',
  className,
  children,
  type = 'button',
  onClick,
  ...rest
}: ToggleProps) {
  const [pressed, setPressed] = useControllable(pressedProp, defaultPressed, onPressedChange)
  return (
    <button
      {...rest}
      type={type}
      aria-pressed={pressed}
      className={cx(styles.root, styles[size], !children && styles.iconOnly, className)}
      data-on={pressed || undefined}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)
        if (!e.defaultPrevented) setPressed(!pressed)
      }}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  )
}
