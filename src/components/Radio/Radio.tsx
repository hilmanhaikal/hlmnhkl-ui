'use client'

import { createContext, useContext, useId, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { useControllable } from '../../internal/useControllable'
import styles from './Radio.module.css'

type Ctx = { name: string; value: string | null; set: (v: string) => void; disabled?: boolean; invalid?: boolean }
const RadioCtx = createContext<Ctx | null>(null)

export type RadioGroupProps = {
  /** Visible group label (rendered as the fieldset legend). */
  label: ReactNode
  /** Extra text under the group label. */
  description?: ReactNode
  /** Error under the radios. Marks the group invalid and is read with it. */
  error?: ReactNode
  /** Selected value, when you control it. Null means nothing is picked. */
  value?: string | null
  /** Starting value when you do not control it. */
  defaultValue?: string | null
  /** Called when the selected value changes, with the new value. */
  onValueChange?: (value: string) => void
  /** Form field name shared by every radio. Undefined makes a unique one. */
  name?: string
  /** Turns off every radio in the group. */
  disabled?: boolean
  /** Stacks the radios or puts them in a row. */
  orientation?: 'vertical' | 'horizontal'
  /** Extra class for the root element. */
  className?: string
  /** The Radio elements. */
  children: ReactNode
}

export function RadioGroup({
  label,
  description,
  error,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  name,
  disabled,
  orientation = 'vertical',
  className,
  children,
}: RadioGroupProps) {
  const auto = useId()
  const [value, setValue] = useControllable<string | null>(valueProp, defaultValue, (v) => v !== null && onValueChange?.(v))
  const descId = `${auto}-desc`
  const errorId = `${auto}-error`
  const describedBy = [description ? descId : null, error ? errorId : null].filter(Boolean).join(' ')
  return (
    <fieldset
      role="radiogroup"
      className={cx(styles.group, className)}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy || undefined}
      data-invalid={error ? true : undefined}
    >
      <legend className={styles.legend}>{label}</legend>
      {description && <p id={descId} className={styles.groupDescription}>{description}</p>}
      <div className={cx(styles.items, styles[orientation])}>
        <RadioCtx.Provider value={{ name: name ?? auto, value, set: setValue, disabled, invalid: !!error }}>{children}</RadioCtx.Provider>
      </div>
      <FieldMessage helpId={`${auto}-help`} errorId={errorId} error={error} />
    </fieldset>
  )
}

export type RadioProps = {
  /** The group value this radio stands for. */
  value: string
  /** Visible text next to the circle. Clicking it picks the radio. */
  label: ReactNode
  /** Extra text under the label, also read by screen readers. */
  description?: ReactNode
  /** Turns off only this radio. */
  disabled?: boolean
}

export function Radio({ value, label, description, disabled }: RadioProps) {
  const ctx = useContext(RadioCtx)
  if (!ctx) throw new Error('Radio must be inside RadioGroup')
  const id = useId()
  const isOn = ctx.value === value
  return (
    <div className={styles.root} data-disabled={disabled || ctx.disabled || undefined}>
      <span className={styles.circleWrap}>
        <input
          id={id}
          type="radio"
          className={styles.input}
          name={ctx.name}
          value={value}
          checked={isOn}
          disabled={disabled}
          aria-invalid={ctx.invalid || undefined}
          aria-describedby={description ? `${id}-desc` : undefined}
          onChange={() => ctx.set(value)}
        />
        <span className={styles.circle} data-on={isOn || undefined} aria-hidden="true">
          <span className={styles.dot} />
        </span>
      </span>
      <span className={styles.text}>
        <label htmlFor={id} className={styles.label}>{label}</label>
        {description && <span id={`${id}-desc`} className={styles.description}>{description}</span>}
      </span>
    </div>
  )
}
