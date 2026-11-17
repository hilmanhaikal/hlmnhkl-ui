import { easing, motionMs } from '../motion'

// Table's sort, groups, scroll edges and row glide, with no framework.

export type TableSort = { key: string; direction: 'ascending' | 'descending' }

type Sortable<T> = { key: string; sortValue?: (row: T) => string | number }

export const readCell = (row: unknown, key: string) => (row as Record<string, unknown>)[key]

/** The rows in the sort's order, or as given when unsorted. */
export function sortRows<T>(rows: T[], columns: Sortable<T>[], sort: TableSort | null): T[] {
  if (!sort) return rows
  const col = columns.find((c) => c.key === sort.key)
  if (!col) return rows
  const value = (r: T) => (col.sortValue ? col.sortValue(r) : (readCell(r, col.key) as string | number))
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  return [...rows].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    const c = typeof va === 'number' && typeof vb === 'number' ? va - vb : collator.compare(String(va ?? ''), String(vb ?? ''))
    return sort.direction === 'ascending' ? c : -c
  })
}

/**
 * Groups take the order they first appear in, and keep it: a sort, or a row moving to another group,
 * never shuffles the groups themselves. A group seen for the first time joins `order` at the end.
 */
export function groupRows<T>(rows: T[], sorted: T[], groupBy: (row: T) => string, order: string[]) {
  for (const key of new Set(rows.map(groupBy))) if (!order.includes(key)) order.push(key)
  return order.map((key) => ({ key, rows: sorted.filter((r) => groupBy(r) === key) })).filter((g) => g.rows.length)
}

/** The next sort after a press on a header: ascending, descending, then off. */
export const nextSort = (sort: TableSort | null, key: string): TableSort | null =>
  sort?.key !== key ? { key, direction: 'ascending' } : sort.direction === 'ascending' ? { key, direction: 'descending' } : null

/** Which edges have more to scroll to, so a fade shows the table goes on. */
export function scrollEdges(el: HTMLElement) {
  // The sticky first column's width, so a cell that takes focus scrolls clear of it (WCAG 2.4.11).
  const first = el.querySelector<HTMLElement>('thead th')
  el.style.setProperty('--first-w', first && getComputedStyle(first).left === '0px' ? `${first.offsetWidth}px` : '0px')
  return { start: el.scrollLeft > 1, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 }
}

/**
 * Browsers do not scroll a sticky header cell into view on focus, so its button could stay under the
 * sticky first column. Nudges the sideways scroll until the focused cell is clear on both sides.
 */
export function revealCell(el: HTMLElement, target: EventTarget | null) {
  const cell = (target as Element | null)?.closest?.('th, td')
  if (!cell || cell === cell.parentElement?.firstElementChild) return
  const box = el.getBoundingClientRect()
  const r = cell.getBoundingClientRect()
  const under = r.left - box.left - (parseFloat(el.style.getPropertyValue('--first-w')) || 0)
  if (under < 0) el.scrollLeft += under
  else if (r.right > box.right) el.scrollLeft += r.right - box.right
}

/**
 * FLIP: rows glide from their last place to the new one. When the groups themselves changed (`regrouped`),
 * they snap there with the spring, so the table visibly splits apart and closes up again. Returns the new places.
 */
export function flipRows(table: HTMLElement, last: Map<string, number>, regrouped: boolean) {
  const duration = motionMs('slow')
  const ease = easing(regrouped ? 'spring' : 'out')
  const now = new Map<string, number>()
  table.querySelectorAll<HTMLElement>('tbody [data-row-id]').forEach((tr) => {
    const rid = tr.dataset.rowId!
    const top = tr.offsetTop
    now.set(rid, top)
    const before = last.get(rid)
    if (before !== undefined && before !== top && duration > 0) tr.animate([{ transform: `translateY(${before - top}px)` }, { transform: 'none' }], { duration, easing: ease })
  })
  return now
}
