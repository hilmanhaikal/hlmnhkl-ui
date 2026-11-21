<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CopyIcon, XIcon } from '../../icons/vue'
import { copyRun, type CopyRun } from '../../internal/motion/liquidMore'
import { capShift, writeText } from '../../internal/motion/copyButton'
import styles from './CopyButton.module.css'

export type CopyButtonLabels = {
  /** Shown and spoken after a successful copy. */
  copied: string
  /** Shown and spoken when the browser blocks the copy. */
  failed: string
}

// The Vue CopyButton: the same look (CopyButton.module.css), drop and check as the React one.
const {
  value,
  label = 'Copy',
  showLabel = false,
  size = 'md',
  resetAfter = 1800,
  labels,
} = defineProps<{
  /** Text to put on the clipboard. */
  value: string
  /** Accessible name, and the visible text when showLabel is on. */
  label?: string
  /** Shows the label as text next to the icon. */
  showLabel?: boolean
  /** Size of the button. */
  size?: 'sm' | 'md'
  /** How long the check or the failed state stays, in ms. */
  resetAfter?: number
  /** Status text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<CopyButtonLabels>
}>()
const text = computed(() => ({ copied: 'Copied', failed: 'Could not copy', ...labels }))
/** Fires after the text is copied, with the copied text. Not fired if copying fails. */
const emit = defineEmits<{ copy: [value: string] }>()

const status = ref<'idle' | 'copied' | 'failed'>('idle')
let timer: number | undefined

const rootEl = ref<HTMLButtonElement | null>(null)
const iconsEl = ref<HTMLSpanElement | null>(null)
const labelEl = ref<HTMLSpanElement | null>(null)
let pressedAt: [number, number] | null = null
let run: CopyRun | null = null

// A copy pours a drop from where it was pressed into the icon (motion/liquidMore.ts); going idle plays it back.
const copied = computed(() => status.value === 'copied')
watch(
  copied,
  (now) => {
    const icons = iconsEl.value
    // A failed copy shows its cross at once, with nothing poured.
    if (!icons || status.value === 'failed') {
      run?.stop()
      run = null
      return
    }
    const at = pressedAt
    pressedAt = null
    run = copyRun(icons, now ? 1 : 0, at, styles.pour, run)
  },
  { flush: 'post' },
)

// With a label, the icon sits on the middle of the label's capital letters (motion/copyButton.ts).
let unplace = () => {}
watch(
  [() => showLabel, () => label, () => size, labelEl],
  () => {
    unplace()
    unplace = capShift(rootEl.value, iconsEl.value, labelEl.value?.firstChild)
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  window.clearTimeout(timer)
  unplace()
  run?.stop()
})

const copy = async () => {
  const ok = await writeText(value)
  status.value = ok ? 'copied' : 'failed'
  if (ok) emit('copy', value)
  window.clearTimeout(timer)
  timer = window.setTimeout(() => (status.value = 'idle'), resetAfter)
}

const onClick = (e: MouseEvent) => {
  const r = iconsEl.value?.getBoundingClientRect()
  // A key press (no pointer) pours from the icon's middle.
  pressedAt = r && e.detail ? [e.clientX - r.left, e.clientY - r.top] : null
  copy()
}
</script>

<template>
  <button
    ref="rootEl"
    type="button"
    data-slot="copy-button"
    :class="[styles.root, styles[size], showLabel && styles.withLabel]"
    :data-status="status"
    :aria-label="showLabel ? undefined : label"
    @click="onClick"
  >
    <span ref="iconsEl" data-slot="copy-button-icon" :class="styles.icons" aria-hidden="true">
      <CopyIcon :class="styles.copy" />
      <svg viewBox="0 0 24 24" :class="styles.check">
        <path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" />
      </svg>
      <XIcon :class="styles.fail" />
    </span>
    <span v-if="showLabel" data-slot="copy-button-label" :class="styles.labels">
      <span ref="labelEl" :class="styles.labelIdle">{{ label }}</span>
      <span :class="styles.labelDone" aria-hidden="true">{{ text.copied }}</span>
      <span :class="styles.labelFailed" aria-hidden="true">{{ text.failed }}</span>
    </span>
    <span :class="styles.srOnly" aria-live="polite">{{ status === 'copied' ? text.copied : status === 'failed' ? text.failed : '' }}</span>
  </button>
</template>
