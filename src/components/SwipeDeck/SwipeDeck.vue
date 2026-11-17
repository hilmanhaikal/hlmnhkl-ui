<script setup lang="ts" generic="T">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { createSwipeDeck, type DeckDir, type DeckSide } from '../../internal/motion/swipeDeck'
import { UndoIcon } from '../../internal/vueIcons'
import styles from './SwipeDeck.module.css'

export type SwipeDeckSide = DeckDir

// The Vue SwipeDeck: the same look (SwipeDeck.module.css), drag, throw and undo as the React one. Each
// card is drawn by the card slot, which gets the item. Other attributes go to the outer box.
const props = withDefaults(
  defineProps<{
    /** The cards, top card first. The top card is the first whose key is not decided yet, so you may remove decided ones. */
    items: T[]
    /** A key that stays the same for each item. */
    getKey: (item: T) => string
    /** A short name for an item, said by screen readers after each decision. */
    getName: (item: T) => string
    /** Screen reader name of the deck, such as "Flats to rent". */
    label: string
    /** The two button words, for the start side then the end side. */
    actions?: [string, string]
    /** What screen readers say was done, start then end, such as "Passed" and "Saved". */
    decided?: [string, string]
    /** Screen reader name of the undo button. */
    undoLabel?: string
    /** Shown when every card has been decided. The empty slot replaces it. */
    empty?: string
  }>(),
  { actions: () => ['Pass', 'Save'], decided: () => ['Passed', 'Saved'], undoLabel: 'Undo the last decision', empty: 'That was the last card.' },
)
/** decide: once for each card, when it has been thrown or a button or key decided it. undo: Undo brought a card back; if you removed it from items, put it back here. */
const emit = defineEmits<{ decide: [item: T, side: SwipeDeckSide]; undo: [item: T] }>()
defineSlots<{ card(props: { item: T }): unknown; empty?: () => unknown }>()

type Done = { item: T; side: DeckSide; dir: SwipeDeckSide }

const done = shallowRef<Done[]>([])
const news = ref('')
const armed = ref<DeckSide | 0>(0)
const root = ref<HTMLElement | null>(null)
const deck = ref<HTMLElement | null>(null)
const knob = ref<HTMLElement | null>(null)
let top: HTMLElement | null = null
const buttons: Record<DeckSide, HTMLElement | null> = { [-1]: null, [1]: null }
// The top card is the first one not yet decided, found by key, so the app may trim or replace items.
const left = computed(() => {
  const gone = new Set(done.value.map((d) => props.getKey(d.item)))
  return props.items.filter((item) => !gone.has(props.getKey(item)))
})

const commit = (side: DeckSide) => {
  const [item, next] = left.value
  if (!item) return
  const count = done.value.length
  const n = left.value.length
  const dir = swipe.named(side)
  done.value = [...done.value, { item, side, dir }]
  const said = `${props.decided[dir === 'start' ? 0 : 1]}: ${props.getName(item)}.`
  news.value = next ? `${said} Card ${count + 2} of ${count + n}: ${props.getName(next)}.` : `${said} No more cards.`
  emit('decide', item, dir)
}

// The drag, the throw and undo's way back (motion/swipeDeck.ts).
const swipe = createSwipeDeck({
  root: () => root.value,
  deck: () => deck.value,
  top: () => top,
  knob: () => knob.value,
  button: (side) => buttons[side],
  setArmed: (side) => (armed.value = side),
  hasCards: () => left.value.length > 0,
  // The next card must be in place before the top card's transform resets, or the thrown card
  // shows in the middle for a frame.
  commit: (side) => {
    commit(side)
    return nextTick()
  },
})

const undo = () => {
  if (!done.value.length) return
  const last = done.value[done.value.length - 1]
  if (!swipe.undo(last.side)) return
  const count = done.value.length - 1
  const n = left.value.length
  done.value = done.value.slice(0, -1)
  news.value = `Brought back: ${props.getName(last.item)}. Card ${count + 1} of ${count + n + 1}.`
  emit('undo', last.item)
}

