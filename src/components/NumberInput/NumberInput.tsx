'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { MinusIcon, PlusIcon } from '../../internal/icons'
import { useControllable } from '../../internal/useControllable'
import { AnimatedNumber } from '../AnimatedNumber'
import styles from './NumberInput.module.css'

export type NumberInputLabels = {
  /** Name of the minus button. A function gets the field label; a string is used as it is. */
  decrease: string | ((label: string) => string)
  /** Name of the plus button. A function gets the field label; a string is used as it is. */
  increase: string | ((label: string) => string)
}

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
  format?: Intl.NumberFormatOptions
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

// Input timings, so reduced motion does not change them
function tokenMs(name: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!raw) return fallback
  // The browser may report 500ms as .5s
  return raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000
}

function parseNumber(text: string, locale?: string): number | null {
  const parts = new Intl.NumberFormat(locale).formatToParts(-12345.6)
  const group = parts.find((p) => p.type === 'group')?.value ?? ','
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.'
  const minus = parts.find((p) => p.type === 'minusSign')?.value ?? '-'
  // sv, nb and fi write minus as U+2212, which the cleanup below would drop
  const clean = text
    .split(minus).join('-')
    .replace(/\u2212/g, '-')
    .split(group).join('')
    .split(decimal).join('.')
    .replace(/[^\d.-]/g, '')
  if (clean === '' || clean === '-' || clean === '.') return null
  const n = Number(clean)
  return Number.isFinite(n) ? n : null
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
  format,
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
  const hold = useRef<{ timer?: number; count: number }>({ count: 0 })
  const decimals = (String(step).split('.')[1] ?? '').length
  const fmt = useMemo(() => new Intl.NumberFormat(locale, format), [locale, format])
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

  const stopHold = () => {
    window.clearTimeout(hold.current.timer)
    hold.current.count = 0
  }
  const startHold = (dir: 1 | -1) => (e: PointerEvent<HTMLButtonElement>) => {
    // Chromium still sends pointer events to a disabled button
    if (e.button !== 0 || e.currentTarget.disabled) return
    e.preventDefault()
    bump(dir)
    // A disabled button gets no pointerup, so listen on the window
    window.addEventListener('pointerup', stopHold, { once: true })
    const tick = () => {
      const v = valueRef.current
      if (v !== null && (dir > 0 ? v >= max : v <= min)) return stopHold()
      hold.current.count++
      bump(dir, hold.current.count > 12 ? step * 5 : step)
      hold.current.timer = window.setTimeout(tick, tokenMs('--hl-motion-repeat', 70))
    }
    hold.current.timer = window.setTimeout(tick, tokenMs('--hl-motion-repeat-delay', 400))
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
    <div className={cx(styles.root, className)}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.field} data-invalid={error ? true : undefined} data-disabled={disabled || undefined}>
        <button
          type="button"
          tabIndex={-1}
          className={styles.step}
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
              <AnimatedNumber value={value} format={format} locale={locale} />
            </span>
          )}
        </div>
        <button
          type="button"
          tabIndex={-1}
          className={styles.step}
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
