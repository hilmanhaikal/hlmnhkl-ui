<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { createDragClose } from '../../internal/motion/fling'
import { trapFocus } from '../../internal/motion/focus'
import { dismissable, lockScroll } from '../../internal/motion/layers'
import { createDialogMorph } from '../../internal/motion/liquid'
import { motionMs } from '../../internal/motion'
import styles from './Dialog.module.css'

// The Vue Dialog: the same look (Dialog.module.css), morph, focus and drag to close as the React one.

const props = withDefaults(
  defineProps<{
    /** Heading of the dialog. Also its accessible name. The title slot replaces it. */
    title?: string
    /** Short text under the title, read out when the dialog opens. The description slot replaces it. */
    description?: string
    /** Maximum width of the panel. */
    size?: 'sm' | 'md' | 'lg'
    /** Set false for dialogs that must not close by a stray tap, like unsaved work. */
    dismissOnOverlay?: boolean
    /** Screen reader name for the close button. */
    closeLabel?: string
    /** Element to focus first. Defaults to the first focusable element. */
    initialFocus?: HTMLElement | null
  }>(),
  { size: 'md', dismissOnOverlay: true, closeLabel: 'Close' },
)

/** Shows the dialog. Use v-model:open; the close button, Esc, an outside tap or a pull down set it false. */
const open = defineModel<boolean>('open', { required: true })
const slots = defineSlots<{ default?: () => unknown; title?: () => unknown; description?: () => unknown; footer?: () => unknown }>()

const id = useId()
const panel = ref<HTMLElement | null>(null)
const hasDescription = computed(() => !!(props.description || slots.description))
const close = () => (open.value = false)

// Stays in the page through the fold, then leaves.
const mounted = ref(open.value)
const state = computed(() => (open.value ? 'open' : 'closed'))
let leaving = 0

// The panel grows out of the control that opened it and folds back into it (motion/liquid.ts).
const morph = createDialogMorph(() => panel.value)
// On a phone the dialog is a bottom sheet, and the hand can pull it down to close.
const drag = createDragClose(() => panel.value, {
  onClose: close,
  isOpen: () => open.value,
  can: (e) => window.matchMedia('(max-width: 520px)').matches && !!(e.target as HTMLElement).closest(`.${styles.handle}, .${styles.header}`),
})

let release: Array<() => void> = []
const stop = () => {
  release.forEach((r) => r())
  release = []
}

// On the server (Nuxt) there is no page to move or hold, so both watchers wait for the browser.
const server = typeof window === 'undefined'

// Before the new state renders, so the opener is read while it still has focus.
watch(
  open,
  (now, was) => {
    if (server) return
    clearTimeout(leaving)
    if (now && !was) morph.opening()
    if (now) {
      mounted.value = true
      drag.fling.opened()
    } else {
      drag.fling.closed()
      leaving = window.setTimeout(() => (mounted.value = false), motionMs('morph-out'))
    }
  },
  { immediate: true, flush: 'pre' },
)

// Once the panel is in the page: play the morph, and hold the scroll, the layer and focus while open.
watch(
  [state, mounted],
  async () => {
    if (server || !mounted.value) return
    await nextTick()
    morph.play(state.value)
    stop()
    if (!open.value || !panel.value) return
    const el = panel.value
    release.push(lockScroll(), dismissable(() => [el], close, { outside: props.dismissOnOverlay }), trapFocus(el, { initialFocus: props.initialFocus }))
  },
  { immediate: true, flush: 'post' },
)

onBeforeUnmount(() => {
  clearTimeout(leaving)
  stop()
  morph.destroy()
  drag.fling.stop()
})

const grab = computed(() =>
  props.dismissOnOverlay ? { onPointerdown: drag.down, onPointermove: drag.move, onPointerup: drag.up, onPointercancel: drag.up } : {},
)
</script>

<template>
  <Teleport v-if="mounted" to="body">
    <div :class="styles.overlay" :data-state="state" aria-hidden="true" />
    <div :class="styles.positioner">
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`${id}-title`"
        :aria-describedby="hasDescription ? `${id}-desc` : undefined"
        tabindex="-1"
        :class="[styles.panel, styles[size]]"
        :data-state="state"
        v-bind="grab"
      >
        <span v-if="dismissOnOverlay" :class="styles.handle" aria-hidden="true" />
        <header :class="styles.header">
          <div :class="styles.titles">
            <h2 :id="`${id}-title`" :class="styles.title"><slot name="title">{{ title }}</slot></h2>
            <p v-if="hasDescription" :id="`${id}-desc`" :class="styles.description"><slot name="description">{{ description }}</slot></p>
          </div>
          <button type="button" :class="styles.close" :aria-label="closeLabel" data-skip-initial-focus="true" @click="close">
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        <div v-if="slots.default" :class="styles.body"><slot /></div>
        <footer v-if="slots.footer" :class="styles.footer"><slot name="footer" /></footer>
      </div>
    </div>
  </Teleport>
</template>
