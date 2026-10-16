'use client'

import { useId, useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
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
  labels: labelsProp,
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
  // The caller's ids join ours, so help and error stay linked.
  const describedBy = [help && !error ? helpId : null, error ? errorId : null, describedByProp]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cx(styles.root, className)}>
      {!floating && (
        <label htmlFor={inputId} className={styles.topLabel}>
          {label}
          {optional && <span className={styles.optional}> {labels.optional}</span>}
        </label>
      )}
      <div
        className={cx(styles.field, styles[size], floating && styles.floating)}
        data-filled={filled || undefined}
        data-invalid={error ? true : undefined}
        data-disabled={rest.disabled || undefined}
      >
        {leading && <span className={styles.adorn}>{leading}</span>}
        <div className={styles.control}>
          {floating && (
            <label htmlFor={inputId} className={styles.floatLabel}>
              {label}
              {optional && <span className={styles.optional}> {labels.optional}</span>}
            </label>
          )}
          <input
            id={inputId}
            className={styles.input}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            onChange={(e) => {
              setInnerFilled(e.target.value !== '')
              onChange?.(e)
            }}
            {...rest}
          />
        </div>
        {trailing && <span className={styles.adorn}>{trailing}</span>}
      </div>
      <FieldMessage helpId={helpId} errorId={errorId} help={help} error={error} />
    </div>
  )
}
