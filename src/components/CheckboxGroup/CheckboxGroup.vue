<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { leavesField, sameList } from '../../internal/formCore'
import { readList, setNativeList, useField, useMirrorList } from '../../internal/vue/useField'
import Checkbox from '../Checkbox/Checkbox.vue'
import styles from './CheckboxGroup.module.css'

// The Vue CheckboxGroup: the same look (CheckboxGroup.module.css) and boxes as the React one.

export type CheckboxOption = { value: string; label: string; description?: string; disabled?: boolean }

const {
  options,
  defaultValue,
  description,
  error,
  name,
  readOnly,
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
  /** Form field name. Each ticked box's value is sent under it. */
  name?: string
  /** The form cannot be sent while no box is ticked. */
  required?: boolean
  /** Keeps the boxes as they are and still sends them with the form. Shown with data-readonly. */
  readOnly?: boolean
  /** Turns off every box in the group. */
  disabled?: boolean
  /** Stacks the boxes or puts them in a row that wraps. */
  orientation?: 'vertical' | 'horizontal'
}>()
const emit = defineEmits<{
  /** Focus left the group, so vee-validate's handleBlur runs. */
  blur: [event: FocusEvent]
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

// The hidden list holds the values for the form; a form reset goes back to the first value.
const root = ref<HTMLFieldSetElement | null>(null)
const input = ref<HTMLSelectElement | null>(null)
defineExpose({ el: input })
const firstValue = value.value
useMirrorList(input, () => value.value, () => firstValue, () => options.map((o) => o.value))
const form = useField({ input, name: () => name, error: () => error, onSync: () => input.value && !sameList(readList(input.value), value.value) && (value.value = readList(input.value)) })
const shownError = form.error

const auto = useId()
const descId = `${auto}-desc`
const errorId = `${auto}-error`
const describedBy = computed(() => [description ? descId : null, shownError.value ? errorId : null].filter(Boolean).join(' ') || undefined)
const toggle = (v: string, on: boolean) => {
  if (readOnly) return
  const next = new Set(value.value)
  if (on) next.add(v)
  else next.delete(v)
  const list = options.map((o) => o.value).filter((x) => next.has(x))
  if (input.value) setNativeList(input.value, list)
  value.value = list
  form.changed()
}
const onBlur = (e: FocusEvent) => {
  if (!leavesField(e, root.value)) return
  form.blurred()
  emit('blur', e)
}
const focusFirst = () => root.value?.querySelector<HTMLInputElement>('input[type="checkbox"]:not(:disabled)')?.focus()
</script>

<template>
  <fieldset
    ref="root"
    data-slot="checkbox-group"
    :class="styles.group"
    :disabled="disabled"
    :aria-describedby="describedBy"
    :data-disabled="disabled || undefined"
    :data-readonly="readOnly || undefined"
    :data-invalid="shownError ? true : undefined"
    :data-orientation="orientation"
    @focusout="onBlur"
  >
    <legend data-slot="field-label" :class="styles.legend">{{ label }}</legend>
    <p v-if="description" :id="descId" data-slot="checkbox-group-description" :class="styles.description">{{ description }}</p>
    <div data-slot="checkbox-group-items" :class="[styles.items, styles[orientation]]">
      <Checkbox
        v-for="o in options"
        :key="o.value"
        :label="o.label"
        :description="o.description"
        :value="o.value"
        :disabled="o.disabled"
        :read-only="readOnly"
        :model-value="value.includes(o.value)"
        :aria-invalid="shownError ? true : undefined"
        @update:model-value="(on?: boolean) => toggle(o.value, !!on)"
      />
    </div>
    <!-- Holds the values for the form, one selected option each. Focus moves on to the first box. -->
    <select ref="input" multiple :name="name" :required="required" tabindex="-1" aria-hidden="true" :class="styles.input" data-slot="checkbox-group-input" @focus="focusFirst" />
    <FieldMessage :help-id="`${auto}-help`" :error-id="errorId" :error="shownError" />
  </fieldset>
</template>
