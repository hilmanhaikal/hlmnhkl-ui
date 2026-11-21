'use client'

import { createContext, useContext, useId, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import type { FormFieldControlProps, FormFieldLabels } from '../../internal/motion/formField'
import styles from './FormField.module.css'

export type { FormFieldControlProps, FormFieldLabels }

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
    <Ctx value={{ controlProps, labelId }}>
      <div data-slot="form-field" className={cx(styles.root, className)} data-invalid={error ? true : undefined} data-disabled={disabled || undefined}>
        <label id={labelId} htmlFor={controlId} data-slot="field-label" className={styles.label}>
          {label}
          {required && <span data-slot="form-field-required" className={styles.required} aria-hidden="true"> *</span>}
          {optional && !required && <span data-slot="form-field-optional" className={styles.optional}> {labels.optional}</span>}
        </label>
        <div data-slot="form-field-control" className={styles.control}>{typeof children === 'function' ? children(controlProps) : children}</div>
        <FieldMessage helpId={helpId} errorId={errorId} help={help} error={error} />
      </div>
    </Ctx>
  )
}
