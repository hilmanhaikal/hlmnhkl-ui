<script setup lang="ts">
import { space, type Space } from '../../internal/space'
import styles from './Stack.module.css'

// The Vue Stack: the same look (Stack.module.css) as the React one. Other attributes go to the element.
const {
  gap = 5,
  align = 'stretch',
  as = 'div',
} = defineProps<{
  /** Space between items, as a step of the space scale (0 to 12, read as --gooee-space-N). */
  gap?: Space
  /** Lines items up across the stack. "stretch" makes each item full width. */
  align?: 'stretch' | 'start' | 'center' | 'end'
  /** Element to render, so the stack can be a list, a section or a form. */
  as?: 'div' | 'section' | 'article' | 'aside' | 'nav' | 'header' | 'footer' | 'main' | 'form' | 'fieldset' | 'ul' | 'ol'
}>()
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <component :is="as" :class="[styles.root, styles[align]]" data-slot="stack" :style="{ '--stack-gap': space(gap) }"><slot /></component>
</template>
