<script setup lang="ts" generic="T">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch, type FunctionalComponent, type VNodeChild } from 'vue'
import { flipRows, groupRows, nextSort, readCell as read, revealCell, scrollEdges, sortRows, type TableSort } from '../../internal/motion/table'
import Skeleton from '../Skeleton/Skeleton.vue'
import styles from './Table.module.css'

export type { TableSort }

export type TableColumn<R> = {
  key: string
  /** Plain text, or a render function for richer content. */
  header: string | (() => VNodeChild)
  /** Plain-text header, used as the row label on narrow screens. Defaults to header when it is a string. */
  label?: string
  /** Defaults to row[key]. */
  cell?: (row: R) => VNodeChild
  sortable?: boolean
  /** What to sort by. Defaults to row[key]. */
  sortValue?: (row: R) => string | number
  align?: 'start' | 'end'
  /** Any CSS width. A number is pixels. */
  width?: number | string
}

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

// The Vue Table: the same look (Table.module.css), sort, groups and row glide (motion/table.ts) as the React one.
const {
  columns,
  rows,
  getRowId,
  defaultSort = null,
  groupBy,
  selectable,
  defaultSelected = [],
  rowLabel,
  layout = 'scroll',
  maxHeight,
  emptyText = 'Nothing here yet.',
  loading = false,
  loadingRows = 5,
  labels: labelsProp,
} = defineProps<{
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
  /** Starting sort when there is no v-model:sort. */
  defaultSort?: TableSort | null
  /** Gathers rows under a header per group, such as each row's status. Groups keep the order they first
   * appear in; the sort applies inside each group. Rows glide to their group when it changes. */
  groupBy?: (row: T) => string
  /** Adds a checkbox column. */
  selectable?: boolean
  /** Starting selection when there is no v-model:selected. */
  defaultSelected?: string[]
  /** Names each row checkbox, such as the person's name. Defaults to the first column's value. */
  rowLabel?: (row: T) => string
  /** On a narrow screen: 'scroll' keeps the table and scrolls it sideways with the first column
   * in place; 'stack' turns each row into a card with its labels. */
  layout?: 'scroll' | 'stack'
  /** Scrolls the body under a sticky header past this height. A number is pixels. */
  maxHeight?: number | string
  /** Shown in place of rows when there are none. The empty slot replaces it. */
  emptyText?: string
  /** Shows skeleton rows in place of the data and holds sorting and selection still. */
  loading?: boolean
  /** How many skeleton rows show while loading. */
  loadingRows?: number
  /** Screen reader text for checkboxes and sort news. Missing keys use the English defaults. */
  labels?: Partial<TableLabels>
}>()
/** The sort: ascending, descending, then null as a header is pressed. Leave it out and the table keeps its own. */
const sortModel = defineModel<TableSort | null | undefined>('sort', { default: undefined })
/** Ids of the selected rows. Leave it out and the table keeps its own. */
const selectedModel = defineModel<string[] | undefined>('selected', { default: undefined })
defineSlots<{ empty?: () => unknown }>()

const labels = computed<TableLabels>(() => ({
  selectAll: 'Select all rows',
  selectRow: (name) => `Select ${name}`,
  sortedBy: (column, direction) => `Sorted by ${column}, ${direction}`,
  unsorted: (column) => `No longer sorted by ${column}`,
  groupCount: (count) => `${count} ${count === 1 ? 'row' : 'rows'}`,
  loading: 'Loading rows',
  ...labelsProp,
}))
const id = useId()
const px = (v: number | string | undefined) => (typeof v === 'number' ? `${v}px` : v)

const sort = computed(() => (sortModel.value === undefined ? defaultSort : sortModel.value))
const selected = computed(() => selectedModel.value ?? defaultSelected)
const announce = ref('')

const scrollEl = ref<HTMLDivElement | null>(null)
const tableEl = ref<HTMLTableElement | null>(null)
const more = ref({ start: false, end: false })
const measure = () => {
  if (!scrollEl.value) return
  const { start, end } = scrollEdges(scrollEl.value)
  if (more.value.start !== start || more.value.end !== end) more.value = { start, end }
}
const reveal = (e: FocusEvent) => scrollEl.value && revealCell(scrollEl.value, e.target)
let ro: ResizeObserver | undefined

const sorted = computed(() => sortRows(rows, columns, sort.value))
const groupOrder: string[] = []
const groups = computed(() => (groupBy ? groupRows(rows, sorted.value, groupBy, groupOrder) : null))
const order = computed(() => (groups.value ? groups.value.map((g) => `${g.key}:${g.rows.map(getRowId).join(',')}`).join('|') : sorted.value.map(getRowId).join('|')))

