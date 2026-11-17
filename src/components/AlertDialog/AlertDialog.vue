<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { trapFocus } from '../../internal/motion/focus'
import { dismissable, lockScroll } from '../../internal/motion/layers'
import { createDialogMorph } from '../../internal/motion/liquid'
import { motionMs } from '../../internal/motion'
import Button from '../Button/Button.vue'
import dialog from '../Dialog/Dialog.module.css'
import styles from './AlertDialog.module.css'

// The Vue AlertDialog: the same look, morph and focus as the React one.

const props = withDefaults(
  defineProps<{
    /** The question, such as "Delete this project?". Also the accessible name. The title slot replaces it. */
    title?: string
    /** What happens if they confirm. Read out with the title when the dialog opens. The description slot replaces it. */
    description?: string
    /** Text of the confirm button. Name the action, such as "Delete project", not "OK". */
    confirmLabel: string
    /** Text of the cancel button. */
    cancelLabel?: string
    /** "danger" gives the confirm button the solid red look, for actions that destroy something. */
    tone?: 'default' | 'danger'
  }>(),
  { cancelLabel: 'Cancel', tone: 'default' },
)

/** Shows the dialog. Use v-model:open; Confirm, Cancel or Esc set it false. A tap outside never closes it. */
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{
  /** They confirmed, before the dialog closes. */
  confirm: []
  /** They cancelled with the button or Esc, before the dialog closes. */
  cancel: []
}>()
const slots = defineSlots<{ default?: () => unknown; title?: () => unknown; description?: () => unknown }>()

const id = useId()
const panel = ref<HTMLElement | null>(null)
const cancelButton = ref<InstanceType<typeof Button> | null>(null)

const cancel = () => {
  emit('cancel')
  open.value = false
}
const confirm = () => {
  emit('confirm')
  open.value = false
}

const mounted = ref(open.value)
const state = computed(() => (open.value ? 'open' : 'closed'))
let leaving = 0
const morph = createDialogMorph(() => panel.value)

let release: Array<() => void> = []
const stop = () => {
  release.forEach((r) => r())
  release = []
}
const server = typeof window === 'undefined'

// Before the new state renders, so the opener is read while it still has focus.
watch(
  open,
  (now, was) => {
    if (server) return
    clearTimeout(leaving)
    if (now && !was) morph.opening()
    if (now) mounted.value = true
    else leaving = window.setTimeout(() => (mounted.value = false), motionMs('morph-out'))
  },
  { immediate: true, flush: 'pre' },
)

watch(
  [state, mounted],
  async () => {
    if (server || !mounted.value) return
    await nextTick()
    morph.play(state.value)
    stop()
    if (!open.value || !panel.value) return
    const el = panel.value
    // Focus starts on the least destructive choice, so a stray Enter never confirms.
    release.push(
      lockScroll(),
      dismissable(() => [el], cancel, { outside: false }),
      trapFocus(el, { initialFocus: cancelButton.value?.el ?? null }),
    )
  },
  { immediate: true, flush: 'post' },
)

onBeforeUnmount(() => {
  clearTimeout(leaving)
  stop()
  morph.destroy()
})
</script>

<template>
  <Teleport v-if="mounted" to="body">
    <div :class="dialog.overlay" :data-state="state" aria-hidden="true" />
    <div :class="dialog.positioner">
      <div ref="panel" role="alertdialog" aria-modal="true" :aria-labelledby="`${id}-title`" :aria-describedby="`${id}-desc`" tabindex="-1" :class="[dialog.panel, dialog.sm]" :data-state="state">
        <header :class="[dialog.header, styles.header]">
          <div :class="dialog.titles">
            <h2 :id="`${id}-title`" :class="dialog.title">
              <slot name="title">{{ props.title }}</slot>
            </h2>
            <p :id="`${id}-desc`" :class="dialog.description">
              <slot name="description">{{ props.description }}</slot>
            </p>
          </div>
        </header>
        <div v-if="slots.default" :class="dialog.body"><slot /></div>
        <footer :class="dialog.footer">
          <Button ref="cancelButton" variant="secondary" @click="cancel">{{ cancelLabel }}</Button>
          <Button :variant="tone === 'danger' ? 'danger' : 'primary'" @click="confirm">{{ confirmLabel }}</Button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
