<script setup lang="ts">
import { computed, ref } from 'vue'
import Input from '../Input/Input.vue'
import styles from './PasswordInput.module.css'

// The Vue PasswordInput: an Input with a show and hide toggle, the same look (PasswordInput.module.css) as the React one.
// Every Input prop and attribute passes through; autocomplete defaults to current-password.
const props = withDefaults(
  defineProps<{
    /** Always required. A placeholder is only an example, never the label. */
    label: string
    /** Start with the password shown, when there is no v-model:visible. */
    defaultVisible?: boolean
    /** Name of the toggle. It stays the same; aria-pressed says whether it is on. */
    toggleLabel?: string
    disabled?: boolean
  }>(),
  { defaultVisible: false, toggleLabel: 'Show password' },
)
/** The text, passed to the Input. */
const model = defineModel<string>()
/** Whether the password shows as plain text. Use v-model:visible, or leave it out and the field keeps its own state. */
const visibleModel = defineModel<boolean | undefined>('visible', { default: undefined })
const inner = ref(props.defaultVisible)
const visible = computed(() => visibleModel.value ?? inner.value)
const toggle = () => {
  inner.value = !visible.value
  visibleModel.value = !visible.value
}
</script>

<template>
  <Input
    v-model="model"
    :label="label"
    :class="styles.root"
    :type="visible ? 'text' : 'password'"
    autocomplete="current-password"
    spellcheck="false"
    autocapitalize="off"
    :disabled="disabled"
  >
    <template #trailing>
      <button type="button" :class="styles.toggle" :aria-label="toggleLabel" :aria-pressed="visible" :disabled="disabled" @click="toggle">
        <svg viewBox="0 0 24 24" :class="styles.eye" :data-open="visible || undefined" aria-hidden="true" focusable="false">
          <path :class="styles.lid" d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
          <circle :class="styles.pupil" cx="12" cy="12" r="2.75" />
          <path :class="styles.slash" d="M4 4l16 16" pathLength="1" />
        </svg>
      </button>
    </template>
  </Input>
</template>
