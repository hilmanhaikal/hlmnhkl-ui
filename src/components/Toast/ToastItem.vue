<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createToastBud, createToastSwipe, toastStack, toastTimer, watchToastHeight, type ToastLeaving } from '../../internal/motion/toast'
import { CheckCircleIcon, ErrorIcon, InfoIcon, XIcon } from '../../internal/vueIcons'
import Spinner from '../Spinner/Spinner.vue'
import type { ToastItemData } from './Toast.vue'
import styles from './Toast.module.css'

// One toast of the Vue ToastProvider (Toast.vue).

const props = defineProps<{ item: ToastItemData; index: number; y: number; expanded: boolean; hidden: boolean; dismissLabel: string }>()
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
watch([() => props.item.duration, () => props.item.variant], () => (remaining.current = props.item.duration ?? 5000))
watch(
  [paused, () => props.item.variant, () => props.item.duration],
  (_, __, onCleanup) => {
    if (paused.value || !Number.isFinite(remaining.current) || props.item.variant === 'loading' || typeof window === 'undefined') return
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
    <span v-if="item.variant && item.variant !== 'default'" :class="styles.icon" :data-variant="item.variant">
      <CheckCircleIcon v-if="item.variant === 'success'" />
      <ErrorIcon v-else-if="item.variant === 'error'" />
      <InfoIcon v-else-if="item.variant === 'info'" />
      <Spinner v-else size="sm" :label="null" />
    </span>
    <div :class="styles.text">
      <p :class="styles.title">{{ item.title }}</p>
      <p v-if="item.description" :class="styles.description">{{ item.description }}</p>
    </div>
    <button v-if="item.action" type="button" :class="styles.action" @click="onAction">{{ item.action.label }}</button>
    <button type="button" :class="styles.close" :aria-label="`${dismissLabel}: ${item.title}`" @click="dismiss('down')">
      <XIcon />
    </button>
  </li>
</template>
