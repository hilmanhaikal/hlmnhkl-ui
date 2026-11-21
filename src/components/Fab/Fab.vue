<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch, type Component } from 'vue'
import { foldOnScroll } from '../../internal/motion/fab'
import { dismissable } from '../../internal/motion/layers'
import { createScrollFrame } from '../../internal/motion/scrollFrame'
import styles from './Fab.module.css'

export type FabAction = {
  /** Shown beside the action's button and read as its name. */
  label: string
  /** An icon component, such as EditIcon from the icons. */
  icon: Component
  onSelect: () => void
}

// The Vue Fab: the same look (Fab.module.css), fold and actions as the React one. The main icon goes in the icon slot.
const {
  extended = false,
  actions,
  position = 'end',
  fixed = true,
} = defineProps<{
  /** The button's name. Shown as text when extended, and always read by screen readers. */
  label: string
  /** Shows the label beside the icon. It pours away into the icon as the page scrolls down, and back on the way up. */
  extended?: boolean
  /** A short stack of actions that pours up out of the button when it is tapped. */
  actions?: FabAction[]
  /** Where it sits along the bottom of the screen. */
  position?: 'end' | 'center'
  /** Pins it to the screen. false sits it at the bottom of its nearest positioned parent instead, for a demo or a panel. */
  fixed?: boolean
}>()
/** click: on tap. With actions, a tap opens them instead. */
const emit = defineEmits<{ click: [] }>()
defineSlots<{ icon?: () => unknown }>()

const id = useId()
const rootEl = ref<HTMLElement | null>(null)
const buttonEl = ref<HTMLButtonElement | null>(null)
const firstEl = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const compact = ref(false)

// Extended, it folds to the icon down the page and opens again on the way up (motion/fab.ts).
const fold = foldOnScroll((c) => (compact.value = c))
let stopFold: (() => void) | undefined
onMounted(() =>
  watch(
    () => extended,
    (on) => {
      stopFold?.()
      stopFold = on ? createScrollFrame(fold).destroy : undefined
    },
    { immediate: true },
  ),
)

let stopDismiss: (() => void) | undefined
watch(open, (now) => {
  stopDismiss?.()
  stopDismiss = now
    ? dismissable(
        () => [rootEl.value],
        (reason) => {
          open.value = false
          if (reason === 'escape') buttonEl.value?.focus()
        },
      )
    : undefined
})
onBeforeUnmount(() => {
  stopFold?.()
  stopDismiss?.()
})

const setFirst = (el: unknown) => (firstEl.value = el as HTMLButtonElement | null)
const hasActions = () => Boolean(actions?.length)
const toggle = () => {
  if (!hasActions()) return emit('click')
  open.value = !open.value
  if (open.value) requestAnimationFrame(() => firstEl.value?.focus())
}
const select = (a: FabAction) => {
  open.value = false
  buttonEl.value?.focus()
  a.onSelect()
}
</script>

<template>
  <div ref="rootEl" data-slot="fab" :class="[styles.root, styles[position], !fixed && styles.contained]" :data-state="open ? 'open' : 'closed'">
    <ul v-if="actions?.length" :id="`${id}-actions`" data-slot="fab-actions" :class="styles.actions" :inert="!open">
      <li v-for="(a, i) in actions" :key="a.label" :style="{ '--i': actions.length - 1 - i }">
        <button :ref="i === 0 ? setFirst : undefined" type="button" data-slot="fab-action" :class="styles.action" @click="select(a)">
          <span data-slot="fab-action-label" :class="styles.actionLabel">{{ a.label }}</span>
          <span data-slot="fab-action-icon" :class="styles.actionIcon" aria-hidden="true"><component :is="a.icon" /></span>
        </button>
      </li>
    </ul>
    <button
      ref="buttonEl"
      type="button"
      data-slot="fab-trigger"
      :class="styles.fab"
      :aria-label="extended ? undefined : label"
      :aria-expanded="actions?.length ? open : undefined"
      :aria-controls="actions?.length ? `${id}-actions` : undefined"
      :data-extended="(extended && !compact) || undefined"
      @click="toggle"
    >
      <span data-slot="fab-icon" :class="styles.icon" aria-hidden="true"><slot name="icon" /></span>
      <span v-if="extended" :class="styles.labelWrap">
        <span data-slot="fab-label" :class="styles.label">{{ label }}</span>
      </span>
    </button>
  </div>
</template>
