import type { ComponentPropsWithRef, CSSProperties } from 'react'
import { cx } from '../../internal/cx'
import { space, type Space } from '../../internal/space'
import styles from './Center.module.css'

export type CenterProps = ComponentPropsWithRef<'div'> & {
  /** "both" centres across and down; "inline" only across, and content starts at the top. */
  axis?: 'both' | 'inline'
  /** Least height of the box, from the --hl-center-h-* tokens. "screen" fills the visible screen. Down centring needs a height to work in. */
  minHeight?: 'sm' | 'md' | 'lg' | 'screen'
  /** Centres each line of text too. Turn off for long text that reads better from the left. */
  centerText?: boolean
  /** Space between the items, as a step of the space scale. */
  gap?: Space
  /** Element to render, such as main for a full page error. */
  as?: 'div' | 'section' | 'main' | 'article'
}

export function Center({ axis = 'both', minHeight, centerText = true, gap = 4, as = 'div', className, style, ...rest }: CenterProps) {
  // One cast keeps the ref and attribute types simple; every option is a block element.
  const Tag = as as 'div'
  const vars = {
    '--center-gap': space(gap),
    '--center-min-h': minHeight ? `var(--hl-center-h-${minHeight})` : undefined,
    ...style,
  } as CSSProperties
  return <Tag className={cx(styles.root, axis === 'both' && styles.both, centerText && styles.text, className)} style={vars} {...rest} />
}
