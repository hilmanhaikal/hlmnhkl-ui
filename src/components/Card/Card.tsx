import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cx } from '../../internal/cx'
import styles from './Card.module.css'

export type CardProps = Omit<ComponentPropsWithRef<'div'>, 'title'> & {
  /** Heading at the top of the body, rendered as an h3. Any content, not the native tooltip. */
  title?: ReactNode
  /** Muted text under the title. */
  description?: ReactNode
  /** Media or a header slot shown above the body, edge to edge. */
  media?: ReactNode
  /** Row under the body, set apart by a border, such as actions. */
  footer?: ReactNode
  /** Lifts on hover. Use when the card holds a link or button that covers it. */
  interactive?: boolean
  /** Space inside the card. */
  padding?: 'md' | 'lg'
  /** Lets the body grow when the card is stretched (a grid cell or flex row), so the footer or a last button sits at the bottom. */
  fill?: boolean
}

export function Card({ title, description, media, footer, interactive, padding = 'md', fill, className, children, ...rest }: CardProps) {
  return (
    <div className={cx(styles.root, interactive && styles.interactive, styles[padding], fill && styles.fill, className)} {...rest}>
      {media && <div className={styles.media}>{media}</div>}
      <div className={styles.body}>
        {title && <h3 className={styles.title}>{title}</h3>}
        {description && <p className={styles.description}>{description}</p>}
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  )
}
