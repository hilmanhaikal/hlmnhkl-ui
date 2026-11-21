<script setup lang="ts">
import { computed } from 'vue'
import { revealTab } from '../../internal/motion/tabs'
import { safe, useTabs } from './tabsContext'
import styles from './Tabs.module.css'

const props = defineProps<{
  /** Picks this tab. Must match the value of its TabPanel. */
  value: string
  /** Stops the tab from being picked. Arrow keys skip it. */
  disabled?: boolean
}>()

const ctx = useTabs()
const on = computed(() => ctx.value.value === props.value)
const id = computed(() => `${ctx.baseId}-tab-${safe(props.value)}`)
const pick = () => {
  ctx.set(props.value)
  revealTab(id.value)
}
</script>

<template>
  <button
    :id="id"
    type="button"
    role="tab"
    :aria-selected="on"
    :aria-controls="`${ctx.baseId}-panel-${safe(value)}`"
    :tabindex="on ? 0 : -1"
    :disabled="disabled"
    :class="styles.tab"
    data-slot="tabs-trigger"
    :data-state="on ? 'active' : 'inactive'"
    :data-disabled="disabled || undefined"
    @click="pick"
  >
    <slot />
  </button>
</template>
