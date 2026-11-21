<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { bodyAt, createThemeIcon, RAYS, raysAt } from '../../internal/motion/themeIcon'
import { themeReveal } from '../../internal/motion/themeReveal'
import IconButton from '../IconButton/IconButton.vue'
import styles from './ThemeToggle.module.css'

export type ThemeToggleTheme = 'light' | 'dark'

// The Vue ThemeToggle: the same button, icon morph and circle reveal as the React one. themeScript, for
// <head>, is in internal/motion/themeReveal.ts.
const {
  theme: themeProp,
  storageKey = 'gooee-theme',
  reveal = true,
  size = 'sm',
} = defineProps<{
  /** The theme, with v-model:theme. Leave it out and the toggle sets data-theme on <html> itself. */
  theme?: ThemeToggleTheme
  /** Where the choice is remembered when the toggle runs the page. Match it in themeScript. */
  storageKey?: string
  /** The new theme grows from the button in a circle over the screen. Turn it off for an instant change. */
  reveal?: boolean
  /** The button's size, the same as IconButton. */
  size?: 'sm' | 'md' | 'lg'
}>()
/** update:theme: the new theme on every flip. */
const emit = defineEmits<{ 'update:theme': [theme: ThemeToggleTheme] }>()

const controlled = computed(() => themeProp !== undefined)
const own = ref<ThemeToggleTheme>('light')
const theme = computed(() => themeProp ?? own.value)
const next = computed<ThemeToggleTheme>(() => (theme.value === 'dark' ? 'light' : 'dark'))

// Read after mount: the server cannot know the page's theme, and themeScript has already set it.
onMounted(() => {
  if (!controlled.value) own.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
})

// Shows the theme the button switches to: the moon in light, the sun in dark (motion/themeIcon.ts).
const body = ref<SVGPathElement | null>(null)
const icon = createThemeIcon(() => body.value, theme.value === 'dark' ? 0 : 1)
// A theme set from outside (or the first paint): morph to it, unless a press already started that morph.
watch(
  theme,
  (t) => {
    const to = t === 'dark' ? 0 : 1
    if (icon.aim !== to) icon.morphTo(to)
  },
  { flush: 'post' },
)
onBeforeUnmount(icon.destroy)

// The theme is in the page once Vue has drawn it, so the view transition photographs the new page.
const apply = async () => {
  const to = next.value
  if (!controlled.value) {
    document.documentElement.dataset.theme = to
    try {
      localStorage.setItem(storageKey, to)
    } catch {
      // Not saved, so it lasts only this visit; the theme still changes.
    }
    own.value = to
  }
  emit('update:theme', to)
  await nextTick()
}
// The icon answers the press at once; the theme change, and its circle, start two frames later, so
// the first motion is on screen before the page is held still to be photographed.
const flip = (e: MouseEvent) => {
  const origin = e.currentTarget as Element
  icon.morphTo(next.value === 'dark' ? 0 : 1)
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (reveal) themeReveal(origin, apply)
      else void apply()
    }),
  )
}
</script>

<template>
  <IconButton :label="`Switch to ${next} theme`" variant="secondary" :size="size" @click="flip">
    <template #icon>
      <svg :class="styles.icon" data-slot="theme-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path ref="body" :d="bodyAt(icon.shown)" />
        <path :class="styles.rays" :d="RAYS" :style="raysAt(icon.shown)" />
      </svg>
    </template>
  </IconButton>
</template>
