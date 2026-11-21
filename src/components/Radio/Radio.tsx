'use client'

import { createContext, useContext, useId, useRef, useState, type ChangeEvent, type ChangeEventHandler, type FocusEventHandler, type ReactNode, type Ref } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { leavesField } from '../../internal/formCore'
import { mergeRefs } from '../../internal/mergeRefs'
import { useControllable } from '../../internal/useControllable'
import { setNativeValue, useField, useMirror } from '../../internal/useField'
import styles from './Radio.module.css'

type Ctx = { name: string; value: string | null; set: (v: string, e: ChangeEvent<HTMLInputElement>) => void; disabled?: boolean; invalid?: boolean; readOnly?: boolean }
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
  /** The form cannot be sent while no radio is picked. */
  required?: boolean
  /** Keeps the pick as it is and still sends it with the form. Shown with data-readonly. */
  readOnly?: boolean
  /** Turns off every radio in the group. */
  disabled?: boolean
  /** Reaches a hidden input that holds the value. Its focus() moves focus to the picked radio, so react-hook-form's register and setFocus work. */
  ref?: Ref<HTMLInputElement>
  /** Called after a pick with the radio's own change event, as a form library's register expects. */
  onChange?: ChangeEventHandler<HTMLInputElement>
  /** Called when focus leaves the group, not when it moves between radios. */
  onBlur?: FocusEventHandler<HTMLFieldSetElement>
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
  required,
  readOnly,
  disabled,
  orientation = 'vertical',
  ref,
  onChange,
  onBlur,
  className,
  children,
}: RadioGroupProps) {
  const auto = useId()
  const [value, setValue] = useControllable<string | null>(valueProp, defaultValue, (v) => v !== null && onValueChange?.(v))
  const rootRef = useRef<HTMLFieldSetElement>(null)
  // A hidden input holds the value for required, a form reset and form libraries; the radios send it.
  const input = useRef<HTMLInputElement>(null)
  const [firstValue] = useState(value)
  useMirror(input, value ?? '', (valueProp === undefined ? defaultValue : firstValue) ?? '')
  const field = useField({ input, name, error, onSync: () => input.current && input.current.value !== (value ?? '') && setValue(input.current.value || null) })
  const shownError = field.error
  const descId = `${auto}-desc`
  const errorId = `${auto}-error`
  const describedBy = [description ? descId : null, shownError ? errorId : null].filter(Boolean).join(' ')
  const set = (v: string, e: ChangeEvent<HTMLInputElement>) => {
    if (input.current) setNativeValue(input.current, v, true)
    setValue(v)
    field.changed()
    onChange?.(e)
  }
  return (
    <fieldset
      ref={rootRef}
      role="radiogroup"
      className={cx(styles.group, className)}
      data-slot="radio-group"
      disabled={disabled}
      aria-invalid={shownError ? true : undefined}
      aria-required={required || undefined}
      aria-readonly={readOnly || undefined}
      aria-describedby={describedBy || undefined}
      data-invalid={shownError ? true : undefined}
      data-readonly={readOnly || undefined}
      onBlur={(e) => {
        if (!leavesField(e.nativeEvent, rootRef.current)) return
        field.blurred()
        onBlur?.(e)
      }}
    >
      <legend className={styles.legend} data-slot="field-label">{label}</legend>
      {description && <p id={descId} className={styles.groupDescription} data-slot="radio-group-description">{description}</p>}
      <div className={cx(styles.items, styles[orientation])} data-slot="radio-group-items" data-orientation={orientation}>
        <RadioCtx value={{ name: name ?? auto, value, set, disabled, invalid: !!shownError, readOnly }}>{children}</RadioCtx>
      </div>
      {/* Holds the value for required and a form reset; the radios send it. Focus moves on to the picked radio. */}
      <input
        ref={mergeRefs(input, ref)}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        className={styles.hiddenInput}
        data-slot="radio-group-input"
        onFocus={() => rootRef.current?.querySelector<HTMLInputElement>('input[type="radio"]:checked:not(:disabled), input[type="radio"]:not(:disabled)')?.focus()}
      />
      <FieldMessage helpId={`${auto}-help`} errorId={errorId} error={shownError} />
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
    <div className={styles.root} data-slot="radio" data-state={isOn ? 'checked' : 'unchecked'} data-disabled={disabled || ctx.disabled || undefined}>
      <span className={styles.circleWrap}>
        <input
          id={id}
          type="radio"
          className={styles.input}
          data-slot="radio-input"
          name={ctx.name}
          value={value}
          checked={isOn}
          disabled={disabled}
          aria-invalid={ctx.invalid || undefined}
          aria-describedby={description ? `${id}-desc` : undefined}
          onClick={(e) => ctx.readOnly && e.preventDefault()}
          onChange={(e) => !ctx.readOnly && ctx.set(value, e)}
        />
        <span className={styles.circle} data-slot="radio-indicator" data-state={isOn ? 'checked' : 'unchecked'} aria-hidden="true">
          <span className={styles.dot} />
        </span>
      </span>
      <span className={styles.text}>
        <label htmlFor={id} className={styles.label} data-slot="field-label">{label}</label>
        {description && <span id={`${id}-desc`} className={styles.description} data-slot="radio-description">{description}</span>}
      </span>
    </div>
  )
}
