<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { markRows } from '../../internal/motion/buttonGroup'
import styles from './ButtonGroup.module.css'

// The Vue ButtonGroup: the same look (ButtonGroup.module.css) as the React one. The buttons go in the default slot.
const props = withDefaults(
  defineProps<{
    /** Accessible name for the group, such as "Text alignment". */
    label: string
    /** A row, or a column where each button takes the full width. */
    orientation?: 'horizontal' | 'vertical'
  }>(),
  { orientation: 'horizontal' },
)

const root = ref<HTMLElement | null>(null)
let stop: (() => void) | undefined
// Each wrapped row keeps round ends of its own (motion/buttonGroup.ts).
const watchRows = () => {
  stop?.()
  stop = root.value && props.orientation === 'horizontal' ? markRows(root.value) : undefined
}
onMounted(watchRows)
watch(() => props.orientation, watchRows, { flush: 'post' })
onBeforeUnmount(() => stop?.())
</script>

<template>
  <div ref="root" role="group" :aria-label="label" :class="[styles.root, styles[orientation]]" :data-orientation="orientation">
    <slot />
  </div>
</template>
