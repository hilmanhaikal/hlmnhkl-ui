<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { createCheckboxPour } from '../../internal/motion/checkbox'
import { useField } from '../../internal/vue/useField'
import styles from './Checkbox.module.css'

// The Vue Checkbox: the same look (Checkbox.module.css) and cup fill as the React one.
// Other attributes, such as name or aria-required, go to the input. A class goes to the root, as in React.
defineOptions({ inheritAttrs: false })

const { description, defaultChecked = false, indeterminate = false, error, readOnly, id } = defineProps<{
  /** Visible text next to the box. Clicking it toggles the box. The label slot replaces it. */
  label?: string
  /** Muted text under the label, linked with aria-describedby. The description slot replaces it. */
  description?: string
  /** Starting checked state when there is no v-model. */
  defaultChecked?: boolean
  /** Shows a dash. A click clears the dash and checks the box. */
  indeterminate?: boolean
  /** Error message under the label. Marks the box invalid. */
  error?: string
  /** Keeps the box as it is and still sends it with the form. Shown with data-readonly. */
  readOnly?: boolean
  disabled?: boolean
  id?: string
}>()

/** Whether the box is ticked. Use v-model, or leave it out and the box keeps its own state. */
const model = defineModel<boolean | undefined>({ default: undefined })
const local = ref(defaultChecked)
const checked = computed({
  get: () => model.value ?? local.value,
  set: (next: boolean) => {
    local.value = next
    model.value = next
  },
})
const slots = defineSlots<{ label?: () => unknown; description?: () => unknown }>()
const attrs = useAttrs()
const inputAttrs = computed(() => {
  const { class: _, ...rest } = attrs
  return rest
})

const auto = useId()
const inputId = computed(() => id ?? auto)
const errorId = computed(() => `${inputId.value}-error`)
const hasDescription = computed(() => !!(description || slots.description))
const input = ref<HTMLInputElement | null>(null)
defineExpose({ el: input })
// The tick is set on the element, not bound: Vue would also write it to the checked attribute, which is
// what a form reset goes back to. A reset goes back to defaultChecked, or to the first v-model value.
const firstChecked = checked.value
const show = () => {
  const el = input.value
  if (!el) return
  el.defaultChecked = model.value === undefined ? defaultChecked : firstChecked
  if (el.checked !== checked.value) el.checked = checked.value
}
onMounted(show)
watch([checked, () => defaultChecked], show, { flush: 'post' })
// Code that writes the box directly and a form reset fire no change event: follow the input.
const form = useField({ input, name: () => attrs.name as string | undefined, error: () => error, onSync: () => input.value && input.value.checked !== checked.value && (checked.value = input.value.checked) })
const shownError = form.error
const describedBy = computed(() => [hasDescription.value ? `${inputId.value}-desc` : null, shownError.value ? errorId.value : null, attrs['aria-describedby']].filter(Boolean).join(' ') || undefined)

// Like a native checkbox, a click clears the mixed look until the prop sets it again.
const mixed = ref(indeterminate)
watch(
  () => indeterminate,
  (now) => (mixed.value = now),
)
const state = computed(() => (mixed.value ? 'indeterminate' : checked.value ? 'checked' : 'unchecked'))

const onChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!mixed.value) checked.value = input.checked
  else {
    mixed.value = false
    checked.value = true
  }
  // A v-model that holds its value keeps the box as it was.
  input.checked = checked.value
  form.changed()
}
// A native checkbox ignores readonly, so the click is held back.
const onClick = (e: MouseEvent) => readOnly && e.preventDefault()

// Ink pours in from the side that was pressed, levels, and then the mark draws (motion/checkbox.ts).
const box = ref<HTMLElement | null>(null)
const cup = createCheckboxPour(() => box.value, styles.pour, state.value)
watch(state, (s) => cup.set(s), { flush: 'post' })
onBeforeUnmount(cup.destroy)
</script>

<template>
  <div
    data-slot="checkbox"
    :class="[styles.root, attrs.class]"
    :data-disabled="disabled || undefined"
    :data-readonly="readOnly || undefined"
    :data-invalid="shownError ? true : undefined"
    @pointerdown="!readOnly && cup.press($event.clientX)"
  >
    <span :class="styles.boxWrap">
      <input
        v-bind="inputAttrs"
        :id="inputId"
        ref="input"
        type="checkbox"
        data-slot="checkbox-input"
        :class="styles.input"
        :indeterminate="mixed"
        :disabled="disabled"
        :readonly="readOnly"
        :aria-readonly="readOnly || undefined"
        :aria-invalid="shownError ? true : (inputAttrs['aria-invalid'] as boolean | undefined)"
        :aria-describedby="describedBy"
        @click="onClick"
        @change="onChange"
        @blur="form.blurred()"
        @keydown="cup.key()"
      />
      <span ref="box" data-slot="checkbox-box" :class="styles.box" :data-state="state" aria-hidden="true">
        <span :class="styles.fill" :data-pour-fill="true" />
        <svg viewBox="0 0 16 16" data-slot="checkbox-indicator" :class="styles.mark">
          <path :class="styles.tick" d="M3.5 8.5l3 3 6-7" pathLength="1" data-mark="tick" />
          <path :class="styles.dash" d="M4 8h8" pathLength="1" data-mark="dash" />
        </svg>
      </span>
    </span>
    <span :class="styles.text">
      <label :for="inputId" data-slot="field-label" :class="styles.label"><slot name="label">{{ label }}</slot></label>
      <span v-if="hasDescription" :id="`${inputId}-desc`" data-slot="checkbox-description" :class="styles.description"><slot name="description">{{ description }}</slot></span>
      <FieldMessage :help-id="`${inputId}-help`" :error-id="errorId" :error="shownError" />
    </span>
  </div>
</template>
