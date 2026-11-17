<script setup lang="ts">
import { computed, inject, useId } from 'vue'
import { radioKey } from './RadioGroup.vue'
import styles from './Radio.module.css'

// The Vue Radio: one choice inside a RadioGroup, the same look (Radio.module.css) as the React one.

const props = defineProps<{
  /** The group value this radio stands for. */
  value: string
  /** Visible text next to the circle. Clicking it picks the radio. */
  label: string
  /** Extra text under the label, also read by screen readers. */
  description?: string
  /** Turns off only this radio. */
  disabled?: boolean
}>()

const ctx = inject(radioKey)
if (!ctx) throw new Error('Radio must be inside RadioGroup')
const id = useId()
const isOn = computed(() => ctx.value.value === props.value)
</script>

<template>
  <div :class="styles.root" :data-disabled="disabled || ctx.disabled.value || undefined">
    <span :class="styles.circleWrap">
      <input
        :id="id"
        type="radio"
        :class="styles.input"
        :name="ctx.name.value"
        :value="value"
        :checked="isOn"
        :disabled="disabled"
        :aria-invalid="ctx.invalid.value || undefined"
        :aria-describedby="description ? `${id}-desc` : undefined"
        @change="ctx.set(value)"
      />
      <span :class="styles.circle" :data-on="isOn || undefined" aria-hidden="true">
        <span :class="styles.dot" />
      </span>
    </span>
    <span :class="styles.text">
      <label :for="id" :class="styles.label">{{ label }}</label>
      <span v-if="description" :id="`${id}-desc`" :class="styles.description">{{ description }}</span>
    </span>
  </div>
</template>
