<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { ChevronDownIcon } from '../../internal/vueIcons'
import styles from './Collapsible.module.css'

// The Vue Collapsible: the same look (Collapsible.module.css) as the React one. For your own button, use the
// trigger slot and bind what it gives: <template #trigger="t"><Button v-bind="t">Details</Button></template>.
const props = withDefaults(
  defineProps<{
    /** Text for the built-in toggle button. The label slot replaces it. */
    label?: string
    /** Starting open state when there is no v-model:open. */
    defaultOpen?: boolean
    /** Stops the panel from opening or closing. */
    disabled?: boolean
  }>(),
  { defaultOpen: false },
)
/** Open state. Use v-model:open, or leave it out and the part keeps its own state. */
const model = defineModel<boolean | undefined>('open', { default: undefined })
const slots = defineSlots<{
  default?: () => unknown
  label?: () => unknown
  trigger?: (props: { 'aria-expanded': boolean; 'aria-controls': string; disabled?: boolean; 'aria-disabled'?: boolean; onClick: () => void }) => unknown
}>()

const id = useId()
const local = ref(props.defaultOpen)
const open = computed(() => model.value ?? local.value)
const toggle = () => {
  if (props.disabled) return
  const next = !open.value
  local.value = next
  model.value = next
}
// Only set when disabled, so a trigger's own disabled attribute is kept otherwise.
const triggerProps = computed(() => ({
  'aria-expanded': open.value,
  'aria-controls': `${id}-panel`,
  ...(props.disabled ? { disabled: true, 'aria-disabled': true } : null),
  onClick: toggle,
}))
</script>

<template>
  <div :class="styles.root" :data-open="open || undefined">
    <slot v-if="slots.trigger" name="trigger" v-bind="triggerProps" />
    <button v-else type="button" :class="styles.trigger" :aria-expanded="open" :aria-controls="`${id}-panel`" :disabled="disabled" @click="toggle">
      <span :class="styles.label"><slot name="label">{{ label }}</slot></span>
      <ChevronDownIcon :class="styles.chevron" />
    </button>
    <!-- Grid rows animate from 0fr to 1fr, so the height follows the content without measuring. -->
    <div :id="`${id}-panel`" :class="styles.panel" :inert="!open">
      <div :class="styles.inner">
        <div :class="styles.content"><slot /></div>
      </div>
    </div>
  </div>
</template>
