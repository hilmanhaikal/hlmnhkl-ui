'use client'

// How a React field joins a form. The logic lives in formCore.ts and is shared with Vue.
//
//   const inner = useRef<HTMLInputElement>(null)
//   const field = useField({ input: inner, name, error, onSync: () => setFilled(inner.current!.value !== '') })
//   <input ref={mergeRefs(inner, ref)} onChange={(e) => { ...; field.changed(); onChange?.(e) }} onBlur={(e) => { field.blurred(); onBlur?.(e) }} />
//   <FieldMessage ... error={field.error} />   and aria-invalid={field.error ? true : undefined}
//
// A field with no native input renders a hidden mirror (an input that holds the value and the name), keeps it
// in step with useMirror, and on a person's change writes it with setNativeValue, which fires a real change
// event; then it calls the caller's onChange with changeEvent(native, mirror) and its onBlur with retarget().

import { createContext, useContext, useLayoutEffect, useRef, useState, useSyncExternalStore, type ChangeEvent, type ReactNode, type RefObject, type SyntheticEvent } from 'react'
import { createNativeValidity, onFormReset, setByCode, setListDefaults, setNativeList, setNativeValue, watchValue, type FormContextValue } from './formCore'

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

/** The nearest Form's errors by name and its checks. Null outside a Form. */
export const FormContext = createContext<FormContextValue | null>(null)

const none = () => () => {}

export type FieldOptions = {
  /** The element that holds the value and the name: the field's real input, or its hidden mirror. */
  input: RefObject<Control | null>
  /** The field's name, to find its error in the nearest Form. */
  name?: string
  /** The field's own error prop. It wins over the Form's error and the browser's message. */
  error?: ReactNode
  /** Called once mounted, when code writes a value into the input, and after the form resets: read the input and redraw. */
  onSync?: () => void
}

/**
 * Wires a field into its form. error is the message to show: the field's own error, else the nearest Form's
 * error for its name, else the browser's message once shown. Call changed() after each change by the person
 * and blurred() when focus leaves the whole field.
 */
export function useField({ input, name, error, onSync }: FieldOptions) {
  const form = useContext(FormContext)
  const formError = useSyncExternalStore(form?.errors.subscribe ?? none, () => form?.errors.get(name), () => form?.errors.get(name))
  const [native, setNative] = useState('')
  const validity = useRef<ReturnType<typeof createNativeValidity>>(null)
  const sync = useRef(onSync)
  sync.current = onSync
  const behavior = useRef(form?.validationBehavior)
  behavior.current = form?.validationBehavior

  useLayoutEffect(() => {
    const el = input.current
    if (!el) return
    const v = createNativeValidity(el, { onMessage: setNative, active: () => behavior.current !== 'aria' })
    validity.current = v
    const stopWatch = watchValue(el, () => sync.current?.())
    const stopReset = onFormReset(el, () => {
      v.reset()
      sync.current?.()
    })
    // A form library may have written a value before this ran (react-hook-form does it in its ref callback).
    sync.current?.()
    return () => {
      v.destroy()
      stopWatch()
      stopReset()
    }
  }, [input])

  return {
    error: error || formError || native || undefined,
    changed: () => {
      // A field with no name has no error by name; clear() with no name would clear them all.
      if (name) form?.errors.clear(name)
      validity.current?.changed()
    },
    blurred: () => validity.current?.blurred(),
  }
}

/**
 * Keeps a hidden mirror input equal to the field's value, quietly, and sets what a form reset goes back to
 * (resetTo). A person's change goes through setNativeValue instead, which fires the events. Booleans for a
 * checkbox mirror, strings for any other. On the first sync, a value code already wrote (react-hook-form's
 * defaultValues) stays, and useField's onSync, which runs next, draws it.
 */
export function useMirror(input: RefObject<HTMLInputElement | null>, value: string | boolean, resetTo: string | boolean) {
  const first = useRef(true)
  useLayoutEffect(() => {
    const el = input.current
    if (!el) return
    const keep = first.current && setByCode(el)
    first.current = false
    if (typeof resetTo === 'boolean') el.defaultChecked = resetTo
    else el.defaultValue = resetTo
    if (!keep) setNativeValue(el, value, true)
  }, [input, value, resetTo])
}

/**
 * useMirror for a field with many values: keeps its hidden <select multiple> holding the values, one selected
 * option per value, and sets what a form reset goes back to. keep lists every value the field can hold, so a
 * form library can select one. A person's change goes through setNativeList, which fires the events.
 */
export function useMirrorList(input: RefObject<HTMLSelectElement | null>, values: string[], resetTo: string[], keep?: string[]) {
  const key = JSON.stringify([values, resetTo, keep])
  useLayoutEffect(() => {
    const el = input.current
    if (!el) return
    setNativeList(el, values, true)
    setListDefaults(el, resetTo, keep)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, key])
}

/** The same React event, aimed at the field's named input, so a form library's onBlur finds the field by its name. */
export function retarget<E extends SyntheticEvent>(e: E, target: Element | null): E {
  return target ? Object.create(e, { target: { value: target } }) : e
}

/** A React-shaped change event for a change the field made itself (setNativeValue's event), aimed at its named input. */
export function changeEvent<T extends Element>(native: Event, target: T): ChangeEvent<T> {
  let prevented = false
  let stopped = false
  return {
    nativeEvent: native,
    target,
    currentTarget: target,
    type: 'change',
    bubbles: true,
    cancelable: false,
    defaultPrevented: false,
    eventPhase: native.eventPhase,
    isTrusted: false,
    timeStamp: native.timeStamp,
    preventDefault: () => (prevented = true),
    isDefaultPrevented: () => prevented,
    stopPropagation: () => (stopped = true),
    isPropagationStopped: () => stopped,
    persist: () => {},
  } as ChangeEvent<T>
}

export { readList, setNativeList } from './formCore'
export { setNativeValue }
