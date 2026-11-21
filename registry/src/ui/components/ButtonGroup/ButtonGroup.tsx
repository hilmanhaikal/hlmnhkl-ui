// Gooee UI, MIT licence. https://gooee.dev
import { useLayoutEffect, useRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { mergeRefs } from '../../internal/mergeRefs'
import { markRows } from '../../internal/motion/buttonGroup'
import styles from './ButtonGroup.module.css'

export type ButtonGroupProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** Accessible name for the group, such as "Text alignment". */
  label: string
  /** The Button, IconButton or Toggle elements to join. Secondary ones show the shared borders best. */
  children: ReactNode
  /** A row, or a column where each button takes the full width. */
  orientation?: 'horizontal' | 'vertical'
}

export function ButtonGroup({ label, children, orientation = 'horizontal', className, ref, ...rest }: ButtonGroupProps) {
  const own = useRef<HTMLDivElement>(null)
  // Each wrapped row keeps round ends of its own (motion/buttonGroup.ts).
  useLayoutEffect(() => {
    if (!own.current || orientation !== 'horizontal') return
    return markRows(own.current)
  }, [orientation])
  return (
    <div {...rest} ref={mergeRefs(own, ref)} role="group" aria-label={label} data-slot="button-group" className={cx(styles.root, styles[orientation], className)} data-orientation={orientation}>
      {children}
    </div>
  )
}
