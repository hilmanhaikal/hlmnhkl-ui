<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch, type Component } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { leavesField } from '../../internal/formCore'
import { createFlow } from '../../internal/motion/liquidMatter'
import { measureSegments, segmentInk, segmentKey } from '../../internal/motion/segmented'
import { setNativeValue, useField, useMirror } from '../../internal/vue/useField'
import styles from './SegmentedControl.module.css'

// The Vue SegmentedControl: the same look (SegmentedControl.module.css), flowing pill and keys as the React one.
// Other attributes go to the control, also when a name adds the message after it.
defineOptions({ inheritAttrs: false })

export type SegmentedControlOption = { value: string; label: string; icon?: Component; disabled?: boolean; ariaLabel?: string }

const { options, size = 'md', name, readOnly, error } = defineProps<{
  /** Accessible name for the group. */
  label: string
  /** The segments, in order. */
  options: SegmentedControlOption[]
  /** Height and text size of the segments. */
  size?: 'sm' | 'md'
  /** Stretches the control to fill its container, with equal segments. */
  fullWidth?: boolean
  /** Form field name. The selected value is sent under it. The control joins a form only with a name. */
  name?: string
  /** The form cannot be sent while no segment is selected. */
  required?: boolean
  /** Keeps the selection as it is and still sends it with the form. Shown with data-readonly. */
  readOnly?: boolean
  /** Turns off every segment. The value is not sent with the form. */
  disabled?: boolean
  /** Error message under the control, shown with a name. Marks the control invalid. */
  error?: string
}>()
const emit = defineEmits<{
  /** Focus left the control, so vee-validate's handleBlur runs. */
  blur: [event: FocusEvent]
}>()

/** The selected value. Use v-model, or leave it out and the first option starts selected. */
const model = defineModel<string>()
const local = ref(options[0]?.value ?? '')
const value = computed({
  get: () => model.value ?? local.value,
  set: (next: string) => {
    local.value = next
    model.value = next
  },
})

const root = ref<HTMLElement | null>(null)
// With a name, a hidden input holds the value for the form; a form reset goes back to the first value.
const input = ref<HTMLInputElement | null>(null)
defineExpose({ el: input })
const firstValue = value.value
useMirror(input, () => value.value, () => firstValue)
const form = useField({ input, name: () => name, error: () => error, onSync: () => input.value && input.value.value !== value.value && (value.value = input.value.value) })
const shownError = computed(() => (name ? form.error.value : undefined))
const errorId = `${useId()}-error`
const select = (next: string) => {
  if (readOnly || next === value.value) return
  if (input.value) setNativeValue(input.value, next)
  value.value = next
  form.changed()
}
const onBlur = (e: FocusEvent) => {
  if (!name || !leavesField(e, root.value)) return
  form.blurred()
  emit('blur', e)
}
const items = ref<Array<HTMLElement | null>>([])
const pillEl = ref<HTMLElement | null>(null)
const pill = ref<{ x: number; w: number } | null>(null)
const ready = ref(false)
const index = computed(() => options.findIndex((o) => o.value === value.value))
// With no match, the first enabled segment takes the tab stop.
const tabStop = computed(() => (index.value >= 0 && !options[index.value].disabled ? index.value : options.findIndex((o) => !o.disabled)))

const measure = () => {
  const place = measureSegments(root.value, items.value[index.value])
  if (place) pill.value = place
}
let ro: ResizeObserver | null = null
onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  if (root.value) ro.observe(root.value)
  requestAnimationFrame(() => (ready.value = true))
})
watch([index, () => options.length], measure, { flush: 'post' })

// The pill flows to the new choice (motion/liquidMatter.ts); the labels under it take the chosen colour.
const flow = createFlow(() => pillEl.value, { host: () => root.value, className: styles.liquid, ink: segmentInk(() => root.value, () => items.value, styles.ink) })
watch(
  () => [index.value, pill.value?.x, pill.value?.w, ready.value] as const,
  () => nextTick(() => flow.update(pill.value, index.value, ready.value)),
  { flush: 'post', immediate: true },
)
onBeforeUnmount(() => {
  ro?.disconnect()
  flow.destroy()
})

const onKeyDown = (e: KeyboardEvent) => {
  const next = segmentKey(e.key, tabStop.value, options.map((o) => !!o.disabled))
  if (next < 0) return
  e.preventDefault()
  select(options[next].value)
  if (!readOnly) items.value[next]?.focus()
}
</script>

<template>
  <div
    v-bind="$attrs"
    ref="root"
    role="radiogroup"
    :aria-label="label"
    :aria-invalid="shownError ? true : undefined"
    :aria-required="required || undefined"
    :aria-readonly="readOnly || undefined"
    :aria-describedby="shownError ? errorId : undefined"
    :class="[styles.root, styles[size], fullWidth && styles.full]"
    data-slot="segmented-control"
    :data-disabled="disabled || undefined"
    :data-readonly="readOnly || undefined"
    :data-invalid="shownError ? true : undefined"
    @keydown="onKeyDown"
    @focusout="onBlur"
  >
    <span
      v-if="pill"
      ref="pillEl"
      :class="styles.pill"
      data-slot="segmented-control-indicator"
      :data-ready="ready || undefined"
      :style="{ transform: `translateX(${pill.x}px)`, width: `${pill.w}px` }"
      aria-hidden="true"
    />
    <button
      v-for="(o, i) in options"
      :key="o.value"
      :ref="(el) => (items[i] = el as HTMLElement | null)"
      type="button"
      role="radio"
      :aria-checked="o.value === value"
      :aria-label="o.ariaLabel"
      :tabindex="i === tabStop ? 0 : -1"
      :disabled="o.disabled || disabled"
      :class="styles.item"
      data-slot="segmented-control-item"
      :data-state="o.value === value ? 'active' : 'inactive'"
      :data-disabled="o.disabled || undefined"
      @click="select(o.value)"
    >
      <span v-if="o.icon" :class="styles.icon" data-slot="segmented-control-icon"><component :is="o.icon" /></span>
      <span v-if="o.label" :class="styles.text" data-slot="segmented-control-label">{{ o.label }}</span>
    </button>
    <!-- Holds the value for the form. Focus moves on to the selected segment. -->
    <input
      v-if="name"
      ref="input"
      :name="name"
      :required="required"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      autocomplete="off"
      :class="styles.input"
      data-slot="segmented-control-input"
      @focus="items[tabStop]?.focus()"
    />
  </div>
  <FieldMessage v-if="name" :help-id="`${errorId}-help`" :error-id="errorId" :error="shownError" />
</template>
