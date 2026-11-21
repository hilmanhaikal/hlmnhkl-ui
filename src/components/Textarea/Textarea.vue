<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { createEdgeFlow } from '../../internal/motion/liquidMore'
import { growTextarea } from '../../internal/motion/textarea'
import { useField } from '../../internal/vue/useField'
import styles from './Textarea.module.css'

// The Vue Textarea: the same look (Textarea.module.css), growth and focus edge as the React one.
// Other attributes, such as name or placeholder, go to the textarea. class and style go to the root.
defineOptions({ inheritAttrs: false })

const { help, error, autoGrow = true, minRows = 3, maxRows = 10, showCount, maxLength, defaultValue, id } = defineProps<{
  /** Visible name of the field, also read by screen readers. */
  label: string
  /** Hint under the field. Hidden while an error shows. */
  help?: string
  /** Error message under the field. Also marks the field invalid. */
  error?: string
  /** Grows with the text. Default true. */
  autoGrow?: boolean
  /** Height in lines when empty. */
  minRows?: number
  /** Most lines it grows to before it scrolls. Only used with autoGrow. */
  maxRows?: number
  /** Shows a live "n / max" count when maxLength is set. */
  showCount?: boolean
  maxLength?: number
  /** The starting text when there is no v-model. */
  defaultValue?: string
  id?: string
}>()
/** The text. Use v-model, or leave it out and the field keeps its own text. */
const model = defineModel<string>()
const attrs = useAttrs()

const fieldAttrs = computed(() => {
  const { class: _class, style: _style, 'aria-describedby': _d, ...rest } = attrs
  return rest
})
const auto = useId()
const fieldId = computed(() => id ?? auto)
const helpId = computed(() => `${fieldId.value}-help`)
const errorId = computed(() => `${fieldId.value}-error`)
const countId = computed(() => `${fieldId.value}-count`)
const inner = ref<HTMLTextAreaElement | null>(null)
// Values written by code and a form reset fire no input event, so grow to fit them.
const form = useField({ input: inner, name: () => attrs.name as string | undefined, error: () => error, onSync: () => resize() })
const shownError = form.error
const describedBy = computed(
  () => [help && !shownError.value ? helpId.value : null, shownError.value ? errorId.value : null, showCount && maxLength ? countId.value : null, attrs['aria-describedby']].filter(Boolean).join(' ') || undefined,
)

const box = ref<HTMLElement | null>(null)
const count = ref<HTMLElement | null>(null)
defineExpose({ el: inner })
const resize = () => growTextarea(inner.value, count.value, { autoGrow, minRows, maxRows, maxLength })

// The text is set on the element, not bound: Vue would also write it to a value attribute, which React does not.
const show = () => {
  const el = inner.value
  if (!el || model.value === undefined) return
  if (el.value !== model.value) el.value = model.value
  if (el.defaultValue !== model.value) el.defaultValue = model.value
}
watch(model, () => {
  show()
  resize()
})
watch(() => [autoGrow, minRows, maxRows, maxLength], resize)

const onInput = (e: Event) => {
  resize()
  if (model.value !== undefined) model.value = (e.target as HTMLTextAreaElement).value
  form.changed()
}

// Focus draws the dark edge round the field from where it was pressed (motion/liquidMore.ts).
let stopEdge = () => {}
onMounted(() => {
  const el = inner.value!
  if (model.value !== undefined) show()
  else if (defaultValue !== undefined) el.defaultValue = defaultValue
  resize()
  if (box.value) stopEdge = createEdgeFlow(el, { root: box.value, when: ':focus', className: styles.edge }).destroy
})
onBeforeUnmount(() => stopEdge())
</script>

<template>
  <div :class="[styles.root, attrs.class]" :style="attrs.style as string | undefined" data-slot="textarea">
    <div :class="styles.labelRow">
      <label :for="fieldId" :class="styles.label" data-slot="field-label">{{ label }}</label>
      <span v-if="showCount && maxLength !== undefined" :id="countId" ref="count" :class="styles.count" data-slot="textarea-count" aria-live="off" />
    </div>
    <div ref="box" :class="styles.box">
      <textarea
        :id="fieldId"
        ref="inner"
        :rows="minRows"
        :class="styles.textarea"
        data-slot="textarea-input"
        :data-invalid="shownError ? true : undefined"
        :aria-invalid="shownError ? true : undefined"
        :aria-describedby="describedBy"
        :maxlength="maxLength"
        v-bind="fieldAttrs"
        @input="onInput"
        @blur="form.blurred()"
      />
    </div>
    <FieldMessage :help-id="helpId" :error-id="errorId" :help="help" :error="shownError" />
  </div>
</template>
