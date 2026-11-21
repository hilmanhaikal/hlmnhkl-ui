// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useEffect, useId, useMemo, useRef, useState, type ChangeEventHandler, type FocusEventHandler, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { leavesField } from '../../internal/formCore'
import { mergeRefs } from '../../internal/mergeRefs'
import { MinusIcon, PlusIcon } from '../../icons/icons'
import { createHold, parseNumber, type NumberInputLabels } from '../../internal/motion/numberInput'
import { useControllable } from '../../internal/useControllable'
import { changeEvent, retarget, setNativeValue, useField, useMirror } from '../../internal/useField'
import { AnimatedNumber } from '../AnimatedNumber'
import styles from './NumberInput.module.css'

export type { NumberInputLabels }

const defaultLabels: NumberInputLabels = {
  decrease: (label) => `Decrease ${label}`,
  increase: (label) => `Increase ${label}`,
}

export type NumberInputProps = {
  /** Visible name of the field, also read by screen readers. */
  label: string
  /** Selected value, when you control it. Null means the field is empty. */
  value?: number | null
  /** Starting value when you do not control it. */
  defaultValue?: number | null
  /** Called when the value changes, with the new number, or null when cleared. */
  onValueChange?: (value: number | null) => void
  /** Lowest allowed number. Typed values are clamped to it. */
  min?: number
  /** Highest allowed number. Typed values are clamped to it. */
  max?: number
  /** How much the buttons and arrow keys change the value. Its decimals set the rounding. */
  step?: number
  /** Step for Page Up and Page Down. Defaults to ten steps. */
  largeStep?: number
  /** Passed to Intl.NumberFormat, for currency, units or decimals. */
  formatOptions?: Intl.NumberFormatOptions
  /** Locale for showing and reading numbers. Undefined uses the browser locale. */
  locale?: string
  /** Hint under the field. Hidden while an error shows. */
  help?: ReactNode
  /** Error message under the field. Also marks the field invalid. */
  error?: ReactNode
  /** Stops typing and the step buttons. */
  disabled?: boolean
  /** Submits the plain number in a hidden field with this name. */
  name?: string
  /** The form cannot be sent while the field is empty. */
  required?: boolean
  /** Shows the number and sends it with the form, but typing, keys and the step buttons do not change it. */
  readOnly?: boolean
  /** Reaches the hidden input that holds the number and the name. Its focus() moves focus to the field, so react-hook-form's register works. */
  ref?: Ref<HTMLInputElement>
  /** Called after the number changes with a change event from the hidden input, as a form library's register expects. */
  onChange?: ChangeEventHandler<HTMLInputElement>
  /** Called when focus leaves the field. The event's target is the hidden input, so a form library finds the field by name. */
  onBlur?: FocusEventHandler<HTMLInputElement>
  /** Screen reader names for the step buttons. Missing keys say "Decrease" or "Increase" plus the label. */
  labels?: Partial<NumberInputLabels>
  /** Extra class for the root element. */
  className?: string
}

