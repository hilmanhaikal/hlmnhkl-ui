'use client'

import { useId, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { useControllable } from '../../internal/useControllable'
import { Checkbox } from '../Checkbox'
import styles from './CheckboxGroup.module.css'

export type CheckboxOption = {
  value: string
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

export type CheckboxGroupProps = {
  /** Visible name of the group, rendered as the legend. */
  label: ReactNode
  /** The boxes, in order. */
  options: CheckboxOption[]
  /** Values of the ticked boxes, when you control it. */
  value?: string[]
  /** Starting value when you do not control it. */
  defaultValue?: string[]
  /** Called when a box is ticked or cleared, with the new list of values in option order. */
  onValueChange?: (value: string[]) => void
  /** Muted text under the label, read with the group. */
  description?: ReactNode
  /** Error under the boxes. Marks every box invalid and is read with the group. */
  error?: ReactNode
  /** Form field name shared by every box. Each ticked box sends its value. */
  name?: string
  /** Turns off every box in the group. */
  disabled?: boolean
  /** Stacks the boxes or puts them in a row that wraps. */
  orientation?: 'vertical' | 'horizontal'
  /** Extra class for the root element. */
  className?: string
}

export function CheckboxGroup({
  label,
  options,
  value: valueProp,
  defaultValue = [],
  onValueChange,
  description,
  error,
  name,
  disabled,
  orientation = 'vertical',
  className,
}: CheckboxGroupProps) {
  const auto = useId()
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange)
  const descId = `${auto}-desc`
  const errorId = `${auto}-error`
  const describedBy = [description ? descId : null, error ? errorId : null].filter(Boolean).join(' ')
  const toggle = (v: string, on: boolean) => {
    const next = new Set(value)
    if (on) next.add(v)
    else next.delete(v)
    setValue(options.map((o) => o.value).filter((x) => next.has(x)))
  }
  return (
    <fieldset className={cx(styles.group, className)} disabled={disabled} aria-describedby={describedBy || undefined} data-disabled={disabled || undefined} data-invalid={error ? true : undefined}>
      <legend className={styles.legend}>{label}</legend>
      {description && <p id={descId} className={styles.description}>{description}</p>}
      <div className={cx(styles.items, styles[orientation])}>
        {options.map((o) => (
          <Checkbox
            key={o.value}
            label={o.label}
            description={o.description}
            name={name}
            value={o.value}
            disabled={o.disabled}
            checked={value.includes(o.value)}
            onCheckedChange={(on) => toggle(o.value, on)}
            aria-invalid={error ? true : undefined}
          />
        ))}
      </div>
      <FieldMessage helpId={`${auto}-help`} errorId={errorId} error={error} />
    </fieldset>
  )
}
