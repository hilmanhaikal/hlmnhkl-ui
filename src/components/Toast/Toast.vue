<script lang="ts">
import { inject, type InjectionKey } from 'vue'
import type { ToastLeaving, ToastOrigin, ToastTone } from '../../internal/motion/toast'

export type { ToastTone }

export type ToastLabels = {
  /** Name of each close button. The toast title is added after it. */
  dismiss: string
}

export type ToastOptions = {
  title: string
  description?: string
  /** Sets the icon and colour. Danger is announced at once. */
  tone?: ToastTone
  /** Shows a spinner and keeps the toast until you update it with loading: false. */
  loading?: boolean
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

const {
  max = 3,
  label = 'Notifications',
  labels,
} = defineProps<{
  /** Most toasts shown in the stack at once. */
  max?: number
  /** Name of the notification region for screen readers. */
  label?: string
  /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<ToastLabels>
}>()
const text = computed(() => ({ dismiss: 'Dismiss', ...labels }))

const items = shallowRef<ToastItemData[]>([])
const heights = shallowRef<Record<number, number>>({})
const expanded = ref(false)
const announce = ref('')
const urgent = ref('')
const timers = new Set<number>()
onBeforeUnmount(() => timers.forEach((t) => window.clearTimeout(t)))

const say = (opts: Partial<ToastOptions>, tone?: ToastTone) => {
  if (tone === 'danger') urgent.value = toastSay(urgent.value, opts)
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
    items.value = [...items.value, { duration: 5000, tone: 'neutral', ...opts, id, leaving: false }]
    say(opts, opts.tone)
    return id
  },
  update: (id, opts) => {
    const tone = items.value.find((t) => t.id === id)?.tone
    items.value = items.value.map((t) => (t.id === id ? { ...t, ...opts } : t))
    if (opts.title) say(opts, opts.tone ?? tone)
  },
  dismiss: (id) => remove(id),
})

const stack = computed(() => toastLayout(items.value, heights.value, expanded.value, max))
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
      data-slot="toast-viewport"
      data-gooee-layer-ignore=""
      :aria-label="label"
      :style="{ height: `${stack.height}px`, '--front-h': `${stack.frontHeight}px` }"
      @pointerenter="(e: PointerEvent) => e.pointerType === 'mouse' && (expanded = true)"
      @pointerleave="(e: PointerEvent) => e.pointerType === 'mouse' && (expanded = false)"
      @focusin="expanded = true"
      @focusout="onFocusOut"
    >
      <ol :class="styles.list" data-slot="toast-list">
        <ToastItem
          v-for="{ t, index, y } in stack.layout"
          :key="t.id"
          :item="t"
          :index="index"
          :y="y"
          :expanded="expanded"
          :hidden="index >= max"
          :labels="text"
          @height="(h: number) => setHeight(t.id, h)"
          @dismiss="(dir: ToastLeaving) => remove(t.id, dir)"
        />
      </ol>
    </section>
  </Teleport>
</template>
