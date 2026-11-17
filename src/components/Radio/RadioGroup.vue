<script lang="ts">
import type { InjectionKey, Ref } from 'vue'

export type RadioContext = { name: Ref<string>; value: Ref<string | null>; set: (v: string) => void; disabled: Ref<boolean | undefined>; invalid: Ref<boolean> }
export const radioKey: InjectionKey<RadioContext> = Symbol('radio')
</script>

<script setup lang="ts">
import { computed, provide, ref, useId } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import styles from './Radio.module.css'

// The Vue RadioGroup: the same look (Radio.module.css) as the React one. Put Radio parts in its slot.

const props = withDefaults(
  defineProps<{
    /** Visible group label (rendered as the fieldset legend). */
    label: string
    /** Extra text under the group label. */
    description?: string
    /** Error under the radios. Marks the group invalid and is read with it. */
    error?: string
    /** Starting value when there is no v-model. */
    defaultValue?: string | null
    /** Form field name shared by every radio. Undefined makes a unique one. */
    name?: string
    /** Turns off every radio in the group. */
    disabled?: boolean
    /** Stacks the radios or puts them in a row. */
    orientation?: 'vertical' | 'horizontal'
  }>(),
  { defaultValue: null, disabled: undefined, orientation: 'vertical' },
)

/** The selected value. Null means nothing is picked. Use v-model, or leave it out and the group keeps its own state. */
const model = defineModel<string | null>()
const local = ref(props.defaultValue)
const value = computed({
  get: () => (model.value === undefined ? local.value : model.value),
  set: (next: string | null) => {
    local.value = next
    model.value = next
  },
})

const auto = useId()
const descId = `${auto}-desc`
const errorId = `${auto}-error`
const describedBy = computed(() => [props.description ? descId : null, props.error ? errorId : null].filter(Boolean).join(' ') || undefined)

provide(radioKey, {
  name: computed(() => props.name ?? auto),
  value,
  set: (v) => (value.value = v),
  disabled: computed(() => props.disabled),
  invalid: computed(() => !!props.error),
})
</script>

<template>
  <fieldset role="radiogroup" :class="styles.group" :disabled="disabled" :aria-invalid="error ? true : undefined" :aria-describedby="describedBy" :data-invalid="error ? true : undefined">
    <legend :class="styles.legend">{{ label }}</legend>
    <p v-if="description" :id="descId" :class="styles.groupDescription">{{ description }}</p>
    <div :class="[styles.items, styles[orientation]]">
      <slot />
    </div>
    <FieldMessage :help-id="`${auto}-help`" :error-id="errorId" :error="error" />
  </fieldset>
</template>
