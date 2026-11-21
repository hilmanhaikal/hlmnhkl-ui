'use client'

import { useId, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { useEdgeFlow } from '../../internal/liquidMore'
import { mergeRefs } from '../../internal/mergeRefs'
import { useField } from '../../internal/useField'
import styles from './Input.module.css'

export type InputProps = Omit<ComponentPropsWithRef<'input'>, 'size'> & {
  /** Always required. A placeholder is only an example, never the label. */
  label: string
  /** "top" puts the label above the field, "floating" puts it inside and moves it up. */
  labelPlacement?: 'top' | 'floating'
  /** Hint under the field. Hidden while there is an error. */
  help?: ReactNode
  /** Error message under the field. Marks the field invalid. */
  error?: ReactNode
  /** Height of the field. sm (32px) suits toolbars and dense side panels; on touch screens it keeps 16px text so phones do not zoom. */
  size?: 'sm' | 'md' | 'lg'
  /** Icon or text inside the field, before the input. */
  leading?: ReactNode
  /** Icon, text or buttons inside the field, after the input. */
  trailing?: ReactNode
  /** Adds "(optional)" after the label. */
  optional?: boolean
  /** Text added to the label, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<InputLabels>
}

export type InputLabels = {
  optional: string
}

const defaultLabels: InputLabels = {
  optional: '(optional)',
}

export function Input({
  label,
  labelPlacement = 'top',
  help,
  error,
  size = 'md',
  leading,
  trailing,
  optional,
  id,
  className,
  value,
  defaultValue,
  onChange,
  onBlur,
  labels: labelsProp,
  ref,
  'aria-describedby': describedByProp,
  ...rest
}: InputProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const auto = useId()
  const inputId = id ?? auto
  const helpId = `${inputId}-help`
  const errorId = `${inputId}-error`
  const [innerFilled, setInnerFilled] = useState(() => String(defaultValue ?? '') !== '')
  const filled = value !== undefined ? String(value) !== '' : innerFilled
  const floating = labelPlacement === 'floating'
  const inner = useRef<HTMLInputElement>(null)
  // Focus draws the dark edge round the field from where it was pressed, or from its start edge for a key.
  const fieldRef = useRef<HTMLDivElement>(null)
  useEdgeFlow(fieldRef, fieldRef, ':focus-within', styles.edge)

  // Values written by code (a form library's setValue or reset) and a form reset fire no onChange, so read the input.
  const field = useField({ input: inner, name: rest.name, error, onSync: () => setInnerFilled(!!inner.current?.value) })
  const shownError = field.error
  // The caller's ids join ours, so help and error stay linked.
  const describedBy = [help && !shownError ? helpId : null, shownError ? errorId : null, describedByProp]
    .filter(Boolean)
    .join(' ')

  return (
    <div data-slot="input" className={cx(styles.root, className)}>
      {!floating && (
        <label htmlFor={inputId} data-slot="field-label" className={styles.topLabel}>
          {label}
          {optional && <span data-slot="input-optional" className={styles.optional}> {labels.optional}</span>}
        </label>
      )}
      <div
        ref={fieldRef}
        data-slot="input-field"
        className={cx(styles.field, styles[size], floating && styles.floating)}
        data-filled={filled || undefined}
        data-invalid={shownError ? true : undefined}
        data-disabled={rest.disabled || undefined}
      >
        {leading && <span data-slot="input-leading" className={styles.adorn}>{leading}</span>}
        <div className={styles.control}>
          {floating && (
            <label htmlFor={inputId} data-slot="field-label" className={styles.floatLabel}>
              {label}
              {optional && <span data-slot="input-optional" className={styles.optional}> {labels.optional}</span>}
            </label>
          )}
          <input
            id={inputId}
            ref={mergeRefs(inner, ref)}
            data-slot="input-control"
            className={styles.input}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={shownError ? true : undefined}
            aria-describedby={describedBy || undefined}
            onChange={(e) => {
              setInnerFilled(e.target.value !== '')
              field.changed()
              onChange?.(e)
            }}
            onBlur={(e) => {
              field.blurred()
              onBlur?.(e)
            }}
            {...rest}
          />
        </div>
        {trailing && <span data-slot="input-trailing" className={styles.adorn}>{trailing}</span>}
      </div>
      <FieldMessage helpId={helpId} errorId={errorId} help={help} error={shownError} />
    </div>
  )
}
