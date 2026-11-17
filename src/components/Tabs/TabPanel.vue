<script setup lang="ts">
import { computed } from 'vue'
import { safe, useTabs } from './tabsContext'
import styles from './Tabs.module.css'

const props = defineProps<{
  /** Shows this panel when the Tab with the same value is selected. Its content mounts only then. */
  value: string
}>()

const ctx = useTabs()
const on = computed(() => ctx.value.value === props.value)
</script>

<template>
  <div
    :id="`${ctx.baseId}-panel-${safe(value)}`"
    role="tabpanel"
    :aria-labelledby="`${ctx.baseId}-tab-${safe(value)}`"
    :hidden="!on"
    :tabindex="0"
    :class="styles.panel"
  >
    <slot v-if="on" />
  </div>
</template>
