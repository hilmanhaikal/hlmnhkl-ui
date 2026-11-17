<script setup lang="ts">
import { computed, ref } from 'vue'
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
const emit = defineEmits<{ /** The date in the band while the wheel still turns, as "YYYY-MM-DD". */ scrub: [value: string] }>()

const now = today()
/** The date as "YYYY-MM-DD", set once the wheel comes to rest. Use v-model, or leave it out and the wheel keeps its own date. */
const model = defineModel<string>()
const local = ref(props.defaultValue ?? now)
const value = computed({
  get: () => model.value ?? local.value,
  set: (next: string) => {
    local.value = next
    model.value = next
  },
})
const wheel = computed(() => dateWheel(value.value, now, props.fromYear, props.toYear, props.strong))
</script>

<template>
  <PickerWheel
    :label="label"
    :columns="wheel.columns"
    :model-value="wheel.rows"
    :format-value="wheel.show"
    @update:model-value="(rows) => rows && (value = wheel.toDate(rows))"
    @scrub="emit('scrub', wheel.toDate($event))"
  >
    <template v-for="(_, name) in $slots" #[name]><slot :name="name" /></template>
  </PickerWheel>
</template>
