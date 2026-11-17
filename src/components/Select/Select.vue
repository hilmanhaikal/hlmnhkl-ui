<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { dismissable } from '../../internal/motion/layers'
import { createLiquid } from '../../internal/motion/liquid'
import { edgeFlow } from '../../internal/motion/liquidMore'
import { createListbox } from '../../internal/motion/listbox'
import { useFloating } from '../../internal/vue/useFloating'
import { usePresence } from '../../internal/vue/usePresence'
import { CheckIcon, ChevronDownIcon } from '../../internal/vueIcons'
import styles from './Select.module.css'

// The Vue Select: the same look (Select.module.css), list morph, focus edge and keys as the React one.

export type SelectOption = { value: string; label: string; disabled?: boolean; hint?: string }

const props = withDefaults(
  defineProps<{
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
    /** Shown in the open list when there are no options. */
    emptyText?: string
    /** Stops the list from opening. */
    disabled?: boolean
    /** Submits the selected value in a hidden field with this name. */
    name?: string
    /** Id of the button, so a label's `for` can point at it. Inner ids add a suffix to it. */
    id?: string
  }>(),
  { hideLabel: false, defaultValue: null, placeholder: 'Choose one', emptyText: 'No options' },
)

/** The selected value. Use v-model, or leave it out and the field keeps its own. Null means nothing is chosen. */
const model = defineModel<string | null>()
const local = ref(props.defaultValue)
const value = computed({
  get: () => (model.value === undefined ? local.value : model.value),
  set: (next: string | null) => {
    local.value = next
    model.value = next
  },
})

const auto = useId()
const baseId = computed(() => props.id ?? auto)
const labelId = computed(() => `${baseId.value}-label`)
const listId = computed(() => `${baseId.value}-list`)
const helpId = computed(() => `${baseId.value}-help`)
const errorId = computed(() => `${baseId.value}-error`)
const emptyId = computed(() => `${baseId.value}-empty`)
const triggerId = computed(() => props.id ?? `${auto}-trigger`)

const open = ref(false)
const active = ref(-1)
const trigger = ref<HTMLButtonElement | null>(null)
const listEl = ref<HTMLElement | null>(null)
const optionEls: Array<HTMLElement | null> = []
const { mounted, state } = usePresence(open, 'morph-out')
const { style, side, ready } = useFloating(trigger, listEl, mounted, { side: 'bottom', align: 'start', offset: 6, matchWidth: true })
// Vue, unlike React, adds no px to a number in a style.
const selectedIndex = computed(() => props.options.findIndex((o) => o.value === value.value))
const selected = computed(() => (selectedIndex.value >= 0 ? props.options[selectedIndex.value] : null))

// Arrows, Home, End, Enter, Space, Tab and type-ahead (motion/listbox.ts).
const list = createListbox(() => props.options)
const { enabled, first } = list

const openList = (at?: number) => {
  if (props.disabled) return
  open.value = true
  active.value = at ?? (enabled(selectedIndex.value) ? selectedIndex.value : first())
}
const close = (focusTrigger = true) => {
  open.value = false
  if (focusTrigger) trigger.value?.focus()
}
const choose = (i: number) => {
  if (!enabled(i)) return
  value.value = props.options[i].value
  close()
}

const onKeyDown = (e: KeyboardEvent) => {
  const r = list.key(e, open.value, active.value, selectedIndex.value)
  if (!r) return
  if (r.prevent) e.preventDefault()
  if (r.open) openList(r.active)
  else if (r.active !== undefined) active.value = r.active
  if (r.choose) choose(active.value)
  if (r.tab) {
    if (enabled(active.value)) value.value = props.options[active.value].value
    open.value = false
  }
}

// The list grows out of the field and folds back into it (motion/liquid.ts).
const liquid = createLiquid(
  () => listEl.value,
  () => trigger.value,
)
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
  if (trigger.value) stopEdge = edgeFlow(trigger.value, trigger.value, ':is([data-open], :focus-visible)', styles.edge)
})
onBeforeUnmount(() => {
  stopEdge()
  undismiss()
  liquid.destroy()
})

const empty = computed(() => props.options.length === 0)
const describedBy = computed(
  () => [props.help && !props.error ? helpId.value : null, props.error ? errorId.value : null, open.value && empty.value ? emptyId.value : null].filter(Boolean).join(' ') || undefined,
)
</script>

<template>
  <div :class="styles.root">
    <span :id="labelId" :class="[styles.label, hideLabel && styles.hiddenLabel]" @click="trigger?.focus()">
      {{ label }}
    </span>
    <button
      :id="triggerId"
      ref="trigger"
      type="button"
      role="combobox"
      :class="styles.trigger"
      :data-open="open || undefined"
      :data-invalid="error ? true : undefined"
      :aria-labelledby="`${labelId} ${triggerId}`"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open && enabled(active) ? `${baseId}-opt-${active}` : undefined"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      :disabled="disabled"
      @click="open ? close() : openList()"
      @keydown="onKeyDown"
    >
      <span :class="[styles.value, !selected && styles.placeholder]">
        <span :key="selected?.value ?? 'none'" :class="styles.valueText" :title="selected ? selected.label : placeholder">
          {{ selected ? selected.label : placeholder }}
        </span>
      </span>
      <ChevronDownIcon :class="styles.chevron" />
    </button>
    <input v-if="name" type="hidden" :name="name" :value="value ?? ''" />
    <FieldMessage :help-id="helpId" :error-id="errorId" :help="help" :error="error" />
    <Teleport v-if="mounted" to="body">
      <div
        :id="listId"
        ref="listEl"
        role="listbox"
        :aria-labelledby="labelId"
        tabindex="-1"
        :class="styles.list"
        :data-state="state"
        :data-side="side"
        :style="style"
        @mousedown.prevent
      >
        <span v-if="hl" :class="styles.highlight" :style="{ transform: `translateY(${hl.top}px)`, height: `${hl.height}px` }" aria-hidden="true" />
        <div
          v-for="(o, i) in options"
          :id="`${baseId}-opt-${i}`"
          :key="o.value"
          :ref="(el) => (optionEls[i] = el as HTMLElement | null)"
          role="option"
          :aria-selected="o.value === value"
          :aria-disabled="o.disabled || undefined"
          :class="styles.option"
          :data-active="i === active || undefined"
          :style="{ '--i': i }"
          @pointermove="enabled(i) && active !== i && (active = i)"
          @click="choose(i)"
        >
          <span :class="styles.optionText">{{ o.label }}<span v-if="o.hint" :class="styles.hint">{{ o.hint }}</span></span>
          <CheckIcon :class="styles.check" :data-on="o.value === value || undefined" />
        </div>
        <div v-if="empty" :id="emptyId" :class="styles.empty">
          {{ emptyText }}
        </div>
      </div>
    </Teleport>
  </div>
</template>
