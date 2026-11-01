import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cx } from '../../internal/cx'
import styles from './ButtonGroup.module.css'

export type ButtonGroupProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** Accessible name for the group, such as "Text alignment". */
  label: string
  /** The Button, IconButton or Toggle elements to join. Secondary ones show the shared borders best. */
  children: ReactNode
  /** A row, or a column where each button takes the full width. */
  orientation?: 'horizontal' | 'vertical'
}

export function ButtonGroup({ label, children, orientation = 'horizontal', className, ...rest }: ButtonGroupProps) {
  return (
    <div {...rest} role="group" aria-label={label} className={cx(styles.root, styles[orientation], className)} data-orientation={orientation}>
      {children}
    </div>
  )
}
