'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { mergeRefs } from '../../internal/mergeRefs'
import { pour, type Pour } from '../../internal/liquidMore'
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

  // Ink pours in from the side that was pressed (a key fills it evenly from below), levels, and then
  // the mark draws. Clearing drains it the same way.
  const boxRef = useRef<HTMLSpanElement>(null)
  const pressedAt = useRef<{ x: number; t: number } | null>(null)
  const pouring = useRef<Pour | null>(null)
  const filled = state !== 'off'
  const was = useRef({ filled, state })
  useLayoutEffect(() => {
    const prev = was.current
    was.current = { filled, state }
    if (prev.filled === filled) return
    const box = boxRef.current
    const at = pressedAt.current
    pressedAt.current = null
    if (!box) return
    const r = box.getBoundingClientRect()
    const side = at && performance.now() - at.t < 1000 ? Math.max(-1, Math.min(1, (at.x - r.left - r.width / 2) / (r.width / 2))) : 0
    const mark = box.querySelector<SVGPathElement>(prev.state === 'mixed' || state === 'mixed' ? '[data-mark="dash"]' : '[data-mark="tick"]')
    pouring.current = pour(box, mark, filled ? 1 : 0, side, styles.pour, pouring.current)
  }, [filled, state])
  useLayoutEffect(() => () => pouring.current?.stop(), [])

  return (
    <div
      className={cx(styles.root, className)}
      data-disabled={disabled || undefined}
      data-invalid={error ? true : undefined}
      onPointerDown={(e) => {
        pressedAt.current = { x: e.clientX, t: performance.now() }
      }}
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
            pressedAt.current = null
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
