'use client'

import { useId, type ComponentPropsWithRef } from 'react'
import { cx } from '../../internal/cx'
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
  id,
  className,
  disabled,
  ...rest
}: SliderProps) {
  const auto = useId()
  const inputId = id ?? auto
  const [value, setValue] = useControllable(valueProp, defaultValue ?? min, onValueChange)
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100
  const text = formatValue(value)

  return (
    <div className={cx(styles.root, className)} data-disabled={disabled || undefined}>
      <div className={styles.head}>
        <label htmlFor={inputId} className={styles.label}>{label}</label>
        {showValue && <output htmlFor={inputId} className={styles.value} aria-hidden="true">{text}</output>}
      </div>
      <div className={styles.trackWrap} style={{ ['--pct' as string]: `${pct}%`, ['--p' as string]: pct / 100 }}>
        <input
          id={inputId}
          type="range"
          className={styles.input}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-valuetext={formatValue === String ? undefined : text}
          onChange={(e) => setValue(Number(e.target.value))}
          {...rest}
        />
        {showValue && (
          <span className={styles.bubble} aria-hidden="true">{text}</span>
        )}
      </div>
    </div>
  )
}
