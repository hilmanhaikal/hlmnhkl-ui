<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ChevronRightIcon } from '../../internal/vueIcons'
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

const props = withDefaults(
  defineProps<{
    /** Path from the top level down. The last item is the current page. */
    items: BreadcrumbItem[]
    /** Above this many items, the middle collapses into a "…" button. With 2 or less, only "…" and the current page show. */
    maxItems?: number
    /** Name of the nav landmark. */
    label?: string
    /** Screen reader name for the "…" button. */
    expandLabel?: string
  }>(),
  { maxItems: 4, label: 'Breadcrumb', expandLabel: 'Show full path' },
)

const expanded = ref(false)
const list = ref<HTMLOListElement | null>(null)
// Under 3 there is no room for the first item, so only "…" and the current page stay.
const head = computed(() => (props.maxItems < 3 ? 0 : 1))
const visible = computed(() => {
  const tail = Math.max(1, props.maxItems - head.value - 1)
  return !expanded.value && props.items.length > props.maxItems ? [...props.items.slice(0, head.value), null, ...props.items.slice(-tail)] : props.items
})

// The "…" button is gone after expanding, so focus moves to the first link it revealed.
watch(expanded, (on) => {
  if (on) nextTick(() => list.value?.querySelector<HTMLElement>(`:scope > li:nth-child(${head.value + 1}) > :is(a, button)`)?.focus())
})
</script>

<template>
  <nav :aria-label="label" :class="styles.root">
    <ol ref="list" :class="styles.list">
      <li v-for="(item, i) in visible" :key="item ? `${item.label}-${i}` : 'more'" :class="styles.item" :style="{ '--i': i }" :data-revealed="expanded || undefined">
        <button v-if="item === null" type="button" :class="styles.more" :aria-label="expandLabel" @click="expanded = true">…</button>
        <span v-else-if="i === visible.length - 1" :class="styles.current" aria-current="page" :title="item.label">{{ item.label }}</span>
        <button v-else-if="item.href === undefined" type="button" :class="[styles.link, styles.button]" :title="item.label" @click="item.onClick?.($event)">{{ item.label }}</button>
        <a v-else :class="styles.link" :href="item.href" :title="item.label" @click="item.onClick?.($event)">{{ item.label }}</a>
        <ChevronRightIcon v-if="i !== visible.length - 1" :class="styles.sep" />
      </li>
    </ol>
  </nav>
</template>
