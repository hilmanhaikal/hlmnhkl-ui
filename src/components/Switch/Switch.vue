<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useAttrs, useId, watch } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { createSwitchThumb } from '../../internal/motion/switchThumb'
import { setNativeValue, useField, useMirror } from '../../internal/vue/useField'
import styles from './Switch.module.css'

// The Vue Switch: the same look (Switch.module.css) and thumb motion as the React one.
// Other attributes, such as aria-label or a blur listener, go to the switch button.
defineOptions({ inheritAttrs: false })

const { description, labelPosition = 'end', readOnly, error, name, id } = defineProps<{
  /** Visible text next to the switch, also its accessible name. The label slot replaces it. */
  label?: string
  /** Extra text under the label, also read by screen readers. The description slot replaces it. */
  description?: string
  /** Puts the label before the switch, like a settings row. */
  labelPosition?: 'start' | 'end'
  /** Form field name. A hidden checkbox sends the value while the switch is on, and nothing while it is off. */
  name?: string
  /** Value sent with the form while the switch is on. Default "on", like a checkbox. */
  value?: string
  /** The form cannot be sent while the switch is off. */
  required?: boolean
  /** Keeps the switch as it is and still sends it with the form. Shown with data-readonly. */
  readOnly?: boolean
  /** Error message under the label. Marks the switch invalid. */
  error?: string
  disabled?: boolean
  id?: string
}>()

/** Whether the switch is on. Use v-model, or leave it out and the switch keeps its own state. */
const checked = defineModel<boolean>({ default: false })
const slots = defineSlots<{ label?: () => unknown; description?: () => unknown }>()

const auto = useId()
const switchId = computed(() => id ?? auto)
const errorId = computed(() => `${switchId.value}-error`)
const hasDescription = computed(() => !!(description || slots.description))
const attrs = useAttrs()

// The hidden checkbox holds the value for the form; a form reset goes back to the first value.
const button = ref<HTMLButtonElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
defineExpose({ el: button, input })
const firstChecked = checked.value
useMirror(input, () => checked.value, () => firstChecked)
const form = useField({ input, name: () => name, error: () => error, onSync: () => input.value && input.value.checked !== checked.value && (checked.value = input.value.checked) })
const shownError = form.error
const describedBy = computed(() => [hasDescription.value && `${switchId.value}-desc`, shownError.value && errorId.value, attrs['aria-describedby']].filter(Boolean).join(' ') || undefined)

const toggle = () => {
  if (readOnly) return
  if (input.value) setNativeValue(input.value, !checked.value)
  checked.value = !checked.value
  form.changed()
}

// The thumb's stretch (motion/switchThumb.ts), played after the DOM has the new state.
const thumbEl = ref<HTMLElement | null>(null)
const thumb = createSwitchThumb(() => thumbEl.value, checked.value)
watch(checked, (on) => thumb.set(on), { flush: 'post' })
onBeforeUnmount(thumb.destroy)
</script>

<template>
  <div
    :class="[styles.root, labelPosition === 'start' && styles.start]"
    data-slot="switch"
    :data-state="checked ? 'checked' : 'unchecked'"
    :data-disabled="disabled || undefined"
    :data-readonly="readOnly || undefined"
    :data-invalid="shownError ? true : undefined"
  >
    <button
      v-bind="$attrs"
      :id="switchId"
      ref="button"
      type="button"
      role="switch"
      :aria-checked="checked"
      :aria-describedby="describedBy"
      :aria-invalid="shownError ? true : undefined"
      :aria-required="required || undefined"
      :aria-readonly="readOnly || undefined"
      :class="styles.track"
      data-slot="switch-track"
      :data-state="checked ? 'checked' : 'unchecked'"
      :disabled="disabled"
      @click="toggle"
      @blur="form.blurred()"
    >
      <span ref="thumbEl" :class="styles.thumb" data-slot="switch-thumb" aria-hidden="true" />
    </button>
    <span :class="styles.text">
      <label :for="switchId" :class="styles.label" data-slot="field-label"><slot name="label">{{ label }}</slot></label>
      <span v-if="hasDescription" :id="`${switchId}-desc`" :class="styles.description" data-slot="switch-description"><slot name="description">{{ description }}</slot></span>
      <FieldMessage :help-id="`${switchId}-help`" :error-id="errorId" :error="shownError" />
    </span>
    <!-- Submits like a checkbox: the value while on, nothing while off. Focus moves on to the switch. -->
    <input
      ref="input"
      type="checkbox"
      :name="name"
      :value="value"
      :required="required"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      :class="styles.input"
      data-slot="switch-input"
      @focus="button?.focus()"
    />
  </div>
</template>
