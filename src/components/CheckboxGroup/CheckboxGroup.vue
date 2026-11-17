<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import Checkbox from '../Checkbox/Checkbox.vue'
import styles from './CheckboxGroup.module.css'

// The Vue CheckboxGroup: the same look (CheckboxGroup.module.css) and boxes as the React one.

export type CheckboxOption = { value: string; label: string; description?: string; disabled?: boolean }

const props = withDefaults(
  defineProps<{
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
  }>(),
  { orientation: 'vertical' },
)

/** Values of the ticked boxes, in option order. Use v-model, or leave it out and the group keeps its own state. */
const model = defineModel<string[]>()
const local = ref(props.defaultValue ?? [])
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
const describedBy = computed(() => [props.description ? descId : null, props.error ? errorId : null].filter(Boolean).join(' ') || undefined)
const toggle = (v: string, on: boolean) => {
  const next = new Set(value.value)
  if (on) next.add(v)
  else next.delete(v)
  value.value = props.options.map((o) => o.value).filter((x) => next.has(x))
}
</script>

<template>
  <fieldset :class="styles.group" :disabled="disabled" :aria-describedby="describedBy" :data-disabled="disabled || undefined" :data-invalid="error ? true : undefined">
    <legend :class="styles.legend">{{ label }}</legend>
    <p v-if="description" :id="descId" :class="styles.description">{{ description }}</p>
    <div :class="[styles.items, styles[orientation]]">
      <Checkbox
        v-for="o in options"
        :key="o.value"
        :label="o.label"
        :description="o.description"
        :name="name"
        :value="o.value"
        :disabled="o.disabled"
        :checked="value.includes(o.value)"
        :aria-invalid="error ? true : undefined"
        @update:checked="(on?: boolean) => toggle(o.value, !!on)"
      />
    </div>
    <FieldMessage :help-id="`${auto}-help`" :error-id="errorId" :error="error" />
  </fieldset>
</template>
