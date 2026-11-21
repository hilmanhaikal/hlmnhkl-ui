<script setup lang="ts">
import styles from './IconButton.module.css'

// The Vue IconButton: the same look (IconButton.module.css) as the React one. The icon goes in the icon slot;
// other attributes and listeners, such as aria-pressed or a click listener, go to the button.
const {
  variant = 'ghost',
  size = 'md',
  type = 'button',
} = defineProps<{
  /** Required: the accessible name, since the button has no visible text. */
  label: string
  /** Visual weight. Ghost has no fill until hover. */
  variant?: 'primary' | 'secondary' | 'ghost'
  /** Size of the button. */
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
}>()
defineSlots<{ icon?: () => unknown }>()
</script>

<template>
  <button :type="type" :aria-label="label" data-slot="icon-button" :class="[styles.root, styles[variant], styles[size]]">
    <span data-slot="icon-button-icon" :class="styles.icon"><slot name="icon" /></span>
  </button>
</template>