// FLIP: rows glide to their new place after a sort or a regroup (motion/table.ts).
let lastTops = new Map<string, number>()
const flip = () => {
  if (!tableEl.value) return
  lastTops = flipRows(tableEl.value, lastTops)
}
watch(order, flip, { flush: 'post' })
onMounted(() => {
  flip()
  const el = scrollEl.value
  if (!el) return
  ro = new ResizeObserver(measure)
  ro.observe(el)
  if (el.firstElementChild) ro.observe(el.firstElementChild)
})
onBeforeUnmount(() => ro?.disconnect())

const labelOf = (c: TableColumn<T>) => c.label ?? (typeof c.header === 'string' ? c.header : c.key)

const toggleSort = (key: string) => {
  const next = nextSort(sort.value, key)
  sortModel.value = next
  const col = columns.find((c) => c.key === key)
  const name = col ? labelOf(col) : key
  announce.value = next ? labels.value.sortedBy(name, next.direction) : labels.value.unsorted(name)
}

const ids = computed(() => sorted.value.map(getRowId))
const selectedSet = computed(() => new Set(selected.value))
const allOn = computed(() => ids.value.length > 0 && ids.value.every((r) => selectedSet.value.has(r)))
const someOn = computed(() => !allOn.value && ids.value.some((r) => selectedSet.value.has(r)))
const scrollable = computed(() => Boolean(maxHeight) || more.value.start || more.value.end)
const nameOf = (row: T) => (rowLabel ? rowLabel(row) : String(read(row, columns[0]?.key ?? '') ?? getRowId(row)))
const colCount = computed(() => columns.length + (selectable ? 1 : 0))
const setRow = (rid: string, on: boolean) => (selectedModel.value = on ? [...selected.value, rid] : selected.value.filter((s) => s !== rid))
const setAll = (on: boolean) => (selectedModel.value = on ? Array.from(new Set([...selected.value, ...ids.value])) : selected.value.filter((s) => !ids.value.includes(s)))

// Keeps the entrance stagger going across groups.
const rowGroups = computed(() => {
  let i = 0
  const list = groups.value && groups.value.length > 0 ? groups.value : [{ key: '', rows: sorted.value }]
  return list.map((g) => ({ key: g.key, rows: g.rows.map((row) => ({ row, rid: getRowId(row), i: Math.min(i++, 12) })) }))
})
// Draws what a header or cell function returns.
const Out: FunctionalComponent<{ v: VNodeChild }> = (p) => p.v
</script>

