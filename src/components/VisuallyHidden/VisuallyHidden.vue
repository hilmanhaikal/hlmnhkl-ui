<script setup lang="ts">
import styles from './VisuallyHidden.module.css'

// The Vue VisuallyHidden: the same look (VisuallyHidden.module.css) as the React one.
const { focusable = false } = defineProps<{
  /** Shows the content while something inside it has keyboard focus, such as a skip link. */
  focusable?: boolean
}>()
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <span :class="focusable ? styles.focusable : styles.root" data-slot="visually-hidden"><slot /></span>
</template>
