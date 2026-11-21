'use client'

import { Fragment, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { cx } from '../../internal/cx'
import { ChevronRightIcon } from '../../icons/icons'
import styles from './Breadcrumb.module.css'

export type BreadcrumbItem = {
  /** Text of the item. */
  label: string
  /** Where the link goes. Without it, the item is a button. */
  href?: string
  /** Called on click with the event, so a link can call preventDefault for client routing. */
  onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void
}

export type BreadcrumbLabels = {
  /** Name of the "…" button. */
  expand: string
}

const defaultLabels: BreadcrumbLabels = { expand: 'Show full path' }

export type BreadcrumbProps = {
  /** Path from the top level down. The last item is the current page. */
  items: BreadcrumbItem[]
  /** Above this many items, the middle collapses into a "…" button. With 2 or less, only "…" and the current page show. */
  maxItems?: number
  /** Name of the nav landmark. */
  label?: string
  /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<BreadcrumbLabels>
  /** Extra class for the nav element. */
  className?: string
}

export function Breadcrumb({ items, maxItems = 4, label = 'Breadcrumb', labels: labelsProp, className }: BreadcrumbProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const [expanded, setExpanded] = useState(false)
  const listRef = useRef<HTMLOListElement>(null)
  const collapse = !expanded && items.length > maxItems
  // Under 3 there is no room for the first item, so only "…" and the current page stay.
  const head = maxItems < 3 ? 0 : 1
  const tail = Math.max(1, maxItems - head - 1)
  const visible = collapse ? [...items.slice(0, head), null, ...items.slice(-tail)] : items

  // The "…" button is gone after expanding, so focus moves to the first link it revealed.
  useLayoutEffect(() => {
    if (!expanded) return
    listRef.current?.querySelector<HTMLElement>(`:scope > li:nth-child(${head + 1}) > :is(a, button)`)?.focus()
  }, [expanded, head])

  return (
    <nav aria-label={label} data-slot="breadcrumb" className={cx(styles.root, className)}>
      <ol ref={listRef} data-slot="breadcrumb-list" className={styles.list}>
        {visible.map((item, i) => {
          const last = i === visible.length - 1
          return (
            <Fragment key={item ? `${item.label}-${i}` : 'more'}>
              <li data-slot="breadcrumb-item" className={styles.item} style={{ ['--i' as string]: i }} data-revealed={expanded || undefined}>
                {item === null ? (
                  <button type="button" data-slot="breadcrumb-more" className={styles.more} aria-label={labels.expand} onClick={() => setExpanded(true)}>
                    …
                  </button>
                ) : last ? (
                  <span data-slot="breadcrumb-current" className={styles.current} aria-current="page" title={item.label}>{item.label}</span>
                ) : item.href === undefined ? (
                  <button type="button" data-slot="breadcrumb-link" className={cx(styles.link, styles.button)} title={item.label} onClick={item.onClick}>
                    {item.label}
                  </button>
                ) : (
                  <a data-slot="breadcrumb-link" className={styles.link} href={item.href} title={item.label} onClick={item.onClick}>
                    {item.label}
                  </a>
                )}
                {!last && <ChevronRightIcon data-slot="breadcrumb-separator" className={styles.sep} />}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