// Undo plays the throw backwards, and a key pressed mid-move plays once the move has ended.
watch(() => done.value.length, swipe.changed, { flush: 'post' })
onMounted(swipe.mount)
onBeforeUnmount(swipe.destroy)

const onKeyDown = (e: KeyboardEvent) => {
  if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return
  if (e.key === 'ArrowLeft') swipe.fly(-1, 0)
  else if (e.key === 'ArrowRight') swipe.fly(1, 0)
  else if (e.key === 'Backspace') undo()
  else return
  e.preventDefault()
}

const shown = computed(() =>
  left.value
    .slice(0, 3)
    .map((item, depth) => ({ item, depth }))
    .reverse(),
)
const over = computed(() => !left.value.length)
const armedDir = computed(() => (armed.value ? swipe.named(armed.value) : undefined))
const setTop = (el: unknown) => (top = el as HTMLElement | null)
const buttonRef = (dir: SwipeDeckSide) => (el: unknown) => (buttons[dir === 'start' ? -1 : 1] = el as HTMLElement | null)
const choose = (dir: SwipeDeckSide) => !over.value && swipe.fly(swipe.physical(dir), 0)
</script>

<template>
  <div ref="root" :class="styles.root" :data-armed="armedDir">
    <div :class="styles.stage">
      <div ref="deck" :class="styles.deck" role="group" aria-roledescription="card deck" :aria-label="label" aria-keyshortcuts="ArrowLeft ArrowRight Backspace" tabindex="0" @keydown="onKeyDown">
        <div v-if="over" :class="styles.empty"><slot name="empty">{{ empty }}</slot></div>
        <div
          v-for="{ item, depth } in shown"
          :key="getKey(item)"
          :ref="depth === 0 ? setTop : undefined"
          :class="styles.card"
          :data-depth="depth"
          :inert="depth > 0"
          :aria-hidden="depth > 0 || undefined"
          @pointerdown="depth === 0 && swipe.down($event)"
          @pointermove="depth === 0 && swipe.move($event)"
          @pointerup="depth === 0 && swipe.up($event)"
          @pointercancel="depth === 0 && swipe.cancel($event)"
          @click.capture="swipe.clickCapture"
          @dragstart.prevent
        >
          <slot name="card" :item="item" />
        </div>
      </div>
    </div>
    <div :class="styles.ruler" aria-hidden="true">
      <span :class="styles.mark" data-side="left" :data-armed="armed === -1 || undefined" />
      <span :class="styles.centre" />
      <span :class="styles.mark" data-side="right" :data-armed="armed === 1 || undefined" />
      <span ref="knob" :class="styles.knob" :data-armed="armed !== 0 || undefined" />
    </div>
    <div :class="styles.bar">
      <button :ref="buttonRef('start')" type="button" :class="styles.choice" data-side="start" :aria-disabled="over || undefined" @click="choose('start')">
        <span :class="styles.word">{{ actions[0] }}</span>
        <span :class="styles.fill" aria-hidden="true">
          <span :class="styles.word">{{ actions[0] }}</span>
        </span>
      </button>
      <button type="button" :class="styles.undo" :aria-label="undoLabel" :aria-disabled="!done.length || undefined" @click="undo">
        <UndoIcon />
      </button>
      <button :ref="buttonRef('end')" type="button" :class="styles.choice" data-side="end" :aria-disabled="over || undefined" @click="choose('end')">
        <span :class="styles.word">{{ actions[1] }}</span>
        <span :class="styles.fill" aria-hidden="true">
          <span :class="styles.word">{{ actions[1] }}</span>
        </span>
      </button>
    </div>
    <span :class="styles.sr" role="status" aria-live="polite" aria-atomic="true">{{ news }}</span>
  </div>
</template>
