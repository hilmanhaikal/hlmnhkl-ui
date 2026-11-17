<script lang="ts">
import { inject, type InjectionKey } from 'vue'
import type { ToastLeaving, ToastOrigin, ToastVariant } from '../../internal/motion/toast'

export type { ToastVariant }

export type ToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
  /** Milliseconds before it leaves. Infinity keeps it until dismissed. */
  duration?: number
  action?: { label: string; onClick: () => void }
  /** Where the action happened: the element pressed, or a point on screen. Within 240px of the toast, the drop buds out of it and a dismiss flows back into it. Further away, or without it, the drop buds out of the window's edge. */
  origin?: ToastOrigin
}

export type ToastItemData = ToastOptions & { id: number; leaving: ToastLeaving }

export type ToastApi = {
  toast: (opts: ToastOptions) => number
  update: (id: number, opts: Partial<ToastOptions>) => void
  dismiss: (id: number) => void
}

/** Lets a second Vue app on the page send toasts through one provider: provide(toastKey, useToast()). */
export const toastKey: InjectionKey<ToastApi> = Symbol('gooee-toast')

/** Sends toasts from anywhere inside a ToastProvider (this file's default export). */
export function useToast(): ToastApi {
  const c = inject(toastKey, null)
  if (!c) throw new Error('useToast needs a <ToastProvider> above it')
  return c
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, provide, ref, shallowRef } from 'vue'
import { motionMs } from '../../internal/motion'
import { toastId, toastLayout, toastSay } from '../../internal/motion/toast'
import ToastItem from './ToastItem.vue'
import styles from './Toast.module.css'

// The Vue ToastProvider: the same look (Toast.module.css), stack, bud and throw as the React one.
// Wrap your app in it; anything inside can call useToast().

const props = withDefaults(
  defineProps<{
    /** How many toasts stay visible in the stack. */
    visible?: number
    /** Name of the notification region for screen readers. */
    label?: string
    /** Screen reader name for each close button. The toast title is added after it. */
    dismissLabel?: string
  }>(),
  { visible: 3, label: 'Notifications', dismissLabel: 'Dismiss' },
)

const items = shallowRef<ToastItemData[]>([])
const heights = shallowRef<Record<number, number>>({})
const expanded = ref(false)
const announce = ref('')
const urgent = ref('')
const timers = new Set<number>()
onBeforeUnmount(() => timers.forEach((t) => window.clearTimeout(t)))

const say = (opts: Partial<ToastOptions>, variant?: ToastVariant) => {
  if (variant === 'error') urgent.value = toastSay(urgent.value, opts)
  else announce.value = toastSay(announce.value, opts)
}

const remove = (id: number, dir: ToastLeaving = 'down') => {
  items.value = items.value.map((t) => (t.id === id && !t.leaving ? { ...t, leaving: dir } : t))
  const timer = window.setTimeout(() => {
    timers.delete(timer)
    items.value = items.value.filter((t) => t.id !== id)
    const { [id]: _, ...rest } = heights.value
    heights.value = rest
  }, motionMs('morph-out'))
  timers.add(timer)
}

provide(toastKey, {
  toast: (opts) => {
    const id = toastId()
    items.value = [...items.value, { duration: 5000, variant: 'default', ...opts, id, leaving: false }]
    say(opts, opts.variant)
    return id
  },
  update: (id, opts) => {
    const variant = items.value.find((t) => t.id === id)?.variant
    items.value = items.value.map((t) => (t.id === id ? { ...t, ...opts } : t))
    if (opts.title) say(opts, opts.variant ?? variant)
  },
  dismiss: (id) => remove(id),
})

const stack = computed(() => toastLayout(items.value, heights.value, expanded.value, props.visible))
const setHeight = (id: number, h: number) => {
  if (heights.value[id] !== h) heights.value = { ...heights.value, [id]: h }
}
const onFocusOut = (e: FocusEvent) => !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null) && (expanded.value = false)
</script>

<template>
  <slot />
  <!-- In the body, so a parent's stacking or overflow never hides the stack. -->
  <Teleport to="body">
    <div :class="styles.srOnly" role="status" aria-live="polite" aria-atomic="true">{{ announce }}</div>
    <div :class="styles.srOnly" role="alert" aria-atomic="true">{{ urgent }}</div>
    <!-- Toasts are not part of an open dialog, but tapping one should not close it. -->
    <section
      :class="styles.viewport"
      data-gooee-layer-ignore=""
      :aria-label="label"
      :style="{ height: `${stack.height}px`, '--front-h': `${stack.frontHeight}px` }"
      @pointerenter="(e: PointerEvent) => e.pointerType === 'mouse' && (expanded = true)"
      @pointerleave="(e: PointerEvent) => e.pointerType === 'mouse' && (expanded = false)"
      @focusin="expanded = true"
      @focusout="onFocusOut"
    >
      <ol :class="styles.list">
        <ToastItem
          v-for="{ t, index, y } in stack.layout"
          :key="t.id"
          :item="t"
          :index="index"
          :y="y"
          :expanded="expanded"
          :hidden="index >= props.visible"
          :dismiss-label="dismissLabel"
          @height="(h: number) => setHeight(t.id, h)"
          @dismiss="(dir: ToastLeaving) => remove(t.id, dir)"
        />
      </ol>
    </section>
  </Teleport>
</template>
