<script setup lang="ts">
import { onMounted, ref } from 'vue'
import styles from './Spinner.module.css'

// The Vue Spinner: the same look (Spinner.module.css) as the React one.

const { size = 'md', label = 'Loading' } = defineProps<{
  /** Diameter of the spinner. */
  size?: 'sm' | 'md' | 'lg'
  /** Spoken to screen readers. Pass null when a parent already announces the busy state. */
  label?: string | null
}>()

// The label lands after the empty live region is mounted, so screen readers hear it.
const mounted = ref(false)
onMounted(() => (mounted.value = true))
</script>

<template>
  <span :class="[styles.root, styles[size]]" data-slot="spinner" :role="label ? 'status' : undefined">
    <svg :class="styles.svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle :class="styles.track" data-slot="spinner-track" cx="12" cy="12" r="9.5" />
      <circle :class="styles.arc" data-slot="spinner-indicator" cx="12" cy="12" r="9.5" pathLength="100" />
    </svg>
    <span v-if="label" :class="styles.srOnly">{{ mounted ? label : null }}</span>
  </span>
</template>
