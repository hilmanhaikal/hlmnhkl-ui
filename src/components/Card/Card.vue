<script setup lang="ts">
import styles from './Card.module.css'

// The Vue Card: the same look (Card.module.css) as the React one. Other attributes go to the root.
const { padding = 'md' } = defineProps<{
  /** Heading at the top of the body, rendered as an h3. The title slot replaces it. */
  title?: string
  /** Muted text under the title. The description slot replaces it. */
  description?: string
  /** Lifts on hover. Use when the card holds a link or button that covers it. */
  interactive?: boolean
  /** Space inside the card. */
  padding?: 'md' | 'lg'
  /** Lets the body grow when the card is stretched (a grid cell or flex row), so the footer or a last button sits at the bottom. */
  fill?: boolean
}>()
/** media: shown above the body, edge to edge. footer: a row under the body, set apart by a border, such as actions. */
const slots = defineSlots<{ default?: () => unknown; title?: () => unknown; description?: () => unknown; media?: () => unknown; footer?: () => unknown }>()
</script>

<template>
  <div data-slot="card" :class="[styles.root, interactive && styles.interactive, styles[padding], fill && styles.fill]">
    <div v-if="slots.media" data-slot="card-media" :class="styles.media"><slot name="media" /></div>
    <div data-slot="card-body" :class="styles.body">
      <h3 v-if="title || slots.title" data-slot="card-title" :class="styles.title"><slot name="title">{{ title }}</slot></h3>
      <p v-if="description || slots.description" data-slot="card-description" :class="styles.description"><slot name="description">{{ description }}</slot></p>
      <slot />
    </div>
    <div v-if="slots.footer" data-slot="card-footer" :class="styles.footer"><slot name="footer" /></div>
  </div>
</template>
