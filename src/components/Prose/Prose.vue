<script setup lang="ts">
import styles from './Prose.module.css'

// The Vue Prose: the same look (Prose.module.css) as the React one. It styles the plain HTML inside it,
// so Markdown or CMS HTML can go in with v-html, or as the default slot.
const { as = 'div' } = defineProps<{
  /** The element to render, such as article. */
  as?: string
}>()
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <component :is="as" :class="styles.root" data-slot="prose"><slot /></component>
</template>
