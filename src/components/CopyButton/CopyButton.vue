<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CopyIcon, XIcon } from '../../internal/vueIcons'
import { copyRun, type CopyRun } from '../../internal/motion/liquidMore'
import { capShift, writeText } from '../../internal/motion/copyButton'
import styles from './CopyButton.module.css'

// The Vue CopyButton: the same look (CopyButton.module.css), drop and check as the React one.
const props = withDefaults(
  defineProps<{
    /** Text to put on the clipboard. */
    value: string
    /** Accessible name, and the visible text when showLabel is on. */
    label?: string
    /** Shown and spoken after a successful copy. */
    copiedLabel?: string
    /** Shown and spoken when the browser blocks the copy. */
    failedLabel?: string
    /** Shows the label as text next to the icon. */
    showLabel?: boolean
    /** Size of the button. */
    size?: 'sm' | 'md'
    /** How long the check or the failed state stays, in ms. */
    resetAfter?: number
  }>(),
  { label: 'Copy', copiedLabel: 'Copied', failedLabel: 'Could not copy', showLabel: false, size: 'md', resetAfter: 1800 },
)
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
  [() => props.showLabel, () => props.label, () => props.size, labelEl],
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
  const ok = await writeText(props.value)
  status.value = ok ? 'copied' : 'failed'
  if (ok) emit('copy', props.value)
  window.clearTimeout(timer)
  timer = window.setTimeout(() => (status.value = 'idle'), props.resetAfter)
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
    :class="[styles.root, styles[size], showLabel && styles.withLabel]"
    :data-copied="status === 'copied' || undefined"
    :data-failed="status === 'failed' || undefined"
    :aria-label="showLabel ? undefined : label"
    @click="onClick"
  >
    <span ref="iconsEl" :class="styles.icons" aria-hidden="true">
      <CopyIcon :class="styles.copy" />
      <svg viewBox="0 0 24 24" :class="styles.check">
        <path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" />
      </svg>
      <XIcon :class="styles.fail" />
    </span>
    <span v-if="showLabel" :class="styles.labels">
      <span ref="labelEl" :class="styles.labelIdle">{{ label }}</span>
      <span :class="styles.labelDone" aria-hidden="true">{{ copiedLabel }}</span>
      <span :class="styles.labelFailed" aria-hidden="true">{{ failedLabel }}</span>
    </span>
    <span :class="styles.srOnly" aria-live="polite">{{ status === 'copied' ? copiedLabel : status === 'failed' ? failedLabel : '' }}</span>
  </button>
</template>
