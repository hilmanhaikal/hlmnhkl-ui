// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { MinusIcon, PlusIcon } from '../../icons/icons'
import { createHold, parseNumber, type NumberInputLabels } from '../../internal/motion/numberInput'
import { useControllable } from '../../internal/useControllable'
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

  const clamp = (n: number) => Number(Math.min(max, Math.max(min, n)).toFixed(decimals))
  const commit = (n: number | null) => {
    const next = n === null ? null : clamp(n)
    if (next !== valueRef.current) {
      valueRef.current = next
      setValue(next)
    }
    if (editing) {
      const shown = next === null ? '' : plain.format(next)
      typed.current = shown
      setText(shown)
    }
  }
  const bump = (dir: 1 | -1, size = step) => {
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
  const describedBy = [help && !error ? helpId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={cx(styles.root, className)} data-slot="number-input">
      <label htmlFor={id} className={styles.label} data-slot="field-label">{label}</label>
      <div className={styles.field} data-slot="number-input-field" data-invalid={error ? true : undefined} data-disabled={disabled || undefined}>
        <button
          type="button"
          tabIndex={-1}
          className={styles.step}
          data-slot="number-input-decrement"
          aria-label={nameOf(labels.decrease)}
          aria-controls={id}
          disabled={disabled || atMin}
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
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            data-editing={editing || undefined}
            disabled={disabled}
            value={editing ? text : value === null ? '' : fmt.format(value)}
            onFocus={() => {
              setEditing(true)
              setText(value === null ? '' : plain.format(value))
            }}
            onBlur={() => {
              commit(parseNumber(text, locale))
              setEditing(false)
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
          disabled={disabled || atMax}
          onPointerDown={startHold(1)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          onClick={(e) => e.detail === 0 && bump(1)}
        >
          <PlusIcon />
        </button>
      </div>
      {name && <input type="hidden" name={name} value={value ?? ''} />}
      <FieldMessage helpId={helpId} errorId={errorId} help={help} error={error} />
    </div>
  )
}
