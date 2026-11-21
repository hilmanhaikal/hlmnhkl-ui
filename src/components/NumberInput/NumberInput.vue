<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { MinusIcon, PlusIcon } from '../../icons/vue'
import { createHold, parseNumber, type NumberInputLabels } from '../../internal/motion/numberInput'
import AnimatedNumber from '../AnimatedNumber/AnimatedNumber.vue'
import styles from './NumberInput.module.css'

// The Vue NumberInput: the same look (NumberInput.module.css), keys and hold to repeat as the React one.
const {
  label,
  defaultValue = null,
  min = -Infinity,
  max = Infinity,
  step = 1,
  largeStep,
  formatOptions,
  locale,
  help,
  error,
  labels,
} = defineProps<{
  /** Visible name of the field, also read by screen readers. */
  label: string
  /** Starting value when there is no v-model. */
  defaultValue?: number | null
  /** Lowest allowed number. Typed values are clamped to it. */
  min?: number
  /** Highest allowed number. Typed values are clamped to it. */
  max?: number
  /** How much the buttons and arrow keys change the value. Its decimals set the rounding. */
  step?: number
  /** Step for Page Up and Page Down. Defaults to ten steps. */
  largeStep?: number
  /** Passed to Intl.NumberFormat, for currency, units or decimals. */
  formatOptions?: Intl.NumberFormatOptions
  /** Locale for showing and reading numbers. Undefined uses the browser locale. */
  locale?: string
  /** Hint under the field. Hidden while an error shows. */
  help?: string
  /** Error message under the field. Also marks the field invalid. */
  error?: string
  /** Stops typing and the step buttons. */
  disabled?: boolean
  /** Submits the plain number in a hidden field with this name. */
  name?: string
  /** Screen reader names for the step buttons. */
  labels?: Partial<NumberInputLabels>
}>()
/** The number, or null when the field is empty. Use v-model, or leave it out and the field keeps its own. */
const model = defineModel<number | null | undefined>({ default: undefined })
const inner = ref<number | null>(defaultValue)
const value = computed(() => (model.value !== undefined ? model.value : inner.value))
const setValue = (next: number | null) => {
  inner.value = next
  model.value = next
}

const nameOf = (text: NumberInputLabels['decrease'] | undefined, fallback: (l: string) => string) => {
  const t = text ?? fallback
  return typeof t === 'function' ? t(label) : t
}
const decreaseName = computed(() => nameOf(labels?.decrease, (l) => `Decrease ${l}`))
const increaseName = computed(() => nameOf(labels?.increase, (l) => `Increase ${l}`))
const id = useId()
const helpId = `${id}-help`
const errorId = `${id}-error`
const editing = ref(false)
const text = ref('')
const decimals = computed(() => (String(step).split('.')[1] ?? '').length)
const fmt = computed(() => new Intl.NumberFormat(locale, formatOptions))
const plain = computed(() => new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 20 }))

const clamp = (n: number) => Number(Math.min(max, Math.max(min, n)).toFixed(decimals.value))
const commit = (n: number | null) => {
  const next = n === null ? null : clamp(n)
  if (next !== value.value) setValue(next)
  if (editing.value) text.value = next === null ? '' : plain.value.format(next)
}
const bump = (dir: 1 | -1, size = step) => {
  const current = (editing.value ? parseNumber(text.value, locale) : null) ?? value.value
  const base = current ?? (min > -Infinity ? min : 0)
  commit(current === null ? base : base + dir * size)
}

const hold = createHold()
const startHold = (dir: 1 | -1) => (e: PointerEvent) => {
  // Chromium still sends pointer events to a disabled button
  if (e.button !== 0 || (e.currentTarget as HTMLButtonElement).disabled) return
  e.preventDefault()
  hold.start(
    (big) => bump(dir, big ? step * 5 : step),
    () => {
      const v = value.value
      return v !== null && (dir > 0 ? v >= max : v <= min)
    },
  )
}
onBeforeUnmount(hold.stop)

const onKeydown = (e: KeyboardEvent) => {
  const big = largeStep ?? step * 10
  const k = e.key
  if (k === 'ArrowUp') bump(1)
  else if (k === 'ArrowDown') bump(-1)
  else if (k === 'PageUp') bump(1, big)
  else if (k === 'PageDown') bump(-1, big)
  else if (k === 'Home' && min > -Infinity) commit(min)
  else if (k === 'End' && max < Infinity) commit(max)
  else if (k === 'Enter') commit(parseNumber(text.value, locale))
  else return
  e.preventDefault()
}
const onFocus = () => {
  editing.value = true
  text.value = value.value === null ? '' : plain.value.format(value.value)
}
const onBlur = () => {
  commit(parseNumber(text.value, locale))
  editing.value = false
}

const atMin = computed(() => value.value !== null && value.value <= min)
const atMax = computed(() => value.value !== null && value.value >= max)
const describedBy = computed(() => [help && !error ? helpId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined)
const shown = computed(() => (editing.value ? text.value : value.value === null ? '' : fmt.value.format(value.value)))
</script>

<template>
  <div :class="styles.root" data-slot="number-input">
    <label :for="id" :class="styles.label" data-slot="field-label">{{ label }}</label>
    <div :class="styles.field" data-slot="number-input-field" :data-invalid="error ? true : undefined" :data-disabled="disabled || undefined">
      <button
        type="button"
        tabindex="-1"
        :class="styles.step"
        data-slot="number-input-decrement"
        :aria-label="decreaseName"
        :aria-controls="id"
        :disabled="disabled || atMin"
        @pointerdown="startHold(-1)($event)"
        @pointerup="hold.stop"
        @pointerleave="hold.stop"
        @pointercancel="hold.stop"
        @click="$event.detail === 0 && bump(-1)"
      >
        <MinusIcon />
      </button>
      <div :class="styles.control">
        <input
          :id="id"
          :class="styles.input"
          data-slot="number-input-input"
          type="text"
          :inputmode="decimals || min < 0 ? 'decimal' : 'numeric'"
          role="spinbutton"
          autocomplete="off"
          :aria-valuenow="value ?? undefined"
          :aria-valuemin="min > -Infinity ? min : undefined"
          :aria-valuemax="max < Infinity ? max : undefined"
          :aria-valuetext="value !== null ? fmt.format(value) : undefined"
          :aria-invalid="error ? true : undefined"
          :aria-describedby="describedBy"
          :data-editing="editing || undefined"
          :disabled="disabled"
          :value="shown"
          @focus="onFocus"
          @blur="onBlur"
          @input="text = ($event.target as HTMLInputElement).value"
          @keydown="onKeydown"
        />
        <span v-if="!editing && value !== null" :class="styles.rolling" aria-hidden="true">
          <AnimatedNumber :value="value" :format-options="formatOptions" :locale="locale" />
        </span>
      </div>
      <button
        type="button"
        tabindex="-1"
        :class="styles.step"
        data-slot="number-input-increment"
        :aria-label="increaseName"
        :aria-controls="id"
        :disabled="disabled || atMax"
        @pointerdown="startHold(1)($event)"
        @pointerup="hold.stop"
        @pointerleave="hold.stop"
        @pointercancel="hold.stop"
        @click="$event.detail === 0 && bump(1)"
      >
        <PlusIcon />
      </button>
    </div>
    <input v-if="name" type="hidden" :name="name" :value="value ?? ''" />
    <FieldMessage :help-id="helpId" :error-id="errorId" :help="help" :error="error" />
  </div>
</template>
