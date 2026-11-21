<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { motionMs } from './motion'
import styles from './FieldMessage.module.css'

// The Vue field message: the same look (FieldMessage.module.css) as the React one.
const props = defineProps<{ helpId: string; errorId: string; help?: string; error?: string }>()

const hasError = computed(() => !!props.error)
// The last error stays visible while it animates out.
const lastError = ref(props.error)
let leaving = 0
watch(
  () => props.error,
  (now) => {
    clearTimeout(leaving)
    if (now) lastError.value = now
    else leaving = window.setTimeout(() => (lastError.value = undefined), motionMs('base'))
  },
)
const shown = computed(() => (hasError.value ? props.error : lastError.value))
</script>

<template>
  <div v-if="help" :class="[styles.collapse, !hasError && styles.open]">
    <div :class="styles.inner">
      <p :id="helpId" data-slot="field-help" :class="styles.help">{{ help }}</p>
    </div>
  </div>
  <div :class="[styles.collapse, hasError && styles.open]" aria-live="polite">
    <div :class="styles.inner">
      <!-- Hidden from screen readers while it closes, so only the live error is read. -->
      <p v-if="shown" :id="hasError ? errorId : undefined" data-slot="field-error" :class="styles.error" :aria-hidden="hasError ? undefined : true">
        <svg viewBox="0 0 16 16" aria-hidden="true" :class="styles.mark">
          <circle cx="8" cy="8" r="7" />
          <path d="M8 4.5v4.25M8 11v.01" />
        </svg>{{ shown }}
      </p>
    </div>
  </div>
</template>
