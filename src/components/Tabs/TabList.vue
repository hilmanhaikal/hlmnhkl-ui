<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue'
import { createTabsRise, measureTab, setTabStop, tabKey, type TabBar } from '../../internal/motion/tabs'
import { useTabs } from './tabsContext'
import styles from './Tabs.module.css'

defineProps<{
  /** Screen reader name for the row of tabs. */
  label: string
}>()

const { value } = useTabs()
const list = ref<HTMLElement | null>(null)
const riseEl = ref<HTMLElement | null>(null)
const bar = ref<TabBar | null>(null)

const measure = () => {
  const next = list.value && measureTab(list.value, value.value)
  if (next) bar.value = next
}
let ro: ResizeObserver | null = null
onMounted(() => {
  measure()
  setTabStop(list.value)
  ro = new ResizeObserver(measure)
  if (list.value) ro.observe(list.value)
})
onUpdated(() => setTabStop(list.value))
watch(value, () => nextTick(() => (measure(), setTabStop(list.value))))

// The rise stretches over to a new choice (motion/tabs.ts).
const rise = createTabsRise()
watch(bar, (b) => rise.place(riseEl.value, b), { flush: 'post' })
onBeforeUnmount(() => {
  ro?.disconnect()
  rise.destroy()
})
</script>

<template>
  <div :class="styles.listScroll">
    <div ref="list" role="tablist" :aria-label="label" :class="styles.list" @keydown="tabKey(list, $event)">
      <slot />
      <span v-if="bar" ref="riseEl" :class="styles.rise" aria-hidden="true" />
    </div>
  </div>
</template>
