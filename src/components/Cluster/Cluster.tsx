import type { ComponentPropsWithRef, CSSProperties } from 'react'
import { cx } from '../../internal/cx'
import { space, type Space } from '../../internal/space'
import styles from './Cluster.module.css'

export type ClusterProps = ComponentPropsWithRef<'div'> & {
  /** Space between items, as a step of the space scale (0 to 12, read as --hl-space-N). */
  gap?: Space
  /** Space between wrapped rows. Defaults to the same step as gap. */
  rowGap?: Space
  /** Lines items up inside a row. "baseline" keeps mixed text sizes on one line. */
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'
  /** Places items along the row. "between" pushes the first and last item to the edges. */
  justify?: 'start' | 'center' | 'end' | 'between'
  /** Lets items flow onto the next row when they run out of room. */
  wrap?: boolean
  /** Element to render, so a row of links can be a nav or a list. */
  as?: 'div' | 'section' | 'nav' | 'header' | 'footer' | 'ul' | 'ol'
}

export function Cluster({ gap = 3, rowGap, align = 'center', justify = 'start', wrap = true, as = 'div', className, style, ...rest }: ClusterProps) {
  // One cast keeps the ref and attribute types simple; every option is a block element.
  const Tag = as as 'div'
  const vars = { '--cluster-gap': space(gap), '--cluster-row-gap': space(rowGap ?? gap), ...style } as CSSProperties
  return <Tag className={cx(styles.root, styles[`align-${align}`], styles[`justify-${justify}`], !wrap && styles.nowrap, className)} style={vars} {...rest} />
}
