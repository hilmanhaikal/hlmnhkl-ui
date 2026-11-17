// Gooee UI, MIT licence. https://gooee.dev
// FormField's control wiring and text, shared by React and Vue.

/** Props to spread on the control, so its label, help and error are wired up. */
export type FormFieldControlProps = {
  /** Id the label points to with htmlFor. */
  id: string
  /** Id of the help or error text, whichever is showing. */
  'aria-describedby'?: string
  /** Set when the field has an error. */
  'aria-invalid'?: true
  /** Set when the field is required. */
  'aria-required'?: true
  /** Set when the field is disabled. */
  disabled?: boolean
}

export type FormFieldLabels = {
  optional: string
}
