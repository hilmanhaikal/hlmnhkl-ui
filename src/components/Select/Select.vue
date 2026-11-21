<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { leavesField } from '../../internal/formCore'
import { dismissable } from '../../internal/motion/layers'
import { createMorph } from '../../internal/motion/liquid'
import { createEdgeFlow } from '../../internal/motion/liquidMore'
import { createListbox } from '../../internal/motion/listbox'
import { setNativeValue, useField, useMirror } from '../../internal/vue/useField'
import { useFloating } from '../../internal/vue/useFloating'
import { usePresence } from '../../internal/vue/usePresence'
import { CheckIcon, ChevronDownIcon } from '../../icons/vue'
import styles from './Select.module.css'

// The Vue Select: the same look (Select.module.css), list morph, focus edge and keys as the React one.

export type SelectOption = { value: string; label: string; disabled?: boolean; hint?: string }

export type SelectLabels = {
  /** Shown in the open list when there are no options. */
  empty: string
}

const { hideLabel = false, options, defaultValue = null, placeholder = 'Choose one', help, error, labels: labelsProp, disabled, readOnly, name, id } = defineProps<{
  /** Visible name of the field, also read by screen readers. */
  label: string
  /** Keeps the label for screen readers only, for a list where a column heading already names the field. */
  hideLabel?: boolean
  /** Choices in the list, in order. */
  options: SelectOption[]
  /** Starting value when there is no v-model. */
  defaultValue?: string | null
  /** Shown when nothing is chosen yet. */
  placeholder?: string
  /** Hint under the field. Hidden while an error shows. */
  help?: string
  /** Error message under the field. Also marks the field invalid. */
  error?: string
  /** Text in the open list, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<SelectLabels>
  /** Stops the list from opening. */
  disabled?: boolean
  /** Submits the selected value in a hidden field with this name. */
  name?: string
  /** The form cannot be sent while nothing is chosen. */
  required?: boolean
  /** Shows the value and sends it with the form, but the list does not open. Shown with data-readonly. */
  readOnly?: boolean
  /** Id of the button, so a label's `for` can point at it. Inner ids add a suffix to it. */
  id?: string
}>()
const emit = defineEmits<{
  /** Focus left the field, so vee-validate's handleBlur runs. */
  blur: [event: FocusEvent]
}>()
const labels = computed<SelectLabels>(() => ({ empty: 'No options', ...labelsProp }))

/** The selected value. Use v-model, or leave it out and the field keeps its own. Null means nothing is chosen. */
const model = defineModel<string | null>()
const local = ref(defaultValue)
const value = computed({
  get: () => (model.value === undefined ? local.value : model.value),
  set: (next: string | null) => {
    local.value = next
    model.value = next
  },
})

const auto = useId()
const baseId = computed(() => id ?? auto)
const labelId = computed(() => `${baseId.value}-label`)
const listId = computed(() => `${baseId.value}-list`)
const helpId = computed(() => `${baseId.value}-help`)
const errorId = computed(() => `${baseId.value}-error`)
const emptyId = computed(() => `${baseId.value}-empty`)
const triggerId = computed(() => id ?? `${auto}-trigger`)

// The hidden input holds the value for the form; a form reset goes back to the first value.
const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
defineExpose({ el: input })
const firstValue = value.value
useMirror(input, () => value.value ?? '', () => firstValue ?? '')
const form = useField({ input, name: () => name, error: () => error, onSync: () => input.value && input.value.value !== (value.value ?? '') && (value.value = input.value.value || null) })
const shownError = form.error

const open = ref(false)
const active = ref(-1)
const trigger = ref<HTMLButtonElement | null>(null)
const listEl = ref<HTMLElement | null>(null)
const optionEls: Array<HTMLElement | null> = []
const { mounted, state } = usePresence(open, 'morph-out')
const { style, side, ready } = useFloating(trigger, listEl, mounted, { side: 'bottom', align: 'start', offset: 6, matchWidth: true })
// Vue, unlike React, adds no px to a number in a style.
const selectedIndex = computed(() => options.findIndex((o) => o.value === value.value))
const selected = computed(() => (selectedIndex.value >= 0 ? options[selectedIndex.value] : null))

// Arrows, Home, End, Enter, Space, Tab and type-ahead (motion/listbox.ts).
const list = createListbox(() => options)
const { enabled, first } = list

const openList = (at?: number) => {
  if (disabled || readOnly) return
  open.value = true
  active.value = at ?? (enabled(selectedIndex.value) ? selectedIndex.value : first())
}
const close = (focusTrigger = true) => {
  open.value = false
  if (focusTrigger) trigger.value?.focus()
}
// A person's choice: the hidden input fires a real change event first.
const commit = (next: string) => {
  if (next === value.value) return
  if (input.value) setNativeValue(input.value, next)
  value.value = next
  form.changed()
}
const choose = (i: number) => {
  if (!enabled(i)) return
  commit(options[i].value)
  close()
}
const onBlur = (e: FocusEvent) => {
  if (!leavesField(e, root.value, listEl.value)) return
  form.blurred()
  emit('blur', e)
}

const onKeyDown = (e: KeyboardEvent) => {
  const r = list.key(e, open.value, active.value, selectedIndex.value)
  if (!r) return
  if (r.prevent) e.preventDefault()
  if (r.open) openList(r.active)
  else if (r.active !== undefined) active.value = r.active
  if (r.choose) choose(active.value)
  if (r.tab) {
    if (enabled(active.value)) commit(options[active.value].value)
    open.value = false
  }
}

