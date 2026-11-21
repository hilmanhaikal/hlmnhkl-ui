<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import styles from './Fieldset.module.css'

// The Vue Fieldset: a native fieldset and legend with the same look (Fieldset.module.css) as the React one.
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  /** Visible name of the group, rendered as the legend. The legend slot replaces it. */
  legend?: string
  /** Muted text under the legend, read with the group. */
  description?: string
  /** Error for the group as a whole, shown under the fields and read with the group. */
  error?: string
  /** Turns off every field inside, natively, so none of them can be focused or sent. */
  disabled?: boolean
  id?: string
}>()
const slots = defineSlots<{ default?: () => unknown; legend?: () => unknown; description?: () => unknown }>()
const attrs = useAttrs()

const rest = computed(() => {
  const { 'aria-describedby': _d, ...other } = attrs
  return other
})
const auto = useId()
const base = computed(() => props.id ?? auto)
const descId = computed(() => `${base.value}-desc`)
const errorId = computed(() => `${base.value}-error`)
const hasDescription = computed(() => !!slots.description || !!props.description)
const describedBy = computed(() => [hasDescription.value ? descId.value : null, props.error ? errorId.value : null, attrs['aria-describedby']].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <fieldset v-bind="rest" :id="id" data-slot="fieldset" :class="styles.root" :disabled="disabled" :aria-describedby="describedBy">
    <legend data-slot="fieldset-legend" :class="styles.legend"><slot name="legend">{{ legend }}</slot></legend>
    <p v-if="hasDescription" :id="descId" data-slot="fieldset-description" :class="styles.description"><slot name="description">{{ description }}</slot></p>
    <div data-slot="fieldset-fields" :class="styles.fields"><slot /></div>
    <FieldMessage :help-id="`${base}-help`" :error-id="errorId" :error="error" />
  </fieldset>
</template>
