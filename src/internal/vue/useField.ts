// How a Vue field joins a form: the twin of internal/useField.ts. The logic lives in formCore.ts.
//
//   const inner = ref<HTMLInputElement | null>(null)
//   const field = useField({ input: inner, name: () => attrs.name as string, error: () => error, onSync: () => (filled.value = inner.value!.value !== '') })
//   <input ref="inner" @input="...; field.changed()" @blur="field.blurred()" />
//   <FieldMessage ... :error="field.error.value" />   and :aria-invalid="field.error.value ? true : undefined"
//
// A field with no native input renders a hidden mirror input bound to its value, and on a person's change
// writes it with setNativeValue first, which fires a real change event. It emits blur when focus leaves the
// whole field, so vee-validate's handleBlur runs.

import { computed, inject, onBeforeUnmount, onMounted, ref, shallowRef, watch, type InjectionKey, type Ref } from 'vue'
import { createNativeValidity, onFormReset, setByCode, setListDefaults, setNativeList, setNativeValue, watchValue, type FormContextValue } from '../formCore'

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

/** The nearest Form's errors by name and its checks. The Form part provides it. */
export const formKey: InjectionKey<FormContextValue> = Symbol('gooee-form')

export type FieldOptions = {
  /** The element that holds the value and the name: the field's real input, or its hidden mirror. */
  input: Ref<Control | null>
  /** The field's name, to find its error in the nearest Form. */
  name: () => string | undefined
  /** The field's own error prop. It wins over the Form's error and the browser's message. */
  error: () => string | undefined
  /** Called once mounted, when code writes a value into the input, and after the form resets: read the input and redraw. */
  onSync?: () => void
}

/**
 * Wires a field into its form. error is the message to show: the field's own error, else the nearest Form's
 * error for its name, else the browser's message once shown. Call changed() after each change by the person
 * and blurred() when focus leaves the whole field.
 */
export function useField({ input, name, error, onSync }: FieldOptions) {
  const form = inject(formKey, null)
  const formError = shallowRef(form?.errors.get(name()))
  const read = () => (formError.value = form?.errors.get(name()))
  const unsubscribe = form?.errors.subscribe(read) ?? (() => {})
  watch(name, read)
  const native = ref('')
  let validity: ReturnType<typeof createNativeValidity> | null = null
  let stop = () => {}

  onMounted(() => {
    const el = input.value
    if (!el) return
    const v = createNativeValidity(el, { onMessage: (m) => (native.value = m), active: () => form?.validationBehavior !== 'aria' })
    validity = v
    const stopWatch = watchValue(el, () => onSync?.())
    const stopReset = onFormReset(el, () => {
      v.reset()
      onSync?.()
    })
    stop = () => {
      v.destroy()
      stopWatch()
      stopReset()
    }
    onSync?.()
  })
  onBeforeUnmount(() => {
    unsubscribe()
    stop()
  })

  return {
    error: computed(() => error() || formError.value || native.value || undefined),
    changed: () => {
      // A field with no name has no error by name; clear() with no name would clear them all.
      const n = name()
      if (n) form?.errors.clear(n)
      validity?.changed()
    },
    blurred: () => validity?.blurred(),
  }
}

/**
 * Keeps a hidden mirror input equal to the field's value, quietly, and sets what a form reset goes back to
 * (resetTo). A person's change goes through setNativeValue instead, which fires the events. Booleans for a
 * checkbox mirror, strings for any other. On the first sync, a value code already wrote stays, and useField's
 * onSync, which runs next, draws it.
 */
export function useMirror(input: Ref<HTMLInputElement | null>, value: () => string | boolean, resetTo: () => string | boolean) {
  let first = true
  const sync = () => {
    const el = input.value
    if (!el) return
    const keep = first && setByCode(el)
    first = false
    const to = resetTo()
    if (typeof to === 'boolean') el.defaultChecked = to
    else el.defaultValue = to
    if (!keep) setNativeValue(el, value(), true)
  }
  onMounted(sync)
  watch([value, resetTo], sync, { flush: 'post' })
}

/**
 * useMirror for a field with many values: keeps its hidden <select multiple> holding the values, one selected
 * option per value, and sets what a form reset goes back to. keep lists every value the field can hold, so a
 * form library can select one. A person's change goes through setNativeList, which fires the events.
 */
export function useMirrorList(input: Ref<HTMLSelectElement | null>, values: () => string[], resetTo: () => string[], keep: () => string[] = () => []) {
  const sync = () => {
    const el = input.value
    if (!el) return
    setNativeList(el, values(), true)
    setListDefaults(el, resetTo(), keep())
  }
  onMounted(sync)
  watch([values, resetTo, keep], sync, { flush: 'post', deep: true })
}

export { readList, setNativeList } from '../formCore'
export { setNativeValue }
