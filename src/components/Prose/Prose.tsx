import type { ComponentPropsWithRef, ElementType } from 'react'
import { cx } from '../../internal/cx'
import styles from './Prose.module.css'

export type ProseProps = {
  /** The element to render, such as article. */
  as?: ElementType
} & ComponentPropsWithRef<'div'>

// Long text written elsewhere, such as Markdown or a CMS: headings, paragraphs, lists, quotes, code and
// pictures, set for reading. It styles plain HTML inside it, so nothing needs a class.
export function Prose({ as: Tag = 'div', className, ...rest }: ProseProps) {
  return <Tag className={cx(styles.root, className)} {...rest} />
}
