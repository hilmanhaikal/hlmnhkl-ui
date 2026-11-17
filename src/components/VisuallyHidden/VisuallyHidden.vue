<script setup lang="ts">
import styles from './VisuallyHidden.module.css'

// The Vue VisuallyHidden: the same look (VisuallyHidden.module.css) as the React one.
withDefaults(
  defineProps<{
    /** Shows the content while something inside it has keyboard focus, such as a skip link. */
    focusable?: boolean
  }>(),
  { focusable: false },
)
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <span :class="focusable ? styles.focusable : styles.root"><slot /></span>
</template>
