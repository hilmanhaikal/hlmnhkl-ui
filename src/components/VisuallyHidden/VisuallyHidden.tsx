import type { ComponentPropsWithRef } from 'react'
import { cx } from '../../internal/cx'
import styles from './VisuallyHidden.module.css'

export type VisuallyHiddenProps = ComponentPropsWithRef<'span'> & {
  /** Shows the content while something inside it has keyboard focus, such as a skip link. */
  focusable?: boolean
}

export function VisuallyHidden({ focusable = false, className, ...rest }: VisuallyHiddenProps) {
  return <span className={cx(focusable ? styles.focusable : styles.root, className)} {...rest} />
}
