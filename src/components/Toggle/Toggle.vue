<script setup lang="ts">
import { computed, ref, useAttrs, useSlots } from 'vue'
import { setNativeValue, useField, useMirror } from '../../internal/vue/useField'
import styles from './Toggle.module.css'

// The Vue Toggle: the same look (Toggle.module.css) as the React one. The icon goes in the icon slot;
// other attributes and listeners go to the button.
defineOptions({ inheritAttrs: false })

const { defaultPressed = false, size = 'md', type = 'button', name, readOnly } = defineProps<{
  /** Starting pressed state when there is no v-model. */
  defaultPressed?: boolean
  /** Height and text size, the same as Button. */
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  /** Form field name. A hidden checkbox next to the button sends the value while it is pressed, and nothing while it is not. */
  name?: string
  /** Value sent with the form while pressed. Default "on", like a checkbox. */
  value?: string
  /** The form cannot be sent while the toggle is not pressed. */
  required?: boolean
  /** Keeps the toggle as it is and still sends it with the form. Shown with data-readonly. */
  readOnly?: boolean
}>()
/** Pressed state. Use v-model, or leave it out and the toggle keeps its own state. */
const model = defineModel<boolean | undefined>({ type: Boolean, default: undefined })
const slots = useSlots() as { default?: () => unknown; icon?: () => unknown }
const attrs = useAttrs()

const own = ref(defaultPressed)
const pressed = computed(() => model.value ?? own.value)
const rest = computed(() => {
  const { onClick: _onClick, ...others } = attrs
  return others
})
// The caller's click runs first, and can stop the change with preventDefault.
const onClick = (e: MouseEvent) => {
  const listener = attrs.onClick as ((e: MouseEvent) => void) | Array<(e: MouseEvent) => void> | undefined
  ;(Array.isArray(listener) ? listener : listener ? [listener] : []).forEach((f) => f(e))
  if (e.defaultPrevented) return
  if (readOnly) return
  if (input.value) setNativeValue(input.value, !pressed.value)
  own.value = !pressed.value
  model.value = own.value
  form.changed()
}

// With a name, the hidden checkbox holds the value for the form; a form reset goes back to the first state.
const button = ref<HTMLButtonElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
defineExpose({ el: button, input })
const firstPressed = pressed.value
useMirror(input, () => pressed.value, () => firstPressed)
const form = useField({
  input,
  name: () => name,
  error: () => undefined,
  onSync: () => {
    if (!input.value || input.value.checked === pressed.value) return
    own.value = input.value.checked
    model.value = own.value
  },
})
</script>

<template>
  <button
    v-bind="rest"
    ref="button"
    :type="type"
    :aria-pressed="pressed"
    :aria-invalid="form.error.value ? true : undefined"
    :aria-readonly="readOnly || undefined"
    :data-readonly="readOnly || undefined"
    :class="[styles.root, styles[size], !slots.default && styles.iconOnly]"
    data-slot="toggle"
    :data-state="pressed ? 'on' : 'off'"
    @click="onClick"
  >
    <span v-if="slots.icon" :class="styles.icon" data-slot="toggle-icon"><slot name="icon" /></span>
    <slot />
  </button>
  <!-- Submits like a checkbox: the value while pressed, nothing while not. Focus moves on to the button. -->
  <input
    v-if="name"
    ref="input"
    type="checkbox"
    :name="name"
    :value="value"
    :required="required"
    :disabled="attrs.disabled as boolean | undefined"
    tabindex="-1"
    aria-hidden="true"
    :class="styles.input"
    data-slot="toggle-input"
    @focus="button?.focus()"
  />
</template>
