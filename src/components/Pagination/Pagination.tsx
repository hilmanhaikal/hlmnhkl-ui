'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { cx } from '../../internal/cx'
import { ChevronLeftIcon, ChevronRightIcon } from '../../internal/icons'
import { useControllable } from '../../internal/useControllable'
import styles from './Pagination.module.css'

export type PaginationProps = {
  /** Total number of pages. Pages count from 1. */
  pageCount: number
  /** Current page, counting from 1, when you control it. */
  page?: number
  /** Starting page when you do not control it. */
  defaultPage?: number
  /** Called when the page changes, with the new page number. */
  onPageChange?: (page: number) => void
  /** Pages shown on each side of the current one. */
  siblings?: number
  /** Screen reader name for the nav landmark. */
  label?: string
  /** Screen reader name for the previous button. */
  previousLabel?: string
  /** Screen reader name for the next button. */
  nextLabel?: string
  /** Builds the screen reader name for each page button. */
  pageLabel?: (page: number) => string
  /** Extra class for the root element. */
  className?: string
}

function range(page: number, count: number, siblings: number): Array<number | 'gap'> {
  const total = siblings * 2 + 5
  if (count <= total) return Array.from({ length: count }, (_, i) => i + 1)
  const left = Math.max(page - siblings, 2)
  const right = Math.min(page + siblings, count - 1)
  const out: Array<number | 'gap'> = [1]
  if (left > 2) out.push('gap')
  for (let p = left; p <= right; p++) out.push(p)
  if (right < count - 1) out.push('gap')
  out.push(count)
  return out
}

export function Pagination({
  pageCount,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  siblings = 1,
  label = 'Pagination',
  previousLabel = 'Previous page',
  nextLabel = 'Next page',
  pageLabel = (p) => `Page ${p}`,
  className,
}: PaginationProps) {
  const [page, setPage] = useControllable(pageProp, defaultPage, onPageChange)
  const listRef = useRef<HTMLUListElement>(null)
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null)
  const [ready, setReady] = useState(false)
  const pages = range(page, pageCount, siblings)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const el = list.querySelector<HTMLElement>('[aria-current="page"]')
      setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null)
    }
    measure()
    if (!ready) requestAnimationFrame(() => setReady(true))
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [page, pageCount, siblings, ready])

  // Keeps the current page in view when the list scrolls on a narrow screen.
  useLayoutEffect(() => {
    const list = listRef.current
    const el = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!list || !el || list.scrollWidth <= list.clientWidth) return
    list.scrollLeft = el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2
  }, [page, pageCount, siblings])

  const go = (p: number) => {
    const next = Math.min(Math.max(p, 1), pageCount)
    if (next !== page) setPage(next)
  }

  return (
    <nav aria-label={label} className={cx(styles.root, className)}>
      <button type="button" className={cx(styles.btn, styles.edge)} aria-label={previousLabel} disabled={page <= 1} onClick={() => go(page - 1)}>
        <ChevronLeftIcon />
      </button>
      <ul ref={listRef} className={styles.list}>
        {pill && (
          <li aria-hidden="true" className={styles.pill} data-ready={ready || undefined} style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />
        )}
        {pages.map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} className={styles.gap} aria-hidden="true">…</li>
          ) : (
            <li key={p}>
              <button
                type="button"
                className={styles.btn}
                aria-label={pageLabel(p)}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => go(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>
      <button type="button" className={cx(styles.btn, styles.edge)} aria-label={nextLabel} disabled={page >= pageCount} onClick={() => go(page + 1)}>
        <ChevronRightIcon />
      </button>
    </nav>
  )
}
