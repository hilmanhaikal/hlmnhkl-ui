<script setup lang="ts">
import { computed } from 'vue'
import styles from './Skeleton.module.css'

// The Vue Skeleton: the same shapes (Skeleton.module.css) as the React one.
// Decorative only. Mark the loading container with aria-busy and a label instead.
const { shape = 'rect', lines = 1, variant = 'solid' } = defineProps<{
  /** Text draws lines, rect a box, circle a round shape such as an avatar. */
  shape?: 'text' | 'rect' | 'circle'
  /** Any CSS width, such as 120 or "50%". */
  width?: number | string
  /** Any CSS height. Ignored for text, where lines set the height. */
  height?: number | string
  /** For text: number of lines. The last one is shorter, like real text. */
  lines?: number
  /** Solid grey shapes, or a sketch: the same shapes as dashed outlines, like a pencil layout. */
  variant?: 'solid' | 'sketch'
}>()

// A number is pixels, as in React.
const px = (v: number | string | undefined) => (typeof v === 'number' ? `${v}px` : v)
const look = computed(() => variant === 'sketch' && styles.sketch)
</script>

<template>
  <span v-if="shape === 'text'" :class="styles.lines" data-slot="skeleton" :style="{ width: px(width) }" aria-hidden="true">
    <span
      v-for="i in lines"
      :key="i - 1"
      :class="[styles.bone, styles.text, look]"
      data-slot="skeleton-line"
      :style="{ width: lines > 1 && i === lines ? '62%' : '100%', '--i': i - 1 }"
    />
  </span>
  <span v-else :class="[styles.bone, styles[shape], look]" data-slot="skeleton" :style="{ width: px(width), height: px(height) }" aria-hidden="true" />
</template>
