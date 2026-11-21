<script lang="ts">
export { applyRetime, type RetimeLabels, type RetimeSpeed } from '../../internal/motion/retime'
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { commitSpeed, defaultRetimeLabels, RETIME_EVENT, retimeSpeeds, savedSpeed, type RetimeLabels, type RetimeSpeed } from '../../internal/motion/retime'
import SegmentedControl from '../SegmentedControl/SegmentedControl.vue'

// The Vue Retime: the same control and speed (motion/retime.ts) as the React one.

const {
  label = 'Motion',
  defaultValue = 'normal',
  remember = true,
  size = 'md',
  labels: labelsProp,
} = defineProps<{
  /** Visible label. */
  label?: string
  /** Starting speed when there is no v-model. A speed saved on this device wins over it. */
  defaultValue?: RetimeSpeed
  /** Saves the choice on this device, so it lasts across visits. */
  remember?: boolean
  /** Height of the control. */
  size?: 'sm' | 'md'
  /** Text for each speed, so you can translate it. */
  labels?: Partial<RetimeLabels>
  /** Fills the row, with the speeds sharing it evenly, as in a settings panel. */
  fullWidth?: boolean
}>()

/** The chosen speed. Use v-model, or leave it out and the part keeps its own. */
const model = defineModel<RetimeSpeed>()
const local = ref<RetimeSpeed>(defaultValue)
const speed = computed({
  get: () => model.value ?? local.value,
  set: (next: RetimeSpeed) => {
    local.value = next
    model.value = next
  },
})

const options = computed(() => {
  const labels = { ...defaultRetimeLabels, ...labelsProp }
  return retimeSpeeds.map((s) => ({ value: s, label: labels[s] }))
})

// A speed saved on an earlier visit comes back after mount, so server and client agree.
const follow = (e: Event) => {
  if (model.value === undefined) speed.value = (e as CustomEvent<RetimeSpeed>).detail
}
onMounted(() => {
  if (remember && model.value === undefined) {
    const saved = savedSpeed()
    if (saved) local.value = saved
  }
  window.addEventListener(RETIME_EVENT, follow)
  commitSpeed(speed.value, remember)
  watch([speed, () => remember], () => commitSpeed(speed.value, remember))
})
onBeforeUnmount(() => window.removeEventListener(RETIME_EVENT, follow))
</script>

<template>
  <SegmentedControl :label="label" :size="size" :model-value="speed" :options="options" :full-width="fullWidth" @update:model-value="speed = $event as RetimeSpeed" />
</template>
