<script setup lang="ts">
import { Comment, Text, ref, type VNode } from 'vue'
import { CheckIcon, XIcon } from '../../internal/vueIcons'
import { collapseOut, focusPast } from '../../internal/motion/collapseOut'
import styles from './Tag.module.css'

// The Vue Tag: the same look (Tag.module.css) and fold-away removal as the React one.
export type TagLabels = {
  /** Name of the remove button, built from the tag's text. */
  remove: (name: string) => string
  /** Used as the name when the tag's text is not plain text. */
  item: string
}

const props = defineProps<{
  /** Shows a remove button (listen with @remove). Called after the exit animation ends. */
  onRemove?: () => void
  /** Label for the remove button. Wins over labels.remove, which defaults to "Remove <text>". */
  removeLabel?: string
  /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<TagLabels>
}>()

/** Makes the tag a toggle chip (aria-pressed). Use v-model:selected, or leave it out for a plain tag. */
const selected = defineModel<boolean | undefined>('selected', { default: undefined })
const slots = defineSlots<{ default?: () => VNode[]; icon?: () => unknown }>()

const root = ref<HTMLElement | null>(null)
const leaving = ref(false)

// The slot's text when it is plain text, so it can name the remove button and fill the title.
const plain = () => {
  const nodes = (slots.default?.() ?? []).filter((n) => n.type !== Comment)
  return nodes.length && nodes.every((n) => n.type === Text) ? nodes.map((n) => String(n.children)).join('') : undefined
}
const removeName = () => props.removeLabel ?? (props.labels?.remove ?? ((name: string) => `Remove ${name}`))(plain() ?? props.labels?.item ?? 'item')

const remove = () => {
  const el = root.value
  if (!el || leaving.value) return
  leaving.value = true
  collapseOut(el, () => {
    focusPast(el)
    props.onRemove?.()
  })
}
</script>

<template>
  <span ref="root" :class="[styles.root, selected && styles.selected]" :data-leaving="leaving || undefined">
    <button v-if="selected !== undefined" type="button" :class="styles.toggle" :aria-pressed="selected" @click="selected = !selected">
      <span :class="styles.check" :data-on="selected || undefined" aria-hidden="true"><CheckIcon /></span>
      <span :class="styles.text" :title="plain()"><slot /></span>
    </button>
    <span v-else :class="styles.static">
      <span v-if="slots.icon" :class="styles.icon"><slot name="icon" /></span>
      <span :class="styles.text" :title="plain()"><slot /></span>
    </span>
    <button v-if="onRemove" type="button" :class="styles.remove" :aria-label="removeName()" @click="remove">
      <XIcon />
    </button>
  </span>
</template>
