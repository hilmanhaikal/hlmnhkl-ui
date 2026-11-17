<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { createDragClose } from '../../internal/motion/fling'
import { trapFocus } from '../../internal/motion/focus'
import { dismissable, lockScroll } from '../../internal/motion/layers'
import { createDetentSheet, DETENT_NAME, detentHeights, detentOrder, type SheetDetent } from '../../internal/motion/sheetDetents'
import { usePresence } from '../../internal/vue/usePresence'
import { XIcon } from '../../internal/vueIcons'
import styles from './Sheet.module.css'

// The Vue Sheet: the same look (Sheet.module.css), drag, heights and focus as the React one.
// With detents, the grabber becomes a control for the height, and the sheet is modal only at its highest.
// Other attributes, such as class, go to the panel.
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Visible heading, also the dialog's accessible name. The title slot replaces it. */
    title?: string
    /** Text under the title, also read as the dialog's description. The description slot replaces it. */
    description?: string
    /** Screen reader name for the close button. */
    closeLabel?: string
    /** Element to focus first. Defaults to the first focusable element in the content. */
    initialFocus?: HTMLElement | null
    /** Heights the sheet rests at, such as ['peek', 'half', 'full']. Below the highest one it is not modal: the page behind stays usable. */
    detents?: SheetDetent[]
    /** The height it rests at. Use v-model:detent to control it. */
    detent?: SheetDetent
    /** The height it opens at when you do not control it. Defaults to the lowest. */
    defaultDetent?: SheetDetent
    /** Screen reader name for the grabber, which sets the height. */
    heightLabel?: string
  }>(),
  { closeLabel: 'Close', heightLabel: 'Sheet height' },
)
/** Whether the sheet is open. Use v-model:open; Esc, an outside tap, a drag or the close button set it false. */
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ 'update:detent': [detent: SheetDetent] }>()
const slots = defineSlots<{ default?: () => unknown; title?: () => unknown; description?: () => unknown; footer?: () => unknown }>()

const id = useId()
const panel = ref<HTMLElement | null>(null)
const overlay = ref<HTMLElement | null>(null)
const grabber = ref<HTMLElement | null>(null)
const body = ref<HTMLElement | null>(null)
const hasDescription = computed(() => !!(props.description || slots.description))
const close = () => (open.value = false)
const { mounted, state } = usePresence(open, 'morph-out')
const withDetents = computed(() => !!props.detents?.length)

// On the server (Nuxt) there is no page to hold, so the watchers wait for the browser.
const server = typeof window === 'undefined'
const releases: Record<string, () => void> = {}
const hold = (key: string, make: (() => () => void) | false) => {
  releases[key]?.()
  releases[key] = make && !server ? make() : () => {}
}

// Without detents: the hand pulls it down to close.
const drag = createDragClose(() => panel.value, { onClose: close, isOpen: () => open.value })
watch(open, (now) => {
  if (withDetents.value) return
  if (now) drag.fling.opened()
  else drag.fling.closed()
})
watch(open, (now) => hold('lock', !withDetents.value && now && lockScroll), { immediate: true })
watch(open, (now) => hold('dismiss', !withDetents.value && now && (() => dismissable(() => [panel.value], close))), { immediate: true })
watch(
  () => !withDetents.value && open.value && mounted.value,
  (on) => hold('trap', on && !!panel.value && (() => trapFocus(panel.value!, { initialFocus: props.initialFocus }))),
  { flush: 'post', immediate: true },
)
const onAnimationEnd = (e: AnimationEvent) => {
  if (e.target === panel.value && state.value === 'open') (e.target as HTMLElement).style.transform = ''
}

// With detents: drag, flick, the grabber's keys and where focus goes (motion/sheetDetents.ts).
const order = computed(() => detentOrder(props.detents ?? []))
const top = computed(() => order.value.length - 1)
const inner = ref<SheetDetent>(props.defaultDetent ?? order.value[0])
const index = computed(() => Math.max(0, order.value.indexOf(props.detent ?? inner.value)))
const atTop = computed(() => index.value === top.value)
const vh = ref(server ? 0 : window.innerHeight)
const heights = computed(() => detentHeights(order.value, vh.value))
const dragging = ref(false)
const target = ref(index.value)
const said = ref('')
const shown = computed(() => order.value[dragging.value ? target.value : index.value])

const sheet = createDetentSheet({
  panel: () => panel.value,
  overlay: () => overlay.value,
  grabber: () => grabber.value,
  body: () => body.value,
  order: () => order.value,
  heights: () => heights.value,
  index: () => index.value,
  open: () => open.value,
  change: (i) => {
    if (props.detent === undefined) inner.value = order.value[i]
    emit('update:detent', order.value[i])
  },
  close,
  target: (i) => (target.value = i),
  dragging: (on) => (dragging.value = on),
  say: (text) => (said.value = text),
})

const onResize = () => (vh.value = window.innerHeight)
onMounted(() => window.addEventListener('resize', onResize))

