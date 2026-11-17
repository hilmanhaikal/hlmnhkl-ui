<script setup lang="ts">
import { computed } from 'vue'
import { space, type Space } from '../../internal/space'
import styles from './Split.module.css'

// The Vue Split: the same look (Split.module.css) as the React one. The sidebar slot is the narrow column;
// leave it out for one column. Other attributes go to the outer box.
const props = withDefaults(
  defineProps<{
    /** Which side the sidebar sits on. It also comes first ("start") or last ("end") when the columns stack. */
    side?: 'start' | 'end'
    /** Width of the sidebar, from the --gooee-split-side-* tokens. */
    sidebarWidth?: 'sm' | 'md' | 'lg'
    /** Space between the columns, and between them once stacked, as a step of the space scale. */
    gap?: Space
    /** What shows once the columns stack: both, only main, or only the sidebar. */
    stacked?: 'both' | 'main' | 'sidebar'
  }>(),
  { side: 'start', sidebarWidth: 'md', gap: 7, stacked: 'both' },
)
const slots = defineSlots<{ default?: () => unknown; sidebar?: () => unknown }>()
const hasSide = computed(() => !!slots.sidebar)
</script>

<!-- The outer box is the query container: an element cannot query its own width. -->
<template>
  <div :class="styles.root" :style="{ '--split-gap': space(gap), '--split-side': `var(--gooee-split-side-${sidebarWidth})` }">
    <div :class="[styles.inner, hasSide ? styles[side] : styles.solo]" :data-stacked="stacked">
      <div v-if="hasSide && side === 'start'" :class="styles.side"><slot name="sidebar" /></div>
      <div :class="styles.main"><slot /></div>
      <div v-if="hasSide && side === 'end'" :class="styles.side"><slot name="sidebar" /></div>
    </div>
  </div>
</template>
