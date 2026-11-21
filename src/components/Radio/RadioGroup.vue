<script setup lang="ts">
import { computed, provide, ref, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { leavesField } from '../../internal/formCore'
import { setNativeValue, useField, useMirror } from '../../internal/vue/useField'
import { radioKey } from './radioContext'
import styles from './Radio.module.css'

// The Vue RadioGroup: the same look (Radio.module.css) as the React one. Put Radio parts in its slot.

const {
  description,
  error,
  defaultValue = null,
  name,
  readOnly = undefined,
  disabled = undefined,
  orientation = 'vertical',
} = defineProps<{
  /** Visible group label (rendered as the fieldset legend). */
  label: string
  /** Extra text under the group label. */
  description?: string
  /** Error under the radios. Marks the group invalid and is read with it. */
  error?: string
  /** Starting value when there is no v-model. */
  defaultValue?: string | null
  /** Form field name shared by every radio. Undefined makes a unique one. */
  name?: string
  /** The form cannot be sent while no radio is picked. */
  required?: boolean
  /** Keeps the pick as it is and still sends it with the form. Shown with data-readonly. */
  readOnly?: boolean
  /** Turns off every radio in the group. */
  disabled?: boolean
  /** Stacks the radios or puts them in a row. */
  orientation?: 'vertical' | 'horizontal'
}>()
const emit = defineEmits<{
  /** Focus left the group, so vee-validate's handleBlur runs. */
  blur: [event: FocusEvent]
}>()

/** The selected value. Null means nothing is picked. Use v-model, or leave it out and the group keeps its own state. */
const model = defineModel<string | null>()
const local = ref(defaultValue)
const value = computed({
  get: () => (model.value === undefined ? local.value : model.value),
  set: (next: string | null) => {
    local.value = next
    model.value = next
  },
})

// A hidden input holds the value for required, a form reset and form libraries; the radios send it.
const root = ref<HTMLFieldSetElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
defineExpose({ el: input })
const firstValue = value.value
useMirror(input, () => value.value ?? '', () => firstValue ?? '')
const form = useField({ input, name: () => name, error: () => error, onSync: () => input.value && input.value.value !== (value.value ?? '') && (value.value = input.value.value || null) })
const shownError = form.error

const auto = useId()
const descId = `${auto}-desc`
const errorId = `${auto}-error`
const describedBy = computed(() => [description ? descId : null, shownError.value ? errorId : null].filter(Boolean).join(' ') || undefined)
const onBlur = (e: FocusEvent) => {
  if (!leavesField(e, root.value)) return
  form.blurred()
  emit('blur', e)
}
const focusPicked = () => root.value?.querySelector<HTMLInputElement>('input[type="radio"]:checked:not(:disabled), input[type="radio"]:not(:disabled)')?.focus()

provide(radioKey, {
  name: computed(() => name ?? auto),
  value,
  set: (v) => {
    if (input.value) setNativeValue(input.value, v, true)
    value.value = v
    form.changed()
  },
  disabled: computed(() => disabled),
  invalid: computed(() => !!shownError.value),
  readOnly: computed(() => readOnly),
})
</script>

<template>
  <fieldset
    ref="root"
    role="radiogroup"
    :class="styles.group"
    data-slot="radio-group"
    :disabled="disabled"
    :aria-invalid="shownError ? true : undefined"
    :aria-required="required || undefined"
    :aria-readonly="readOnly || undefined"
    :aria-describedby="describedBy"
    :data-invalid="shownError ? true : undefined"
    :data-readonly="readOnly || undefined"
    @focusout="onBlur"
  >
    <legend :class="styles.legend" data-slot="field-label">{{ label }}</legend>
    <p v-if="description" :id="descId" :class="styles.groupDescription" data-slot="radio-group-description">{{ description }}</p>
    <div :class="[styles.items, styles[orientation]]" data-slot="radio-group-items" :data-orientation="orientation">
      <slot />
    </div>
    <!-- Holds the value for required and a form reset; the radios send it. Focus moves on to the picked radio. -->
    <input
      ref="input"
      :required="required"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      autocomplete="off"
      :class="styles.hiddenInput"
      data-slot="radio-group-input"
      @focus="focusPicked"
    />
    <FieldMessage :help-id="`${auto}-help`" :error-id="errorId" :error="shownError" />
  </fieldset>
</template>