// The list grows out of the field and folds back into it (motion/liquid.ts).
const liquid = createMorph(() => listEl.value, { origin: () => trigger.value })
// Waits for the render that puts the list in its place, so the grow starts from the right shape.
watch(
  [state, ready],
  async () => {
    if (!ready.value) return
    await nextTick()
    liquid.play(state.value)
  },
  { flush: 'post' },
)

// Esc and a press outside close the list; only Esc puts focus back on the field.
let undismiss = () => {}
watch(
  open,
  (now) => {
    undismiss()
    undismiss = now ? dismissable(() => [trigger.value, listEl.value], (reason) => close(reason === 'escape')) : () => {}
  },
  { flush: 'post' },
)

// One highlight glides between the options.
const hl = ref<{ top: number; height: number } | null>(null)
watch(
  [active, open, mounted],
  () => {
    if (!open.value) return (hl.value = null)
    const el = optionEls[active.value]
    if (!el) return
    hl.value = { top: el.offsetTop, height: el.offsetHeight }
    el.scrollIntoView({ block: 'nearest' })
  },
  { flush: 'post' },
)

// Open or keyboard focused, the field's dark edge flows round it from where it was pressed (motion/liquidMore.ts).
let stopEdge = () => {}
onMounted(() => {
  if (trigger.value) stopEdge = createEdgeFlow(trigger.value, { when: ':is([data-state="open"], :focus-visible)', className: styles.edge }).destroy
})
onBeforeUnmount(() => {
  stopEdge()
  undismiss()
  liquid.destroy()
})

const empty = computed(() => options.length === 0)
const describedBy = computed(
  () => [help && !shownError.value ? helpId.value : null, shownError.value ? errorId.value : null, open.value && empty.value ? emptyId.value : null].filter(Boolean).join(' ') || undefined,
)
</script>

<template>
  <div ref="root" :class="styles.root" data-slot="select" :data-readonly="readOnly || undefined">
    <span :id="labelId" :class="[styles.label, hideLabel && styles.hiddenLabel]" data-slot="field-label" @click="trigger?.focus()">
      {{ label }}
    </span>
    <button
      :id="triggerId"
      ref="trigger"
      type="button"
      role="combobox"
      :class="styles.trigger"
      data-slot="select-trigger"
      :data-state="open ? 'open' : 'closed'"
      :data-invalid="shownError ? true : undefined"
      :aria-labelledby="`${labelId} ${triggerId}`"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open && enabled(active) ? `${baseId}-opt-${active}` : undefined"
      :aria-invalid="shownError ? true : undefined"
      :aria-required="required || undefined"
      :aria-readonly="readOnly || undefined"
      :aria-describedby="describedBy"
      :disabled="disabled"
      @click="open ? close() : openList()"
      @keydown="onKeyDown"
      @blur="onBlur"
    >
      <span :class="[styles.value, !selected && styles.placeholder]" data-slot="select-value">
        <span :key="selected?.value ?? 'none'" :class="styles.valueText" :title="selected ? selected.label : placeholder">
          {{ selected ? selected.label : placeholder }}
        </span>
      </span>
      <ChevronDownIcon :class="styles.chevron" data-slot="select-icon" />
    </button>
    <!-- Holds the value for the form. Not type hidden, so required works; focus moves on to the field. -->
    <input
      ref="input"
      :name="name"
      :required="required"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      autocomplete="off"
      :class="styles.input"
      data-slot="select-input"
      @focus="trigger?.focus()"
    />
    <FieldMessage :help-id="helpId" :error-id="errorId" :help="help" :error="shownError" />
    <Teleport v-if="mounted" to="body">
      <div
        :id="listId"
        ref="listEl"
        role="listbox"
        :aria-labelledby="labelId"
        tabindex="-1"
        :class="styles.list"
        data-slot="select-list"
        :data-state="state"
        :data-side="side"
        :style="style"
        @mousedown.prevent
      >
        <span v-if="hl" :class="styles.highlight" data-slot="select-highlight" :style="{ transform: `translateY(${hl.top}px)`, height: `${hl.height}px` }" aria-hidden="true" />
        <div
          v-for="(o, i) in options"
          :id="`${baseId}-opt-${i}`"
          :key="o.value"
          :ref="(el) => (optionEls[i] = el as HTMLElement | null)"
          role="option"
          :aria-selected="o.value === value"
          :aria-disabled="o.disabled || undefined"
          :class="styles.option"
          data-slot="select-option"
          :data-highlighted="i === active || undefined"
          :data-selected="o.value === value || undefined"
          :data-disabled="o.disabled || undefined"
          :style="{ '--i': Math.min(i, 12) }"
          @pointermove="enabled(i) && active !== i && (active = i)"
          @click="choose(i)"
        >
          <span :class="styles.optionText" data-slot="select-option-text">{{ o.label }}<span v-if="o.hint" :class="styles.hint" data-slot="select-option-hint">{{ o.hint }}</span></span>
          <CheckIcon :class="styles.check" data-slot="select-option-indicator" />
        </div>
        <div v-if="empty" :id="emptyId" :class="styles.empty" data-slot="select-empty">
          {{ labels.empty }}
        </div>
      </div>
    </Teleport>
  </div>
</template>
