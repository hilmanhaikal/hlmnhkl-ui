'use client'

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useControllable } from '../../internal/useControllable'
import styles from './SegmentedControl.module.css'

export type SegmentOption = { value: string; label: ReactNode; icon?: ReactNode; disabled?: boolean; ariaLabel?: string }

export type SegmentedControlProps = {
  /** Accessible name for the group. */
  label: string
  /** The segments, in order. */
  options: SegmentOption[]
  /** Selected value, when you control it. */
  value?: string
  /** Starting value when you do not control it. Undefined picks the first option. */
  defaultValue?: string
  /** Called when the selected segment changes, with the new value. */
  onValueChange?: (value: string) => void
  /** Height and text size of the segments. */
  size?: 'sm' | 'md'
  /** Stretches the control to fill its container, with equal segments. */
  fullWidth?: boolean
  /** Extra class for the root element. */
  className?: string
}

export function SegmentedControl({
  label,
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  size = 'md',
  fullWidth,
  className,
}: SegmentedControlProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue ?? options[0]?.value ?? '', onValueChange)
  const rootRef = useRef<HTMLDivElement>(null)
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null)
  const [ready, setReady] = useState(false)
  const index = options.findIndex((o) => o.value === value)
  // With no match, the first enabled segment takes the tab stop
  const tabStop = index >= 0 && !options[index].disabled ? index : options.findIndex((o) => !o.disabled)

  useLayoutEffect(() => {
    const measure = () => {
      // Tight mode only when the segments overflow at their normal size, so a wide screen keeps the normal look
      const root = rootRef.current
      if (root) {
        root.removeAttribute('data-tight')
        if (root.scrollWidth > root.clientWidth) root.setAttribute('data-tight', '')
      }
      const el = refs.current[index]
      if (el) setPill({ x: el.offsetLeft, w: el.offsetWidth })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (rootRef.current) ro.observe(rootRef.current)
    return () => ro.disconnect()
  }, [index, options.length])

  useLayoutEffect(() => {
    if (pill && !ready) {
      const r = requestAnimationFrame(() => setReady(true))
      return () => cancelAnimationFrame(r)
    }
  }, [pill, ready])

  const move = (from: number, dir: 1 | -1) => {
    let i = from
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length
      if (!options[i].disabled) return i
    }
    return from
  }

  const onKeyDown = (e: KeyboardEvent) => {
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = move(tabStop, 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = move(tabStop, -1)
    else if (e.key === 'Home') next = move(-1, 1)
    else if (e.key === 'End') next = move(options.length, -1)
    if (next < 0) return
    e.preventDefault()
    setValue(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-label={label}
      className={cx(styles.root, styles[size], fullWidth && styles.full, className)}
      onKeyDown={onKeyDown}
    >
      {pill && (
        <span
          className={styles.pill}
          data-ready={ready || undefined}
          style={{ transform: `translateX(${pill.x}px)`, width: pill.w }}
          aria-hidden="true"
        />
      )}
      {options.map((o, i) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.ariaLabel}
            tabIndex={i === tabStop ? 0 : -1}
            disabled={o.disabled}
            className={styles.item}
            data-on={on || undefined}
            onClick={() => setValue(o.value)}
          >
            {o.icon && <span className={styles.icon}>{o.icon}</span>}
            {o.label && <span className={styles.text}>{o.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
