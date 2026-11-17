<script setup lang="ts">
import { space, type Space } from '../../internal/space'
import styles from './Cluster.module.css'

// The Vue Cluster: the same look (Cluster.module.css) as the React one. Other attributes go to the element.
withDefaults(
  defineProps<{
    /** Space between items, as a step of the space scale (0 to 12, read as --gooee-space-N). */
    gap?: Space
    /** Space between wrapped rows. Defaults to the same step as gap. */
    rowGap?: Space
    /** Lines items up inside a row. "baseline" keeps mixed text sizes on one line. */
    align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'
    /** Places items along the row. "between" pushes the first and last item to the edges. */
    justify?: 'start' | 'center' | 'end' | 'between'
    /** Lets items flow onto the next row when they run out of room. */
    wrap?: boolean
    /** Element to render, so a row of links can be a nav or a list. */
    as?: 'div' | 'section' | 'nav' | 'header' | 'footer' | 'ul' | 'ol'
  }>(),
  { gap: 3, align: 'center', justify: 'start', wrap: true, as: 'div' },
)
defineSlots<{ default?: () => unknown }>()
</script>

<template>
  <component
    :is="as"
    :class="[styles.root, styles[`align-${align}`], styles[`justify-${justify}`], !wrap && styles.nowrap]"
    :style="{ '--cluster-gap': space(gap), '--cluster-row-gap': space(rowGap ?? gap) }"
  >
    <slot />
  </component>
</template>
