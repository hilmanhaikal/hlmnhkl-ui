<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { createSoftPress } from '../../internal/motion/softPress'
import Spinner from '../Spinner/Spinner.vue'
import styles from './Button.module.css'

// The Vue Button: the same look (Button.module.css) and soft press as the React one.
// Other attributes and listeners go to the button (or the link, with href).
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Visual weight. Use one primary per view and danger for destructive actions. */
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    /** Height and text size. */
    size?: 'sm' | 'md' | 'lg'
    /** Shows a spinner and ignores clicks, but keeps focus on the button. */
    loading?: boolean
    /** Spoken while loading, for example "Saving". */
    loadingLabel?: string
    /** Stretches the button to fill its container. */
    fullWidth?: boolean
    disabled?: boolean
    /** Why the button is disabled. Read by screen readers and shown as a tooltip while it is disabled. */
    disabledReason?: string
    /** Renders a link with the same look, for navigation. */
    href?: string
    type?: 'button' | 'submit' | 'reset'
  }>(),
  { variant: 'primary', size: 'md', loading: false, loadingLabel: 'Loading', type: 'button' },
)
// The rendered button or link, for a parent that moves focus to it (React's forwarded ref).
const el = ref<HTMLButtonElement | HTMLAnchorElement | null>(null)
defineExpose({ el })
const slots = useSlots() as { default?: () => unknown; leading?: () => unknown; trailing?: () => unknown }
const attrs = useAttrs()

const reasonId = useId()
const ariaDisabled = computed(() => attrs['aria-disabled'] === true || attrs['aria-disabled'] === 'true')
const inert = computed(() => props.loading || props.disabled || ariaDisabled.value)
const reason = computed(() => (props.disabled || ariaDisabled.value ? props.disabledReason : undefined))
const describedBy = computed(() => [attrs['aria-describedby'], reason.value ? reasonId : undefined].filter(Boolean).join(' ') || undefined)

// The edge is soft: it dents where pressed and springs back (motion/softPress.ts).
const soft = createSoftPress({
  look: { layer: styles.soft, fill: styles.softFill, ring: styles.softRing, wet: styles.wet },
  get keys() {
    return props.href === undefined ? [' ', 'Enter'] : ['Enter']
  },
  get inert() {
    return inert.value
  },
})
watch(inert, (now) => now && soft.stop())
onBeforeUnmount(soft.destroy)

// The caller's click runs only while the button is not inert; preventDefault also stops a submit or a link.
const onClick = (e: MouseEvent) => {
  if (inert.value) {
    e.preventDefault()
    return
  }
  const own = attrs.onClick as ((e: MouseEvent) => void) | Array<(e: MouseEvent) => void> | undefined
  ;(Array.isArray(own) ? own : own ? [own] : []).forEach((f) => f(e))
}
const rest = computed(() => {
  const { onClick: _onClick, 'aria-describedby': _describedBy, 'aria-disabled': _ariaDisabled, class: _class, ...others } = attrs
  return others
})
const shared = computed(() => ({
  'aria-describedby': describedBy.value,
  title: (attrs.title as string | undefined) ?? reason.value,
  // The caller's class joins ours, as React's className does.
  class: [styles.root, styles[props.variant], styles[props.size], props.fullWidth && styles.full, attrs.class],
  'data-loading': props.loading || undefined,
  'aria-busy': props.loading || undefined,
  'aria-disabled': inert.value || undefined,
}))
</script>

<template>
  <!-- A link has no disabled state; without href it leaves the tab order like a disabled button. -->
  <a
    v-if="href !== undefined"
    ref="el"
    v-bind="{ ...rest, ...shared }"
    :href="disabled ? undefined : href"
    :role="disabled ? 'link' : undefined"
    @click="onClick"
    @pointerdown="soft.down"
    @pointermove="soft.hover"
    @pointerleave="soft.leave"
    @keydown="soft.keyDown"
    @keyup="soft.keyUp"
    @blur="soft.blur"
  >
    <span :class="styles.content">
      <span v-if="slots.leading" :class="styles.icon"><slot name="leading" /></span>
      <span :class="styles.label"><slot /></span>
      <span v-if="slots.trailing" :class="styles.icon"><slot name="trailing" /></span>
    </span>
    <span :class="styles.spinner" aria-hidden="true"><Spinner v-if="loading" size="sm" :label="null" /></span>
    <span :class="styles.srOnly" role="status">{{ loading ? loadingLabel : null }}</span>
    <span v-if="reason" :id="reasonId" :class="styles.srOnly" aria-hidden="true">{{ reason }}</span>
  </a>
  <!-- With a reason the button is aria-disabled only: a natively disabled button cannot take focus, so its reason could not be reached. -->
  <button
    v-else
    ref="el"
    v-bind="{ ...rest, ...shared }"
    :type="type"
    :disabled="reason ? undefined : disabled"
    @click="onClick"
    @pointerdown="soft.down"
    @pointermove="soft.hover"
    @pointerleave="soft.leave"
    @keydown="soft.keyDown"
    @keyup="soft.keyUp"
    @blur="soft.blur"
  >
    <span :class="styles.content">
      <span v-if="slots.leading" :class="styles.icon"><slot name="leading" /></span>
      <span :class="styles.label"><slot /></span>
      <span v-if="slots.trailing" :class="styles.icon"><slot name="trailing" /></span>
    </span>
    <span :class="styles.spinner" aria-hidden="true"><Spinner v-if="loading" size="sm" :label="null" /></span>
    <span :class="styles.srOnly" role="status">{{ loading ? loadingLabel : null }}</span>
    <span v-if="reason" :id="reasonId" :class="styles.srOnly" aria-hidden="true">{{ reason }}</span>
  </button>
</template>
