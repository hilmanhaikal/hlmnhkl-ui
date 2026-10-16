'use client'

import { Fragment, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { cx } from '../../internal/cx'
import { ChevronRightIcon } from '../../internal/icons'
import styles from './Breadcrumb.module.css'

export type BreadcrumbItem = {
  /** Text of the item. */
  label: string
  /** Where the link goes. Without it, the item is a button. */
  href?: string
  /** Called on click with the event, so a link can call preventDefault for client routing. */
  onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void
}

export type BreadcrumbProps = {
  /** Path from the top level down. The last item is the current page. */
  items: BreadcrumbItem[]
  /** Above this many items, the middle collapses into a "…" button. */
  maxItems?: number
  /** Name of the nav landmark. */
  label?: string
  /** Screen reader name for the "…" button. */
  expandLabel?: string
  /** Extra class for the nav element. */
  className?: string
}

export function Breadcrumb({ items, maxItems = 4, label = 'Breadcrumb', expandLabel = 'Show full path', className }: BreadcrumbProps) {
  const [expanded, setExpanded] = useState(false)
  const listRef = useRef<HTMLOListElement>(null)
  const collapse = !expanded && items.length > maxItems
  const tail = Math.max(1, maxItems - 2)
  const visible = collapse ? [items[0], null, ...items.slice(-tail)] : items

  // The "…" button is gone after expanding, so focus moves to the first link it revealed.
  useLayoutEffect(() => {
    if (!expanded) return
    listRef.current?.querySelector<HTMLElement>(':scope > li:nth-child(2) > :is(a, button)')?.focus()
  }, [expanded])

  return (
    <nav aria-label={label} className={cx(styles.root, className)}>
      <ol ref={listRef} className={styles.list}>
        {visible.map((item, i) => {
          const last = i === visible.length - 1
          return (
            <Fragment key={item ? `${item.label}-${i}` : 'more'}>
              <li className={styles.item} style={{ ['--i' as string]: i }} data-revealed={expanded || undefined}>
                {item === null ? (
                  <button type="button" className={styles.more} aria-label={expandLabel} onClick={() => setExpanded(true)}>
                    …
                  </button>
                ) : last ? (
                  <span className={styles.current} aria-current="page">{item.label}</span>
                ) : item.href === undefined ? (
                  <button type="button" className={cx(styles.link, styles.button)} onClick={item.onClick}>
                    {item.label}
                  </button>
                ) : (
                  <a className={styles.link} href={item.href} onClick={item.onClick}>
                    {item.label}
                  </a>
                )}
                {!last && <ChevronRightIcon className={styles.sep} />}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
