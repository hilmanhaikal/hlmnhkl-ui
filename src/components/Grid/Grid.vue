<script setup lang="ts">
import { computed } from 'vue'
import { space, type Space } from '../../internal/space'
import styles from './Grid.module.css'

// The Vue Grid: the same look (Grid.module.css) as the React one. Other attributes go to the element.
const {
  columns,
  min: minProp,
  gap = 5,
  as = 'div',
  steps = 'all',
} = defineProps<{
  /** Fixed number of columns. With min, it becomes the most columns the grid may show. */
  columns?: number
  /** Narrowest a cell may get before a column drops: a token size or any CSS length. Defaults to "md" when columns is not set. */
  min?: 'xs' | 'sm' | 'md' | 'lg' | (string & {})
  /** Space between cells, as a step of the space scale (0 to 12, read as --gooee-space-N). */
  gap?: Space
  /** Element to render, so a set of cards can be a list. */
  as?: 'div' | 'section' | 'ul' | 'ol'
  /** With columns and min: "halves" steps from columns to half of it, then to one (4, 2, 1), so no card is left alone on a row. */
  steps?: 'all' | 'halves'
}>()
defineSlots<{ default?: () => unknown }>()

const tokenSizes = ['xs', 'sm', 'md', 'lg']
const vars = computed(() => {
  const min = minProp ?? 'md'
  return {
    '--grid-gap': space(gap),
    '--grid-cols': columns,
    '--grid-half': columns ? Math.max(1, Math.floor(columns / 2)) : undefined,
    '--grid-min': tokenSizes.includes(min) ? `var(--gooee-grid-min-${min})` : min,
  }
})
const kind = computed(() => {
  const fit = minProp !== undefined || columns === undefined
  if (!fit) return styles.fixed
  return !columns ? styles.fit : steps === 'halves' ? styles.halves : styles.capped
})
</script>

<template>
  <component :is="as" data-slot="grid" :class="[styles.root, kind]" :style="vars"><slot /></component>
</template>