<template>
  <div :class="styles.root" data-slot="table" :data-layout="layout" :data-more-start="more.start || undefined" :data-more-end="more.end || undefined">
    <div
      ref="scrollEl"
      :class="styles.scroll"
      data-slot="table-container"
      :style="{ maxHeight: px(maxHeight) }"
      :tabindex="scrollable ? 0 : undefined"
      :role="scrollable ? 'region' : undefined"
      :aria-labelledby="scrollable ? `${id}-cap` : undefined"
      @scroll="measure"
      @focusin="reveal"
    >
      <!-- Explicit roles keep table semantics when rows restyle as cards (layout="stack") -->
      <table ref="tableEl" role="table" :class="styles.table" data-slot="table-element" :aria-labelledby="`${id}-cap`" :aria-busy="loading || undefined">
        <caption :id="`${id}-cap`" :class="[styles.caption, hideCaption && styles.srOnly]" data-slot="table-caption">{{ caption }}</caption>
        <thead role="rowgroup" :class="styles.head" data-slot="table-header">
          <tr role="row">
            <th v-if="selectable" role="columnheader" scope="col" :class="styles.checkCell" data-slot="table-head">
              <span :class="styles.check" data-slot="table-checkbox">
                <input
                  data-slot="table-checkbox-input"
                  type="checkbox"
                  :aria-label="labels.selectAll"
                  :checked="allOn"
                  :indeterminate="someOn"
                  :disabled="loading"
                  :class="styles.checkInput"
                  @change="setAll(($event.target as HTMLInputElement).checked)"
                />
                <span :class="styles.checkBox" data-slot="table-checkbox-indicator" :data-state="someOn ? 'indeterminate' : allOn ? 'checked' : 'unchecked'" aria-hidden="true">
                  <svg viewBox="0 0 16 16"><path :class="styles.tick" d="M3.5 8.5l3 3 6-7" pathLength="1" /><path :class="styles.dash" d="M4 8h8" pathLength="1" /></svg>
                </span>
              </span>
            </th>
            <th
              v-for="c in columns"
              :key="c.key"
              role="columnheader"
              scope="col"
              :aria-sort="c.sortable ? (sort?.key === c.key ? sort.direction : 'none') : undefined"
              :class="styles.th"
              data-slot="table-head"
              :data-align="c.align ?? 'start'"
              :data-sortable="c.sortable || undefined"
              :style="{ width: px(c.width) }"
            >
              <button
                v-if="c.sortable"
                type="button"
                :class="styles.sortButton"
                data-slot="table-sort"
                :disabled="loading"
                :data-state="sort?.key === c.key ? 'active' : 'inactive'"
                @click="toggleSort(c.key)"
              >
                <span><Out :v="typeof c.header === 'string' ? c.header : c.header()" /></span>
                <svg viewBox="0 0 16 16" :class="styles.sortIcon" data-slot="table-sort-icon" :data-dir="sort?.key === c.key ? sort.direction : undefined" aria-hidden="true">
                  <path d="M8 12.5v-9M4.5 7L8 3.5 11.5 7" />
                </svg>
              </button>
              <Out v-else :v="typeof c.header === 'string' ? c.header : c.header()" />
            </th>
          </tr>
        </thead>
        <tbody v-if="loading" role="rowgroup" data-slot="table-body">
          <tr v-for="r in loadingRows" :key="r" aria-hidden="true" :class="[styles.row, styles.loadingRow]" data-slot="table-row">
            <td v-if="selectable" :class="styles.checkCell" data-slot="table-cell" />
            <td v-for="(c, i) in columns" :key="c.key" :class="styles.td" data-slot="table-cell" :data-align="c.align ?? 'start'" :data-label="labelOf(c)">
              <Skeleton shape="text" :width="`${[72, 56, 84][(r - 1 + i) % 3]}%`" />
            </td>
          </tr>
        </tbody>
        <template v-else>
          <tbody v-for="g in rowGroups" :key="g.key" role="rowgroup" data-slot="table-body" v-bind="groups && groups.length > 0 ? { class: styles.group } : {}">
            <tr v-if="groups && groups.length > 0" role="row" :data-row-id="`group:${g.key}`" :class="styles.groupRow" data-slot="table-group-row">
              <th role="rowheader" scope="rowgroup" :colspan="colCount" :class="styles.groupHead" data-slot="table-group-head">
                <span>{{ g.key }}</span>{{ ' ' }}<span :class="styles.groupCount" data-slot="table-group-count">{{ labels.groupCount(g.rows.length) }}</span>
              </th>
            </tr>
            <tr v-for="{ row, rid, i } in g.rows" :key="rid" role="row" :data-row-id="rid" :class="styles.row" data-slot="table-row" :data-selected="selectedSet.has(rid) || undefined" :style="{ '--i': i }">
              <td v-if="selectable" role="cell" :class="styles.checkCell" data-slot="table-cell">
                <span :class="styles.check" data-slot="table-checkbox">
                  <input
                    data-slot="table-checkbox-input"
                    type="checkbox"
                    :aria-label="labels.selectRow(nameOf(row))"
                    :checked="selectedSet.has(rid)"
                    :class="styles.checkInput"
                    @change="setRow(rid, ($event.target as HTMLInputElement).checked)"
                  />
                  <span :class="styles.checkBox" data-slot="table-checkbox-indicator" :data-state="selectedSet.has(rid) ? 'checked' : 'unchecked'" aria-hidden="true">
                    <svg viewBox="0 0 16 16"><path :class="styles.tick" d="M3.5 8.5l3 3 6-7" pathLength="1" /><path :class="styles.dash" d="M4 8h8" pathLength="1" /></svg>
                  </span>
                </span>
              </td>
              <td v-for="c in columns" :key="c.key" role="cell" :class="styles.td" data-slot="table-cell" :data-align="c.align ?? 'start'" :data-label="labelOf(c)">
                <!-- One wrapper, so the card layout always gets a label and a value -->
                <span><Out :v="c.cell ? c.cell(row) : String(read(row, c.key) ?? '')" /></span>
              </td>
            </tr>
            <tr v-if="!groups?.length && sorted.length === 0" role="row">
              <td role="cell" :colspan="colCount" :class="styles.empty" data-slot="table-empty"><slot name="empty">{{ emptyText }}</slot></td>
            </tr>
          </tbody>
        </template>
      </table>
    </div>
    <p :class="styles.srOnly" role="status">{{ announce }}</p>
    <p :class="styles.srOnly" role="status">{{ loading ? labels.loading : '' }}</p>
  </div>
</template>
