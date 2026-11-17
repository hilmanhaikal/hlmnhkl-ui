'use client'

import { useEffect, useId, useRef, useState, type ComponentPropsWithRef, type KeyboardEvent, type PointerEvent } from 'react'
import { cx } from '../../internal/cx'
import { createSlider } from '../../internal/motion/slider'
import { useControllable } from '../../internal/useControllable'
import styles from './Slider.module.css'

export type SliderProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'value' | 'defaultValue' | 'onChange'> & {
  /** Visible name of the slider, also read by screen readers. */
  label: string
  /** Selected value, when you control it. */
  value?: number
  /** Starting value when you do not control it. Undefined starts at min. */
  defaultValue?: number
  /** Called when the value changes, with the new number. */
  onValueChange?: (value: number) => void
  /** Lowest value on the track. */
  min?: number
  /** Highest value on the track. */
  max?: number
  /** Size of each move, by drag or arrow key. */
  step?: number
  /** Shows the value next to the label and in a bubble while dragging. */
  showValue?: boolean
  /** Turns the number into the text shown and read by screen readers. */
  formatValue?: (value: number) => string
  /** Values the thumb is drawn to as it passes, shown as dots on the track. Let go near one and it lands on it; Page Up and Page Down jump between them. */
  marks?: number[]
}

export function Slider({
  label,
  value: valueProp,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  formatValue = String,
  marks,
  id,
  className,
  disabled,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
  onBlur,
  ...rest
}: SliderProps) {
  const auto = useId()
  const inputId = id ?? auto
  const [value, setValue] = useControllable(valueProp, defaultValue ?? min, onValueChange)
  // Where the thumb is drawn while it glides to a click or settles on a mark; the value is set already.
  const [shown, setShown] = useState<number | null>(null)
  const latest = useRef({ value, min, max, step, marks })
  latest.current = { value, min, max, step, marks }
  const set = useRef(setValue)
  set.current = setValue
  // The glide, the grab and the landing on marks (motion/slider.ts).
  const slider = useRef<ReturnType<typeof createSlider>>(null)
  slider.current ??= createSlider(
    () => latest.current,
    (v) => {
      latest.current = { ...latest.current, value: v }
      set.current(v)
    },
    setShown,
  )
  const at = shown ?? value
  const pct = max === min ? 0 : ((at - min) / (max - min)) * 100
  const text = formatValue(value)

  useEffect(() => () => slider.current!.destroy(), [])

  return (
    <div className={cx(styles.root, className)} data-disabled={disabled || undefined}>
      <div className={styles.head}>
        <label htmlFor={inputId} className={styles.label}>{label}</label>
        {showValue && <output htmlFor={inputId} className={styles.value} aria-hidden="true">{text}</output>}
      </div>
      <div className={styles.trackWrap} data-gliding={shown !== null || undefined} style={{ ['--pct' as string]: `${pct}%`, ['--p' as string]: pct / 100 }}>
        <input
          id={inputId}
          type="range"
          className={styles.input}
          min={min}
          max={max}
          step={shown === null ? step : 'any'}
          value={at}
          disabled={disabled}
          aria-valuenow={value}
          aria-valuetext={formatValue === String ? undefined : text}
          // Only "input": the browser's "change" on release carries the thumb's mid-glide place, not the value.
          onChange={(e) => e.nativeEvent.type === 'input' && slider.current!.input(e.currentTarget, Number(e.target.value))}
          onPointerDown={(e: PointerEvent<HTMLInputElement>) => {
            slider.current!.down(e.currentTarget, e.clientX)
            onPointerDown?.(e)
          }}
          onPointerMove={(e: PointerEvent<HTMLInputElement>) => {
            slider.current!.move(e.clientX)
            onPointerMove?.(e)
          }}
          onPointerUp={(e: PointerEvent<HTMLInputElement>) => {
            slider.current!.up()
            onPointerUp?.(e)
          }}
          onPointerCancel={(e: PointerEvent<HTMLInputElement>) => {
            slider.current!.end()
            onPointerCancel?.(e)
          }}
          onLostPointerCapture={slider.current.end}
          onBlur={(e) => {
            slider.current!.end()
            onBlur?.(e)
          }}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            slider.current!.end()
            onKeyDown?.(e)
            if (!e.defaultPrevented && slider.current!.key(e.key)) e.preventDefault()
          }}
          {...rest}
        />
        {showValue && (
          <span className={styles.bubble} aria-hidden="true">{text}</span>
        )}
        {/* After the bubble, which CSS shows from the input just before it. */}
        {marks?.length ? (
          <span className={styles.marks} aria-hidden="true">
            {marks.map((m) => (
              <span key={m} className={styles.mark} data-on={m === value || undefined} style={{ ['--m' as string]: (m - min) / (max - min || 1) }} />
            ))}
          </span>
        ) : null}
      </div>
    </div>
  )
}
