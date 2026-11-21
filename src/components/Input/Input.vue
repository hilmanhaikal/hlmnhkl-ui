<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { createEdgeFlow } from '../../internal/motion/liquidMore'
import { useField } from '../../internal/vue/useField'
import styles from './Input.module.css'

// The Vue Input: the same look (Input.module.css) and focus edge as the React one.
// Other attributes, such as name, type or placeholder, go to the input. class and style go to the root, like React's className.
defineOptions({ inheritAttrs: false })

export type InputLabels = {
  optional: string
}

const {
  labelPlacement = 'top',
  help,
  error,
  size = 'md',
  labels,
  id,
} = defineProps<{
  /** Always required. A placeholder is only an example, never the label. */
  label: string
  /** "top" puts the label above the field, "floating" puts it inside and moves it up. */
  labelPlacement?: 'top' | 'floating'
  /** Hint under the field. Hidden while there is an error. */
  help?: string
  /** Error message under the field. Marks the field invalid. */
  error?: string
  /** Height of the field. */
  size?: 'sm' | 'md' | 'lg'
  /** Adds "(optional)" after the label. */
  optional?: boolean
  /** Text added to the label, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<InputLabels>
  disabled?: boolean
  id?: string
}>()
/** The text. Use v-model, or leave it out and the input keeps its own value. */
const model = defineModel<string>()
const slots = defineSlots<{ leading?: () => unknown; trailing?: () => unknown }>()
const attrs = useAttrs()

// Without a v-model the value is not bound at all: Vue writes a bound value back on every render, which
// would wipe what the person typed.
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return model.value === undefined ? rest : { ...rest, value: model.value }
})
const optionalText = computed(() => labels?.optional ?? '(optional)')
const auto = useId()
const inputId = computed(() => id ?? auto)
const helpId = computed(() => `${inputId.value}-help`)
const errorId = computed(() => `${inputId.value}-error`)
const floating = computed(() => labelPlacement === 'floating')
const typed = ref(String(attrs.value ?? model.value ?? '') !== '')
const filled = computed(() => (model.value !== undefined ? model.value !== '' : typed.value))
const input = ref<HTMLInputElement | null>(null)
const field = ref<HTMLElement | null>(null)
defineExpose({ el: input })
// Values written by code and a form reset fire no input event, so read the input.
const form = useField({ input, name: () => attrs.name as string | undefined, error: () => error, onSync: () => (typed.value = !!input.value?.value) })
const shownError = form.error
// The caller's ids join ours, so help and error stay linked.
const describedBy = computed(() => [help && !shownError.value ? helpId.value : null, shownError.value ? errorId.value : null, attrs['aria-describedby']].filter(Boolean).join(' ') || undefined)
const onInput = (e: Event) => {
  const v = (e.target as HTMLInputElement).value
  typed.value = v !== ''
  if (model.value !== undefined) model.value = v
  form.changed()
}

// Focus draws the dark edge round the field from where it was pressed (motion/liquidMore.ts).
let stopEdge = () => {}
onMounted(() => {
  if (field.value) stopEdge = createEdgeFlow(field.value, { when: ':focus-within', className: styles.edge }).destroy
})
onBeforeUnmount(() => stopEdge())
</script>

<template>
  <div data-slot="input" :class="[styles.root, attrs.class]" :style="attrs.style as string | undefined">
    <label v-if="!floating" :for="inputId" data-slot="field-label" :class="styles.topLabel">
      {{ label }}<span v-if="optional" data-slot="input-optional" :class="styles.optional">{{ ` ${optionalText}` }}</span>
    </label>
    <div
      ref="field"
      data-slot="input-field"
      :class="[styles.field, styles[size], floating && styles.floating]"
      :data-filled="filled || undefined"
      :data-invalid="shownError ? true : undefined"
      :data-disabled="disabled || undefined"
    >
      <span v-if="slots.leading" data-slot="input-leading" :class="styles.adorn"><slot name="leading" /></span>
      <div :class="styles.control">
        <label v-if="floating" :for="inputId" data-slot="field-label" :class="styles.floatLabel">
          {{ label }}<span v-if="optional" data-slot="input-optional" :class="styles.optional">{{ ` ${optionalText}` }}</span>
        </label>
        <input
          v-bind="inputAttrs"
          :id="inputId"
          ref="input"
          data-slot="input-control"
          :class="styles.input"
          :disabled="disabled"
          :aria-invalid="shownError ? true : (attrs['aria-invalid'] as boolean | undefined)"
          :aria-describedby="describedBy"
          @input="onInput"
          @blur="form.blurred()"
        />
      </div>
      <span v-if="slots.trailing" data-slot="input-trailing" :class="styles.adorn"><slot name="trailing" /></span>
    </div>
    <FieldMessage :help-id="helpId" :error-id="errorId" :help="help" :error="shownError" />
  </div>
</template>
