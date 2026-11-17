<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { edgeFlow } from '../../internal/motion/liquidMore'
import { growTextarea } from '../../internal/motion/textarea'
import styles from './Textarea.module.css'

// The Vue Textarea: the same look (Textarea.module.css), growth and focus edge as the React one.
// Other attributes, such as name or placeholder, go to the textarea. class and style go to the root.
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
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
  }>(),
  { autoGrow: true, minRows: 3, maxRows: 10 },
)
/** The text. Use v-model, or leave it out and the field keeps its own text. */
const model = defineModel<string>()
const attrs = useAttrs()

const fieldAttrs = computed(() => {
  const { class: _class, style: _style, 'aria-describedby': _d, ...rest } = attrs
  return rest
})
const auto = useId()
const fieldId = computed(() => props.id ?? auto)
const helpId = computed(() => `${fieldId.value}-help`)
const errorId = computed(() => `${fieldId.value}-error`)
const countId = computed(() => `${fieldId.value}-count`)
const describedBy = computed(
  () => [props.help && !props.error ? helpId.value : null, props.error ? errorId.value : null, props.showCount && props.maxLength ? countId.value : null, attrs['aria-describedby']].filter(Boolean).join(' ') || undefined,
)

const inner = ref<HTMLTextAreaElement | null>(null)
const box = ref<HTMLElement | null>(null)
const count = ref<HTMLElement | null>(null)
defineExpose({ field: inner })
const resize = () => growTextarea(inner.value, count.value, props)

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
watch(() => [props.autoGrow, props.minRows, props.maxRows, props.maxLength], resize)

const onInput = (e: Event) => {
  resize()
  if (model.value !== undefined) model.value = (e.target as HTMLTextAreaElement).value
}

// Focus draws the dark edge round the field from where it was pressed (motion/liquidMore.ts).
let stopEdge = () => {}
// A native form reset changes the value without an input event.
let frame = 0
const onReset = () => {
  frame = requestAnimationFrame(resize)
}
onMounted(() => {
  const el = inner.value!
  if (model.value !== undefined) show()
  else if (props.defaultValue !== undefined) el.defaultValue = props.defaultValue
  resize()
  if (box.value) stopEdge = edgeFlow(el, box.value, ':focus', styles.edge)
  el.form?.addEventListener('reset', onReset)
})
onBeforeUnmount(() => {
  stopEdge()
  inner.value?.form?.removeEventListener('reset', onReset)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div :class="[styles.root, attrs.class]" :style="attrs.style as string | undefined">
    <div :class="styles.labelRow">
      <label :for="fieldId" :class="styles.label">{{ label }}</label>
      <span v-if="showCount && maxLength !== undefined" :id="countId" ref="count" :class="styles.count" aria-live="off" />
    </div>
    <div ref="box" :class="styles.box">
      <textarea
        :id="fieldId"
        ref="inner"
        :rows="minRows"
        :class="styles.textarea"
        :data-invalid="error ? true : undefined"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        :maxlength="maxLength"
        v-bind="fieldAttrs"
        @input="onInput"
      />
    </div>
    <FieldMessage :help-id="helpId" :error-id="errorId" :help="help" :error="error" />
  </div>
</template>
