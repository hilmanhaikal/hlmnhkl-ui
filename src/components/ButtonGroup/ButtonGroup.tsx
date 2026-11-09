import { useLayoutEffect, useRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { mergeRefs } from '../../internal/mergeRefs'
import styles from './ButtonGroup.module.css'

export type ButtonGroupProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & {
  /** Accessible name for the group, such as "Text alignment". */
  label: string
  /** The Button, IconButton or Toggle elements to join. Secondary ones show the shared borders best. */
  children: ReactNode
  /** A row, or a column where each button takes the full width. */
  orientation?: 'horizontal' | 'vertical'
}

// A row with no room wraps onto more rows. Each row stays joined, with round ends of its own, so the
// buttons that start and end a row are marked as they fall.
export function ButtonGroup({ label, children, orientation = 'horizontal', className, ref, ...rest }: ButtonGroupProps) {
  const own = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const root = own.current
    if (!root || orientation !== 'horizontal') return
    const mark = () => {
      const kids = [...root.children] as HTMLElement[]
      kids.forEach((k, i) => {
        const prev = kids[i - 1], next = kids[i + 1]
        k.toggleAttribute('data-row-start', !prev || prev.offsetTop !== k.offsetTop)
        k.toggleAttribute('data-row-end', !next || next.offsetTop !== k.offsetTop)
      })
    }
    mark()
    const ro = new ResizeObserver(mark)
    ro.observe(root)
    const mo = new MutationObserver(mark)
    mo.observe(root, { childList: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [orientation])
  return (
    <div {...rest} ref={mergeRefs(own, ref)} role="group" aria-label={label} className={cx(styles.root, styles[orientation], className)} data-orientation={orientation}>
      {children}
    </div>
  )
}
