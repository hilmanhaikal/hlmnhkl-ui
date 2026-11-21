<script setup lang="ts">
import { computed, ref } from 'vue'
import { leavesField } from '../../internal/formCore'
import Input, { type InputLabels } from '../Input/Input.vue'
import styles from './PasswordInput.module.css'

// The Vue PasswordInput: an Input with a show and hide toggle, the same look (PasswordInput.module.css) as the React one.
// Every Input prop and attribute passes through; autocomplete defaults to current-password.

export type PasswordInputLabels = InputLabels & {
  /** Name of the toggle. It stays the same; aria-pressed says whether it is on. */
  toggle: string
}

const { defaultVisible = false } = defineProps<{
  /** Always required. A placeholder is only an example, never the label. */
  label: string
  /** Start with the password shown, when there is no v-model:visible. */
  defaultVisible?: boolean
  /** Text for the label and the toggle, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<PasswordInputLabels>
  disabled?: boolean
}>()
/** The text, passed to the Input. */
const model = defineModel<string>()
/** Whether the password shows as plain text. Use v-model:visible, or leave it out and the field keeps its own state. */
const visibleModel = defineModel<boolean | undefined>('visible', { default: undefined })
const emit = defineEmits<{
  /** Focus left the field, not moved between the text and the toggle, so vee-validate's handleBlur runs. */
  blur: [event: FocusEvent]
}>()
const field = ref<InstanceType<typeof Input> | null>(null)
const el = computed(() => field.value?.el ?? null)
defineExpose({ el })
const leave = (e: FocusEvent) => {
  if (leavesField(e, el.value?.closest('[data-slot="input-field"]') ?? null)) emit('blur', e)
}
const inner = ref(defaultVisible)
const visible = computed(() => visibleModel.value ?? inner.value)
const toggle = () => {
  inner.value = !visible.value
  visibleModel.value = !visible.value
}
</script>

<template>
  <Input
    ref="field"
    v-model="model"
    :label="label"
    :labels="labels"
    :class="styles.root"
    :type="visible ? 'text' : 'password'"
    autocomplete="current-password"
    spellcheck="false"
    autocapitalize="off"
    :disabled="disabled"
    @blur="leave"
  >
    <template #trailing>
      <button type="button" :class="styles.toggle" data-slot="password-input-toggle" :data-state="visible ? 'on' : 'off'" :aria-label="labels?.toggle ?? 'Show password'" :aria-pressed="visible" :disabled="disabled" @click="toggle" @blur="leave">
        <svg viewBox="0 0 24 24" :class="styles.eye" aria-hidden="true" focusable="false">
          <path :class="styles.lid" d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
          <circle :class="styles.pupil" cx="12" cy="12" r="2.75" />
          <path :class="styles.slash" d="M4 4l16 16" pathLength="1" />
        </svg>
      </button>
    </template>
  </Input>
</template>
