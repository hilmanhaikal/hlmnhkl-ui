<script setup lang="ts">
import { computed, ref, useId, useSlots, watch } from 'vue'
import { clamp } from '../../internal/feel'
import type { WheelColumn as PickerWheelColumn } from '../../internal/motion/pickerWheel'
import WheelColumn from './WheelColumn.vue'
import styles from './PickerWheel.module.css'

// The Vue PickerWheel: the same look (PickerWheel.module.css), drag, coast and landing as the React one.

export type { PickerWheelColumn }

const props = withDefaults(
  defineProps<{
    /** Visible name of the whole wheel, read by screen readers as the group's name. */
    label: string
    /** The columns, left to right. */
    columns: PickerWheelColumn[]
    /** Starting rows when there is no v-model. Undefined starts on the first row of each. */
    defaultValue?: number[]
    /** Turns the rows into a large readout above the wheel. No readout when left out. */
    formatValue?: (value: number[]) => string
    /** A line under the label and readout, such as what the choice means. The detail slot replaces it. */
    detail?: string
    /** A short buzz on each row while it turns, on phones that can (Android). */
    haptics?: boolean
  }>(),
  { haptics: false },
)
const emit = defineEmits<{ /** The rows in the band while the wheel still turns. */ scrub: [value: number[]] }>()
const slots = useSlots()

/** The chosen row of each column, set once a column comes to rest. Use v-model, or leave it out and the wheel keeps its own rows. */
const model = defineModel<number[]>()
const local = ref(props.defaultValue ?? props.columns.map(() => 0))
const raw = computed({
  get: () => model.value ?? local.value,
  set: (next: number[]) => {
    local.value = next
    model.value = next
  },
})

const labelId = useId()
const detailId = useId()
const value = computed(() => props.columns.map((c, i) => clamp(raw.value[i] ?? 0, 0, c.options.length - 1)))
// The rows as last set, so two columns that settle at once both count.
let latest = value.value
watch(value, (v) => (latest = v), { flush: 'sync' })
const onChange = (i: number, row: number) => {
  if (latest[i] === row) return
  const next = latest.map((v, j) => (j === i ? row : v))
  latest = next
  raw.value = next
}
const live = ref(value.value)
const onShown = (i: number, row: number) => {
  if (live.value[i] !== row) live.value = live.value.map((v, j) => (j === i ? row : v))
}
watch(
  () => live.value.join(','),
  () => emit('scrub', live.value),
)
const hasDetail = computed(() => !!(props.detail || slots.detail))
</script>

<template>
  <div :class="styles.root">
    <div :class="styles.head">
      <span :id="labelId" :class="styles.label">{{ label }}</span>
      <span v-if="formatValue" :class="styles.readout">{{ formatValue(live) }}</span>
      <span v-if="hasDetail" :id="detailId" :class="styles.detail"><slot name="detail">{{ detail }}</slot></span>
    </div>
    <div :class="styles.wheel" role="group" :aria-labelledby="labelId" :aria-describedby="hasDetail ? detailId : undefined">
      <WheelColumn v-for="(c, i) in columns" :key="i" :column="c" :index="value[i]" :haptics="haptics" @change="onChange(i, $event)" @shown="onShown(i, $event)" />
    </div>
  </div>
</template>
