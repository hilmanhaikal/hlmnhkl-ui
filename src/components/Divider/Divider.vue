<script setup lang="ts">
import styles from './Divider.module.css'

// The Vue Divider: the same look (Divider.module.css) as the React one.
withDefaults(
  defineProps<{
    /** Direction of the line. A vertical line stretches to the height of its flex row. */
    orientation?: 'horizontal' | 'vertical'
    /** Text in the middle of a horizontal line, such as "or". The label slot replaces it. */
    label?: string
    /** Draws the line in from the centre when it mounts. */
    animated?: boolean
  }>(),
  { orientation: 'horizontal', animated: true },
)
const slots = defineSlots<{ label?: () => unknown }>()
</script>

<template>
  <!-- A separator hides its children, so the role sits on the lines and the label is still read. -->
  <div v-if="(label || slots.label) && orientation === 'horizontal'" :class="[styles.labelled, animated && styles.animated]">
    <span :class="styles.line" role="separator" aria-orientation="horizontal" />
    <span :class="styles.text"><slot name="label">{{ label }}</slot></span>
    <span :class="styles.line" role="separator" aria-orientation="horizontal" />
  </div>
  <div v-else role="separator" :aria-orientation="orientation" :class="[styles.root, styles[orientation], animated && styles.animated]" />
</template>
