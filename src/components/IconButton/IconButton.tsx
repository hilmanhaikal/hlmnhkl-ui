import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cx } from '../../internal/cx'
import styles from './IconButton.module.css'

export type IconButtonProps = Omit<ComponentPropsWithRef<'button'>, 'children'> & {
  /** Required: the accessible name, since the button has no visible text. */
  label: string
  /** The icon to show. It is the only visible content. */
  icon: ReactNode
  /** Visual weight. Ghost has no fill until hover. */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Size of the button. */
  size?: 'sm' | 'md' | 'lg'
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cx(styles.root, styles[variant], styles[size], className)}
      {...rest}
    >
      <span className={styles.icon}>{icon}</span>
    </button>
  )
}
