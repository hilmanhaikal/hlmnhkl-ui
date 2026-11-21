<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { prefersReducedMotion } from '../../internal/motion'
import { bud, createFuse, cssMs, DONE_FOR, GUARD, HINT_AFTER, LEAVE, outline, TAP } from '../../internal/motion/holdToConfirm'
import { CheckIcon, XIcon } from '../../icons/vue'
import styles from './HoldToConfirm.module.css'

// The Vue HoldToConfirm: the same look (HoldToConfirm.module.css), hold, confirm step and motion as the
// React one. The action's label goes in the default slot.
const {
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  doneLabel = 'Done',
  hint = 'Hold to confirm, or tap for a confirm step.',
  disabled = false,
} = defineProps<{
  /** The action as a verb for the confirm step's line, such as "Delete": "Press it again to delete, or Cancel." */
  confirmLabel?: string
  /** The name of the round cancel button that buds out beside it in the confirm step. */
  cancelLabel?: string
  /** Shown in place of the label once it is done, such as "Workspace deleted". The doneLabel slot replaces it. */
  doneLabel?: string
  /** The line under the button. Defaults to how to use it. The hint slot replaces it. */
  hint?: string
  /** The line under the button while the confirm step is open. The stepHint slot replaces it. */
  stepHint?: string
  /** Blocks the button. Say why in the hint. */
  disabled?: boolean
}>()
/** confirm: once the hold runs to the end, or the button is pressed again in the confirm step. cancel: a hold let go early, or the step cancelled. */
const emit = defineEmits<{ confirm: []; cancel: [] }>()
defineSlots<{ default?: () => unknown; doneLabel?: () => unknown; hint?: () => unknown; stepHint?: () => unknown }>()

type Phase = 'idle' | 'step' | 'done'

const id = useId()
const rootEl = ref<HTMLElement | null>(null)
const shellEl = ref<HTMLElement | null>(null)
const mainEl = ref<HTMLButtonElement | null>(null)
const rowEl = ref<HTMLElement | null>(null)
const cancelEl = ref<HTMLButtonElement | null>(null)
const runEl = ref<SVGPathElement | null>(null)
const phase = ref<Phase>('idle')
const size = ref({ w: 0, h: 0, inset: 1 })
const path = ref('')
const keep = ref(false)
const said = ref('')

// The burning line (motion/holdToConfirm.ts).
const fuse = createFuse(() => runEl.value)
let stepAt = 0
let tapTimer = 0
let press: { t0: number; pointer: number | 'key'; key?: string } | null = null

let ro: ResizeObserver | undefined
onMounted(() => {
  const root = rootEl.value
  const main = mainEl.value
  if (!root || !main) return
  const measure = () => {
    const w = main.offsetWidth
    const h = main.offsetHeight
    const inset = parseFloat(getComputedStyle(root).getPropertyValue('--gooee-hold-to-confirm-stroke')) / 2 || 1
    size.value = { w, h, inset }
    path.value = outline(w, h, inset, w / 2)
  }
  measure()
  ro = new ResizeObserver(measure)
  ro.observe(main)
})

const finish = () => {
  fuse.stop()
  press = null
  fuse.paint(1)
  keep.value = false
  // From the step, focus goes back to the button: the step closes under it. Safari never focused Confirm.
  if (phase.value === 'step') mainEl.value?.focus({ preventScroll: true })
  phase.value = 'done'
  said.value = doneLabel
  if (!prefersReducedMotion()) navigator.vibrate?.(12)
  emit('confirm')
}

// Forward at an even speed, and back fast on the morph curve.
const run = () =>
  fuse.forward(
    cssMs(shellEl.value, '--gooee-delay-hold-to-confirm', 1500),
    (now) => {
      if (press && now - press.t0 > HINT_AFTER) keep.value = true
    },
    finish,
  )

const openStep = () => {
  window.clearTimeout(tapTimer)
  tapTimer = 0
  fuse.stop()
  fuse.paint(0)
  stepAt = performance.now()
  phase.value = 'step'
}

const closeStep = () => {
  phase.value = 'idle'
  mainEl.value?.focus({ preventScroll: true })
  emit('cancel')
}

watch(
  phase,
  (now, _, onCleanup) => {
    if (now === 'step') cancelEl.value?.focus({ preventScroll: true })
    if (now !== 'done') return
    const t = window.setTimeout(() => {
      fuse.paint(0)
      phase.value = 'idle'
      said.value = ''
    }, DONE_FOR)
    onCleanup(() => window.clearTimeout(t))
  },
  { flush: 'post' },
)

// The cancel drop buds out when the step opens and flows back when it closes, either way.
let wasOpen = false
watch(
  phase,
  (now, _, onCleanup) => {
    const isOpen = now === 'step'
    if (isOpen === wasOpen) return
    wasOpen = isOpen
    const row = rowEl.value,
      shell = shellEl.value,
      x = cancelEl.value
    if (!row || !shell || !x) return
    const stop = bud(row, shell, x, isOpen ? 'in' : 'out', styles.bud)
    if (stop) onCleanup(stop)
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  ro?.disconnect()
  fuse.stop()
  window.clearTimeout(tapTimer)
})

