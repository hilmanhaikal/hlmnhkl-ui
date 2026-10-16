import type { ComponentPropsWithRef, CSSProperties } from 'react'
import { cx } from '../../internal/cx'
import { space, type Space } from '../../internal/space'
import styles from './Stack.module.css'

export type StackProps = ComponentPropsWithRef<'div'> & {
  /** Space between items, as a step of the space scale (0 to 12, read as --hl-space-N). */
  gap?: Space
  /** Lines items up across the stack. "stretch" makes each item full width. */
  align?: 'stretch' | 'start' | 'center' | 'end'
  /** Element to render, so the stack can be a list, a section or a form. */
  as?: 'div' | 'section' | 'article' | 'aside' | 'nav' | 'header' | 'footer' | 'main' | 'form' | 'fieldset' | 'ul' | 'ol'
}

export function Stack({ gap = 5, align = 'stretch', as = 'div', className, style, ...rest }: StackProps) {
  // One cast keeps the ref and attribute types simple; every option is a block element.
  const Tag = as as 'div'
  return <Tag className={cx(styles.root, styles[align], className)} style={{ '--stack-gap': space(gap), ...style } as CSSProperties} {...rest} />
}
