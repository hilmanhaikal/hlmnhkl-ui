<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { holdKey } from '../../internal/motion/keys'
import styles from './Kbd.module.css'

// The Vue Kbd: the same keycap (Kbd.module.css) as the React one. The key name goes in the default slot.
const props = defineProps<{
  /** A KeyboardEvent.key value. When set, the key presses down while the real key is held. */
  listen?: string
}>()

const down = ref(false)
watchEffect((stop) => {
  if (!props.listen || typeof window === 'undefined') return
  stop(holdKey(props.listen, (held) => (down.value = held)))
})
</script>

<template>
  <kbd data-slot="kbd" :class="styles.root" :data-state="down ? 'on' : 'off'"><slot /></kbd>
</template>
