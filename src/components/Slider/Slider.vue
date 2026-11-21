<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { onFormReset } from '../../internal/formCore'
import { createSlider } from '../../internal/motion/slider'
import { useField } from '../../internal/vue/useField'
import styles from './Slider.module.css'

// The Vue Slider: the same look (Slider.module.css), glide and marks as the React one.
// Other attributes, such as name or a listener, go to the input. A class goes to the root, as in React.
defineOptions({ inheritAttrs: false })

const {
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  formatValue = String,
  marks,
  readOnly,
  error,
  id,
} = defineProps<{
  /** Visible name of the slider, also read by screen readers. */
  label: string
  /** Starting value when there is no v-model. Undefined starts at min. */
  defaultValue?: number
  /** Lowest value on the track. */
  min?: number
  /** Highest value on the track. */
  max?: number
  /** Size of each move, by drag or arrow key. */
  step?: number
  /** Shows the value next to the label and in a bubble while dragging. */
  showValue?: boolean
  /** Turns the number into the text shown and read by screen readers. */
  formatValue?: (value: number) => string
  /** Values the thumb is drawn to as it passes, shown as dots on the track. Let go near one and it lands on it; Page Up and Page Down jump between them. */
  marks?: number[]
  /** Keeps the thumb where it is and still sends the value with the form. Shown with data-readonly. */
  readOnly?: boolean
  /** Error message under the slider. Marks the slider invalid. */
  error?: string
  disabled?: boolean
  id?: string
}>()

const emit = defineEmits<{ /** The value once it comes to rest: the hand lets go, a key comes up, or the slider loses focus. */ valueCommit: [value: number] }>()

/** The value, set on each new one while the thumb moves. Use v-model, or leave it out and the slider keeps its own value. */
const model = defineModel<number>()
const local = ref(defaultValue ?? min)
const value = computed({
  get: () => model.value ?? local.value,
  set: (next: number) => {
    local.value = next
    model.value = next
  },
})
const attrs = useAttrs()
const inputAttrs = computed(() => {
  const { class: _, ...rest } = attrs
  return rest
})

const auto = useId()
const inputId = computed(() => id ?? auto)
// Where the thumb is drawn while it glides to a click or settles on a mark; the value is set already.
const shown = ref<number | null>(null)
const at = computed(() => shown.value ?? value.value)
const pct = computed(() => (max === min ? 0 : ((at.value - min) / (max - min)) * 100))
const text = computed(() => formatValue(value.value))

// The glide, the grab and the landing on marks (motion/slider.ts).
const slider = createSlider(
  () => ({ value: value.value, min, max, step, marks }),
  (v) => (value.value = v),
  (v) => (shown.value = v),
  (v) => emit('valueCommit', v),
)
onBeforeUnmount(slider.destroy)

// The range input is the form field. The drawn place during a glide is not a value set by code.
const inner = ref<HTMLInputElement | null>(null)
defineExpose({ el: inner })
// Vue keeps the input's default in step with its value, so a form reset is brought back here.
const firstValue = value.value
let stopReset = () => {}
onMounted(() => {
  if (inner.value)
    stopReset = onFormReset(inner.value, () => {
      slider.end()
      value.value = firstValue
    })
})
onBeforeUnmount(() => stopReset())
const form = useField({
  input: inner,
  name: () => attrs.name as string | undefined,
  error: () => error,
  onSync: () => {
    const el = inner.value
    if (el && shown.value === null && Number(el.value) !== value.value) value.value = Number(el.value)
  },
})
const shownError = form.error
const errorId = computed(() => `${inputId.value}-error`)
const describedBy = computed(() => [shownError.value ? errorId.value : null, attrs['aria-describedby']].filter(Boolean).join(' ') || undefined)

const onInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!readOnly) {
    slider.input(input, Number(input.value))
    form.changed()
  }
  // A v-model that holds its value keeps the thumb where it was.
  input.value = String(at.value)
}
const onKeydown = (e: KeyboardEvent) => {
  if (readOnly && e.key !== 'Tab') e.preventDefault()
  if (!e.defaultPrevented && slider.key(e.key)) e.preventDefault()
}
const onPointerdown = (e: PointerEvent) => {
  if (readOnly) e.preventDefault()
  else slider.down(e.currentTarget as HTMLInputElement, e.clientX)
}
</script>

<template>
  <div
    :class="[styles.root, attrs.class]"
    data-slot="slider"
    data-orientation="horizontal"
    :data-disabled="disabled || undefined"
    :data-readonly="readOnly || undefined"
    :data-invalid="shownError ? true : undefined"
  >
    <div :class="styles.head">
      <label :for="inputId" :class="styles.label" data-slot="field-label">{{ label }}</label>
      <output v-if="showValue" :for="inputId" :class="styles.value" data-slot="slider-value" aria-hidden="true">{{ text }}</output>
    </div>
    <div :class="styles.trackWrap" data-slot="slider-control" :data-gliding="shown !== null || undefined" :style="{ '--pct': `${pct}%`, '--p': pct / 100 }">
      <input
        v-bind="inputAttrs"
        :id="inputId"
        ref="inner"
        type="range"
        :class="styles.input"
        data-slot="slider-input"
        :min="min"
        :max="max"
        :step="shown === null ? step : 'any'"
        :value="at"
        :disabled="disabled"
        :aria-valuenow="value"
        :aria-valuetext="formatValue === String ? undefined : text"
        :aria-readonly="readOnly || undefined"
        :aria-invalid="shownError ? true : undefined"
        :aria-describedby="describedBy"
        @input="onInput"
        @pointerdown="onPointerdown"
        @pointermove="slider.move($event.clientX)"
        @pointerup="slider.up()"
        @pointercancel="slider.end()"
        @lostpointercapture="slider.end()"
        @blur="slider.end(), form.blurred()"
        @keydown="onKeydown"
        @keyup="slider.keyUp()"
      />
      <span v-if="showValue" :class="styles.bubble" data-slot="slider-bubble" aria-hidden="true">{{ text }}</span>
      <!-- After the bubble, which CSS shows from the input just before it. -->
      <span v-if="marks?.length" :class="styles.marks" data-slot="slider-marks" aria-hidden="true">
        <span v-for="m in marks" :key="m" :class="styles.mark" data-slot="slider-mark" :data-state="m === value ? 'active' : 'inactive'" :style="{ '--m': (m - min) / (max - min || 1) }" />
      </span>
    </div>
    <FieldMessage :help-id="`${inputId}-help`" :error-id="errorId" :error="shownError" />
  </div>
</template>
