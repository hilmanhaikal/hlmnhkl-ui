<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { useField } from '../../internal/vue/useField'
import styles from './InputGroup.module.css'

// The Vue InputGroup: the same look (InputGroup.module.css) as the React one.
// Other attributes, such as name, type or placeholder, go to the input. class and style go to the root.
defineOptions({ inheritAttrs: false })

const {
  prefix,
  suffix,
  help,
  error,
  size = 'md',
  defaultValue,
  id,
} = defineProps<{
  /** Always required. A placeholder is only an example, never the label. */
  label: string
  /** Hides the label visually but keeps it as the field's name. */
  hideLabel?: boolean
  /** Text joined before the field, in a shaded cell. For an icon or a button, use the prefix slot. */
  prefix?: string
  /** Text joined after the field, the same way as prefix. */
  suffix?: string
  /** Hint under the field. Hidden while there is an error. */
  help?: string
  /** Error message under the field. Marks the group invalid. */
  error?: string
  /** Height of the group, matching Input. */
  size?: 'sm' | 'md' | 'lg'
  /** The starting text when there is no v-model. */
  defaultValue?: string
  disabled?: boolean
  id?: string
}>()
/** The text. Use v-model, or leave it out and the input keeps its own value. */
const model = defineModel<string>()
const slots = defineSlots<{ prefix?: () => unknown; suffix?: () => unknown }>()
const attrs = useAttrs()

// Without a v-model the value is not bound at all: Vue writes a bound value back on every render, which
// would wipe what the person typed.
const inputAttrs = computed(() => {
  const { class: _class, style: _style, 'aria-describedby': _d, ...rest } = attrs
  return model.value === undefined ? rest : { ...rest, value: model.value }
})
const auto = useId()
const inputId = computed(() => id ?? auto)
const helpId = computed(() => `${inputId.value}-help`)
const errorId = computed(() => `${inputId.value}-error`)
const hasPrefix = computed(() => !!slots.prefix || prefix !== undefined)
const hasSuffix = computed(() => !!slots.suffix || suffix !== undefined)
// Text beside the field, such as a unit or "https://", is read as part of its description.
const textPrefix = computed(() => !slots.prefix && prefix !== undefined)
const textSuffix = computed(() => !slots.suffix && suffix !== undefined)
const inner = ref<HTMLInputElement | null>(null)
defineExpose({ el: inner })
const form = useField({ input: inner, name: () => attrs.name as string | undefined, error: () => error })
const shownError = form.error
// defaultValue is what a form reset goes back to.
onMounted(() => {
  if (model.value === undefined && defaultValue !== undefined && inner.value) inner.value.defaultValue = defaultValue
})
const describedBy = computed(
  () =>
    [
      textPrefix.value ? `${inputId.value}-prefix` : null,
      textSuffix.value ? `${inputId.value}-suffix` : null,
      help && !shownError.value ? helpId.value : null,
      shownError.value ? errorId.value : null,
      attrs['aria-describedby'],
    ]
      .filter(Boolean)
      .join(' ') || undefined,
)

// A press on a shaded cell puts the caret in the field, as it would on the field itself.
const focusField = (e: PointerEvent) => {
  if (e.target instanceof Element && e.target.closest('button, a, input, select, textarea')) return
  e.preventDefault()
  inner.value?.focus()
}
const onInput = (e: Event) => {
  if (model.value !== undefined) model.value = (e.target as HTMLInputElement).value
  form.changed()
}
</script>

<template>
  <div data-slot="input-group" :class="[styles.root, attrs.class]" :style="attrs.style as string | undefined">
    <label :for="inputId" data-slot="field-label" :class="[styles.label, hideLabel && styles.srOnly]">{{ label }}</label>
    <div data-slot="input-group-field" :class="[styles.group, styles[size]]" :data-invalid="shownError ? true : undefined" :data-disabled="disabled || undefined">
      <span v-if="hasPrefix" :id="textPrefix ? `${inputId}-prefix` : undefined" data-slot="input-group-prefix" :class="styles.addon" @pointerdown="focusField">
        <slot name="prefix">{{ prefix }}</slot>
      </span>
      <input
        v-bind="inputAttrs"
        :id="inputId"
        ref="inner"
        data-slot="input-group-control"
        :class="styles.input"
        :disabled="disabled"
        :aria-invalid="shownError ? true : undefined"
        :aria-describedby="describedBy"
        @input="onInput"
        @blur="form.blurred()"
      />
      <span v-if="hasSuffix" :id="textSuffix ? `${inputId}-suffix` : undefined" data-slot="input-group-suffix" :class="styles.addon" @pointerdown="focusField">
        <slot name="suffix">{{ suffix }}</slot>
      </span>
    </div>
    <FieldMessage :help-id="helpId" :error-id="errorId" :help="help" :error="shownError" />
  </div>
</template>
