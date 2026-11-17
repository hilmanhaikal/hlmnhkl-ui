<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createSplitFlap, flapCellsHtml, SPLIT_FLAP_CHARS, type FlapLook } from '../../internal/motion/splitFlap'
import styles from './SplitFlap.module.css'

// The Vue SplitFlap: the same look (SplitFlap.module.css) and flips (motion/splitFlap.ts) as the React one.
// Other attributes go to the root.
const props = withDefaults(
  defineProps<{
    /** The text the board shows. A change flips each cell forward through the drum to its new letter. */
    value: string
    /** At least this many cells: shorter text is padded with blank ones, so a column keeps its width. */
    length?: number
    /** Text size of the cells. */
    size?: 'sm' | 'md' | 'lg'
    /** The drum's letters, in the order a cell passes them. A letter that is not on it flips straight in. */
    chars?: string
    /** Says the new text to screen readers once, when the board has landed. Turn off when one message covers several boards. */
    announce?: boolean
  }>(),
  { length: 0, size: 'md', chars: SPLIT_FLAP_CHARS, announce: true },
)
/** settle: fires once with the text when every cell has landed. */
const emit = defineEmits<{ settle: [value: string] }>()

const LOOK: FlapLook = { cell: styles.cell, top: styles.top, bottom: styles.bottom, glyph: styles.glyph, flap: styles.flap, front: styles.front, back: styles.back }
const target = computed(() => props.value.padEnd(props.length, ' '))
// The first cells come with the markup, so a server page shows the board before any script runs.
const first = flapCellsHtml(LOOK, target.value)
const said = ref(props.value)
const board = ref<HTMLSpanElement | null>(null)
let flap: ReturnType<typeof createSplitFlap> | null = null

onMounted(() => {
  if (board.value) flap = createSplitFlap(board.value, LOOK, target.value)
})
watch(target, (t) => {
  const value = props.value
  flap?.show(t, props.chars, () => {
    said.value = value
    emit('settle', value)
  })
})
onBeforeUnmount(() => flap?.destroy())
</script>

<template>
  <span :class="styles.root" :data-size="size">
    <span :class="styles.sr" :aria-live="announce ? 'polite' : undefined" aria-atomic="true">{{ said }}</span>
    <span ref="board" :class="styles.board" aria-hidden="true" v-html="first" />
  </span>
</template>
