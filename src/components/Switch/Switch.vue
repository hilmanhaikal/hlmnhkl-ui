<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useAttrs, useId, watch } from 'vue'
import { createSwitchThumb } from '../../internal/motion/switchThumb'
import styles from './Switch.module.css'

// The Vue Switch: the same look (Switch.module.css) and thumb motion as the React one.
// Other attributes, such as aria-label or a click listener, go to the switch button.
defineOptions({ inheritAttrs: false })

const { description, labelPosition = 'end', id } = defineProps<{
  /** Visible text next to the switch, also its accessible name. The label slot replaces it. */
  label?: string
  /** Extra text under the label, also read by screen readers. The description slot replaces it. */
  description?: string
  /** Puts the label before the switch, like a settings row. */
  labelPosition?: 'start' | 'end'
  /** Form field name. The form gets "on" while the switch is on, and nothing while it is off. */
  name?: string
  disabled?: boolean
  id?: string
}>()

/** Whether the switch is on. Use v-model, or leave it out and the switch keeps its own state. */
const checked = defineModel<boolean>({ default: false })
const slots = defineSlots<{ label?: () => unknown; description?: () => unknown }>()

const auto = useId()
const switchId = computed(() => id ?? auto)
const hasDescription = computed(() => !!(description || slots.description))
const attrs = useAttrs()
const describedBy = computed(() => [hasDescription.value && `${switchId.value}-desc`, attrs['aria-describedby']].filter(Boolean).join(' ') || undefined)

// The thumb's stretch (motion/switchThumb.ts), played after the DOM has the new state.
const thumbEl = ref<HTMLElement | null>(null)
const thumb = createSwitchThumb(() => thumbEl.value, checked.value)
watch(checked, (on) => thumb.set(on), { flush: 'post' })
onBeforeUnmount(thumb.destroy)
</script>

<template>
  <div :class="[styles.root, labelPosition === 'start' && styles.start]" data-slot="switch" :data-state="checked ? 'checked' : 'unchecked'" :data-disabled="disabled || undefined">
    <button
      v-bind="$attrs"
      :id="switchId"
      type="button"
      role="switch"
      :aria-checked="checked"
      :aria-describedby="describedBy"
      :class="styles.track"
      data-slot="switch-track"
      :data-state="checked ? 'checked' : 'unchecked'"
      :disabled="disabled"
      @click="checked = !checked"
    >
      <span ref="thumbEl" :class="styles.thumb" data-slot="switch-thumb" aria-hidden="true" />
    </button>
    <span :class="styles.text">
      <label :for="switchId" :class="styles.label" data-slot="field-label"><slot name="label">{{ label }}</slot></label>
      <span v-if="hasDescription" :id="`${switchId}-desc`" :class="styles.description" data-slot="switch-description"><slot name="description">{{ description }}</slot></span>
    </span>
    <!-- Submits like a checkbox: "on" when on, nothing when off -->
    <input v-if="name && checked" type="hidden" :name="name" value="on" />
  </div>
</template>
