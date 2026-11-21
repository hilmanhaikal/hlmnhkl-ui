<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import styles from './Avatar.module.css'

// The Vue Avatar: the same look (Avatar.module.css) as the React one.
const { name, src, size = 'md' } = defineProps<{
  /** Used for the alt text and the initials fallback. */
  name: string
  /** Image URL. Initials show while it loads and if it fails. */
  src?: string
  /** Diameter of the avatar. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Shows a status dot and adds the status to the spoken name. */
  status?: 'online' | 'away' | 'offline'
}>()

const state = ref<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error')
watch(
  () => src,
  (src) => (state.value = src ? 'loading' : 'error'),
)

const initials = computed(() =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join(''),
)

// A server-rendered image can finish before Vue hydrates, so its load event is gone by then.
const seen = (img: unknown) => {
  if (img instanceof HTMLImageElement && img.complete && state.value === 'loading') state.value = img.naturalWidth ? 'loaded' : 'error'
}
</script>

<template>
  <span data-slot="avatar" :class="[styles.root, styles[size]]" role="img" :aria-label="status ? `${name}, ${status}` : name">
    <span data-slot="avatar-fallback" :class="styles.fallback" aria-hidden="true">{{ initials }}</span>
    <img
      v-if="src && state !== 'error'"
      :ref="seen"
      data-slot="avatar-image"
      :class="styles.img"
      :src="src"
      alt=""
      :data-loaded="state === 'loaded' || undefined"
      @load="state = 'loaded'"
      @error="state = 'error'"
    />
    <span v-if="status" data-slot="avatar-status" :class="styles.status" :data-status="status" aria-hidden="true" />
  </span>
</template>
