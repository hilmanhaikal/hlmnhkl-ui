<script setup lang="ts">
import styles from './AspectRatio.module.css'

// The Vue AspectRatio: the same look (AspectRatio.module.css) as the React one. The child fills the box.
const { ratio = 16 / 9 } = defineProps<{
  /** Width over height, such as 16 / 9, "16 / 9" or 1 for a square. */
  ratio?: number | string
}>()
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <div data-slot="aspect-ratio" :class="styles.root" :style="{ '--ratio': ratio }"><slot /></div>
</template>
