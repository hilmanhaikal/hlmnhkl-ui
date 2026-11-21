// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { flipRows, groupRows, nextSort, readCell as read, revealCell, scrollEdges, sortRows, type TableSort } from '../../internal/motion/table'
import { useControllable } from '../../internal/useControllable'
import { Skeleton } from '../Skeleton'
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

export type { TableSort }

export type TableLabels = {
  /** Name of the checkbox in the header. */
  selectAll: string
  /** Name of each row checkbox, built from the row's name. */
  selectRow: (name: string) => string
  /** Spoken after a sort, with the column name and direction. */
  sortedBy: (column: string, direction: TableSort['direction']) => string
  /** Spoken when a third press turns the sort off. */
  unsorted: (column: string) => string
  /** The row count beside each group's name. */
  groupCount: (count: number) => string
  /** Spoken while the rows load. */
  loading: string
}

const defaultLabels: TableLabels = {
  selectAll: 'Select all rows',
  selectRow: (name) => `Select ${name}`,
  sortedBy: (column, direction) => `Sorted by ${column}, ${direction}`,
  unsorted: (column) => `No longer sorted by ${column}`,
  groupCount: (count) => `${count} ${count === 1 ? 'row' : 'rows'}`,
  loading: 'Loading rows',
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
  /** Gathers rows under a header per group, such as each row's status. Groups keep the order they first
   * appear in; the sort applies inside each group. Rows glide to their group when it changes. */
  groupBy?: (row: T) => string
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
  /** Shows skeleton rows in place of the data and holds sorting and selection still. */
  loading?: boolean
  /** How many skeleton rows show while loading. */
  loadingRows?: number
  /** Screen reader text for checkboxes and sort news. Missing keys use the English defaults. */
  labels?: Partial<TableLabels>
  /** Extra class for the root element. */
  className?: string
}

function Check({ checked, mixed, label, disabled, onChange }: { checked: boolean; mixed?: boolean; label: string; disabled?: boolean; onChange: (v: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(mixed)
  }, [mixed])
  return (
    <span className={styles.check} data-slot="table-checkbox">
      <input ref={ref} type="checkbox" data-slot="table-checkbox-input" aria-label={label} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className={styles.checkInput} />
      <span className={styles.checkBox} data-slot="table-checkbox-indicator" data-state={mixed ? 'indeterminate' : checked ? 'checked' : 'unchecked'} aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <path className={styles.tick} d="M3.5 8.5l3 3 6-7" pathLength="1" />
          <path className={styles.dash} d="M4 8h8" pathLength="1" />
        </svg>
      </span>
    </span>
  )
}

