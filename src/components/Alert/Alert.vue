<script setup lang="ts">
import { computed, ref } from 'vue'
import { foldAway } from '../../internal/motion/alert'
import { focusPast } from '../../internal/motion/collapseOut'
import { CheckCircleIcon, ErrorIcon, InfoIcon, WarningIcon, XIcon } from '../../icons/vue'
import styles from './Alert.module.css'

// The Vue Alert: the same look (Alert.module.css) and fold-away dismiss as the React one.
export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

export type AlertLabels = {
  /** Name of the close button. */
  dismiss: string
}

const { tone = 'info', onDismiss, labels } = defineProps<{
  /** Sets the colour and icon. Danger and warning are announced at once. */
  tone?: AlertTone
  /** Short bold line at the top. The title slot replaces it. */
  title?: string
  /** Shows a close button (listen with @dismiss). Called after the collapse animation. */
  onDismiss?: () => void
  /** Full-width strip for the top of a page. */
  banner?: boolean
  /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<AlertLabels>
}>()
/** default: body text under the title. action: a button or link shown under the text. */
const slots = defineSlots<{ default?: () => unknown; title?: () => unknown; action?: () => unknown }>()

const icons = { info: InfoIcon, success: CheckCircleIcon, warning: WarningIcon, danger: ErrorIcon }
const urgent = computed(() => tone === 'danger' || tone === 'warning')

const text = computed(() => ({ dismiss: 'Dismiss', ...labels }))

const root = ref<HTMLElement | null>(null)
const leaving = ref(false)

// Fades, then folds the height (motion/alert.ts). The close button is about to unmount, so focus moves on first.
const dismiss = () => {
  const el = root.value
  if (!el || leaving.value) return
  leaving.value = true
  foldAway(el, () => {
    focusPast(el)
    onDismiss?.()
  })
}
</script>

<template>
  <div ref="root" :role="urgent ? 'alert' : 'status'" data-slot="alert" :class="[styles.root, styles[tone], banner && styles.banner]" :data-leaving="leaving || undefined">
    <component :is="icons[tone]" data-slot="alert-icon" :class="styles.icon" />
    <div :class="styles.text">
      <p v-if="title || slots.title" data-slot="alert-title" :class="styles.title"><slot name="title">{{ title }}</slot></p>
      <div v-if="slots.default" data-slot="alert-body" :class="styles.body"><slot /></div>
      <div v-if="slots.action" data-slot="alert-action" :class="styles.action"><slot name="action" /></div>
    </div>
    <button v-if="onDismiss" type="button" data-slot="alert-close" :class="styles.close" :aria-label="text.dismiss" @click="dismiss">
      <XIcon />
    </button>
  </div>
</template>
