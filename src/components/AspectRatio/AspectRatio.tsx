import type { ComponentPropsWithRef, CSSProperties } from 'react'
import { cx } from '../../internal/cx'
import styles from './AspectRatio.module.css'

export type AspectRatioProps = ComponentPropsWithRef<'div'> & {
  /** Width over height, such as 16 / 9 or 1 for a square. */
  ratio?: number
}

export function AspectRatio({ ratio = 16 / 9, className, style, ...rest }: AspectRatioProps) {
  return <div className={cx(styles.root, className)} style={{ '--ratio': ratio, ...style } as CSSProperties} {...rest} />
}
