<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { dateWheel, today } from '../../internal/motion/pickerWheel'
import PickerWheel from './PickerWheel.vue'

// PickerWheel set up for a date: day, month and year, with each month's real length (the Vue DateWheel).
// Other props (detail, haptics) go to the PickerWheel.

const props = defineProps<{
  /** Visible name of the whole wheel, read by screen readers as the group's name. */
  label: string
  /** Starting date when there is no v-model. Undefined starts today. */
  defaultValue?: string
  /** The first year on the wheel. Undefined is 100 years ago. */
  fromYear?: number
  /** The last year on the wheel. Undefined is 10 years from now. */
  toYear?: number
  /** Dates, as "YYYY-MM-DD", drawn stronger. Undefined is today. */
  strong?: string[]
}>()
const emit = defineEmits<{ /** The date, as "YYYY-MM-DD", once the wheel comes to rest on a new one. */ valueCommit: [value: string] }>()

const now = today()
/** The date in the band as "YYYY-MM-DD", set each time it changes while the wheel turns. Use v-model, or leave it out and the wheel keeps its own date. */
const model = defineModel<string>()
const local = ref(props.defaultValue ?? now)
const value = computed({
  get: () => model.value ?? local.value,
  set: (next: string) => {
    local.value = next
    model.value = next
  },
})
// The days follow the month the wheel rests on, not each month that turns past (31 stays 31 on the way
// through February). A date from outside, not one this wheel told, is a new rest.
let told = value.value
const rested = ref(value.value)
watch(value, (v) => v !== told && (rested.value = v), { flush: 'sync' })
const wheel = computed(() => dateWheel(rested.value, now, props.fromYear, props.toYear, props.strong))
const onChange = (rows: number[] | undefined) => {
  if (!rows) return
  told = wheel.value.toDate(rows)
  value.value = told
}
const onCommit = (rows: number[]) => {
  told = wheel.value.toDate(rows)
  rested.value = told
  emit('valueCommit', told)
}
</script>

<template>
  <PickerWheel :label="label" :columns="wheel.columns" :model-value="wheel.rows" :format-value="wheel.show" @update:model-value="onChange" @value-commit="onCommit">
    <template v-for="(_, name) in $slots" #[name]><slot :name="name" /></template>
  </PickerWheel>
</template>
