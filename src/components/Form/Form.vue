<script setup lang="ts">
import { nextTick, provide, ref, watch } from 'vue'
import { createFormErrors, focusFirst, type FormErrors, type ValidationBehavior } from '../../internal/formCore'
import { formKey } from '../../internal/vue/useField'

export type { FormErrors, ValidationBehavior }

// The Vue Form: the same markup and behaviour as the React one. Other attributes, such as action or
// novalidate, go to the form. Listen to submit with @submit.prevent to handle it in the page.
const props = withDefaults(
  defineProps<{
    /** Errors by field name, such as a server's answer. Each shows under its field and goes when that field changes, not on a form reset (React resets the form after every action). */
    errors?: FormErrors
    /** "native" uses the browser's checks (required, type, pattern), shows their messages under the fields and blocks a failed submit. "aria" never blocks submit; it only marks fields with errors. */
    validationBehavior?: ValidationBehavior
  }>(),
  { validationBehavior: 'native' },
)
const emit = defineEmits<{ submit: [event: SubmitEvent]; reset: [event: Event] }>()
defineSlots<{ default?: () => unknown }>()

const store = createFormErrors(props.errors)
provide(formKey, {
  errors: store,
  get validationBehavior() {
    return props.validationBehavior
  },
})

const el = ref<HTMLFormElement | null>(null)
defineExpose({ el })
let submitted = false
// A submit that came back with errors (a server, an async check) focuses the first field with one.
watch(
  () => props.errors,
  async (next) => {
    store.set(next)
    const names = store.names()
    await nextTick()
    if (submitted && names.length && el.value) focusFirst(el.value, names)
    submitted = false
  },
)
const onSubmit = (e: Event) => {
  submitted = true
  emit('submit', e as SubmitEvent)
}
</script>

<template>
  <form ref="el" data-slot="form" :novalidate="validationBehavior === 'aria' || undefined" @submit="onSubmit" @reset="emit('reset', $event)">
    <slot />
  </form>
</template>
