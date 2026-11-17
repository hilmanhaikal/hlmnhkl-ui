'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { mergeRefs } from '../../internal/mergeRefs'
import { createCheckboxPour } from '../../internal/motion/checkbox'
import { useControllable } from '../../internal/useControllable'
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
  onPointerDown,
  onKeyDown,
  'aria-describedby': describedByProp,
  ...rest
}: CheckboxProps) {
  const auto = useId()
  const inputId = id ?? auto
  const errorId = `${inputId}-error`
  const describedBy = [description ? `${inputId}-desc` : null, error ? errorId : null, describedByProp].filter(Boolean).join(' ')
  const [checked, setChecked] = useControllable(checkedProp, defaultChecked, onCheckedChange)
  const inner = useRef<HTMLInputElement>(null)
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

  const state = mixed ? 'mixed' : checked ? 'on' : 'off'

  // Ink pours in from the side that was pressed, levels, and then the mark draws (motion/checkbox.ts).
  const boxRef = useRef<HTMLSpanElement>(null)
  const cup = useRef<ReturnType<typeof createCheckboxPour>>(null)
  cup.current ??= createCheckboxPour(() => boxRef.current, styles.pour, state)
  useLayoutEffect(() => cup.current!.set(state), [state])
  useLayoutEffect(() => () => cup.current!.destroy(), [])

  return (
    <div
      className={cx(styles.root, className)}
      data-disabled={disabled || undefined}
      data-invalid={error ? true : undefined}
      onPointerDown={(e) => cup.current!.press(e.clientX)}
    >
      <span className={styles.boxWrap}>
        <input
          ref={mergeRefs(inner, ref)}
          id={inputId}
          type="checkbox"
          className={styles.input}
          checked={checked}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(e) => {
            if (!mixed) return setChecked(e.target.checked)
            setMixed(false)
            setChecked(true)
          }}
          onPointerDown={onPointerDown}
          onKeyDown={(e) => {
            cup.current!.key()
            onKeyDown?.(e)
          }}
          {...rest}
        />
        <span ref={boxRef} className={styles.box} data-state={state} aria-hidden="true">
          <span className={styles.fill} data-pour-fill />
          <svg viewBox="0 0 16 16" className={styles.mark}>
            <path className={styles.tick} d="M3.5 8.5l3 3 6-7" pathLength="1" data-mark="tick" />
            <path className={styles.dash} d="M4 8h8" pathLength="1" data-mark="dash" />
          </svg>
        </span>
      </span>
      <span className={styles.text}>
        <label htmlFor={inputId} className={styles.label}>{label}</label>
        {description && <span id={`${inputId}-desc`} className={styles.description}>{description}</span>}
        <FieldMessage helpId={`${inputId}-help`} errorId={errorId} error={error} />
      </span>
    </div>
  )
}