export function NumberInput({
  label,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  largeStep,
  formatOptions,
  locale,
  help,
  error,
  disabled,
  name,
  required,
  readOnly,
  ref,
  onChange,
  onBlur,
  labels: labelsProp,
  className,
}: NumberInputProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const nameOf = (text: NumberInputLabels['decrease']) => (typeof text === 'function' ? text(label) : text)
  const id = useId()
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const [value, setValue] = useControllable<number | null>(valueProp, defaultValue, onValueChange)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const valueRef = useRef(value)
  valueRef.current = value
  // The hold timer keeps calling the bump from its first render, so it reads the typed text from a ref
  const typed = useRef<string | null>(null)
  typed.current = editing ? text : null
  const [hold] = useState(createHold)
  const decimals = (String(step).split('.')[1] ?? '').length
  const fmt = useMemo(() => new Intl.NumberFormat(locale, formatOptions), [locale, formatOptions])
  const plain = useMemo(() => new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 20 }), [locale])
  const rootRef = useRef<HTMLDivElement>(null)
  const visibleRef = useRef<HTMLInputElement>(null)
  // The hidden input holds the plain number for the form and for form libraries; a form reset goes back to the first value.
  const mirror = useRef<HTMLInputElement>(null)
  const [firstValue] = useState(value)
  const asText = (n: number | null) => (n === null ? '' : String(n))
  useMirror(mirror, asText(value), asText(valueProp === undefined ? defaultValue : firstValue))
  const field = useField({
    input: mirror,
    name,
    error,
    onSync: () => {
      const v = mirror.current?.value ?? ''
      const n = v === '' ? null : Number(v)
      if (v === asText(valueRef.current) || Number.isNaN(n)) return
      valueRef.current = n
      setValue(n)
    },
  })
  const shownError = field.error

  const clamp = (n: number) => Number(Math.min(max, Math.max(min, n)).toFixed(decimals))
  const commit = (n: number | null) => {
    const next = n === null ? null : clamp(n)
    if (next !== valueRef.current) {
      valueRef.current = next
      setValue(next)
      // A person's change: the hidden input fires a real change event, then the caller's onChange gets it.
      const el = mirror.current
      const native = el && setNativeValue(el, asText(next))
      field.changed()
      if (native) onChange?.(changeEvent(native, el!))
    }
    if (editing) {
      const shown = next === null ? '' : plain.format(next)
      typed.current = shown
      setText(shown)
    }
  }
  const bump = (dir: 1 | -1, size = step) => {
    if (readOnly) return
    const current = (typed.current === null ? null : parseNumber(typed.current, locale)) ?? valueRef.current
    const base = current ?? (min > -Infinity ? min : 0)
    commit(current === null ? base : base + dir * size)
  }

  const stopHold = hold.stop
  const startHold = (dir: 1 | -1) => (e: PointerEvent<HTMLButtonElement>) => {
    // Chromium still sends pointer events to a disabled button
    if (e.button !== 0 || e.currentTarget.disabled) return
    e.preventDefault()
    hold.start(
      (big) => bump(dir, big ? step * 5 : step),
      () => {
        const v = valueRef.current
        return v !== null && (dir > 0 ? v >= max : v <= min)
      },
    )
  }
  useEffect(() => stopHold, [])

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (readOnly) return
    const big = largeStep ?? step * 10
    const k = e.key
    if (k === 'ArrowUp') bump(1)
    else if (k === 'ArrowDown') bump(-1)
    else if (k === 'PageUp') bump(1, big)
    else if (k === 'PageDown') bump(-1, big)
    else if (k === 'Home' && min > -Infinity) commit(min)
    else if (k === 'End' && max < Infinity) commit(max)
    else if (k === 'Enter') commit(parseNumber(text, locale))
    else return
    e.preventDefault()
  }

  const atMin = value !== null && value <= min
  const atMax = value !== null && value >= max
  const describedBy = [help && !shownError ? helpId : null, shownError ? errorId : null].filter(Boolean).join(' ')

  return (
    <div ref={rootRef} className={cx(styles.root, className)} data-slot="number-input" data-readonly={readOnly || undefined}>
      <label htmlFor={id} className={styles.label} data-slot="field-label">{label}</label>
      <div className={styles.field} data-slot="number-input-field" data-invalid={shownError ? true : undefined} data-disabled={disabled || undefined}>
        <button
          type="button"
          tabIndex={-1}
          className={styles.step}
          data-slot="number-input-decrement"
          aria-label={nameOf(labels.decrease)}
          aria-controls={id}
          disabled={disabled || readOnly || atMin}
          onPointerDown={startHold(-1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          onClick={(e) => e.detail === 0 && bump(-1)}
        >
          <MinusIcon />
        </button>
        <div className={styles.control}>
          <input
            ref={visibleRef}
            id={id}
            className={styles.input}
            data-slot="number-input-input"
            type="text"
            inputMode={decimals || min < 0 ? 'decimal' : 'numeric'}
            role="spinbutton"
            autoComplete="off"
            aria-valuenow={value ?? undefined}
            aria-valuemin={min > -Infinity ? min : undefined}
            aria-valuemax={max < Infinity ? max : undefined}
            aria-valuetext={value !== null ? fmt.format(value) : undefined}
            aria-invalid={shownError ? true : undefined}
            aria-required={required || undefined}
            aria-describedby={describedBy || undefined}
            data-editing={editing || undefined}
            disabled={disabled}
            readOnly={readOnly}
            value={editing ? text : value === null ? '' : fmt.format(value)}
            onFocus={() => {
              setEditing(true)
              setText(value === null ? '' : plain.format(value))
            }}
            onBlur={(e) => {
              if (!readOnly) commit(parseNumber(text, locale))
              setEditing(false)
              if (!leavesField(e.nativeEvent, rootRef.current)) return
              field.blurred()
              onBlur?.(retarget(e, mirror.current))
            }}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {!editing && value !== null && (
            <span className={styles.rolling} aria-hidden="true">
              <AnimatedNumber value={value} formatOptions={formatOptions} locale={locale} />
            </span>
          )}
        </div>
        <button
          type="button"
          tabIndex={-1}
          className={styles.step}
          data-slot="number-input-increment"
          aria-label={nameOf(labels.increase)}
          aria-controls={id}
          disabled={disabled || readOnly || atMax}
          onPointerDown={startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          onClick={(e) => e.detail === 0 && bump(1)}
        >
          <PlusIcon />
        </button>
      </div>
      {/* Holds the number for the form. Not type hidden, so required works; focus moves on to the field. */}
      <input
        ref={mergeRefs(mirror, ref)}
        name={name}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        className={styles.value}
        data-slot="number-input-value"
        onFocus={() => visibleRef.current?.focus()}
      />
      <FieldMessage helpId={helpId} errorId={errorId} help={help} error={shownError} />
    </div>
  )
}
