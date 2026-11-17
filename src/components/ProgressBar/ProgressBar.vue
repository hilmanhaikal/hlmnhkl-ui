<script setup lang="ts">
import { computed, useId } from 'vue'
import styles from './ProgressBar.module.css'

// The Vue ProgressBar: the same look (ProgressBar.module.css) as the React one.
const props = withDefaults(
  defineProps<{
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
  }>(),
  { max: 100, showValue: true, size: 'md' },
)

const id = useId()
const determinate = computed(() => props.value !== undefined)
const ratio = computed(() => (props.value !== undefined ? Math.min(Math.max(props.value / props.max, 0), 1) : 0))
const now = computed(() => (props.value !== undefined ? Math.min(Math.max(props.value, 0), props.max) : undefined))
</script>

<template>
  <div :class="styles.root">
    <div :class="[styles.head, hideLabel && styles.srOnly]">
      <span :id="id" :class="styles.label">{{ label }}</span>
      <span v-if="determinate && showValue" :class="styles.value" aria-hidden="true">{{ Math.round(ratio * 100) }}%</span>
    </div>
    <div
      role="progressbar"
      :aria-labelledby="id"
      :aria-valuemin="determinate ? 0 : undefined"
      :aria-valuemax="determinate ? max : undefined"
      :aria-valuenow="now"
      :class="[styles.track, styles[size]]"
      :data-indeterminate="!determinate || undefined"
    >
      <span :class="styles.fill" :style="determinate ? { transform: `scaleX(${ratio})` } : undefined" />
    </div>
  </div>
</template>
