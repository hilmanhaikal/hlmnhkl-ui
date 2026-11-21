// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useId, useRef, useState, type ChangeEventHandler, type FocusEventHandler, type ReactNode, type Ref } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { leavesField, sameList } from '../../internal/formCore'
import { mergeRefs } from '../../internal/mergeRefs'
import { useControllable } from '../../internal/useControllable'
import { changeEvent, readList, retarget, setNativeList, useField, useMirrorList } from '../../internal/useField'
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
  /** Form field name. Each ticked box's value is sent under it. */
  name?: string
  /** The form cannot be sent while no box is ticked. */
  required?: boolean
  /** Keeps the boxes as they are and still sends them with the form. Shown with data-readonly. */
  readOnly?: boolean
  /** Turns off every box in the group. */
  disabled?: boolean
  /** Reaches the hidden list that holds the values and the name. Its focus() moves focus to the first box, so react-hook-form's setFocus works. */
  ref?: Ref<HTMLSelectElement>
  /** Called after a box is ticked or cleared, with a change event from the hidden list, as a form library expects. */
  onChange?: ChangeEventHandler<HTMLSelectElement>
  /** Called when focus leaves the group, not when it moves between boxes. The event's target is the hidden list. */
  onBlur?: FocusEventHandler<HTMLFieldSetElement>
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
  required,
  readOnly,
  disabled,
  orientation = 'vertical',
  ref,
  onChange,
  onBlur,
  className,
}: CheckboxGroupProps) {
  const auto = useId()
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange)
  const rootRef = useRef<HTMLFieldSetElement>(null)
  // The hidden list holds the values for the form and for form libraries; a form reset goes back to the first value.
  const input = useRef<HTMLSelectElement>(null)
  const [firstValue] = useState(value)
  const all = options.map((o) => o.value)
  useMirrorList(input, value, valueProp === undefined ? defaultValue : firstValue, all)
  const field = useField({ input, name, error, onSync: () => input.current && !sameList(readList(input.current), value) && setValue(readList(input.current)) })
  const shownError = field.error
  const descId = `${auto}-desc`
  const errorId = `${auto}-error`
  const describedBy = [description ? descId : null, shownError ? errorId : null].filter(Boolean).join(' ')
  const toggle = (v: string, on: boolean) => {
    if (readOnly) return
    const next = new Set(value)
    if (on) next.add(v)
    else next.delete(v)
    const list = all.filter((x) => next.has(x))
    const native = input.current && setNativeList(input.current, list)
    setValue(list)
    field.changed()
    if (native) onChange?.(changeEvent(native, input.current!))
  }
  return (
    <fieldset
      ref={rootRef}
      data-slot="checkbox-group"
      className={cx(styles.group, className)}
      disabled={disabled}
      aria-describedby={describedBy || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={shownError ? true : undefined}
      data-orientation={orientation}
      onBlur={(e) => {
        if (!leavesField(e.nativeEvent, rootRef.current)) return
        field.blurred()
        onBlur?.(retarget(e, input.current))
      }}
    >
      <legend data-slot="field-label" className={styles.legend}>{label}</legend>
      {description && <p id={descId} data-slot="checkbox-group-description" className={styles.description}>{description}</p>}
      <div data-slot="checkbox-group-items" className={cx(styles.items, styles[orientation])}>
        {options.map((o) => (
          <Checkbox
            key={o.value}
            label={o.label}
            description={o.description}
            value={o.value}
            disabled={o.disabled}
            readOnly={readOnly}
            checked={value.includes(o.value)}
            onCheckedChange={(on) => toggle(o.value, on)}
            aria-invalid={shownError ? true : undefined}
          />
        ))}
      </div>
      {/* Holds the values for the form, one selected option each. Focus moves on to the first box. */}
      <select
        ref={mergeRefs(input, ref)}
        multiple
        name={name}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className={styles.input}
        data-slot="checkbox-group-input"
        onFocus={() => rootRef.current?.querySelector<HTMLInputElement>('input[type="checkbox"]:not(:disabled)')?.focus()}
      />
      <FieldMessage helpId={`${auto}-help`} errorId={errorId} error={shownError} />
    </fieldset>
  )
}
