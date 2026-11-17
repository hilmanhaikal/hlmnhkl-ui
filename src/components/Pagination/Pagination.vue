<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '../../internal/vueIcons'
import { pageRange } from './range'
import styles from './Pagination.module.css'

// The Vue Pagination: the same look (Pagination.module.css) and gliding pill as the React one.

const props = withDefaults(
  defineProps<{
    /** Total number of pages. Pages count from 1. */
    pageCount: number
    /** Starting page when there is no v-model:page. */
    defaultPage?: number
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
  }>(),
  { defaultPage: 1, siblings: 1, label: 'Pagination', previousLabel: 'Previous page', nextLabel: 'Next page', pageLabel: (p: number) => `Page ${p}` },
)

/** Current page, counting from 1. Use v-model:page, or leave it out and the part keeps its own state. */
const model = defineModel<number | undefined>('page', { default: undefined })
const local = ref(props.defaultPage)
// A stored page can sit past the end after pageCount drops.
const page = computed(() => Math.min(Math.max(model.value ?? local.value, 1), Math.max(props.pageCount, 1)))
const pages = computed(() => pageRange(page.value, props.pageCount, props.siblings))

const list = ref<HTMLUListElement | null>(null)
const pill = ref<{ x: number; w: number } | null>(null)
const ready = ref(false)

const measure = () => {
  const el = list.value?.querySelector<HTMLElement>('[aria-current="page"]')
  pill.value = el ? { x: el.offsetLeft, w: el.offsetWidth } : null
}
// Keeps the current page in view when the list scrolls on a narrow screen.
const center = () => {
  const el = list.value?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!list.value || !el || list.value.scrollWidth <= list.value.clientWidth) return
  list.value.scrollLeft = el.offsetLeft - (list.value.clientWidth - el.offsetWidth) / 2
}
let ro: ResizeObserver | null = null
onMounted(() => {
  measure()
  center()
  requestAnimationFrame(() => (ready.value = true))
  ro = new ResizeObserver(measure)
  if (list.value) ro.observe(list.value)
})
watch([page, () => props.pageCount, () => props.siblings], () => (measure(), center()), { flush: 'post' })
onBeforeUnmount(() => ro?.disconnect())

const go = (p: number) => {
  const next = Math.min(Math.max(p, 1), props.pageCount)
  if (next === page.value) return
  local.value = next
  model.value = next
}
</script>

<template>
  <nav :aria-label="label" :class="styles.root">
    <button type="button" :class="[styles.btn, styles.edge]" :aria-label="previousLabel" :disabled="page <= 1" @click="go(page - 1)">
      <ChevronLeftIcon />
    </button>
    <ul ref="list" :class="styles.list">
      <li v-if="pill" aria-hidden="true" :class="styles.pill" :data-ready="ready || undefined" :style="{ transform: `translateX(${pill.x}px)`, width: `${pill.w}px` }" />
      <template v-for="(p, i) in pages" :key="p === 'gap' ? `gap-${i}` : p">
        <li v-if="p === 'gap'" :class="styles.gap" aria-hidden="true">…</li>
        <li v-else>
          <button type="button" :class="styles.btn" :aria-label="pageLabel(p)" :aria-current="p === page ? 'page' : undefined" @click="go(p)">{{ p }}</button>
        </li>
      </template>
    </ul>
    <button type="button" :class="[styles.btn, styles.edge]" :aria-label="nextLabel" :disabled="page >= pageCount" @click="go(page + 1)">
      <ChevronRightIcon />
    </button>
  </nav>
</template>
