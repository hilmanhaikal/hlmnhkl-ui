import type { ComponentPropsWithRef, CSSProperties, ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { space, type Space } from '../../internal/space'
import styles from './Split.module.css'

export type SplitProps = ComponentPropsWithRef<'div'> & {
  /** Content of the narrow column, such as filters or a table of contents. */
  sidebar: ReactNode
  /** Which side the sidebar sits on. It also comes first ("start") or last ("end") when the columns stack. */
  side?: 'start' | 'end'
  /** Width of the sidebar, from the --gooee-split-side-* tokens. */
  sidebarWidth?: 'sm' | 'md' | 'lg'
  /** Space between the columns, and between them once stacked, as a step of the space scale. */
  gap?: Space
  /** What shows once the columns stack: both, only main, or only the sidebar. */
  stacked?: 'both' | 'main' | 'sidebar'
}

export function Split({ sidebar, side = 'start', sidebarWidth = 'md', gap = 7, stacked = 'both', className, style, children, ...rest }: SplitProps) {
  const hasSide = sidebar !== null && sidebar !== undefined && sidebar !== false
  const aside = hasSide && <div className={styles.side} data-slot="split-side">{sidebar}</div>
  const main = <div className={styles.main} data-slot="split-main">{children}</div>
  const vars = { '--split-gap': space(gap), '--split-side': `var(--gooee-split-side-${sidebarWidth})`, ...style } as CSSProperties
  // The outer box is the query container: an element cannot query its own width.
  return (
    <div className={cx(styles.root, className)} data-slot="split" style={vars} {...rest}>
      <div className={cx(styles.inner, hasSide ? styles[side] : styles.solo)} data-stacked={stacked}>
        {side === 'start' ? aside : main}
        {side === 'start' ? main : aside}
      </div>
    </div>
  )
}
