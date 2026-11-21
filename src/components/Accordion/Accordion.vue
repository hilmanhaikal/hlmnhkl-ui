<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { accordionKey } from './accordionContext'
import styles from './Accordion.module.css'

// The Vue Accordion: the same look (Accordion.module.css) and keys as the React one. Put AccordionItem
// parts inside.

const {
  type = 'single',
  defaultValue = [],
  headingLevel = 3,
} = defineProps<{
  /** "single" keeps one item open at a time. */
  type?: 'single' | 'multiple'
  /** Starting open items when there is no v-model. */
  defaultValue?: string[]
  /** Heading level for item titles, to fit the page outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
}>()

/** Values of the open items. Use v-model, or leave it out and the accordion keeps its own state. */
const model = defineModel<string[]>()
const local = ref(defaultValue)
const open = computed(() => model.value ?? local.value)
const set = (next: string[]) => {
  local.value = next
  model.value = next
}

provide(accordionKey, {
  open,
  level: computed(() => headingLevel),
  toggle: (v) => {
    const isOpen = open.value.includes(v)
    if (type === 'single') set(isOpen ? [] : [v])
    else set(isOpen ? open.value.filter((x) => x !== v) : [...open.value, v])
  },
})

const root = ref<HTMLElement | null>(null)
const onKeyDown = (e: KeyboardEvent) => {
  // Skips triggers of nested accordions, which handle their own keys.
  const triggers = Array.from(root.value?.querySelectorAll<HTMLButtonElement>(`.${styles.trigger}:not(:disabled)`) ?? []).filter((t) => t.closest(`.${styles.root}`) === root.value)
  const i = triggers.indexOf(document.activeElement as HTMLButtonElement)
  if (i < 0) return
  let next = -1
  if (e.key === 'ArrowDown') next = (i + 1) % triggers.length
  else if (e.key === 'ArrowUp') next = (i - 1 + triggers.length) % triggers.length
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = triggers.length - 1
  if (next < 0) return
  e.preventDefault()
  e.stopPropagation()
  triggers[next].focus()
}
</script>

<template>
  <div ref="root" data-slot="accordion" :class="styles.root" @keydown="onKeyDown">
    <slot />
  </div>
</template>
