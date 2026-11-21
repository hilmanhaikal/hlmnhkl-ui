<script setup lang="ts">
import { computed, useId } from 'vue'
import styles from './ProgressBar.module.css'

// The Vue ProgressBar: the same look (ProgressBar.module.css) as the React one.
const {
  value,
  max = 100,
  showValue = true,
  size = 'md',
} = defineProps<{
  /** Says what is in progress. Shown above the bar and read by screen readers. */
  label: string
  /** 0 to max. Leave it out for an indeterminate bar. */
  value?: number
  /** The value that means done. */
  max?: number
  /** Shows the percentage next to the label. */
  showValue?: boolean
  /** Hides the label visually but keeps it for screen readers. */
  hideLabel?: boolean
  /** Thickness of the bar. */
  size?: 'sm' | 'md'
}>()

const id = useId()
const determinate = computed(() => value !== undefined)
const ratio = computed(() => (value !== undefined ? Math.min(Math.max(value / max, 0), 1) : 0))
const now = computed(() => (value !== undefined ? Math.min(Math.max(value, 0), max) : undefined))
</script>

<template>
  <div :class="styles.root" data-slot="progress-bar">
    <div :class="[styles.head, hideLabel && styles.srOnly]">
      <span :id="id" :class="styles.label" data-slot="progress-bar-label">{{ label }}</span>
      <span v-if="determinate && showValue" :class="styles.value" data-slot="progress-bar-value" aria-hidden="true">{{ Math.round(ratio * 100) }}%</span>
    </div>
    <div
      role="progressbar"
      :aria-labelledby="id"
      :aria-valuemin="determinate ? 0 : undefined"
      :aria-valuemax="determinate ? max : undefined"
      :aria-valuenow="now"
      :class="[styles.track, styles[size]]"
      data-slot="progress-bar-track"
      :data-status="!determinate ? 'indeterminate' : ratio >= 1 ? 'complete' : 'loading'"
    >
      <span :class="styles.fill" data-slot="progress-bar-indicator" :style="determinate ? { transform: `scaleX(${ratio})` } : undefined" />
    </div>
  </div>
</template>
