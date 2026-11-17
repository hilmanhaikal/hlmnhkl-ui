<script setup lang="ts">
import { computed, ref, useAttrs, useSlots } from 'vue'
import styles from './Toggle.module.css'

// The Vue Toggle: the same look (Toggle.module.css) as the React one. The icon goes in the icon slot;
// other attributes and listeners go to the button.
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Starting pressed state when there is no v-model. */
    defaultPressed?: boolean
    /** Height and text size, the same as Button. */
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit' | 'reset'
  }>(),
  { defaultPressed: false, size: 'md', type: 'button' },
)
/** Pressed state. Use v-model:pressed, or leave it out and the toggle keeps its own state. */
const model = defineModel<boolean | undefined>('pressed', { type: Boolean, default: undefined })
const slots = useSlots() as { default?: () => unknown; icon?: () => unknown }
const attrs = useAttrs()

const own = ref(props.defaultPressed)
const pressed = computed(() => model.value ?? own.value)
const rest = computed(() => {
  const { onClick: _onClick, ...others } = attrs
  return others
})
// The caller's click runs first, and can stop the change with preventDefault.
const onClick = (e: MouseEvent) => {
  const listener = attrs.onClick as ((e: MouseEvent) => void) | Array<(e: MouseEvent) => void> | undefined
  ;(Array.isArray(listener) ? listener : listener ? [listener] : []).forEach((f) => f(e))
  if (e.defaultPrevented) return
  own.value = !pressed.value
  model.value = own.value
}
</script>

<template>
  <button
    v-bind="rest"
    :type="type"
    :aria-pressed="pressed"
    :class="[styles.root, styles[size], !slots.default && styles.iconOnly]"
    :data-on="pressed || undefined"
    @click="onClick"
  >
    <span v-if="slots.icon" :class="styles.icon"><slot name="icon" /></span>
    <slot />
  </button>
</template>
