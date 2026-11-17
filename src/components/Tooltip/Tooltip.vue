<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, useId, watch, type VNode } from 'vue'
import type { Side } from '../../internal/motion/floating'
import { dismissable } from '../../internal/motion/layers'
import { createLiquid } from '../../internal/motion/liquid'
import { createTipTimer, tipEdge } from '../../internal/motion/tooltip'
import { useFloating } from '../../internal/vue/useFloating'
import { usePresence } from '../../internal/vue/usePresence'
import { cloneTrigger, elementRef, firstNode } from '../../internal/vue/trigger'
import styles from './Tooltip.module.css'

// The Vue Tooltip: the same look (Tooltip.module.css), timing and growth as the React one.
// The default slot is the trigger: one focusable element, such as a Button.

const props = withDefaults(
  defineProps<{
    /** Short text shown on hover and focus. It also describes the trigger to screen readers. The content slot replaces it. */
    content?: string
    /** Preferred side of the trigger. It flips when there is no room. */
    side?: Side
    /** Delay before showing on hover. Defaults to the tooltip delay token. */
    delay?: number
  }>(),
  { side: 'top' },
)
const slots = defineSlots<{ default?: () => VNode[]; content?: () => unknown }>()

const id = useId()
const open = ref(false)
const anchor = shallowRef<HTMLElement | null>(null)
const setAnchor = elementRef(anchor)
const tip = ref<HTMLElement | null>(null)
const { mounted, state } = usePresence(open, 'morph-out')
const { style, side: placed, ready } = useFloating(anchor, tip, mounted, () => ({ side: props.side, offset: 8 }))
// Vue sets a bare number as no length at all, so the place gets its unit here.
// The tip grows out of the edge of the target it points to, a sliver as wide as the target, and folds back into it.
const liquid = createLiquid(
  () => tip.value,
  () => tipEdge(anchor.value, placed.value),
)
watch([state, () => mounted.value && ready.value], ([s, on]) => on && liquid.play(s), { flush: 'post' })

// When it shows and hides (motion/tooltip.ts).
const timer = createTipTimer(
  (v) => (open.value = v),
  () => props.delay,
)

// Esc hides it without moving focus (WCAG 1.4.13), and only it, not a dialog behind it.
let release = () => {}
watch(open, (now) => {
  release()
  release = now ? dismissable(() => [], () => (open.value = false), { outside: false, hint: true }) : () => {}
})

onBeforeUnmount(() => {
  timer.clear()
  release()
  liquid.destroy()
})

// The trigger is the slot's own element, given the tip's ARIA and events, like React's cloneElement.
const trigger = () => {
  const node = firstNode(slots.default?.())
  if (!node) return null
  return cloneTrigger(node, setAnchor, {
    'aria-describedby': [node.props?.['aria-describedby'], open.value ? id : null].filter(Boolean).join(' ') || undefined,
    onPointerenter: timer.enter,
    onPointerleave: timer.leave,
    onPointerdown: timer.down,
    onPointerup: timer.up,
    onFocus: timer.focus,
    onBlur: timer.blur,
  })
}
</script>

<template>
  <component :is="trigger()" />
  <Teleport v-if="mounted" to="body">
    <div
      :id="id"
      ref="tip"
      role="tooltip"
      :class="styles.tip"
      :data-state="state"
      :data-side="placed"
      :style="style"
      @pointerenter="timer.clear"
      @pointerleave="timer.hide()"
    >
      <slot name="content">{{ content }}</slot>
    </div>
  </Teleport>
</template>