export function Table<T>({
  columns,
  rows,
  getRowId,
  caption,
  hideCaption,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  groupBy,
  selectable,
  selected: selectedProp,
  defaultSelected = [],
  onSelectedChange,
  rowLabel,
  maxHeight,
  layout = 'scroll',
  emptyText = 'Nothing here yet.',
  loading = false,
  loadingRows = 5,
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
    const { start, end } = scrollEdges(el)
    setMore((m) => (m.start === start && m.end === end ? m : { start, end }))
  }
  const reveal = (e: FocusEvent<HTMLDivElement>) => {
    if (scrollRef.current) revealCell(scrollRef.current, e.target)
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
  const tableRef = useRef<HTMLTableElement>(null)
  const lastTops = useRef(new Map<string, number>())
  const groupOrder = useRef<string[]>([])

  const sorted = useMemo(() => sortRows(rows, columns, sort), [rows, columns, sort])

  const groups = groupBy ? groupRows(rows, sorted, groupBy, groupOrder.current) : null
  const order = groups ? groups.map((g) => `${g.key}:${g.rows.map(getRowId).join(',')}`).join('|') : sorted.map(getRowId).join('|')

  // FLIP: rows glide to their new place after a sort or a regroup.
  useLayoutEffect(() => {
    const table = tableRef.current
    if (!table) return
    lastTops.current = flipRows(table, lastTops.current)
  }, [order])

  const labelOf = (c: TableColumn<T>) => c.label ?? (typeof c.header === 'string' ? c.header : c.key)

  const toggleSort = (key: string) => {
    const next = nextSort(sort, key)
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

  const colCount = columns.length + (selectable ? 1 : 0)
  // Keeps the entrance stagger going across groups.
  let rowIndex = 0
  const renderRow = (row: T) => {
    const ri = rowIndex++
    const rid = getRowId(row)
    const on = selectedSet.has(rid)
    return (
      <tr key={rid} role="row" data-row-id={rid} className={styles.row} data-slot="table-row" data-selected={on || undefined} style={{ ['--i' as string]: Math.min(ri, 12) }}>
        {selectable && (
          <td role="cell" className={styles.checkCell} data-slot="table-cell">
            <Check checked={on} label={labels.selectRow(nameOf(row))} onChange={(v) => setSelected(v ? [...selected, rid] : selected.filter((s) => s !== rid))} />
          </td>
        )}
        {columns.map((c) => (
          <td key={c.key} role="cell" className={styles.td} data-slot="table-cell" data-align={c.align ?? 'start'} data-label={labelOf(c)}>
            {/* One wrapper, so the card layout always gets a label and a value */}
            <span>{c.cell ? c.cell(row) : String(read(row, c.key) ?? '')}</span>
          </td>
        ))}
      </tr>
    )
  }

  return (
    <div className={cx(styles.root, className)} data-slot="table" data-layout={layout} data-more-start={more.start || undefined} data-more-end={more.end || undefined}>
      <div ref={scrollRef} onScroll={measure} onFocus={reveal} className={styles.scroll} data-slot="table-container" style={{ maxHeight }} tabIndex={scrollable ? 0 : undefined} role={scrollable ? 'region' : undefined} aria-labelledby={scrollable ? `${id}-cap` : undefined}>
        {/* Explicit roles keep table semantics when rows restyle as cards (layout="stack") */}
        <table ref={tableRef} role="table" className={styles.table} data-slot="table-element" aria-labelledby={`${id}-cap`} aria-busy={loading || undefined}>
          <caption id={`${id}-cap`} className={cx(styles.caption, hideCaption && styles.srOnly)} data-slot="table-caption">
            {caption}
          </caption>
          <thead role="rowgroup" className={styles.head} data-slot="table-header">
            <tr role="row">
              {selectable && (
                <th role="columnheader" scope="col" className={styles.checkCell} data-slot="table-head">
                  <Check
                    checked={allOn}
                    mixed={someOn}
                    label={labels.selectAll}
                    disabled={loading}
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
                    data-slot="table-head"
                    data-align={c.align ?? 'start'}
                    data-sortable={c.sortable || undefined}
                    style={{ width: c.width }}
                  >
                    {c.sortable ? (
                      <button type="button" className={styles.sortButton} data-slot="table-sort" disabled={loading} data-state={active ? 'active' : 'inactive'} onClick={() => toggleSort(c.key)}>
                        <span>{c.header}</span>
                        <svg viewBox="0 0 16 16" className={styles.sortIcon} data-slot="table-sort-icon" data-dir={dir} aria-hidden="true">
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
          {loading ? (
            <tbody role="rowgroup" data-slot="table-body">
              {Array.from({ length: loadingRows }, (_, r) => (
                <tr key={r} aria-hidden="true" className={cx(styles.row, styles.loadingRow)} data-slot="table-row">
                  {selectable && <td className={styles.checkCell} data-slot="table-cell" />}
                  {columns.map((c, i) => (
                    <td key={c.key} className={styles.td} data-slot="table-cell" data-align={c.align ?? 'start'} data-label={labelOf(c)}>
                      <Skeleton shape="text" width={`${[72, 56, 84][(r + i) % 3]}%`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : groups && groups.length > 0 ? (
            groups.map((g) => (
              <tbody key={g.key} role="rowgroup" className={styles.group} data-slot="table-body">
                <tr role="row" data-row-id={`group:${g.key}`} className={styles.groupRow} data-slot="table-group-row">
                  <th role="rowheader" scope="rowgroup" colSpan={colCount} className={styles.groupHead} data-slot="table-group-head">
                    <span>{g.key}</span>{' '}
                    <span className={styles.groupCount} data-slot="table-group-count">{labels.groupCount(g.rows.length)}</span>
                  </th>
                </tr>
                {g.rows.map(renderRow)}
              </tbody>
            ))
          ) : (
            <tbody role="rowgroup" data-slot="table-body">
              {sorted.map(renderRow)}
              {sorted.length === 0 && (
                <tr role="row">
                  <td role="cell" colSpan={colCount} className={styles.empty} data-slot="table-empty">
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </div>
      <p className={styles.srOnly} role="status">{announce}</p>
      <p className={styles.srOnly} role="status">{loading ? labels.loading : ''}</p>
    </div>
  )
}
