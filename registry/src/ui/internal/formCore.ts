// Gooee UI, MIT licence. https://gooee.dev
// Form plumbing every field shares, with no framework. React wraps it in internal/useField.ts, Vue in
// internal/vue/useField.ts; a field uses those, not this file.
//
// - setNativeValue: write a value into the field's native input and fire real input and change events.
// - watchValue: hear values that code writes straight into the input (form library setValue, reset).
// - onFormReset: hear the form's reset, after the browser has put the default values back.
// - leavesField: whether a blur takes focus out of the whole field, not to another piece of it.
// - createNativeValidity: the browser's own message, shown after a submit attempt or a blur after an edit.
// - createFormErrors: the Form part's errors by field name; each clears when its field changes.
// - focusFirst: focus the first field in a form that is invalid, or that has an error by name.
// - setNativeList, setListDefaults, readList: a multi-value field's hidden <select multiple>, one option per value.

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

/** Errors by field name, as a server or a schema gives them (zod's flatten() gives arrays). */
export type FormErrors = Record<string, string | string[] | null | undefined>

/** How a Form checks: "native" uses the browser's checks and blocks submit; "aria" never blocks, it only marks fields. */
export type ValidationBehavior = 'native' | 'aria'

const setter = (el: Control, prop: 'value' | 'checked') => Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), prop)?.set

/**
 * Writes the value (a boolean for a checkbox) past any framework's own tracking, the way a person's edit does.
 * Unless silent, fires bubbling input and change events and returns the change event.
 */
export function setNativeValue(el: Control, next: string | boolean, silent = false): Event | null {
  const prop = typeof next === 'boolean' ? 'checked' : 'value'
  if ((el as HTMLInputElement)[prop] === next) return null
  setter(el, prop)?.call(el, next)
  if (silent) return null
  el.dispatchEvent(new Event('input', { bubbles: true }))
  const change = new Event('change', { bubbles: true })
  el.dispatchEvent(change)
  return change
}

/**
 * Whether code wrote the input before the field's first sync: a form library such as react-hook-form writes its
 * defaultValues in its ref callback. The field then takes that value instead of writing its own over it.
 */
export const setByCode = (el: HTMLInputElement) => (el.type === 'checkbox' ? el.checked !== el.defaultChecked : el.value !== el.defaultValue)

/**
 * A multi-value field mirrors its values in a hidden <select multiple>: each value is a selected option, so
 * FormData has one entry per value, required blocks an empty field, and a form reset selects the defaults again.
 * Selects the given values in order (adding an option for a new one) and clears the rest. Unless silent,
 * fires bubbling input and change events and returns the change event.
 */
export function setNativeList(el: HTMLSelectElement, values: string[], silent = false): Event | null {
  if (sameList(readList(el), values)) return null
  const byValue = new Map([...el.options].map((o) => [o.value, o]))
  values.forEach((v, i) => {
    const o = byValue.get(v) ?? new Option(v, v)
    if (el.options[i] !== o) el.insertBefore(o, el.options[i] ?? null)
    o.selected = true
  })
  ;[...el.options].slice(values.length).forEach((o) => (o.selected = false))
  if (silent) return null
  el.dispatchEvent(new Event('input', { bubbles: true }))
  const change = new Event('change', { bubbles: true })
  el.dispatchEvent(change)
  return change
}

/** Sets which values a form reset brings back. Keeps an option for every value in keep (all a field can hold, for a form library's setValue) and drops the others. */
export function setListDefaults(el: HTMLSelectElement, defaults: string[], keep: string[] = []) {
  const wanted = new Set([...readList(el), ...defaults, ...keep])
  ;[...el.options].forEach((o) => !wanted.has(o.value) && o.remove())
  const have = new Set([...el.options].map((o) => o.value))
  wanted.forEach((v) => !have.has(v) && el.add(new Option(v, v)))
  // defaultSelected writes the attribute, which moves the selection too, so the selection is read first and put back.
  const now = readList(el)
  ;[...el.options].forEach((o) => (o.defaultSelected = defaults.includes(o.value)))
  ;[...el.options].forEach((o) => (o.selected = now.includes(o.value)))
}

/** The values a multi-value mirror holds, in order. */
export const readList = (el: HTMLSelectElement) => [...el.selectedOptions].map((o) => o.value)

/** Whether two lists hold the same values in the same order. */
export const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((v, i) => v === b[i])

/**
 * Calls back when code sets the element's value or checked property, which fires no event. The call comes a
 * microtask later, so several writes make one call. Wraps whatever property is there (React keeps its own
 * tracker on the element) and puts it back on stop.
 */
