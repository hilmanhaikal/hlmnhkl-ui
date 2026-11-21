<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { focusInCard, measurePill, pillAlertTimer, pillOutside, pillVars } from '../../internal/motion/livePill'
import { CheckIcon } from '../../icons/vue'
import styles from './LivePill.module.css'

// The Vue LivePill: the same look (LivePill.module.css) and grow-from-its-spot card (motion/livePill.ts) as the
// React one. Other attributes, such as a class or style, go to the root.
const { placement = 'bottom', align = 'center', progress, status, tone = 'paper', news, alert, alertMs = 5000 } = defineProps<{
  /** Screen reader name of the pill: start with the words it shows, then the rest of the state, such as "City map 63%, download". People using voice control say what they see. */
  label: string
  /** Where it sits. At the bottom it is in thumb reach and grows up; at the top it grows down. */
  placement?: 'bottom' | 'top'
  /** "center" keeps the pill in the middle of its row, like a status bar. "start" puts it at the row's start edge, and the card grows from there. */
  align?: 'center' | 'start'
  /** Pins it to the screen edge, clear of the safe area. Leave off to place it yourself. */
  fixed?: boolean
  /** From 0 to 1: a ring at the pill's start shows it. Open, the ring grows on its spot with the percent inside. */
  progress?: number
  /** "done" closes the ring into a tick (also at progress 1). "stopped" turns it red with a mark; say why in the words. */
  status?: 'done' | 'stopped'
  /** "paper" is a light pill with an outline; "ink" is a solid dark one. */
  tone?: 'paper' | 'ink'
  /** News for screen readers, said once each time it changes, such as "Download paused". Never a ticking number. */
  news?: string
  /** News that opens the pill by itself, such as "Rider is at your door". Said once, and the pill shrinks back after alertMs. */
  alert?: string
  /** How long an alert keeps it open, in ms. A hand or focus on the pill holds it open. */
  alertMs?: number
}>()
/** Whether it is open. Use v-model:open, or leave it out and the pill keeps its own state. */
const open = defineModel<boolean>('open', { default: false })
/** compact: what the small pill shows; it stays on its spot when the pill opens. default: what the open card shows. */
defineSlots<{ compact?: () => unknown; default?: () => unknown }>()

const shell = ref<HTMLElement | null>(null)
const button = ref<HTMLElement | null>(null)
const slot = ref<HTMLElement | null>(null)
const lead = ref<HTMLElement | null>(null)
const shut = ref<string>()
const rowH = ref<number>()
const ringAt = ref<[number, number]>()
const byAlert = ref(false)
const held = ref(false)
const said = ref('')

const close = (refocus: boolean) => {
  byAlert.value = false
  open.value = false
  if (refocus) button.value?.focus({ preventScroll: true })
}

watch(
  () => news,
  (news) => news && (said.value = news),
)
watch(
  () => alert,
  (alert) => {
    if (!alert) return
    said.value = alert
    // Only a card the alert opened shrinks back by itself; one the person opened stays.
    if (open.value) return
    byAlert.value = true
    open.value = true
  },
)

const stops: (() => void)[] = []
onMounted(() => {
  // Shut, the card is cut back to the button's own box, so the pill grows out of its own spot.
  stops.push(
    measurePill(shell.value!, button.value!, { slot: () => slot.value, lead: () => lead.value, isOpen: () => open.value }, (shape) => {
      shut.value = shape.shut
      if (shape.ringAt) ringAt.value = shape.ringAt
      rowH.value = shape.rowH
    }),
  )
  stops.push(
    watch(
      open,
      (now, _, onCleanup) => {
        if (!now) return void (byAlert.value = false)
        onCleanup(pillOutside(() => shell.value, () => button.value, () => close(false)))
      },
      { immediate: true },
    ),
  )
  stops.push(
    watchEffect((onCleanup) => {
      if (!open.value || !byAlert.value || held.value) return
      onCleanup(pillAlertTimer(alertMs, () => close(focusInCard(shell.value, button.value))))
    }),
  )
})
onBeforeUnmount(() => stops.forEach((stop) => stop()))

const p = computed(() => (progress === undefined ? undefined : Math.min(1, Math.max(0, progress))))
const state = computed(() => status ?? (p.value === 1 ? 'done' : undefined))
const ring = computed(() => p.value !== undefined || state.value !== undefined)

const onKeydown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || !open.value) return
  e.stopPropagation()
  close(true)
}
const onFocusout = (e: FocusEvent) => {
  if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) held.value = false
}
</script>

<template>
  <div data-slot="live-pill" :class="styles.root" :data-placement="placement" :data-align="align" :data-ring="ring || undefined" :data-fixed="fixed || undefined" :style="pillVars(shut, rowH, ringAt)">
    <div
      ref="shell"
      data-slot="live-pill-shell"
      :class="styles.shell"
      :data-state="open ? 'open' : 'closed'"
      :data-measured="shut ? '' : undefined"
      :data-tone="tone"
      @keydown="onKeydown"
      @pointerenter="held = true"
      @pointerleave="held = false"
      @focusin="held = true"
      @focusout="onFocusout"
    >
      <span v-if="ring" ref="lead" data-slot="live-pill-ring" :class="styles.lead" :data-status="state" aria-hidden="true">
        <svg :class="styles.ring" viewBox="0 0 44 44">
          <circle :class="styles.track" cx="22" cy="22" r="20" />
          <circle :class="styles.arc" cx="22" cy="22" r="20" :pathLength="100" :stroke-dasharray="`${state ? 100 : (p ?? 0) * 100} 100`" />
        </svg>
        <CheckIcon v-if="state === 'done'" data-slot="live-pill-mark" :class="styles.mark" />
        <svg v-else-if="state === 'stopped'" data-slot="live-pill-mark" :class="styles.mark" viewBox="0 0 24 24">
          <path d="M12 7v6M12 17v.01" />
        </svg>
        <span v-else data-slot="live-pill-percent" :class="styles.pct">{{ Math.round((p ?? 0) * 100) }}%</span>
      </span>
      <div :class="styles.row">
        <button ref="button" type="button" data-slot="live-pill-trigger" :class="styles.button" :aria-expanded="open" :aria-label="label" @click="open ? close(false) : (open = true)">
          <span v-if="ring" ref="slot" :class="styles.slot" />
          <span data-slot="live-pill-compact" :class="styles.face"><slot name="compact" /></span>
        </button>
      </div>
      <div data-slot="live-pill-content" :class="styles.body" :inert="!open" :aria-hidden="!open || undefined">
        <slot />
      </div>
    </div>
    <span :class="styles.sr" role="status" aria-live="polite" aria-atomic="true">{{ said }}</span>
  </div>
</template>
