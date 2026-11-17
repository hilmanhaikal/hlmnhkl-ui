<script setup lang="ts">
import styles from './AspectRatio.module.css'

// The Vue AspectRatio: the same look (AspectRatio.module.css) as the React one. The child fills the box.
withDefaults(
  defineProps<{
    /** Width over height, such as 16 / 9 or 1 for a square. */
    ratio?: number
  }>(),
  { ratio: 16 / 9 },
)
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <div :class="styles.root" :style="{ '--ratio': ratio }"><slot /></div>
</template>
