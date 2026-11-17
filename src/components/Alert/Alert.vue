<script setup lang="ts">
import { computed, ref } from 'vue'
import { foldAway } from '../../internal/motion/alert'
import { focusPast } from '../../internal/motion/collapseOut'
import { CheckCircleIcon, ErrorIcon, InfoIcon, WarningIcon, XIcon } from '../../internal/vueIcons'
import styles from './Alert.module.css'

// The Vue Alert: the same look (Alert.module.css) and fold-away dismiss as the React one.
export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(
  defineProps<{
    /** Sets the colour and icon. Error and warning are announced at once. */
    variant?: AlertVariant
    /** Short bold line at the top. The title slot replaces it. */
    title?: string
    /** Shows a close button (listen with @dismiss). Called after the collapse animation. */
    onDismiss?: () => void
    /** Screen reader name for the close button. */
    dismissLabel?: string
    /** Full-width strip for the top of a page. */
    banner?: boolean
  }>(),
  { variant: 'info', dismissLabel: 'Dismiss' },
)
/** default: body text under the title. action: a button or link shown under the text. */
const slots = defineSlots<{ default?: () => unknown; title?: () => unknown; action?: () => unknown }>()

const icons = { info: InfoIcon, success: CheckCircleIcon, warning: WarningIcon, error: ErrorIcon }
const urgent = computed(() => props.variant === 'error' || props.variant === 'warning')

const root = ref<HTMLElement | null>(null)
const leaving = ref(false)

// Fades, then folds the height (motion/alert.ts). The close button is about to unmount, so focus moves on first.
const dismiss = () => {
  const el = root.value
  if (!el || leaving.value) return
  leaving.value = true
  foldAway(el, () => {
    focusPast(el)
    props.onDismiss?.()
  })
}
</script>

<template>
  <div ref="root" :role="urgent ? 'alert' : 'status'" :class="[styles.root, styles[variant], banner && styles.banner]" :data-leaving="leaving || undefined">
    <component :is="icons[variant]" :class="styles.icon" />
    <div :class="styles.text">
      <p v-if="title || slots.title" :class="styles.title"><slot name="title">{{ title }}</slot></p>
      <div v-if="slots.default" :class="styles.body"><slot /></div>
      <div v-if="slots.action" :class="styles.action"><slot name="action" /></div>
    </div>
    <button v-if="onDismiss" type="button" :class="styles.close" :aria-label="dismissLabel" @click="dismiss">
      <XIcon />
    </button>
  </div>
</template>
