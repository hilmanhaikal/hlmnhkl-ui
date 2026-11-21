'use client'

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useFlow } from '../../internal/liquidMatter'
import { measureSegments, segmentInk, segmentKey } from '../../internal/motion/segmented'
import { useControllable } from '../../internal/useControllable'
import styles from './SegmentedControl.module.css'

export type SegmentedControlOption = { value: string; label: ReactNode; icon?: ReactNode; disabled?: boolean; ariaLabel?: string }

export type SegmentedControlProps = {
  /** Accessible name for the group. */
  label: string
  /** The segments, in order. */
  options: SegmentedControlOption[]
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
  const pillRef = useRef<HTMLSpanElement>(null)
  const index = options.findIndex((o) => o.value === value)
  // With no match, the first enabled segment takes the tab stop
  const tabStop = index >= 0 && !options[index].disabled ? index : options.findIndex((o) => !o.disabled)

  useLayoutEffect(() => {
    const measure = () => {
      const place = measureSegments(rootRef.current, refs.current[index])
      if (place) setPill(place)
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

  // The pill flows to the new choice. The labels stay put; under the liquid they take the chosen
  // colour, from a copy of the row clipped to the same outline.
  const ink = useRef<ReturnType<typeof segmentInk>>(null)
  ink.current ??= segmentInk(() => rootRef.current, () => refs.current, styles.ink)
  useFlow(rootRef, pillRef, pill, index, ready, styles.liquid, false, ink.current)

  const onKeyDown = (e: KeyboardEvent) => {
    const next = segmentKey(e.key, tabStop, options.map((o) => !!o.disabled))
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
      data-slot="segmented-control"
      onKeyDown={onKeyDown}
    >
      {pill && (
        <span
          ref={pillRef}
          className={styles.pill}
          data-slot="segmented-control-indicator"
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
            data-slot="segmented-control-item"
            data-state={on ? 'active' : 'inactive'}
            data-disabled={o.disabled || undefined}
            onClick={() => setValue(o.value)}
          >
            {o.icon && <span className={styles.icon} data-slot="segmented-control-icon">{o.icon}</span>}
            {o.label && <span className={styles.text} data-slot="segmented-control-label">{o.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
