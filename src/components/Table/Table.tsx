'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { easing, motionMs } from '../../internal/motion'
import { useControllable } from '../../internal/useControllable'
import styles from './Table.module.css'

export type TableColumn<T> = {
  key: string
  header: ReactNode
  /** Plain-text header, used as the row label on narrow screens. Defaults to header when it is a string. */
  label?: string
  /** Defaults to row[key]. */
  cell?: (row: T) => ReactNode
  sortable?: boolean
  /** What to sort by. Defaults to row[key]. */
  sortValue?: (row: T) => string | number
  align?: 'start' | 'end'
  width?: CSSProperties['width']
}

export type TableSort = { key: string; direction: 'ascending' | 'descending' }

export type TableLabels = {
  /** Name of the checkbox in the header. */
  selectAll: string
  /** Name of each row checkbox, built from the row's name. */
  selectRow: (name: string) => string
  /** Spoken after a sort, with the column name and direction. */
  sortedBy: (column: string, direction: TableSort['direction']) => string
  /** Spoken when a third press turns the sort off. */
  unsorted: (column: string) => string
}

const defaultLabels: TableLabels = {
  selectAll: 'Select all rows',
  selectRow: (name) => `Select ${name}`,
  sortedBy: (column, direction) => `Sorted by ${column}, ${direction}`,
  unsorted: (column) => `No longer sorted by ${column}`,
}

export type TableProps<T> = {
  /** The columns, in order, and how each one reads and shows a row. */
  columns: TableColumn<T>[]
  /** The data, one item per row. */
  rows: T[]
  /** Returns a stable, unique id for a row. Used for keys, selection and sort motion. */
  getRowId: (row: T) => string
  /** Always required. Names the table for screen readers. */
  caption: string
  /** Hides the caption visually but keeps it for screen readers. */
  hideCaption?: boolean
  /** Current sort column and direction, when you control it. Null means unsorted. */
  sort?: TableSort | null
  /** Starting sort when you do not control it. */
  defaultSort?: TableSort | null
  /** Called with the new sort when a header is pressed: ascending, descending, then null. */
  onSortChange?: (sort: TableSort | null) => void
  /** Adds a checkbox column. */
  selectable?: boolean
  /** Ids of the selected rows, when you control it. */
  selected?: string[]
  /** Starting selection when you do not control it. */
  defaultSelected?: string[]
  /** Called when the selection changes, with the new list of row ids. */
  onSelectedChange?: (ids: string[]) => void
  /** Names each row checkbox, such as the person's name. Defaults to the first column's value. */
  rowLabel?: (row: T) => string
  /** On a narrow screen: 'scroll' keeps the table and scrolls it sideways with the first column
   * in place; 'stack' turns each row into a card with its labels. */
  layout?: 'scroll' | 'stack'
  /** Scrolls the body under a sticky header past this height. */
  maxHeight?: CSSProperties['maxHeight']
  /** Shown in place of rows when there are none. */
  emptyText?: ReactNode
  /** Screen reader text for checkboxes and sort news. Missing keys use the English defaults. */
  labels?: Partial<TableLabels>
  /** Extra class for the root element. */
  className?: string
}

function Check({ checked, mixed, label, onChange }: { checked: boolean; mixed?: boolean; label: string; onChange: (v: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(mixed)
  }, [mixed])
  return (
    <span className={styles.check}>
      <input ref={ref} type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} className={styles.checkInput} />
      <span className={styles.checkBox} data-state={mixed ? 'mixed' : checked ? 'on' : 'off'} aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <path className={styles.tick} d="M3.5 8.5l3 3 6-7" pathLength="1" />
          <path className={styles.dash} d="M4 8h8" pathLength="1" />
        </svg>
      </span>
    </span>
  )
}

const read = (row: unknown, key: string) => (row as Record<string, unknown>)[key]

