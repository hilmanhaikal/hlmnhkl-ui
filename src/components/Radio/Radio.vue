<script setup lang="ts">
import { computed, useId } from 'vue'
import { useRadioGroup } from './radioContext'
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

const ctx = useRadioGroup()
const id = useId()
const isOn = computed(() => ctx.value.value === props.value)
</script>

<template>
  <div :class="styles.root" data-slot="radio" :data-state="isOn ? 'checked' : 'unchecked'" :data-disabled="disabled || ctx.disabled.value || undefined">
    <span :class="styles.circleWrap">
      <input
        :id="id"
        type="radio"
        :class="styles.input"
        data-slot="radio-input"
        :name="ctx.name.value"
        :value="value"
        :checked="isOn"
        :disabled="disabled"
        :aria-invalid="ctx.invalid.value || undefined"
        :aria-describedby="description ? `${id}-desc` : undefined"
        @click="ctx.readOnly?.value && $event.preventDefault()"
        @change="!ctx.readOnly?.value && ctx.set(value)"
      />
      <span :class="styles.circle" data-slot="radio-indicator" :data-state="isOn ? 'checked' : 'unchecked'" aria-hidden="true">
        <span :class="styles.dot" />
      </span>
    </span>
    <span :class="styles.text">
      <label :for="id" :class="styles.label" data-slot="field-label">{{ label }}</label>
      <span v-if="description" :id="`${id}-desc`" :class="styles.description" data-slot="radio-description">{{ description }}</span>
    </span>
  </div>
</template>
