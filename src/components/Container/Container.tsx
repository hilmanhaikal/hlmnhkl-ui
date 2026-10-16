import type { ComponentPropsWithRef, CSSProperties } from 'react'
import { cx } from '../../internal/cx'
import { space, type Space } from '../../internal/space'
import styles from './Container.module.css'

export type ContainerProps = ComponentPropsWithRef<'div'> & {
  /** Widest the content gets, from the --hl-container-* tokens. "full" never stops growing. */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Space on the left and right, as a step of the space scale. The notch area on a phone wins when it is wider. */
  padding?: Space
  /** Element to render, such as main for the page body. */
  as?: 'div' | 'main' | 'section' | 'article' | 'header' | 'footer'
}

export function Container({ size = 'lg', padding = 5, as = 'div', className, style, ...rest }: ContainerProps) {
  // One cast keeps the ref and attribute types simple; every option is a block element.
  const Tag = as as 'div'
  return <Tag className={cx(styles.root, styles[size], className)} style={{ '--container-pad': space(padding), ...style } as CSSProperties} {...rest} />
}
