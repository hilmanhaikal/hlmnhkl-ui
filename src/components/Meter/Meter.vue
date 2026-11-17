<script setup lang="ts">
import { computed, useId } from 'vue'
import { CheckCircleIcon, ErrorIcon, WarningIcon } from '../../internal/vueIcons'
import styles from './Meter.module.css'

// The Vue Meter: the same look (Meter.module.css) and tones as the React one.
export type MeterTone = 'good' | 'fair' | 'poor'
export type MeterLabels = Record<MeterTone, string>

const props = withDefaults(
  defineProps<{
    /** Says what is measured. Shown above the bar and read by screen readers. */
    label: string
    /** The measurement, from min to max. */
    value: number
    /** Lowest possible value. */
    min?: number
    /** Highest possible value. */
    max?: number
    /** Top of the low range, as in the HTML meter. Set low or high to turn the tones on. */
    low?: number
    /** Bottom of the high range, as in the HTML meter. */
    high?: number
    /** The best value. The range it falls in is good, the next is fair, the far one poor. Left out, it is the middle. */
    optimum?: number
    /** Shown and spoken instead of the percentage, such as "72 GB of 100 GB". */
    valueText?: string
    /** Shows the value next to the label. */
    showValue?: boolean
    /** Hides the label visually but keeps it for screen readers. */
    hideLabel?: boolean
    /** Thickness of the bar. */
    size?: 'sm' | 'md'
    /** Words for each tone, shown with its icon and spoken with the value. Missing keys use the English defaults. */
    labels?: Partial<MeterLabels>
  }>(),
  { min: 0, max: 100, showValue: true, size: 'md' },
)

const defaultLabels: MeterLabels = { good: 'Good', fair: 'Fair', poor: 'Poor' }
const icons = { good: CheckCircleIcon, fair: WarningIcon, poor: ErrorIcon }
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)

// The HTML meter's rule: how many ranges lie between the value and the optimum.
function toneOf(value: number, min: number, max: number, low?: number, high?: number, optimum?: number): MeterTone | undefined {
  if (low === undefined && high === undefined) return undefined
  const lo = clamp(low ?? min, min, max)
  const hi = clamp(high ?? max, lo, max)
  const range = (n: number) => (n < lo ? 0 : n > hi ? 2 : 1)
  const steps = Math.abs(range(value) - range(clamp(optimum ?? (min + max) / 2, min, max)))
  return steps === 0 ? 'good' : steps === 1 ? 'fair' : 'poor'
}

const id = useId()
const words = computed(() => ({ ...defaultLabels, ...props.labels }))
const now = computed(() => clamp(props.value, props.min, props.max))
const at = (n: number) => (clamp(n, props.min, props.max) - props.min) / (props.max - props.min || 1)
const tone = computed(() => toneOf(now.value, props.min, props.max, props.low, props.high, props.optimum))
const text = computed(() => props.valueText ?? `${Math.round(at(now.value) * 100)}%`)
const marks = computed(() => [props.low, props.high].filter((n): n is number => n !== undefined && n > props.min && n < props.max))
</script>

<template>
  <div :class="styles.root" :data-tone="tone">
    <div :class="styles.head">
      <span :id="id" :class="[styles.label, hideLabel && styles.srOnly]">{{ label }}</span>
      <span :class="styles.reading" aria-hidden="true">
        <span v-if="showValue" :class="styles.value">{{ text }}</span>
        <span v-if="tone" :class="styles.tone">
          <component :is="icons[tone]" :class="styles.icon" />
          {{ words[tone] }}
        </span>
      </span>
    </div>
    <div
      role="meter"
      :aria-labelledby="id"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="now"
      :aria-valuetext="tone ? `${text}, ${words[tone]}` : text"
      :class="[styles.track, styles[size]]"
    >
      <span :class="styles.fill" :style="{ transform: `scaleX(${at(now)})` }" />
      <span v-for="n in marks" :key="n" :class="styles.mark" :style="{ left: `${at(n) * 100}%` }" />
    </div>
  </div>
</template>
