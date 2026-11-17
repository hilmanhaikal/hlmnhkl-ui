<script setup lang="ts">
import { computed, ref } from 'vue'
import { timeWheel } from '../../internal/motion/pickerWheel'
import PickerWheel from './PickerWheel.vue'

// PickerWheel set up for a time: hour, minute and, on a 12 hour clock, AM or PM (the Vue TimeWheel).
// Other props (detail, haptics) go to the PickerWheel.

const props = withDefaults(
  defineProps<{
    /** Visible name of the whole wheel, read by screen readers as the group's name. */
    label: string
    /** Starting time when there is no v-model. */
    defaultValue?: string
    /** 12 shows AM and PM; 24 shows hours 00 to 23. */
    hourCycle?: 12 | 24
    /** Minutes between two rows. */
    minuteStep?: number
    /** Minutes drawn stronger. Page Up and Page Down jump between them. */
    strong?: number[]
  }>(),
  { defaultValue: '09:00', hourCycle: 12, minuteStep: 1, strong: () => [0, 30] },
)
const emit = defineEmits<{ /** The time in the band while the wheel still turns, as "HH:mm". */ scrub: [value: string] }>()

/** The time as "HH:mm" in 24 hours, set once the wheel comes to rest. Use v-model, or leave it out and the wheel keeps its own time. */
const model = defineModel<string>()
const local = ref(props.defaultValue)
const value = computed({
  get: () => model.value ?? local.value,
  set: (next: string) => {
    local.value = next
    model.value = next
  },
})
const wheel = computed(() => timeWheel(props.hourCycle, props.minuteStep, props.strong))
</script>

<template>
  <PickerWheel
    :label="label"
    :columns="wheel.columns"
    :model-value="wheel.toRows(value)"
    :format-value="wheel.show"
    @update:model-value="(rows) => rows && (value = wheel.toTime(rows))"
    @scrub="emit('scrub', wheel.toTime($event))"
  >
    <template v-for="(_, name) in $slots" #[name]><slot :name="name" /></template>
  </PickerWheel>
</template>
