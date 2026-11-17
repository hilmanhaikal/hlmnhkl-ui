<script setup lang="ts">
import { Comment, Text, useAttrs, type VNode } from 'vue'
import styles from './Badge.module.css'

// The Vue Badge: the same look (Badge.module.css) as the React one. Other attributes go to the root.
withDefaults(
  defineProps<{
    /** Visual weight: filled, outlined or a soft tint. */
    variant?: 'solid' | 'outline' | 'subtle'
    /** Status colour. Use it only for a real status, and keep a word in the badge. */
    tone?: 'neutral' | 'success' | 'warning' | 'danger'
    /** A small dot before the text. "pulse" makes it breathe, for live states. */
    dot?: boolean | 'pulse'
  }>(),
  { variant: 'subtle', tone: 'neutral', dot: false },
)
const slots = defineSlots<{ default?: () => VNode[] }>()
const attrs = useAttrs()

const plain = () => {
  const nodes = (slots.default?.() ?? []).filter((n) => n.type !== Comment)
  return nodes.length && nodes.every((n) => n.type === Text) ? nodes.map((n) => String(n.children)).join('') : undefined
}
</script>

<template>
  <span :class="[styles.root, styles[variant]]" :data-tone="tone === 'neutral' ? undefined : tone">
    <span v-if="dot" :class="styles.dot" :data-pulse="dot === 'pulse' || undefined" aria-hidden="true" />
    <!-- Keyed on content, so a new value pops in instead of swapping silently. -->
    <span :key="plain()" :class="styles.text" :title="attrs.title ? undefined : plain()"><slot /></span>
  </span>
</template>
