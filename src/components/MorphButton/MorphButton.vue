<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue'
import { focusables } from '../../internal/motion/focus'
import { dismissable } from '../../internal/motion/layers'
import { morphInsets, observeMorphButton, placeMorphButton, takesFocus, type MorphBox, type MorphCorner } from '../../internal/motion/morphButton'
import { XIcon } from '../../icons/vue'
import styles from './MorphButton.module.css'

// The Vue MorphButton: the same look (MorphButton.module.css), growth and dismiss as the React one. The
// panel's content goes in the default slot, the icon in the icon slot.

export type MorphButtonLabels = {
  /** Screen reader name for the close button. */
  close: string
}

const { defaultOpen = false, width = 'sm', labels: labelsProp, initialFocus } = defineProps<{
  /** The button's text. It stays on the same spot and becomes the panel's title and name. The label slot replaces it. */
  label?: string
  /** Starting open state when there is no v-model. */
  defaultOpen?: boolean
  /** How wide the panel grows. It never runs past the edge of the screen. */
  width?: 'sm' | 'md'
  /** Text for the button's controls, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<MorphButtonLabels>
  /** Element to focus when it opens. Defaults to the first control in the panel. */
  initialFocus?: HTMLElement | null
}>()
const labels = computed<MorphButtonLabels>(() => ({ close: 'Close', ...labelsProp }))
/** Whether the panel is open. Use v-model:open, or leave it out and the button keeps its own state. */
const model = defineModel<boolean | undefined>('open', { type: Boolean, default: undefined })
const slots = useSlots() as { default?: () => unknown; label?: () => unknown; icon?: () => unknown }

const id = useId()
const own = ref(defaultOpen)
const open = computed(() => model.value ?? own.value)
const setOpen = (next: boolean) => {
  own.value = next
  model.value = next
}
const corner = ref<MorphCorner>('tl')
const room = ref<number>()
const box = ref<MorphBox>({ tw: 0, th: 0, pw: 0, ph: 0 })
const anchorEl = ref<HTMLElement | null>(null)
const shellEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)

// Measured now and on every resize, and placed toward the side with room (motion/morphButton.ts).
let stopObserve: (() => void) | undefined
onMounted(() => {
  if (!triggerEl.value || !shellEl.value) return
  stopObserve = observeMorphButton(anchorEl.value!, triggerEl.value, shellEl.value, (b) => (box.value = b), (r) => (room.value = r))
})

const place = () => {
  if (!shellEl.value) return
  const at = placeMorphButton(anchorEl.value, box.value)
  if (!at) return
  corner.value = at.corner
  room.value = at.room
}
const show = (next: boolean) => {
  if (next) place()
  setOpen(next)
}
const backToButton = () => triggerEl.value?.focus({ preventScroll: true })

// Esc, a press outside, or focus moving on closes it. A layer it opened, such as a Select's list, is
// above it, so picking there does not count. Focus goes back to the button unless the press landed on
// something that takes focus itself.
let stopDismiss: (() => void) | undefined
// A controlled open from outside picks its side too; then focus moves into the panel.
const onOpen = (now: boolean) => {
  stopDismiss?.()
  stopDismiss = undefined
  if (!now) return
  place()
  stopDismiss = dismissable(
    () => [shellEl.value],
    (reason, e) => {
      setOpen(false)
      if (reason === 'escape') backToButton()
      else if (e.type === 'pointerdown' && !takesFocus(e.target)) window.setTimeout(backToButton)
    },
    { focusOut: true },
  )
  if (!panelEl.value) return
  const first = initialFocus ?? focusables(panelEl.value).find((el) => !el.hasAttribute('data-skip-initial-focus')) ?? panelEl.value
  first.focus({ preventScroll: true })
}
watch(open, onOpen, { flush: 'post' })
onMounted(() => open.value && onOpen(true))
onBeforeUnmount(() => {
  stopObserve?.()
  stopDismiss?.()
})

const vars = computed(() => ({ ...morphInsets(corner.value, box.value, open.value), maxWidth: room.value === undefined ? undefined : `${room.value}px` }))
const close = () => {
  setOpen(false)
  backToButton()
}
</script>

<template>
  <div ref="anchorEl" data-slot="morph-button" :class="styles.anchor" :style="{ width: box.tw ? `${box.tw}px` : undefined, height: box.th ? `${box.th}px` : undefined }">
    <div ref="shellEl" data-slot="morph-button-shell" :class="styles.shell" :data-state="open ? 'open' : 'closed'" :data-corner="corner" :data-width="width" :style="vars">
      <div :class="styles.surface" aria-hidden="true" />
      <div :class="styles.content">
        <button ref="triggerEl" type="button" data-slot="morph-button-trigger" :class="styles.trigger" :aria-expanded="open" aria-haspopup="dialog" :aria-controls="`${id}-panel`" @click="show(!open)">
          <span v-if="slots.icon" data-slot="morph-button-icon" :class="styles.icon" aria-hidden="true"><slot name="icon" /></span>
          <span :id="`${id}-label`" data-slot="morph-button-label"><slot name="label">{{ label }}</slot></span>
        </button>
        <div ref="panelEl" :id="`${id}-panel`" role="dialog" :aria-labelledby="`${id}-label`" tabindex="-1" data-slot="morph-button-panel" :class="styles.panel" :inert="!open" :aria-hidden="!open || undefined">
          <button type="button" data-slot="morph-button-close" :class="styles.close" :aria-label="labels.close" data-skip-initial-focus="true" @click="close">
            <XIcon />
          </button>
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
