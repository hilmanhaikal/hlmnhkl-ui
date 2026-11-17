<script setup lang="ts">
import { ref, watch } from 'vue'
import styles from './Roll.module.css'

// Text that rolls in from the side it moved toward (the Vue twin of Roll.tsx). With reduced motion it just
// changes. `still` swaps the text in place, for values that change on every frame of a drag.
const props = defineProps<{ text: string; class?: string; still?: boolean }>()
const dir = ref<'up' | 'down'>('up')
watch(
  () => props.text,
  (now, was) => (dir.value = now.localeCompare(was, undefined, { numeric: true }) > 0 ? 'up' : 'down'),
  { flush: 'sync' },
)
</script>

<template>
  <span :class="props.class ? `${styles.roll} ${props.class}` : styles.roll">
    <span :key="still ? 'still' : text" :class="still ? undefined : styles.in" :data-dir="dir">{{ text }}</span>
  </span>
</template>
