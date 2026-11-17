<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useAttrs, useId } from 'vue'
import { createSlider } from '../../internal/motion/slider'
import styles from './Slider.module.css'

// The Vue Slider: the same look (Slider.module.css), glide and marks as the React one.
// Other attributes, such as name or a listener, go to the input. A class goes to the root, as in React.
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
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
    disabled?: boolean
    id?: string
  }>(),
  { min: 0, max: 100, step: 1, showValue: true, formatValue: String },
)

/** The value. Use v-model, or leave it out and the slider keeps its own value. */
const model = defineModel<number>()
const local = ref(props.defaultValue ?? props.min)
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
const inputId = computed(() => props.id ?? auto)
// Where the thumb is drawn while it glides to a click or settles on a mark; the value is set already.
const shown = ref<number | null>(null)
const at = computed(() => shown.value ?? value.value)
const pct = computed(() => (props.max === props.min ? 0 : ((at.value - props.min) / (props.max - props.min)) * 100))
const text = computed(() => props.formatValue(value.value))

// The glide, the grab and the landing on marks (motion/slider.ts).
const slider = createSlider(
  () => ({ value: value.value, min: props.min, max: props.max, step: props.step, marks: props.marks }),
  (v) => (value.value = v),
  (v) => (shown.value = v),
)
onBeforeUnmount(slider.destroy)

const onInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  slider.input(input, Number(input.value))
  // A v-model that holds its value keeps the thumb where it was.
  input.value = String(at.value)
}
const onKeydown = (e: KeyboardEvent) => {
  slider.end()
  if (!e.defaultPrevented && slider.key(e.key)) e.preventDefault()
}
</script>

<template>
  <div :class="[styles.root, attrs.class]" :data-disabled="disabled || undefined">
    <div :class="styles.head">
      <label :for="inputId" :class="styles.label">{{ label }}</label>
      <output v-if="showValue" :for="inputId" :class="styles.value" aria-hidden="true">{{ text }}</output>
    </div>
    <div :class="styles.trackWrap" :data-gliding="shown !== null || undefined" :style="{ '--pct': `${pct}%`, '--p': pct / 100 }">
      <input
        v-bind="inputAttrs"
        :id="inputId"
        type="range"
        :class="styles.input"
        :min="min"
        :max="max"
        :step="shown === null ? step : 'any'"
        :value="at"
        :disabled="disabled"
        :aria-valuenow="value"
        :aria-valuetext="formatValue === String ? undefined : text"
        @input="onInput"
        @pointerdown="slider.down($event.currentTarget as HTMLInputElement, $event.clientX)"
        @pointermove="slider.move($event.clientX)"
        @pointerup="slider.up()"
        @pointercancel="slider.end()"
        @lostpointercapture="slider.end()"
        @blur="slider.end()"
        @keydown="onKeydown"
      />
      <span v-if="showValue" :class="styles.bubble" aria-hidden="true">{{ text }}</span>
      <!-- After the bubble, which CSS shows from the input just before it. -->
      <span v-if="marks?.length" :class="styles.marks" aria-hidden="true">
        <span v-for="m in marks" :key="m" :class="styles.mark" :data-on="m === value || undefined" :style="{ '--m': (m - min) / (max - min || 1) }" />
      </span>
    </div>
  </div>
</template>
