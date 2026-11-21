<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createToastBud, createToastSwipe, toastStack, toastTimer, watchToastHeight, type ToastLeaving } from '../../internal/motion/toast'
import { CheckCircleIcon, ErrorIcon, InfoIcon, XIcon } from '../../icons/vue'
import Spinner from '../Spinner/Spinner.vue'
import type { ToastItemData, ToastLabels } from './Toast.vue'
import styles from './Toast.module.css'

// One toast of the Vue ToastProvider (Toast.vue).

const props = defineProps<{ item: ToastItemData; index: number; y: number; expanded: boolean; hidden: boolean; labels: ToastLabels }>()
const emit = defineEmits<{ height: [h: number]; dismiss: [dir: ToastLeaving] }>()

const el = ref<HTMLElement | null>(null)
const dragging = ref(false)
const hover = ref(false)
const dismiss = (dir: ToastLeaving) => emit('dismiss', dir)

// Thrown sideways, it flies off at the speed of the swipe (motion/toast.ts).
const swipe = createToastSwipe(() => el.value, {
  leaving: () => props.item.leaving !== false,
  dragging: (on) => (dragging.value = on),
  dismiss,
})

// A drop buds out of the origin, or out of the window's edge, and grows into the toast; a dismiss flows back the same way.
const bud = createToastBud(
  () => el.value,
  () => props.item.origin,
  styles.bud,
)
let stopHeight = () => {}
onMounted(() => {
  bud.place(props.index)
  bud.change(props.item.leaving)
  stopHeight = watchToastHeight(el.value!, (h) => emit('height', h))
})
watch(
  () => props.index,
  (i) => !props.item.leaving && bud.place(i),
  { flush: 'post' },
)
watch(
  () => props.item.leaving,
  (leaving) => bud.change(leaving),
  { flush: 'post' },
)

// It leaves on its own, but waits while hovered, focused, held or hidden.
const paused = computed(() => props.expanded || hover.value || dragging.value || props.item.leaving !== false)
const remaining = { current: props.item.duration ?? 5000 }
watch([() => props.item.duration, () => props.item.tone, () => props.item.loading], () => (remaining.current = props.item.duration ?? 5000))
watch(
  [paused, () => props.item.tone, () => props.item.loading, () => props.item.duration],
  (_, __, onCleanup) => {
    if (paused.value || !Number.isFinite(remaining.current) || props.item.loading || typeof window === 'undefined') return
    onCleanup(toastTimer(remaining, () => dismiss('down')))
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  swipe.stop()
  bud.destroy()
  stopHeight()
})

const place = computed(() => toastStack(props.index, props.y, props.expanded))
const onAction = () => {
  props.item.action?.onClick()
  dismiss('down')
}
</script>

<template>
  <li
    ref="el"
    :class="styles.toast"
    data-slot="toast"
    :data-leaving="item.leaving || undefined"
    :data-dragging="dragging || undefined"
    :data-hidden="hidden || undefined"
    :data-behind="(!expanded && index > 0) || undefined"
    :style="{ '--y': `${place.y}px`, '--s': place.scale, zIndex: 100 - Math.max(index, 0) }"
    :aria-hidden="hidden || undefined"
    :inert="hidden || undefined"
    @pointerenter="hover = true"
    @pointerleave="hover = false"
    @pointerdown="swipe.down"
    @pointermove="swipe.move"
    @pointerup="swipe.up"
    @pointercancel="swipe.up"
  >
    <span v-if="item.loading || (item.tone && item.tone !== 'neutral')" :class="styles.icon" data-slot="toast-icon" :data-tone="item.loading ? undefined : item.tone">
      <Spinner v-if="item.loading" size="sm" :label="null" />
      <CheckCircleIcon v-else-if="item.tone === 'success'" />
      <ErrorIcon v-else-if="item.tone === 'danger'" />
      <InfoIcon v-else />
    </span>
    <div :class="styles.text" data-slot="toast-content">
      <p :class="styles.title" data-slot="toast-title">{{ item.title }}</p>
      <p v-if="item.description" :class="styles.description" data-slot="toast-description">{{ item.description }}</p>
    </div>
    <button v-if="item.action" type="button" :class="styles.action" data-slot="toast-action" @click="onAction">{{ item.action.label }}</button>
    <button type="button" :class="styles.close" data-slot="toast-close" :aria-label="`${labels.dismiss}: ${item.title}`" @click="dismiss('down')">
      <XIcon />
    </button>
  </li>
</template>
