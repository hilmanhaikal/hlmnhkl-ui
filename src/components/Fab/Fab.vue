<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch, type Component } from 'vue'
import { foldOnScroll } from '../../internal/motion/fab'
import { dismissable } from '../../internal/motion/layers'
import { onScrollFrame } from '../../internal/motion/scrollFrame'
import styles from './Fab.module.css'

export type FabAction = {
  /** Shown beside the action's button and read as its name. */
  label: string
  /** An icon component, such as EditIcon from the icons. */
  icon: Component
  onSelect: () => void
}

// The Vue Fab: the same look (Fab.module.css), fold and actions as the React one. The main icon goes in the icon slot.
const props = withDefaults(
  defineProps<{
    /** The button's name. Shown as text when extended, and always read by screen readers. */
    label: string
    /** Shows the label beside the icon. It pours away into the icon as the page scrolls down, and back on the way up. */
    extended?: boolean
    /** A short stack of actions that pours up out of the button when it is tapped. */
    actions?: FabAction[]
    /** Where it sits along the bottom of the screen. */
    position?: 'end' | 'center'
    /** Sits at the bottom of its nearest positioned parent instead of the screen, for a demo or a panel. */
    contained?: boolean
  }>(),
  { extended: false, position: 'end', contained: false },
)
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
    () => props.extended,
    (on) => {
      stopFold?.()
      stopFold = on ? onScrollFrame(fold) : undefined
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
const hasActions = () => Boolean(props.actions?.length)
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
  <div ref="rootEl" :class="[styles.root, styles[position], contained && styles.contained]" :data-open="open || undefined">
    <ul v-if="actions?.length" :id="`${id}-actions`" :class="styles.actions" :inert="!open">
      <li v-for="(a, i) in actions" :key="a.label" :style="{ '--i': actions.length - 1 - i }">
        <button :ref="i === 0 ? setFirst : undefined" type="button" :class="styles.action" @click="select(a)">
          <span :class="styles.actionLabel">{{ a.label }}</span>
          <span :class="styles.actionIcon" aria-hidden="true"><component :is="a.icon" /></span>
        </button>
      </li>
    </ul>
    <button
      ref="buttonEl"
      type="button"
      :class="styles.fab"
      :aria-label="extended ? undefined : label"
      :aria-expanded="actions?.length ? open : undefined"
      :aria-controls="actions?.length ? `${id}-actions` : undefined"
      :data-extended="(extended && !compact) || undefined"
      @click="toggle"
    >
      <span :class="styles.icon" aria-hidden="true"><slot name="icon" /></span>
      <span v-if="extended" :class="styles.labelWrap">
        <span :class="styles.label">{{ label }}</span>
      </span>
    </button>
  </div>
</template>
