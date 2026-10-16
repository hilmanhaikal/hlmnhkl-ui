import type { ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { InboxIcon } from '../../internal/icons'
import styles from './EmptyState.module.css'

export type EmptyStateProps = {
  /** Short heading that says what is empty. */
  title: ReactNode
  /** Text under the title, such as what to do next. */
  description?: ReactNode
  /** Picture above the title. It is hidden from screen readers. */
  icon?: ReactNode
  /** One primary action, plus an optional secondary one. */
  action?: ReactNode
  /** Less important action, shown before the primary one. */
  secondaryAction?: ReactNode
  /** Heading level for the title, to fit the page outline. Use 1 when the empty state is the whole page. */
  headingLevel?: 1 | 2 | 3 | 4
  /** Extra class for the root element. */
  className?: string
}

export function EmptyState({ title, description, icon = <InboxIcon />, action, secondaryAction, headingLevel = 3, className }: EmptyStateProps) {
  const H = `h${headingLevel}` as 'h3'
  return (
    <div className={cx(styles.root, className)}>
      <div className={styles.icon} style={{ ['--i' as string]: 0 }} aria-hidden="true">{icon}</div>
      <H className={styles.title} style={{ ['--i' as string]: 1 }}>{title}</H>
      {description && <p className={styles.description} style={{ ['--i' as string]: 2 }}>{description}</p>}
      {(action || secondaryAction) && (
        <div className={styles.actions} style={{ ['--i' as string]: 3 }}>
          {secondaryAction}
          {action}
        </div>
      )}
    </div>
  )
}