export function watchValue(el: Control, onSet: () => void): () => void {
  const undo: Array<() => void> = []
  let queued = false
  const notify = () => {
    if (queued) return
    queued = true
    queueMicrotask(() => {
      queued = false
      onSet()
    })
  }
  for (const prop of ['value', 'checked'] as const) {
    if (!(prop in el)) continue
    const own = Object.getOwnPropertyDescriptor(el, prop)
    const base = own ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), prop)
    if (!base?.get || !base.set) continue
    Object.defineProperty(el, prop, {
      configurable: true,
      enumerable: base.enumerable,
      get() {
        return base.get!.call(this)
      },
      set(v) {
        base.set!.call(this, v)
        notify()
      },
    })
    undo.push(() => {
      if (own) Object.defineProperty(el, prop, own)
      else delete (el as unknown as Record<string, unknown>)[prop]
    })
  }
  return () => undo.forEach((u) => u())
}

/** Calls back after the element's form resets. The reset event fires before the browser restores the values, so this waits a frame. */
export function onFormReset(el: Control, onReset: () => void): () => void {
  const form = el.form
  if (!form) return () => {}
  let frame = 0
  const handle = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(onReset)
  }
  form.addEventListener('reset', handle)
  return () => {
    form.removeEventListener('reset', handle)
    cancelAnimationFrame(frame)
  }
}

/** True when a blur takes focus out of the field: not into the root, nor into a piece kept elsewhere, such as a portalled list. */
export function leavesField(e: FocusEvent, root: Element | null, ...also: Array<Element | null | undefined>): boolean {
  const to = e.relatedTarget as Node | null
  if (!to) return true
  return ![root, ...also].some((el) => el?.contains(to))
}

/** The elements of a form that take part in its checks, in order. */
const controls = (form: HTMLFormElement) => [...form.elements].filter((el): el is Control => 'validity' in el && (el as Control).willValidate)

/**
 * Focuses the first field in the form that the browser finds invalid, or, given names, the first one with an
 * error by name. A hidden mirror input passes the focus on to its visible control. Returns whether it found one.
 */
export function focusFirst(form: HTMLFormElement, names?: string[]): boolean {
  const hit = names ? [...form.elements].find((el) => names.includes((el as Control).name)) : controls(form).find((el) => !el.validity.valid)
  if (!hit) return false
  ;(hit as HTMLElement).focus()
  return true
}

type ValidityOptions = {
  /** Called with the message to show, or '' to show none. */
  onMessage: (message: string) => void
  /** False while the field should not show the browser's message (the Form uses "aria" checks). */
  active?: () => boolean
}

/**
 * The browser's own message for a field, shown in Gooee's style. It shows after a submit attempt (the invalid
 * event) or a blur after an edit, like :user-invalid, then follows the value live, so it goes the moment the value
 * is fixed. The browser's bubble is held back and the first invalid field in the form takes focus instead.
 * In a novalidate form it shows only when code asks for the check (form.reportValidity()).
 */
export function createNativeValidity(el: Control, { onMessage, active = () => true }: ValidityOptions) {
  let shown = false
  let edited = false
  const show = () => onMessage(shown && active() ? el.validationMessage : '')
  const onInvalid = (e: Event) => {
    if (!active()) return
    e.preventDefault()
    shown = true
    show()
    const form = el.form
    if (form && controls(form).find((c) => !c.validity.valid) === el) (el as HTMLElement).focus()
  }
  el.addEventListener('invalid', onInvalid)
  return {
    /** The value changed: update a shown message, or keep it hidden. */
    changed() {
      edited = true
      if (shown) show()
    },
    /** Focus left the field: after an edit, show the message from now on. Not in a novalidate form, which checks in its own way. */
    blurred() {
      if (!edited || el.form?.noValidate) return
      shown = true
      show()
    },
    /** The form reset: hide the message until the next edit or submit. */
    reset() {
      shown = false
      edited = false
      show()
    },
    destroy() {
      el.removeEventListener('invalid', onInvalid)
    },
  }
}

/**
 * The Form part's errors by field name. set() takes a new map (a new server answer) and brings back every
 * name; clear() hides one name's error until the next set(), so a field's server error goes when its value changes.
 */
export function createFormErrors(initial?: FormErrors) {
  let errors: FormErrors = initial ?? {}
  const cleared = new Set<string>()
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())
  return {
    get(name: string | undefined): string | undefined {
      if (!name || cleared.has(name)) return undefined
      const e = errors[name]
      const text = Array.isArray(e) ? e.join(' ') : e
      return text || undefined
    },
    /** The names that have an error showing, in the map's order. */
    names: () => Object.keys(errors).filter((n) => !cleared.has(n) && errors[n] && (!Array.isArray(errors[n]) || errors[n]!.length)),
    set(next: FormErrors | undefined) {
      if (next === errors) return
      errors = next ?? {}
      cleared.clear()
      emit()
    },
    /** Hides one name's error, or every error when no name is given (the form reset). */
    clear(name?: string) {
      const names = name === undefined ? Object.keys(errors) : [name]
      const fresh = names.filter((n) => n && !cleared.has(n) && errors[n])
      if (!fresh.length) return
      fresh.forEach((n) => cleared.add(n))
      emit()
    },
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
  }
}

export type FormErrorStore = ReturnType<typeof createFormErrors>

/** What a Form gives the fields inside it. */
export type FormContextValue = { errors: FormErrorStore; validationBehavior: ValidationBehavior }
