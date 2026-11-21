'use client'

import { useId, useLayoutEffect, useRef, useState, type ChangeEventHandler, type FocusEventHandler, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { leavesField } from '../../internal/formCore'
import { mergeRefs } from '../../internal/mergeRefs'
import { useFlow } from '../../internal/liquidMatter'
import { measureSegments, segmentInk, segmentKey } from '../../internal/motion/segmented'
import { useControllable } from '../../internal/useControllable'
import { changeEvent, retarget, setNativeValue, useField, useMirror } from '../../internal/useField'
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
  /** Form field name. The selected value is sent under it. The control joins a form only with a name. */
  name?: string
  /** The form cannot be sent while no segment is selected. */
  required?: boolean
  /** Keeps the selection as it is and still sends it with the form. Shown with data-readonly. */
  readOnly?: boolean
  /** Turns off every segment. The value is not sent with the form. */
  disabled?: boolean
  /** Error message under the control, shown with a name. Marks the control invalid. */
  error?: ReactNode
  /** Reaches the hidden input that holds the value and the name. Its focus() moves focus to the selected segment. */
  ref?: Ref<HTMLInputElement>
  /** Called after a new selection with a change event from the hidden input, as a form library expects. */
  onChange?: ChangeEventHandler<HTMLInputElement>
  /** Called when focus leaves the control, not when it moves between segments. */
  onBlur?: FocusEventHandler<HTMLDivElement>
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
  name,
  required,
  readOnly,
  disabled,
  error,
  ref,
  onChange,
  onBlur,
  className,
}: SegmentedControlProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue ?? options[0]?.value ?? '', onValueChange)
  const rootRef = useRef<HTMLDivElement>(null)
  // With a name, a hidden input holds the value for the form; a form reset goes back to the first value.
  const input = useRef<HTMLInputElement>(null)
  const [firstValue] = useState(value)
  useMirror(input, value, valueProp === undefined ? (defaultValue ?? options[0]?.value ?? '') : firstValue)
  const field = useField({ input, name, error, onSync: () => input.current && input.current.value !== value && setValue(input.current.value) })
  const shownError = name ? field.error : undefined
  const errorId = `${useId()}-error`
  const select = (next: string) => {
    if (readOnly || next === value) return
    const native = input.current && setNativeValue(input.current, next)
    setValue(next)
    field.changed()
    if (native) onChange?.(changeEvent(native, input.current!))
  }
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
    select(options[next].value)
    if (!readOnly) refs.current[next]?.focus()
  }

  const control = (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-label={label}
      aria-invalid={shownError ? true : undefined}
      aria-required={required || undefined}
      aria-readonly={readOnly || undefined}
      aria-describedby={shownError ? errorId : undefined}
      className={cx(styles.root, styles[size], fullWidth && styles.full, className)}
      data-slot="segmented-control"
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={shownError ? true : undefined}
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        if (!name || !leavesField(e.nativeEvent, rootRef.current)) return
        field.blurred()
        onBlur?.(retarget(e, input.current))
      }}
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
            disabled={o.disabled || disabled}
            className={styles.item}
            data-slot="segmented-control-item"
            data-state={on ? 'active' : 'inactive'}
            data-disabled={o.disabled || undefined}
            onClick={() => select(o.value)}
          >
            {o.icon && <span className={styles.icon} data-slot="segmented-control-icon">{o.icon}</span>}
            {o.label && <span className={styles.text} data-slot="segmented-control-label">{o.label}</span>}
          </button>
        )
      })}
      {name && (
        // Holds the value for the form. Focus moves on to the selected segment.
        <input
          ref={mergeRefs(input, ref)}
          name={name}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
          className={styles.input}
          data-slot="segmented-control-input"
          onFocus={() => refs.current[tabStop]?.focus()}
        />
      )}
    </div>
  )
  if (!name) return control
  return (
    <>
      {control}
      <FieldMessage helpId={`${errorId}-help`} errorId={errorId} error={shownError} />
    </>
  )
}
