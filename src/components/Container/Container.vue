<script setup lang="ts">
import { space, type Space } from '../../internal/space'
import styles from './Container.module.css'

// The Vue Container: the same look (Container.module.css) as the React one. Other attributes go to the element.
withDefaults(
  defineProps<{
    /** Widest the content gets, from the --gooee-container-* tokens. "full" never stops growing. */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    /** Space on the left and right, as a step of the space scale. The notch area on a phone wins when it is wider. */
    padding?: Space
    /** Element to render, such as main for the page body. */
    as?: 'div' | 'main' | 'section' | 'article' | 'header' | 'footer'
  }>(),
  { size: 'lg', padding: 5, as: 'div' },
)
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <component :is="as" :class="[styles.root, styles[size]]" :style="{ '--container-pad': space(padding) }"><slot /></component>
</template>
