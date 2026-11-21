'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { mergeRefs } from '../../internal/mergeRefs'
import { createCheckboxPour } from '../../internal/motion/checkbox'
import { useControllable } from '../../internal/useControllable'
import { useField } from '../../internal/useField'
import styles from './Checkbox.module.css'

export type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'checked' | 'defaultChecked' | 'onChange'> & {
  /** Visible text next to the box. Clicking it toggles the box. */
  label: ReactNode
  /** Muted text under the label, linked with aria-describedby. */
  description?: ReactNode
  /** Checked state, when you control it. */
  checked?: boolean
  /** Starting checked state when you do not control it. */
  defaultChecked?: boolean
  /** Called when the checked state changes, with the new state. */
  onCheckedChange?: (checked: boolean) => void
  /** Shows a dash. A click clears the dash and checks the box. */
  indeterminate?: boolean
  /** Error message under the label. Marks the box invalid. */
  error?: ReactNode
  /** Keeps the box as it is and still sends it with the form. Shown with data-readonly. */
  readOnly?: boolean
}

export function Checkbox({
  label,
  description,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  indeterminate = false,
  error,
  id,
  className,
  ref,
  disabled,
  readOnly,
  onPointerDown,
  onKeyDown,
  'aria-describedby': describedByProp,
  ...rest
}: CheckboxProps) {
  const auto = useId()
  const inputId = id ?? auto
  const errorId = `${inputId}-error`
  const [checked, setChecked] = useControllable(checkedProp, defaultChecked, onCheckedChange)
  // A form library's onChange, such as react-hook-form's register, runs after the box updates instead of replacing it.
  const { onChange, onBlur, onClick, ...inputRest } = rest as typeof rest & Pick<ComponentPropsWithRef<'input'>, 'onChange'>
  const inner = useRef<HTMLInputElement>(null)
  // A form library's setValue or reset writes the box directly, and a form reset fires no change: follow the input.
  const field = useField({ input: inner, name: inputRest.name, error, onSync: () => inner.current && inner.current.checked !== checked && setChecked(inner.current.checked) })
  const shownError = field.error
  const describedBy = [description ? `${inputId}-desc` : null, shownError ? errorId : null, describedByProp].filter(Boolean).join(' ')
  // A form reset goes back to defaultChecked, or to the first checked value when it is controlled.
  const [firstChecked] = useState(checked)
  const resetTo = checkedProp === undefined ? defaultChecked : firstChecked
  useLayoutEffect(() => {
    if (inner.current) inner.current.defaultChecked = resetTo
  }, [resetTo])
  // Like a native checkbox, a click clears the mixed look until the prop sets it again.
  const [mixed, setMixed] = useState(indeterminate)
  const [lastProp, setLastProp] = useState(indeterminate)
  if (indeterminate !== lastProp) {
    setLastProp(indeterminate)
    setMixed(indeterminate)
  }

  useEffect(() => {
    if (inner.current) inner.current.indeterminate = mixed
  }, [mixed])

  const state = mixed ? 'indeterminate' : checked ? 'checked' : 'unchecked'

  // Ink pours in from the side that was pressed, levels, and then the mark draws (motion/checkbox.ts).
  const boxRef = useRef<HTMLSpanElement>(null)
  const cup = useRef<ReturnType<typeof createCheckboxPour>>(null)
  cup.current ??= createCheckboxPour(() => boxRef.current, styles.pour, state)
  useLayoutEffect(() => cup.current!.set(state), [state])
  useLayoutEffect(() => () => cup.current!.destroy(), [])

  return (
    <div
      data-slot="checkbox"
      className={cx(styles.root, className)}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={shownError ? true : undefined}
      onPointerDown={(e) => !readOnly && cup.current!.press(e.clientX)}
    >
      <span className={styles.boxWrap}>
        <input
          ref={mergeRefs(inner, ref)}
          id={inputId}
          type="checkbox"
          data-slot="checkbox-input"
          className={styles.input}
          checked={checked}
          disabled={disabled}
          readOnly={readOnly}
          aria-readonly={readOnly || undefined}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={describedBy || undefined}
          onClick={(e) => {
            // A native checkbox ignores readonly, so the click is held back.
            if (readOnly) e.preventDefault()
            onClick?.(e)
          }}
          onChange={(e) => {
            if (readOnly) return
            if (mixed) {
              setMixed(false)
              setChecked(true)
            } else setChecked(e.target.checked)
            field.changed()
            onChange?.(e)
          }}
          onBlur={(e) => {
            field.blurred()
            onBlur?.(e)
          }}
          onPointerDown={onPointerDown}
          onKeyDown={(e) => {
            cup.current!.key()
            onKeyDown?.(e)
          }}
          {...inputRest}
        />
        <span ref={boxRef} data-slot="checkbox-box" className={styles.box} data-state={state} aria-hidden="true">
          <span className={styles.fill} data-pour-fill />
          <svg viewBox="0 0 16 16" data-slot="checkbox-indicator" className={styles.mark}>
            <path className={styles.tick} d="M3.5 8.5l3 3 6-7" pathLength="1" data-mark="tick" />
            <path className={styles.dash} d="M4 8h8" pathLength="1" data-mark="dash" />
          </svg>
        </span>
      </span>
      <span className={styles.text}>
        <label htmlFor={inputId} data-slot="field-label" className={styles.label}>{label}</label>
        {description && <span id={`${inputId}-desc`} data-slot="checkbox-description" className={styles.description}>{description}</span>}
        <FieldMessage helpId={`${inputId}-help`} errorId={errorId} error={shownError} />
      </span>
    </div>
  )
}