const start = (pointer: number | 'key', x: number, key?: string) => {
  press = { t0: performance.now(), pointer, key }
  path.value = outline(size.value.w, size.value.h, size.value.inset, x)
  shellEl.value?.setAttribute('data-held', '')
  run()
}

const letGo = (tapAllowed: boolean) => {
  const pr = press
  press = null
  shellEl.value?.removeAttribute('data-held')
  keep.value = false
  if (!pr || phase.value !== 'idle') return
  const tap = tapAllowed && performance.now() - pr.t0 < TAP
  fuse.rewind()
  if (!tap) return emit('cancel')
  if (pr.pointer === 'key') return openStep()
  // A tapped step opens on the click that follows, after the browser has focused the button, so focus
  // can then move to Cancel. If no click comes, it opens anyway.
  tapTimer = window.setTimeout(openStep, TAP)
}

const onPointerDown = (e: PointerEvent) => {
  if (disabled || phase.value !== 'idle' || press || (e.pointerType === 'mouse' && e.button !== 0)) return
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture?.(e.pointerId)
  start(e.pointerId, e.clientX - el.getBoundingClientRect().left)
}

const onPointerMove = (e: PointerEvent) => {
  if (!press || press.pointer !== e.pointerId) return
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  if (e.clientX < r.left - LEAVE || e.clientX > r.right + LEAVE || e.clientY < r.top - LEAVE || e.clientY > r.bottom + LEAVE) letGo(false)
}

const onPointerEnd = (e: PointerEvent) => {
  if (press?.pointer === e.pointerId) letGo(e.type === 'pointerup')
}

// Held Enter or Space works like a held finger, from the middle of the button. One press opens the
// confirm step, since holding a key is hard for many people.
const onKeyDown = (e: KeyboardEvent) => {
  if (phase.value === 'step') {
    // In the step the button confirms with its own click; Escape steps back.
    if (e.key === 'Escape') closeStep()
    return
  }
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  if (e.repeat || disabled || phase.value !== 'idle' || press) return
  start('key', size.value.w / 2, e.key)
}

const onKeyUp = (e: KeyboardEvent) => {
  if (phase.value === 'step' || (e.key !== 'Enter' && e.key !== ' ')) return
  e.preventDefault()
  if (press?.key === e.key) letGo(true)
}

// A screen reader or voice control sends a click with no press: it opens the confirm step.
const onClick = (e: MouseEvent) => {
  // In the step, pressing the button again confirms it, unless it is the second half of a double-click.
  if (phase.value === 'step') {
    if (e.detail === 0 || performance.now() - stepAt > GUARD) finish()
    return
  }
  if (disabled || phase.value !== 'idle' || press) return
  if (e.detail === 0 || tapTimer) openStep()
}

const onCancelKey = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return
  e.stopPropagation()
  closeStep()
}

const open = computed(() => phase.value === 'step')
</script>

<template>
  <div ref="rootEl" data-slot="hold-to-confirm" :class="styles.root">
    <div ref="rowEl" :class="styles.row">
      <div ref="shellEl" data-slot="hold-to-confirm-shell" :class="styles.shell" :data-status="phase" :data-disabled="disabled || undefined">
        <button
          ref="mainEl"
          type="button"
          data-slot="hold-to-confirm-button"
          :class="styles.main"
          :aria-describedby="`${id}-hint`"
          :aria-expanded="open"
          :aria-controls="`${id}-step`"
          :aria-disabled="disabled || undefined"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerEnd"
          @pointercancel="onPointerEnd"
          @contextmenu.prevent
          @keydown="onKeyDown"
          @keyup="onKeyUp"
          @blur="press?.pointer === 'key' && letGo(false)"
          @click="onClick"
        >
          <span :class="styles.faces">
            <span data-slot="hold-to-confirm-label" :class="styles.face" data-face="idle" :aria-hidden="phase === 'done' || undefined"><slot /></span>
            <span data-slot="hold-to-confirm-done-label" :class="styles.face" data-face="done" :aria-hidden="phase !== 'done' || undefined">
              <CheckIcon />
              <slot name="doneLabel">{{ doneLabel }}</slot>
            </span>
          </span>
          <svg data-slot="hold-to-confirm-fuse" :class="styles.fuse" :width="size.w" :height="size.h" aria-hidden="true">
            <path ref="runEl" :d="path" :class="styles.run" :pathLength="1" />
          </svg>
        </button>
      </div>
      <button
        :id="`${id}-step`"
        ref="cancelEl"
        type="button"
        data-slot="hold-to-confirm-cancel"
        :class="styles.cancel"
        :aria-label="cancelLabel"
        :aria-describedby="`${id}-hint`"
        :inert="!open"
        @click="closeStep"
        @keydown="onCancelKey"
      >
        <XIcon />
      </button>
    </div>
    <p :id="`${id}-hint`" data-slot="hold-to-confirm-hint" :class="styles.hint">
      <slot v-if="open" name="stepHint">{{ stepHint ?? `Press it again to ${confirmLabel.toLowerCase()}, or ${cancelLabel}.` }}</slot>
      <template v-else-if="phase === 'done'" />
      <template v-else-if="keep">Keep holding</template>
      <slot v-else name="hint">{{ hint }}</slot>
    </p>
    <p :class="styles.srOnly" aria-live="polite">{{ said }}</p>
  </div>
</template>
