<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import Checkbox from '../Checkbox/Checkbox.vue'
import styles from './CheckboxGroup.module.css'

// The Vue CheckboxGroup: the same look (CheckboxGroup.module.css) and boxes as the React one.

export type CheckboxOption = { value: string; label: string; description?: string; disabled?: boolean }

const {
  options,
  defaultValue,
  description,
  error,
  orientation = 'vertical',
} = defineProps<{
  /** Visible name of the group, rendered as the legend. */
  label: string
  /** The boxes, in order. */
  options: CheckboxOption[]
  /** Starting value when there is no v-model. */
  defaultValue?: string[]
  /** Muted text under the label, read with the group. */
  description?: string
  /** Error under the boxes. Marks every box invalid and is read with the group. */
  error?: string
  /** Form field name shared by every box. Each ticked box sends its value. */
  name?: string
  /** Turns off every box in the group. */
  disabled?: boolean
  /** Stacks the boxes or puts them in a row that wraps. */
  orientation?: 'vertical' | 'horizontal'
}>()

/** Values of the ticked boxes, in option order. Use v-model, or leave it out and the group keeps its own state. */
const model = defineModel<string[]>()
const local = ref(defaultValue ?? [])
const value = computed({
  get: () => model.value ?? local.value,
  set: (next: string[]) => {
    local.value = next
    model.value = next
  },
})

const auto = useId()
const descId = `${auto}-desc`
const errorId = `${auto}-error`
const describedBy = computed(() => [description ? descId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined)
const toggle = (v: string, on: boolean) => {
  const next = new Set(value.value)
  if (on) next.add(v)
  else next.delete(v)
  value.value = options.map((o) => o.value).filter((x) => next.has(x))
}
</script>

<template>
  <fieldset data-slot="checkbox-group" :class="styles.group" :disabled="disabled" :aria-describedby="describedBy" :data-disabled="disabled || undefined" :data-invalid="error ? true : undefined" :data-orientation="orientation">
    <legend data-slot="field-label" :class="styles.legend">{{ label }}</legend>
    <p v-if="description" :id="descId" data-slot="checkbox-group-description" :class="styles.description">{{ description }}</p>
    <div data-slot="checkbox-group-items" :class="[styles.items, styles[orientation]]">
      <Checkbox
        v-for="o in options"
        :key="o.value"
        :label="o.label"
        :description="o.description"
        :name="name"
        :value="o.value"
        :disabled="o.disabled"
        :model-value="value.includes(o.value)"
        :aria-invalid="error ? true : undefined"
        @update:model-value="(on?: boolean) => toggle(o.value, !!on)"
      />
    </div>
    <FieldMessage :help-id="`${auto}-help`" :error-id="errorId" :error="error" />
  </fieldset>
</template>
