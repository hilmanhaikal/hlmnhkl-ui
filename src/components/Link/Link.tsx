import type { ComponentPropsWithRef } from 'react'
import { cx } from '../../internal/cx'
import { ArrowUpRightIcon } from '../../internal/icons'
import styles from './Link.module.css'

export type LinkLabels = {
  /** Screen reader text after an external link's name. */
  newTab: string
}

const defaultLabels: LinkLabels = {
  newTab: '(opens in a new tab)',
}

export type LinkProps = ComponentPropsWithRef<'a'> & {
  /** Opens in a new tab, adds a safe rel and an arrow, and tells screen readers. */
  external?: boolean
  /** Inline sits in running text. Standalone gets a full-size touch target. */
  variant?: 'inline' | 'standalone'
  /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<LinkLabels>
}

export function Link({ external, variant = 'inline', labels: labelsProp, className, children, ...rest }: LinkProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  return (
    <a
      className={cx(styles.root, styles[variant], className)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
      {...rest}
    >
      <span className={styles.text}>{children}</span>
      {external && (
        <>
          <ArrowUpRightIcon className={styles.arrow} />
          <span className={styles.srOnly}> {labels.newTab}</span>
        </>
      )}
    </a>
  )
}
