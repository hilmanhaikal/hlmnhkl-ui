'use client'

import { useId, useLayoutEffect, useRef, useState, type ChangeEventHandler, type ComponentPropsWithRef, type ReactNode, type Ref } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { mergeRefs } from '../../internal/mergeRefs'
import { createSwitchThumb } from '../../internal/motion/switchThumb'
import { useControllable } from '../../internal/useControllable'
import { changeEvent, retarget, setNativeValue, useField, useMirror } from '../../internal/useField'
import styles from './Switch.module.css'

export type SwitchProps = Omit<ComponentPropsWithRef<'button'>, 'onChange' | 'value'> & {
  /** Visible text next to the switch, also its accessible name. */
  label: ReactNode
  /** Extra text under the label, also read by screen readers. */
  description?: ReactNode
  /** Whether the switch is on, when you control it. */
  checked?: boolean
  /** Starting state when you do not control it. */
  defaultChecked?: boolean
  /** Called when the switch is toggled, with the new on or off state. */
  onCheckedChange?: (checked: boolean) => void
  /** Puts the label before the switch, like a settings row. */
  labelPosition?: 'start' | 'end'
  /** Form field name. A hidden checkbox sends the value while the switch is on, and nothing while it is off. */
  name?: string
  /** Value sent with the form while the switch is on. Default "on", like a checkbox. */
  value?: string
  /** The form cannot be sent while the switch is off. */
  required?: boolean
  /** Keeps the switch as it is and still sends it with the form. Shown with data-readonly. */
  readOnly?: boolean
  /** Error message under the label. Marks the switch invalid. */
  error?: ReactNode
  /** Called after a toggle with a change event from the hidden checkbox, as a form library's register expects. */
  onChange?: ChangeEventHandler<HTMLInputElement>
  /** Reaches the hidden checkbox that holds the value. With react-hook-form, pass register's ref here (ref stays on the button). */
  inputRef?: Ref<HTMLInputElement>
}

export function Switch({
  label,
  description,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  labelPosition = 'end',
  id,
  className,
  disabled,
  onClick,
  onBlur,
  onChange,
  name,
  value,
  required,
  readOnly,
  error,
  inputRef,
  ref,
  'aria-describedby': describedByProp,
  ...rest
}: SwitchProps) {
  const auto = useId()
  const switchId = id ?? auto
  const errorId = `${switchId}-error`
  const [checked, setChecked] = useControllable(checkedProp, defaultChecked, onCheckedChange)
  const button = useRef<HTMLButtonElement>(null)
  // The hidden checkbox holds the value for the form and for form libraries.
  const input = useRef<HTMLInputElement>(null)
  const [firstChecked] = useState(checked)
  useMirror(input, checked, checkedProp === undefined ? defaultChecked : firstChecked)
  const field = useField({ input, name, error, onSync: () => input.current && input.current.checked !== checked && setChecked(input.current.checked) })
  const shownError = field.error
  const describedBy = [description && `${switchId}-desc`, shownError && errorId, describedByProp].filter(Boolean).join(' ')
  // The thumb's stretch (motion/switchThumb.ts).
  const thumbRef = useRef<HTMLSpanElement>(null)
  const thumb = useRef<ReturnType<typeof createSwitchThumb>>(null)
  thumb.current ??= createSwitchThumb(() => thumbRef.current, checked)
  useLayoutEffect(() => thumb.current!.set(checked), [checked])
  useLayoutEffect(() => () => thumb.current!.destroy(), [])
  return (
    <div
      className={cx(styles.root, labelPosition === 'start' && styles.start, className)}
      data-slot="switch"
      data-state={checked ? 'checked' : 'unchecked'}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={shownError ? true : undefined}
    >
      <button
        ref={mergeRefs(button, ref)}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={describedBy || undefined}
        aria-invalid={shownError ? true : undefined}
        aria-required={required || undefined}
        aria-readonly={readOnly || undefined}
        className={styles.track}
        data-slot="switch-track"
        data-state={checked ? 'checked' : 'unchecked'}
        disabled={disabled}
        onClick={(e) => {
          if (!readOnly) {
            const native = input.current && setNativeValue(input.current, !checked)
            setChecked(!checked)
            field.changed()
            if (native) onChange?.(changeEvent(native, input.current!))
          }
          onClick?.(e)
        }}
        onBlur={(e) => {
          field.blurred()
          onBlur?.(retarget(e, input.current))
        }}
        {...rest}
      >
        <span ref={thumbRef} className={styles.thumb} data-slot="switch-thumb" aria-hidden="true" />
      </button>
      <span className={styles.text}>
        <label htmlFor={switchId} className={styles.label} data-slot="field-label">{label}</label>
        {description && <span id={`${switchId}-desc`} className={styles.description} data-slot="switch-description">{description}</span>}
        <FieldMessage helpId={`${switchId}-help`} errorId={errorId} error={shownError} />
      </span>
      {/* Submits like a checkbox: the value while on, nothing while off. Focus moves on to the switch. */}
      <input
        ref={mergeRefs(input, inputRef)}
        type="checkbox"
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className={styles.input}
        data-slot="switch-input"
        onFocus={() => button.current?.focus()}
      />
    </div>
  )
}
