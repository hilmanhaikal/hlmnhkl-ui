<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ChevronRightIcon } from '../../icons/vue'
import styles from './Breadcrumb.module.css'

// The Vue Breadcrumb: the same look (Breadcrumb.module.css) and unfold as the React one.

export type BreadcrumbItem = {
  /** Text of the item. */
  label: string
  /** Where the link goes. Without it, the item is a button. */
  href?: string
  /** Called on click with the event, so a link can call preventDefault for client routing. */
  onClick?: (event: MouseEvent) => void
}

export type BreadcrumbLabels = {
  /** Name of the "…" button. */
  expand: string
}

const {
  items,
  maxItems = 4,
  label = 'Breadcrumb',
  labels,
} = defineProps<{
  /** Path from the top level down. The last item is the current page. */
  items: BreadcrumbItem[]
  /** Above this many items, the middle collapses into a "…" button. With 2 or less, only "…" and the current page show. */
  maxItems?: number
  /** Name of the nav landmark. */
  label?: string
  /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<BreadcrumbLabels>
}>()
const text = computed(() => ({ expand: 'Show full path', ...labels }))

const expanded = ref(false)
const list = ref<HTMLOListElement | null>(null)
// Under 3 there is no room for the first item, so only "…" and the current page stay.
const head = computed(() => (maxItems < 3 ? 0 : 1))
const visible = computed(() => {
  const tail = Math.max(1, maxItems - head.value - 1)
  return !expanded.value && items.length > maxItems ? [...items.slice(0, head.value), null, ...items.slice(-tail)] : items
})

// The "…" button is gone after expanding, so focus moves to the first link it revealed.
watch(expanded, (on) => {
  if (on) nextTick(() => list.value?.querySelector<HTMLElement>(`:scope > li:nth-child(${head.value + 1}) > :is(a, button)`)?.focus())
})
</script>

<template>
  <nav :aria-label="label" data-slot="breadcrumb" :class="styles.root">
    <ol ref="list" data-slot="breadcrumb-list" :class="styles.list">
      <li v-for="(item, i) in visible" :key="item ? `${item.label}-${i}` : 'more'" data-slot="breadcrumb-item" :class="styles.item" :style="{ '--i': i }" :data-revealed="expanded || undefined">
        <button v-if="item === null" type="button" data-slot="breadcrumb-more" :class="styles.more" :aria-label="text.expand" @click="expanded = true">…</button>
        <span v-else-if="i === visible.length - 1" data-slot="breadcrumb-current" :class="styles.current" aria-current="page" :title="item.label">{{ item.label }}</span>
        <button v-else-if="item.href === undefined" type="button" data-slot="breadcrumb-link" :class="[styles.link, styles.button]" :title="item.label" @click="item.onClick?.($event)">{{ item.label }}</button>
        <a v-else data-slot="breadcrumb-link" :class="styles.link" :href="item.href" :title="item.label" @click="item.onClick?.($event)">{{ item.label }}</a>
        <ChevronRightIcon v-if="i !== visible.length - 1" data-slot="breadcrumb-separator" :class="styles.sep" />
      </li>
    </ol>
  </nav>
</template>
