<script lang="ts">
import { inject, type ComputedRef, type InjectionKey } from 'vue'
import type { FormFieldControlProps } from '../../internal/motion/formField'

const key: InjectionKey<ComputedRef<FormFieldControlProps>> = Symbol('gooee-form-field')

/** Inside a FormField, returns the props for its control (bind them with v-bind). Outside one, returns null. */
export function useFormField(): ComputedRef<FormFieldControlProps> | null {
  return inject(key, null)
}
</script>

<script setup lang="ts">
import { computed, provide, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import type { FormFieldLabels } from '../../internal/motion/formField'
import styles from './FormField.module.css'

// The Vue FormField: the same look (FormField.module.css) as the React one. The control gets its wiring
// from the default slot's props, or from useFormField() inside your own control.
const props = defineProps<{
  /** Visible label above the control. The label slot replaces it. */
  label?: string
  /** Hint under the control. Hidden while there is an error. */
  help?: string
  /** Error message under the control. Marks the control invalid. */
  error?: string
  /** Adds a "*" after the label and sets aria-required on the control. */
  required?: boolean
  /** Adds "(optional)" after the label. */
  optional?: boolean
  /** Dims the field and passes disabled to the control. */
  disabled?: boolean
  /** Use a fixed id instead of a generated one. */
  id?: string
  /** Text added to the label, so you can translate it. */
  labels?: Partial<FormFieldLabels>
}>()
defineSlots<{ default?: (props: FormFieldControlProps) => unknown; label?: () => unknown }>()

const auto = useId()
const controlId = computed(() => props.id ?? auto)
const labelId = computed(() => `${controlId.value}-label`)
const helpId = computed(() => `${controlId.value}-help`)
const errorId = computed(() => `${controlId.value}-error`)
const controlProps = computed<FormFieldControlProps>(() => ({
  id: controlId.value,
  'aria-describedby': [props.help && !props.error ? helpId.value : null, props.error ? errorId.value : null].filter(Boolean).join(' ') || undefined,
  'aria-invalid': props.error ? true : undefined,
  'aria-required': props.required ? true : undefined,
  disabled: props.disabled || undefined,
}))
provide(key, controlProps)
</script>

<template>
  <div :class="styles.root" :data-invalid="error ? true : undefined" :data-disabled="disabled || undefined">
    <label :id="labelId" :for="controlId" :class="styles.label">
      <slot name="label">{{ label }}</slot><span v-if="required" :class="styles.required" aria-hidden="true"> *</span><span v-if="optional && !required" :class="styles.optional">{{ ` ${labels?.optional ?? '(optional)'}` }}</span>
    </label>
    <div :class="styles.control"><slot v-bind="controlProps" /></div>
    <FieldMessage :help-id="helpId" :error-id="errorId" :help="help" :error="error" />
  </div>
</template>