export function Table<T>({
  columns,
  rows,
  getRowId,
  caption,
  hideCaption,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  selectable,
  selected: selectedProp,
  defaultSelected = [],
  onSelectedChange,
  rowLabel,
  maxHeight,
  layout = 'scroll',
  emptyText = 'Nothing here yet.',
  labels: labelsProp,
  className,
}: TableProps<T>) {
  const labels = { ...defaultLabels, ...labelsProp }
  const id = useId()
  // Which edges have more to scroll to, so a fade shows the table goes on.
  const scrollRef = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState({ start: false, end: false })
  const measure = () => {
    const el = scrollRef.current
    if (!el) return
    const start = el.scrollLeft > 1
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    setMore((m) => (m.start === start && m.end === end ? m : { start, end }))
  }
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [])
  const [sort, setSort] = useControllable<TableSort | null>(sortProp, defaultSort, onSortChange)
  const [selected, setSelected] = useControllable(selectedProp, defaultSelected, onSelectedChange)
  const [announce, setAnnounce] = useState('')
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const lastTops = useRef(new Map<string, number>())

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return rows
    const value = (r: T) => (col.sortValue ? col.sortValue(r) : (read(r, col.key) as string | number))
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
    const out = [...rows].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      const c = typeof va === 'number' && typeof vb === 'number' ? va - vb : collator.compare(String(va ?? ''), String(vb ?? ''))
      return sort.direction === 'ascending' ? c : -c
    })
    return out
  }, [rows, columns, sort])

  const order = sorted.map(getRowId).join('|')

  // FLIP: rows glide to their new place after a sort
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const duration = motionMs('slow')
    const ease = easing('out')
    const now = new Map<string, number>()
    body.querySelectorAll<HTMLElement>('[data-row-id]').forEach((tr) => {
      const rid = tr.dataset.rowId!
      const top = tr.offsetTop
      now.set(rid, top)
      const before = lastTops.current.get(rid)
      if (before !== undefined && before !== top && duration > 0) {
        tr.animate([{ transform: `translateY(${before - top}px)` }, { transform: 'none' }], { duration, easing: ease })
      }
    })
    lastTops.current = now
  }, [order])

  const labelOf = (c: TableColumn<T>) => c.label ?? (typeof c.header === 'string' ? c.header : c.key)

  const toggleSort = (key: string) => {
    const same = sort?.key === key
    const next: TableSort | null = !same
      ? { key, direction: 'ascending' }
      : sort.direction === 'ascending'
        ? { key, direction: 'descending' }
        : null
    setSort(next)
    const col = columns.find((c) => c.key === key)
    const name = col ? labelOf(col) : key
    setAnnounce(next ? labels.sortedBy(name, next.direction) : labels.unsorted(name))
  }

  const ids = sorted.map(getRowId)
  const selectedSet = new Set(selected)
  const allOn = ids.length > 0 && ids.every((r) => selectedSet.has(r))
  const someOn = !allOn && ids.some((r) => selectedSet.has(r))
  const scrollable = Boolean(maxHeight) || more.start || more.end
  const nameOf = (row: T) => (rowLabel ? rowLabel(row) : String(read(row, columns[0]?.key ?? '') ?? getRowId(row)))

  return (
    <div className={cx(styles.root, className)} data-layout={layout} data-more-start={more.start || undefined} data-more-end={more.end || undefined}>
      <div ref={scrollRef} onScroll={measure} className={styles.scroll} style={{ maxHeight }} tabIndex={scrollable ? 0 : undefined} role={scrollable ? 'region' : undefined} aria-labelledby={scrollable ? `${id}-cap` : undefined}>
        {/* Explicit roles keep table semantics when rows restyle as cards (layout="stack") */}
        <table role="table" className={styles.table} aria-labelledby={`${id}-cap`}>
          <caption id={`${id}-cap`} className={cx(styles.caption, hideCaption && styles.srOnly)}>
            {caption}
          </caption>
          <thead role="rowgroup" className={styles.head}>
            <tr role="row">
              {selectable && (
                <th role="columnheader" scope="col" className={styles.checkCell}>
                  <Check
                    checked={allOn}
                    mixed={someOn}
                    label={labels.selectAll}
                    onChange={(v) => setSelected(v ? Array.from(new Set([...selected, ...ids])) : selected.filter((s) => !ids.includes(s)))}
                  />
                </th>
              )}
              {columns.map((c) => {
                const active = sort?.key === c.key
                const dir = active ? sort!.direction : undefined
                return (
                  <th
                    key={c.key}
                    role="columnheader"
                    scope="col"
                    aria-sort={c.sortable ? (dir ?? 'none') : undefined}
                    className={styles.th}
                    data-align={c.align ?? 'start'}
                    data-sortable={c.sortable || undefined}
                    style={{ width: c.width }}
                  >
                    {c.sortable ? (
                      <button type="button" className={styles.sortButton} data-active={active || undefined} onClick={() => toggleSort(c.key)}>
                        <span>{c.header}</span>
                        <svg viewBox="0 0 16 16" className={styles.sortIcon} data-dir={dir} aria-hidden="true">
                          <path d="M8 12.5v-9M4.5 7L8 3.5 11.5 7" />
                        </svg>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody role="rowgroup" ref={bodyRef}>
            {sorted.map((row, ri) => {
              const rid = getRowId(row)
              const on = selectedSet.has(rid)
              return (
                <tr key={rid} role="row" data-row-id={rid} className={styles.row} data-selected={on || undefined} style={{ ['--i' as string]: Math.min(ri, 12) }}>
                  {selectable && (
                    <td role="cell" className={styles.checkCell}>
                      <Check checked={on} label={labels.selectRow(nameOf(row))} onChange={(v) => setSelected(v ? [...selected, rid] : selected.filter((s) => s !== rid))} />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} role="cell" className={styles.td} data-align={c.align ?? 'start'} data-label={labelOf(c)}>
                      {/* One wrapper, so the card layout always gets a label and a value */}
                      <span>{c.cell ? c.cell(row) : String(read(row, c.key) ?? '')}</span>
                    </td>
                  ))}
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr role="row">
                <td role="cell" colSpan={columns.length + (selectable ? 1 : 0)} className={styles.empty}>
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className={styles.srOnly} role="status">{announce}</p>
    </div>
  )
}
