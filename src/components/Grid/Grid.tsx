import type { ComponentPropsWithRef, CSSProperties } from 'react'
import { cx } from '../../internal/cx'
import { space, type Space } from '../../internal/space'
import styles from './Grid.module.css'

export type GridProps = ComponentPropsWithRef<'div'> & {
  /** Fixed number of columns. With min, it becomes the most columns the grid may show. */
  columns?: number
  /** Narrowest a cell may get before a column drops: a token size or any CSS length. Defaults to "md" when columns is not set. */
  min?: 'xs' | 'sm' | 'md' | 'lg' | (string & {})
  /** Space between cells, as a step of the space scale (0 to 12, read as --hl-space-N). */
  gap?: Space
  /** Element to render, so a set of cards can be a list. */
  as?: 'div' | 'section' | 'ul' | 'ol'
  /** With columns and min: "halves" steps from columns to half of it, then to one (4, 2, 1), so no card is left alone on a row. */
  steps?: 'all' | 'halves'
}

const tokenSizes = ['xs', 'sm', 'md', 'lg']

export function Grid({ columns, min, gap = 5, as = 'div', steps = 'all', className, style, ...rest }: GridProps) {
  // One cast keeps the ref and attribute types simple; every option is a block element.
  const Tag = as as 'div'
  const fit = min !== undefined || columns === undefined
  const minValue = min === undefined ? 'md' : min
  const vars = {
    '--grid-gap': space(gap),
    '--grid-cols': columns,
    '--grid-half': columns ? Math.max(1, Math.floor(columns / 2)) : undefined,
    '--grid-min': tokenSizes.includes(minValue) ? `var(--hl-grid-min-${minValue})` : minValue,
    ...style,
  } as CSSProperties
  const fitClass = !columns ? styles.fit : steps === 'halves' ? styles.halves : styles.capped
  return <Tag className={cx(styles.root, fit ? fitClass : styles.fixed, className)} style={vars} {...rest} />
}
