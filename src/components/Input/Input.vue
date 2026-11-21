<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { createEdgeFlow } from '../../internal/motion/liquidMore'
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

const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})
const optionalText = computed(() => labels?.optional ?? '(optional)')
const auto = useId()
const inputId = computed(() => id ?? auto)
const helpId = computed(() => `${inputId.value}-help`)
const errorId = computed(() => `${inputId.value}-error`)
const floating = computed(() => labelPlacement === 'floating')
const typed = ref(String(attrs.value ?? model.value ?? '') !== '')
const filled = computed(() => (model.value !== undefined ? model.value !== '' : typed.value))
// The caller's ids join ours, so help and error stay linked.
const describedBy = computed(() => [help && !error ? helpId.value : null, error ? errorId.value : null, attrs['aria-describedby']].filter(Boolean).join(' ') || undefined)

const input = ref<HTMLInputElement | null>(null)
const field = ref<HTMLElement | null>(null)
defineExpose({ el: input })
const onInput = (e: Event) => {
  const v = (e.target as HTMLInputElement).value
  typed.value = v !== ''
  if (model.value !== undefined) model.value = v
}

// Focus draws the dark edge round the field from where it was pressed (motion/liquidMore.ts).
let stopEdge = () => {}
// A native form reset changes the value without an input event.
let frame = 0
const onReset = () => {
  frame = requestAnimationFrame(() => (typed.value = input.value?.value !== ''))
}
onMounted(() => {
  if (field.value) stopEdge = createEdgeFlow(field.value, { when: ':focus-within', className: styles.edge }).destroy
  input.value?.form?.addEventListener('reset', onReset)
})
onBeforeUnmount(() => {
  stopEdge()
  input.value?.form?.removeEventListener('reset', onReset)
  cancelAnimationFrame(frame)
})
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
      :data-invalid="error ? true : undefined"
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
          :value="model ?? (attrs.value as string | undefined)"
          :disabled="disabled"
          :aria-invalid="error ? true : (attrs['aria-invalid'] as boolean | undefined)"
          :aria-describedby="describedBy"
          @input="onInput"
        />
      </div>
      <span v-if="slots.trailing" data-slot="input-trailing" :class="styles.adorn"><slot name="trailing" /></span>
    </div>
    <FieldMessage :help-id="helpId" :error-id="errorId" :help="help" :error="error" />
  </div>
</template>
