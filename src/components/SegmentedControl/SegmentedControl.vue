<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { createFlow } from '../../internal/motion/liquidMatter'
import { measureSegments, segmentInk, segmentKey } from '../../internal/motion/segmented'
import styles from './SegmentedControl.module.css'

// The Vue SegmentedControl: the same look (SegmentedControl.module.css), flowing pill and keys as the React one.

export type SegmentedControlOption = { value: string; label: string; icon?: Component; disabled?: boolean; ariaLabel?: string }

const { options, size = 'md' } = defineProps<{
  /** Accessible name for the group. */
  label: string
  /** The segments, in order. */
  options: SegmentedControlOption[]
  /** Height and text size of the segments. */
  size?: 'sm' | 'md'
  /** Stretches the control to fill its container, with equal segments. */
  fullWidth?: boolean
}>()

/** The selected value. Use v-model, or leave it out and the first option starts selected. */
const model = defineModel<string>()
const local = ref(options[0]?.value ?? '')
const value = computed({
  get: () => model.value ?? local.value,
  set: (next: string) => {
    local.value = next
    model.value = next
  },
})

const root = ref<HTMLElement | null>(null)
const items = ref<Array<HTMLElement | null>>([])
const pillEl = ref<HTMLElement | null>(null)
const pill = ref<{ x: number; w: number } | null>(null)
const ready = ref(false)
const index = computed(() => options.findIndex((o) => o.value === value.value))
// With no match, the first enabled segment takes the tab stop.
const tabStop = computed(() => (index.value >= 0 && !options[index.value].disabled ? index.value : options.findIndex((o) => !o.disabled)))

const measure = () => {
  const place = measureSegments(root.value, items.value[index.value])
  if (place) pill.value = place
}
let ro: ResizeObserver | null = null
onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  if (root.value) ro.observe(root.value)
  requestAnimationFrame(() => (ready.value = true))
})
watch([index, () => options.length], measure, { flush: 'post' })

// The pill flows to the new choice (motion/liquidMatter.ts); the labels under it take the chosen colour.
const flow = createFlow(() => pillEl.value, { host: () => root.value, className: styles.liquid, ink: segmentInk(() => root.value, () => items.value, styles.ink) })
watch(
  () => [index.value, pill.value?.x, pill.value?.w, ready.value] as const,
  () => nextTick(() => flow.update(pill.value, index.value, ready.value)),
  { flush: 'post', immediate: true },
)
onBeforeUnmount(() => {
  ro?.disconnect()
  flow.destroy()
})

const onKeyDown = (e: KeyboardEvent) => {
  const next = segmentKey(e.key, tabStop.value, options.map((o) => !!o.disabled))
  if (next < 0) return
  e.preventDefault()
  value.value = options[next].value
  items.value[next]?.focus()
}
</script>

<template>
  <div ref="root" role="radiogroup" :aria-label="label" :class="[styles.root, styles[size], fullWidth && styles.full]" data-slot="segmented-control" @keydown="onKeyDown">
    <span
      v-if="pill"
      ref="pillEl"
      :class="styles.pill"
      data-slot="segmented-control-indicator"
      :data-ready="ready || undefined"
      :style="{ transform: `translateX(${pill.x}px)`, width: `${pill.w}px` }"
      aria-hidden="true"
    />
    <button
      v-for="(o, i) in options"
      :key="o.value"
      :ref="(el) => (items[i] = el as HTMLElement | null)"
      type="button"
      role="radio"
      :aria-checked="o.value === value"
      :aria-label="o.ariaLabel"
      :tabindex="i === tabStop ? 0 : -1"
      :disabled="o.disabled"
      :class="styles.item"
      data-slot="segmented-control-item"
      :data-state="o.value === value ? 'active' : 'inactive'"
      :data-disabled="o.disabled || undefined"
      @click="value = o.value"
    >
      <span v-if="o.icon" :class="styles.icon" data-slot="segmented-control-icon"><component :is="o.icon" /></span>
      <span v-if="o.label" :class="styles.text" data-slot="segmented-control-label">{{ o.label }}</span>
    </button>
  </div>
</template>
