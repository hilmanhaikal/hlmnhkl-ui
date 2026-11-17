<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createScrollArea } from '../../internal/motion/scrollArea'
import styles from './ScrollArea.module.css'

// The Vue ScrollArea: the same look (ScrollArea.module.css) and drawn scrollbar as the React one.

const props = withDefaults(
  defineProps<{
    /** Name of the scrollable region. Required, because the region takes keyboard focus. */
    label: string
    /** A number in pixels, or any CSS length such as "50vh". */
    maxHeight?: number | string
    /** Which ways the content can scroll, and which scrollbars show. */
    orientation?: 'vertical' | 'horizontal' | 'both'
  }>(),
  { orientation: 'vertical' },
)
defineSlots<{ default?: () => unknown }>()

const root = ref<HTMLElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const thumbY = ref<HTMLElement | null>(null)
const thumbX = ref<HTMLElement | null>(null)
const axes = computed(() => [props.orientation !== 'horizontal' && ('y' as const), props.orientation !== 'vertical' && ('x' as const)].filter((a) => a !== false))
const height = computed(() => (typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight))

// The thumbs, their idle fade and drags (motion/scrollArea.ts): direct style writes, so scrolling never re-renders.
const area = createScrollArea({ root: () => root.value, viewport: () => viewport.value, thumb: (axis) => (axis === 'y' ? thumbY.value : thumbX.value) })
let stop = () => {}
onMounted(() => (stop = area.observe()))
onBeforeUnmount(() => {
  stop()
  area.destroy()
})
const setThumb = (axis: 'x' | 'y') => (el: unknown) => {
  if (axis === 'y') thumbY.value = el as HTMLElement | null
  else thumbX.value = el as HTMLElement | null
}
</script>

<template>
  <div ref="root" :class="styles.root" :data-orientation="orientation" @pointerenter="area.wake" @pointermove="area.wake">
    <div ref="viewport" :class="styles.viewport" :style="{ maxHeight: height }" role="region" :aria-label="label" tabindex="0" @scroll="area.onScroll">
      <div :class="styles.content"><slot /></div>
    </div>
    <div v-for="axis in axes" :key="axis" :class="styles.track" :data-axis="axis" aria-hidden="true" @pointerdown="area.trackDown(axis, $event)">
      <div
        :ref="setThumb(axis)"
        :class="styles.thumb"
        @pointerdown="area.thumbDown(axis, $event)"
        @pointermove="area.thumbMove"
        @pointerup="area.thumbUp"
        @pointercancel="area.thumbUp"
      />
    </div>
  </div>
</template>