// Before the new state renders, so the opener is read while it still has focus.
watch(open, (now) => withDetents.value && now && !server && sheet.opening(), { flush: 'pre', immediate: true })
watch(
  [open, mounted, index, vh],
  () => {
    if (withDetents.value && open.value && mounted.value && !server) sheet.sync(props.initialFocus)
  },
  { flush: 'post', immediate: true },
)
// Closed, it gives focus back to its opener, and opens next time at the default height.
watch(
  open,
  (now) => {
    if (!withDetents.value || now) return
    inner.value = props.defaultDetent ?? order.value[0]
    sheet.closed()
  },
  { flush: 'post' },
)
// At the top it is modal: focus stays where it is in the sheet, or starts on initialFocus.
watch(
  () => withDetents.value && open.value && mounted.value && atTop.value,
  (on) =>
    hold(
      'detentTrap',
      on &&
        !!panel.value &&
        (() => {
          const el = panel.value!
          const active = document.activeElement as HTMLElement | null
          return trapFocus(el, { initialFocus: active && el.contains(active) ? active : (props.initialFocus ?? null), restore: false })
        }),
    ),
  { flush: 'post', immediate: true },
)
watch(
  () => withDetents.value && open.value && atTop.value,
  (on) => hold('detentLock', on && lockScroll),
  { immediate: true },
)
watch([open, atTop], () => hold('detentDismiss', withDetents.value && open.value && (() => dismissable(() => [panel.value], sheet.stepDown, { outside: atTop.value }))), { immediate: true })
watch(mounted, () => hold('touch', withDetents.value && !!body.value && (() => sheet.holdTouch(body.value!))), { flush: 'post', immediate: true })

onBeforeUnmount(() => {
  Object.values(releases).forEach((r) => r())
  drag.fling.stop()
  sheet.destroy()
  if (!server) window.removeEventListener('resize', onResize)
})
</script>

<template>
  <Teleport v-if="mounted" to="body">
    <template v-if="!withDetents">
      <div :class="styles.overlay" :data-state="state" aria-hidden="true" />
      <div
        v-bind="$attrs"
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`${id}-title`"
        :aria-describedby="hasDescription ? `${id}-desc` : undefined"
        tabindex="-1"
        :class="styles.sheet"
        :data-state="state"
        @animationend="onAnimationEnd"
      >
        <div :class="styles.grab" @pointerdown="drag.down" @pointermove="drag.move" @pointerup="drag.up" @pointercancel="drag.up">
          <span :class="styles.handle" aria-hidden="true" />
          <header :class="styles.header">
            <div :class="styles.titles">
              <h2 :id="`${id}-title`" :class="styles.title"><slot name="title">{{ title }}</slot></h2>
              <p v-if="hasDescription" :id="`${id}-desc`" :class="styles.description"><slot name="description">{{ description }}</slot></p>
            </div>
            <button type="button" :class="styles.close" :aria-label="closeLabel" data-skip-initial-focus="true" @click="close">
              <XIcon />
            </button>
          </header>
        </div>
        <div v-if="slots.default" :class="styles.body"><slot /></div>
        <footer v-if="slots.footer" :class="styles.footer"><slot name="footer" /></footer>
      </div>
    </template>
    <template v-else>
      <div ref="overlay" :class="styles.overlay" :data-state="state" data-detents="true" :data-top="atTop || undefined" aria-hidden="true" />
      <div
        v-bind="$attrs"
        :id="`${id}-sheet`"
        ref="panel"
        role="dialog"
        :aria-modal="atTop || undefined"
        :aria-labelledby="`${id}-title`"
        :aria-describedby="hasDescription ? `${id}-desc` : undefined"
        tabindex="-1"
        :class="styles.sheet"
        :data-state="state"
        data-detents="true"
        :data-top="atTop || undefined"
        :data-dragging="dragging || undefined"
        :style="{ height: `${heights[top]}px` }"
        @pointerdown="sheet.down"
        @focusin="sheet.focusIn($event.target)"
      >
        <div
          ref="grabber"
          :class="styles.grabber"
          role="slider"
          tabindex="0"
          :aria-label="heightLabel"
          aria-orientation="vertical"
          aria-valuemin="0"
          :aria-valuemax="top"
          :aria-valuenow="index"
          :aria-valuetext="DETENT_NAME[order[index]]"
          :aria-controls="`${id}-sheet`"
          :data-detent="shown"
          @keydown="sheet.grabKey"
          @click="sheet.grabClick"
        >
          <span :class="styles.pill" />
        </div>
        <header :class="styles.header">
          <div :class="styles.titles">
            <h2 :id="`${id}-title`" :class="styles.title"><slot name="title">{{ title }}</slot></h2>
            <p v-if="hasDescription" :id="`${id}-desc`" :class="styles.description"><slot name="description">{{ description }}</slot></p>
          </div>
          <button type="button" :class="styles.close" :aria-label="closeLabel" data-skip-initial-focus="true" @click="close">
            <XIcon />
          </button>
        </header>
        <div v-if="slots.default" ref="body" :class="styles.body"><slot /></div>
        <footer v-if="slots.footer" :class="styles.footer"><slot name="footer" /></footer>
        <p :class="styles.srOnly" aria-live="polite">{{ said }}</p>
      </div>
    </template>
  </Teleport>
</template>
