<script setup lang="ts">
import { computed, ref } from 'vue'
import { localeHourCycle, timeWheel } from '../../internal/motion/pickerWheel'
import PickerWheel from './PickerWheel.vue'

// PickerWheel set up for a time: hour, minute and, on a 12 hour clock, AM or PM (the Vue TimeWheel).
// Other props (detail, haptics) go to the PickerWheel.

const {
  defaultValue = '09:00',
  hourCycle,
  step = 1,
  strong = [0, 30],
} = defineProps<{
  /** Visible name of the whole wheel, read by screen readers as the group's name. */
  label: string
  /** Starting time when there is no v-model. */
  defaultValue?: string
  /** 12 shows AM and PM; 24 shows hours 00 to 23. Defaults to what the browser's locale uses. */
  hourCycle?: 12 | 24
  /** Minutes between two rows, such as 5 or 15. */
  step?: number
  /** Minutes drawn stronger. Page Up and Page Down jump between them. */
  strong?: number[]
}>()
const emit = defineEmits<{ /** The time, as "HH:mm", once the wheel comes to rest on a new one. */ valueCommit: [value: string] }>()

/** The time in the band as "HH:mm" in 24 hours, set each time it changes while the wheel turns. Use v-model, or leave it out and the wheel keeps its own time. */
const model = defineModel<string>()
const local = ref(defaultValue)
const value = computed({
  get: () => model.value ?? local.value,
  set: (next: string) => {
    local.value = next
    model.value = next
  },
})
const wheel = computed(() => timeWheel(hourCycle ?? localeHourCycle(), step, strong))
</script>

<template>
  <PickerWheel
    :label="label"
    :columns="wheel.columns"
    :model-value="wheel.toRows(value)"
    :format-value="wheel.show"
    @update:model-value="(rows) => rows && (value = wheel.toTime(rows))"
    @value-commit="emit('valueCommit', wheel.toTime($event))"
  >
    <template v-for="(_, name) in $slots" #[name]><slot :name="name" /></template>
  </PickerWheel>
</template>
