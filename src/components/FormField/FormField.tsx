'use client'

import { createContext, useContext, useId, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import styles from './FormField.module.css'

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

type FieldContext = { controlProps: FormFieldControlProps; labelId: string }

const Ctx = createContext<FieldContext | null>(null)

/** Inside a FormField, returns the props for its control. Outside one, returns null. */
export function useFormField(): FormFieldControlProps | null {
  return useContext(Ctx)?.controlProps ?? null
}

export type FormFieldProps = {
  /** Visible label above the control. */
  label: ReactNode
  /** The control. Pass a function to get the wiring props, or call useFormField() inside your own control. */
  children: ReactNode | ((props: FormFieldControlProps) => ReactNode)
  /** Hint under the control. Hidden while there is an error. */
  help?: ReactNode
  /** Error message under the control. Marks the control invalid. */
  error?: ReactNode
  /** Adds a "*" after the label and sets aria-required on the control. */
  required?: boolean
  /** Adds "(optional)" after the label. */
  optional?: boolean
  /** Dims the field and passes disabled to the control. */
  disabled?: boolean
  /** Use a fixed id instead of a generated one. */
  id?: string
  /** Text added to the label, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<FormFieldLabels>
  /** Extra class for the root element. */
  className?: string
}

export type FormFieldLabels = {
  optional: string
}

const defaultLabels: FormFieldLabels = {
  optional: '(optional)',
}

export function FormField({ label, children, help, error, required, optional, disabled, id, labels: labelsProp, className }: FormFieldProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const auto = useId()
  const controlId = id ?? auto
  const labelId = `${controlId}-label`
  const helpId = `${controlId}-help`
  const errorId = `${controlId}-error`
  const describedBy = [help && !error ? helpId : null, error ? errorId : null].filter(Boolean).join(' ')
  const controlProps: FormFieldControlProps = {
    id: controlId,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-required': required ? true : undefined,
    disabled: disabled || undefined,
  }

  return (
    <Ctx.Provider value={{ controlProps, labelId }}>
      <div className={cx(styles.root, className)} data-invalid={error ? true : undefined} data-disabled={disabled || undefined}>
        <label id={labelId} htmlFor={controlId} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true"> *</span>}
          {optional && !required && <span className={styles.optional}> {labels.optional}</span>}
        </label>
        <div className={styles.control}>{typeof children === 'function' ? children(controlProps) : children}</div>
        <FieldMessage helpId={helpId} errorId={errorId} help={help} error={error} />
      </div>
    </Ctx.Provider>
  )
}
