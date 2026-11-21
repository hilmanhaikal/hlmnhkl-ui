<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { leavesField } from '../../internal/formCore'
import { setNativeValue, useField, useMirror } from '../../internal/vue/useField'
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
  name,
  readOnly,
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
  /** The form cannot be sent while the field is empty. */
  required?: boolean
  /** Shows the number and sends it with the form, but typing, keys and the step buttons do not change it. */
  readOnly?: boolean
  /** Screen reader names for the step buttons. */
  labels?: Partial<NumberInputLabels>
}>()
/** The number, or null when the field is empty. Use v-model, or leave it out and the field keeps its own. */
const model = defineModel<number | null | undefined>({ default: undefined })
const emit = defineEmits<{
  /** Focus left the field, so vee-validate's handleBlur runs. */
  blur: [event: FocusEvent]
}>()
const inner = ref<number | null>(defaultValue)
const value = computed(() => (model.value !== undefined ? model.value : inner.value))
const setValue = (next: number | null) => {
  inner.value = next
  model.value = next
}

// The hidden input holds the plain number for the form; a form reset goes back to the first value.
const root = ref<HTMLElement | null>(null)
const visible = ref<HTMLInputElement | null>(null)
const mirror = ref<HTMLInputElement | null>(null)
defineExpose({ el: mirror })
const asText = (n: number | null) => (n === null ? '' : String(n))
const firstValue = value.value
useMirror(mirror, () => asText(value.value), () => asText(firstValue))
const form = useField({
  input: mirror,
  name: () => name,
  error: () => error,
  onSync: () => {
    const v = mirror.value?.value ?? ''
    const n = v === '' ? null : Number(v)
    if (v !== asText(value.value) && !Number.isNaN(n)) setValue(n)
  },
})
const shownError = form.error

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
  if (next !== value.value) {
    // A person's change: the hidden input fires a real change event first.
    if (mirror.value) setNativeValue(mirror.value, asText(next))
    setValue(next)
    form.changed()
  }
  if (editing.value) text.value = next === null ? '' : plain.value.format(next)
}
const bump = (dir: 1 | -1, size = step) => {
  if (readOnly) return
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
  if (readOnly) return
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
const onBlur = (e: FocusEvent) => {
  if (!readOnly) commit(parseNumber(text.value, locale))
  editing.value = false
  if (!leavesField(e, root.value)) return
  form.blurred()
  emit('blur', e)
}

const atMin = computed(() => value.value !== null && value.value <= min)
const atMax = computed(() => value.value !== null && value.value >= max)
const describedBy = computed(() => [help && !shownError.value ? helpId : null, shownError.value ? errorId : null].filter(Boolean).join(' ') || undefined)
const shown = computed(() => (editing.value ? text.value : value.value === null ? '' : fmt.value.format(value.value)))
</script>

<template>
  <div ref="root" :class="styles.root" data-slot="number-input" :data-readonly="readOnly || undefined">
    <label :for="id" :class="styles.label" data-slot="field-label">{{ label }}</label>
    <div :class="styles.field" data-slot="number-input-field" :data-invalid="shownError ? true : undefined" :data-disabled="disabled || undefined">
      <button
        type="button"
        tabindex="-1"
        :class="styles.step"
        data-slot="number-input-decrement"
        :aria-label="decreaseName"
        :aria-controls="id"
        :disabled="disabled || readOnly || atMin"
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
          ref="visible"
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
          :aria-invalid="shownError ? true : undefined"
          :aria-required="required || undefined"
          :aria-describedby="describedBy"
          :data-editing="editing || undefined"
          :disabled="disabled"
          :readonly="readOnly"
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
        :disabled="disabled || readOnly || atMax"
        @pointerdown="startHold(1)($event)"
        @pointerup="hold.stop"
        @pointerleave="hold.stop"
        @pointercancel="hold.stop"
        @click="$event.detail === 0 && bump(1)"
      >
        <PlusIcon />
      </button>
    </div>
    <!-- Holds the number for the form. Not type hidden, so required works; focus moves on to the field. -->
    <input
      ref="mirror"
      :name="name"
      :required="required"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      autocomplete="off"
      :class="styles.value"
      data-slot="number-input-value"
      @focus="visible?.focus()"
    />
    <FieldMessage :help-id="helpId" :error-id="errorId" :help="help" :error="shownError" />
  </div>
</template>
