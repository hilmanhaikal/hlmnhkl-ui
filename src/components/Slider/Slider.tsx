'use client'

import { useEffect, useId, useRef, useState, type ComponentPropsWithRef, type KeyboardEvent, type PointerEvent } from 'react'
import { cx } from '../../internal/cx'
import { magnetTo, nearestMark } from '../../internal/magnet'
import { motionMs, prefersReducedMotion } from '../../internal/motion'
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
  // `grab` is how far from the thumb's centre it was picked up, so the thumb does not jump to the pointer.
  const press = useRef<{ x: number; lastX: number; moved: boolean; grab: number } | null>(null)
  const glide = useRef(0)
  const latest = useRef(value)
  latest.current = value
  const at = shown ?? value
  const pct = max === min ? 0 : ((at - min) / (max - min)) * 100
  const text = formatValue(value)
  // How near a mark the pull starts: 6% of the track.
  const reach = (max - min) * 0.06
  const decimals = (String(step).split('.')[1] ?? '').length
  const toStep = (v: number) => Math.min(max, Math.max(min, Number((Math.round((v - min) / step) * step + min).toFixed(decimals))))

  useEffect(() => () => cancelAnimationFrame(glide.current), [])

  // The thumb travels from where it is drawn to `to`, easing out. A click and a landing both use it.
  function glideTo(from: number, to: number) {
    cancelAnimationFrame(glide.current)
    const ms = motionMs('base')
    if (!ms || from === to || prefersReducedMotion()) return setShown(null)
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      setShown(p < 1 ? from + (to - from) * (1 - Math.pow(1 - p, 3)) : null)
      if (p < 1) glide.current = requestAnimationFrame(tick)
    }
    glide.current = requestAnimationFrame(tick)
  }

  // The value under the pointer, before any step, from the input's own geometry: the thumb's centre
  // runs from half a thumb in at each end.
  function track(input: HTMLInputElement) {
    const r = input.getBoundingClientRect()
    const thumb = parseFloat(getComputedStyle(input).getPropertyValue('--thumb')) || 0
    return { left: r.left + thumb / 2, width: Math.max(1, r.width - thumb), thumb }
  }

  function fromPointer(input: HTMLInputElement, x: number) {
    const t = track(input)
    return min + Math.min(1, Math.max(0, (x - t.left) / t.width)) * (max - min)
  }

  function change(input: HTMLInputElement, native: number) {
    const p = press.current
    const next = p && marks?.length ? toStep(magnetTo(fromPointer(input, p.lastX - p.grab), marks, reach)) : native
    // A press that has not moved is a click: the value jumps, the thumb glides there. Once it moves, the hand leads.
    if (p && !p.moved) glideTo(at, next)
    else if (shown !== null) {
      cancelAnimationFrame(glide.current)
      setShown(null)
    }
    latest.current = next
    setValue(next)
  }

  const endPress = () => {
    press.current = null
  }

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
          onChange={(e) => e.nativeEvent.type === 'input' && change(e.currentTarget, Number(e.target.value))}
          onPointerDown={(e: PointerEvent<HTMLInputElement>) => {
            const t = track(e.currentTarget)
            const centre = t.left + ((value - min) / (max - min || 1)) * t.width
            const grab = marks?.length && Math.abs(e.clientX - centre) <= t.thumb / 2 ? e.clientX - centre : 0
            press.current = { x: e.clientX, lastX: e.clientX, moved: false, grab }
            onPointerDown?.(e)
          }}
          onPointerMove={(e: PointerEvent<HTMLInputElement>) => {
            const p = press.current
            if (p) {
              p.lastX = e.clientX
              if (Math.abs(e.clientX - p.x) > 3) p.moved = true
            }
            onPointerMove?.(e)
          }}
          onPointerUp={(e: PointerEvent<HTMLInputElement>) => {
            endPress()
            // Let go near a mark: it lands on the mark.
            const now = latest.current
            const mark = marks?.length ? nearestMark(now, marks) : null
            if (mark !== null && mark !== now && Math.abs(mark - now) < reach / 2) {
              glideTo(at, mark)
              setValue(mark)
            }
            onPointerUp?.(e)
          }}
          onPointerCancel={(e: PointerEvent<HTMLInputElement>) => {
            endPress()
            onPointerCancel?.(e)
          }}
          onLostPointerCapture={endPress}
          onBlur={(e) => {
            endPress()
            onBlur?.(e)
          }}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            endPress()
            onKeyDown?.(e)
            if (e.defaultPrevented || !marks?.length || (e.key !== 'PageUp' && e.key !== 'PageDown')) return
            const sorted = [...marks].sort((a, b) => a - b)
            const next = e.key === 'PageUp' ? (sorted.find((m) => m > value) ?? max) : ([...sorted].reverse().find((m) => m < value) ?? min)
            e.preventDefault()
            setValue(next)
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
