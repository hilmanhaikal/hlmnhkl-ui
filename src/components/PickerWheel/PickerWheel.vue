<script setup lang="ts">
import { computed, ref, useId, useSlots, watch } from 'vue'
import { clamp } from '../../internal/feel'
import type { WheelColumn as PickerWheelColumn } from '../../internal/motion/pickerWheel'
import WheelColumn from './WheelColumn.vue'
import styles from './PickerWheel.module.css'

// The Vue PickerWheel: the same look (PickerWheel.module.css), drag, coast and landing as the React one.

export type { PickerWheelColumn }

const { columns, defaultValue, detail, haptics = false } = defineProps<{
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
}>()
const emit = defineEmits<{ /** Every column's row, once a column comes to rest on a new row. */ valueCommit: [value: number[]] }>()
const slots = useSlots()

/** The row of each column in the band, set each time a new row comes in while the wheel turns. Use v-model, or leave it out and the wheel keeps its own rows. */
const model = defineModel<number[]>()
const local = ref(defaultValue ?? columns.map(() => 0))
const raw = computed({
  get: () => model.value ?? local.value,
  set: (next: number[]) => {
    local.value = next
    model.value = next
  },
})

const labelId = useId()
const detailId = useId()
const value = computed(() => columns.map((c, i) => clamp(raw.value[i] ?? 0, 0, c.options.length - 1)))
const live = ref(value.value)
// The rows last told, so a row comes once whether it came while moving or at rest.
let told = value.value.join(',')
const tell = (rows: number[]) => {
  if (rows.join(',') === told) return
  told = rows.join(',')
  raw.value = rows
}
const onShown = (i: number, row: number) => {
  if (live.value[i] !== row) live.value = live.value.map((v, j) => (j === i ? row : v))
}
watch(
  () => live.value.join(','),
  () => tell(live.value),
)
const onCommit = (i: number, row: number) => {
  const next = live.value.map((v, j) => (j === i ? row : v))
  live.value = next
  tell(next)
  emit('valueCommit', next)
}
const hasDetail = computed(() => !!(detail || slots.detail))
</script>

<template>
  <div :class="styles.root" data-slot="picker-wheel">
    <div :class="styles.head">
      <span :id="labelId" :class="styles.label" data-slot="field-label">{{ label }}</span>
      <span v-if="formatValue" :class="styles.readout" data-slot="picker-wheel-value">{{ formatValue(live) }}</span>
      <span v-if="hasDetail" :id="detailId" :class="styles.detail" data-slot="picker-wheel-detail"><slot name="detail">{{ detail }}</slot></span>
    </div>
    <div :class="styles.wheel" data-slot="picker-wheel-columns" role="group" :aria-labelledby="labelId" :aria-describedby="hasDetail ? detailId : undefined">
      <WheelColumn v-for="(c, i) in columns" :key="i" :column="c" :index="value[i]" :haptics="haptics" @commit="onCommit(i, $event)" @shown="onShown(i, $event)" />
    </div>
  </div>
</template>
