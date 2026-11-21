<script setup lang="ts">
import { cloneVNode, computed, ref, useId, type VNode } from 'vue'
import { firstNode } from '../../internal/vue/trigger'
import { ChevronDownIcon } from '../../icons/vue'
import styles from './Collapsible.module.css'

// The Vue Collapsible: the same look (Collapsible.module.css) as the React one. For your own button, put it in
// the trigger slot: it gets the ARIA and the click, like React's cloneElement. The slot props carry the same, for
// those who bind them by hand.
const { defaultOpen = false, disabled } = defineProps<{
  /** Text for the built-in toggle button. The label slot replaces it. */
  label?: string
  /** Starting open state when there is no v-model:open. */
  defaultOpen?: boolean
  /** Stops the panel from opening or closing. */
  disabled?: boolean
}>()
/** Open state. Use v-model:open, or leave it out and the part keeps its own state. */
const model = defineModel<boolean | undefined>('open', { default: undefined })
const slots = defineSlots<{
  default?: () => unknown
  label?: () => unknown
  trigger?: (props: { 'aria-expanded': boolean; 'aria-controls': string; disabled?: boolean; 'aria-disabled'?: boolean; onClick: () => void }) => VNode[]
}>()

const id = useId()
const local = ref(defaultOpen)
const open = computed(() => model.value ?? local.value)
const toggle = () => {
  if (disabled) return
  const next = !open.value
  local.value = next
  model.value = next
}
// Only set when disabled, so a trigger's own disabled attribute is kept otherwise.
const triggerProps = computed(() => ({
  'aria-expanded': open.value,
  'aria-controls': `${id}-panel`,
  ...(disabled ? { disabled: true, 'aria-disabled': true } : null),
  onClick: toggle,
}))
// Vue merges two listeners only when they differ, so a trigger that also binds the slot props toggles once.
const trigger = () => {
  const node = firstNode(slots.trigger?.(triggerProps.value))
  return node ? cloneVNode(node, triggerProps.value, true) : null
}
</script>

<template>
  <div data-slot="collapsible" :class="styles.root" :data-state="open ? 'open' : 'closed'" :data-disabled="disabled || undefined">
    <component :is="trigger()" v-if="slots.trigger" />
    <button v-else type="button" data-slot="collapsible-trigger" :class="styles.trigger" :aria-expanded="open" :aria-controls="`${id}-panel`" :disabled="disabled" @click="toggle">
      <span data-slot="collapsible-label" :class="styles.label"><slot name="label">{{ label }}</slot></span>
      <ChevronDownIcon data-slot="collapsible-icon" :class="styles.chevron" />
    </button>
    <!-- Grid rows animate from 0fr to 1fr, so the height follows the content without measuring. -->
    <div :id="`${id}-panel`" data-slot="collapsible-panel" :class="styles.panel" :inert="!open">
      <div :class="styles.inner">
        <div data-slot="collapsible-content" :class="styles.content"><slot /></div>
      </div>
    </div>
  </div>
</template>
