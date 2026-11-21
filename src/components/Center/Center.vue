<script setup lang="ts">
import { space, type Space } from '../../internal/space'
import styles from './Center.module.css'

// The Vue Center: the same look (Center.module.css) as the React one. Other attributes go to the element.
const {
  axis = 'both',
  centerText = true,
  gap = 4,
  as = 'div',
} = defineProps<{
  /** "both" centres across and down; "inline" only across, and content starts at the top. */
  axis?: 'both' | 'inline'
  /** Least height of the box, from the --gooee-center-h-* tokens. "screen" fills the visible screen. Down centring needs a height to work in. */
  minHeight?: 'sm' | 'md' | 'lg' | 'screen'
  /** Centres each line of text too. Turn off for long text that reads better from the left. */
  centerText?: boolean
  /** Space between the items, as a step of the space scale. */
  gap?: Space
  /** Element to render, such as main for a full page error. */
  as?: 'div' | 'section' | 'main' | 'article'
}>()
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <component
    :is="as"
    data-slot="center"
    :class="[styles.root, axis === 'both' && styles.both, centerText && styles.text]"
    :style="{ '--center-gap': space(gap), '--center-min-h': minHeight ? `var(--gooee-center-h-${minHeight})` : undefined }"
  >
    <slot />
  </component>
</template>
