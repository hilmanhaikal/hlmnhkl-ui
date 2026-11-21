<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, useId, watch, type VNode } from 'vue'
import type { Align, Side } from '../../internal/motion/floating'
import { trapFocus } from '../../internal/motion/focus'
import { dismissable } from '../../internal/motion/layers'
import { createMorph } from '../../internal/motion/liquid'
import { useFloating } from '../../internal/vue/useFloating'
import { usePresence } from '../../internal/vue/usePresence'
import { cloneTrigger, elementRef, firstNode } from '../../internal/vue/trigger'
import { XIcon } from '../../icons/vue'
import styles from './Popover.module.css'

// The Vue Popover: the same look (Popover.module.css), growth, dismiss and focus as the React one.
// The trigger slot is one element, such as a Button, that opens and closes it on click.
// Other attributes, such as class, go to the panel.
defineOptions({ inheritAttrs: false })

export type PopoverLabels = {
  /** Screen reader name for the close button. */
  close: string
}

const { side = 'bottom', align = 'start', labels: labelsProp } = defineProps<{
  /** Visible heading, also the dialog's accessible name. The title slot replaces it. */
  title?: string
  /** Preferred side of the trigger. It flips when there is no room. */
  side?: Side
  /** How the panel lines up with the trigger along that side. */
  align?: Align
  /** Text for the popover's controls, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<PopoverLabels>
}>()
const labels = computed<PopoverLabels>(() => ({ close: 'Close', ...labelsProp }))
/** Whether the panel is open. Use v-model:open to control it; without it the popover keeps its own state. */
const open = defineModel<boolean>('open', { default: false })
const slots = defineSlots<{ trigger?: () => VNode[]; default?: () => unknown; title?: () => unknown }>()

const id = useId()
const anchor = shallowRef<HTMLElement | null>(null)
const setAnchor = elementRef(anchor)
const panel = ref<HTMLElement | null>(null)
const close = () => (open.value = false)
const { mounted, state } = usePresence(open, 'morph-out')
const { style, side: placed, ready } = useFloating(anchor, panel, mounted, () => ({ side, align, offset: 8 }))
// Vue sets a bare number as no length at all, so the place gets its unit here.
// The panel grows out of its trigger and folds back into it.
const liquid = createMorph(() => panel.value, { origin: () => anchor.value })
watch([state, () => mounted.value && ready.value], ([s, on]) => on && liquid.play(s), { flush: 'post' })

let releaseDismiss = () => {}
watch(open, (now) => {
  releaseDismiss()
  releaseDismiss = now ? dismissable(() => [anchor.value, panel.value], close) : () => {}
})
// Focus moves in while it is open, and goes back when it closes.
let releaseTrap = () => {}
watch(
  () => open.value && mounted.value,
  (on) => {
    releaseTrap()
    releaseTrap = on && panel.value ? trapFocus(panel.value) : () => {}
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  releaseDismiss()
  releaseTrap()
  liquid.destroy()
})

// The trigger is the slot's own element, given the popover's ARIA and click, like React's cloneElement.
const trigger = () => {
  const node = firstNode(slots.trigger?.())
  return cloneTrigger(node, setAnchor, {
    onClick: () => (open.value = !open.value),
    'aria-haspopup': 'dialog',
    'aria-expanded': open.value,
    'aria-controls': open.value ? id : undefined,
  })
}
</script>

<template>
  <component :is="trigger()" />
  <Teleport v-if="mounted" to="body">
    <div
      v-bind="$attrs"
      :id="id"
      ref="panel"
      role="dialog"
      :aria-labelledby="`${id}-title`"
      tabindex="-1"
      :class="styles.panel"
      data-slot="popover-content"
      :data-state="state"
      :data-side="placed"
      :style="style"
    >
      <div :class="styles.head" data-slot="popover-header">
        <h2 :id="`${id}-title`" :class="styles.title" data-slot="popover-title"><slot name="title">{{ title }}</slot></h2>
        <button type="button" :class="styles.close" data-slot="popover-close" :aria-label="labels.close" data-skip-initial-focus="true" @click="close">
          <XIcon />
        </button>
      </div>
      <div :class="styles.body" data-slot="popover-body"><slot /></div>
    </div>
  </Teleport>
</template>
