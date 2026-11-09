'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { clamp, follow, lastStep, pull, roundTo, stepKey, steps, wheelSteps } from '../../internal/feel'
import { morphCurve, readMotionMs } from '../../internal/motion'
import { Roll } from '../../internal/Roll'
import { useControllable } from '../../internal/useControllable'
import { ink, sideways, tokenNumber, useOnChange, useScrub } from '../../internal/useScrub'
import styles from './RulerScrubber.module.css'

export type RulerScrubberProps = Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange' | 'children'> & {
  /** Visible name of the ruler, also read by screen readers. */
  label: string
  /** The value, when you control it. */
  value?: number
  /** Starting value when you do not control it. Undefined starts at min. */
  defaultValue?: number
  /** Called once the ruler comes to rest on a new value. */
  onValueChange?: (value: number) => void
  /** Called with the value under the needle while the ruler still moves. */
  onScrub?: (value: number) => void
  /** Lowest value. */
  min?: number
  /** Highest value. */
  max?: number
  /** Size of one step: one tick on the ruler, and a mark it is drawn onto. */
  step?: number
  /** Values with a long, numbered tick. Page Up and Page Down jump between them. Defaults to every 10 steps. */
  marks?: number[]
  /** Values drawn stronger, such as a limit or the usual choice. */
  strong?: number[]
  /** A tag under each strong mark, such as "Allowance". */
  strongLabel?: string
  /** Turns the value into the readout and what screen readers hear. */
  formatValue?: (value: number) => string
  /** Turns a mark into the number under its tick. Defaults to formatValue. */
  formatMark?: (value: number) => string
  /** A line under the readout, such as what the value means. */
  detail?: ReactNode
  /** A short buzz on each tick while it moves, on phones that can (Android). */
  haptics?: boolean
}

export function RulerScrubber({
  label,
  value: valueProp,
  defaultValue,
  onValueChange,
  onScrub,
  min = 0,
  max = 100,
  step = 1,
  marks,
  strong = [],
  strongLabel,
  formatValue = String,
  formatMark,
  detail,
  haptics = false,
  className,
  ...rest
}: RulerScrubberProps) {
  const labelId = useId()
  const detailId = useId()
  const top = lastStep(min, max, step)
  const [raw, setValue] = useControllable(valueProp, defaultValue ?? min, onValueChange)
  const value = clamp(raw, min, top)
  const all = steps(min, max, step)
  const labelled = new Set((marks ?? all.filter((_, i) => i % 10 === 0)).map((v) => roundTo(v, step, min)))
  const strongSet = new Set(strong.map((v) => roundTo(v, step, min)))
  const land = (p: number) => clamp(roundTo(p, step, min), min, top)
  const markText = formatMark ?? formatValue
  // The px between two ticks (a token) and how many ticks fit either side of the needle.
  const [fit, setFit] = useState({ gap: 0, span: 24, width: 0, tag: 0 })
  const tagRef = useRef<HTMLSpanElement>(null)
  const wheel = useRef(wheelSteps())

  const sc = useScrub({
    value,
    min,
    max: top,
    edge: step,
    land,
    // The hand at 4000px a second at most, so a hard throw still stops in reach.
    maxSpeed: fit.gap ? (4000 / fit.gap) * step : undefined,
    // Dragging left brings higher values in, like pulling a tape.
    move: (e, last) => (-(e.clientX - last.x) / (fit.gap || 1)) * step * (e.shiftKey ? 0.25 : 1),
    key: (k, t) => stepKey(k, t, { min, max, step, marks: [...labelled] }),
    wheel: (e, t) => {
      const dx = sideways(e)
      if (dx === null || !fit.gap) return null
      const n = wheel.current(dx, fit.gap, e.timeStamp)
      const to = clamp(roundTo(t + n * step, step, min), min, top)
      return to === t && (t === min || t === top) ? null : to
    },
    onSettle: setValue,
    haptics,
  })

  useLayoutEffect(() => {
    const el = sc.ref.current
    if (!el) return
    const measure = () => {
      const gap = tokenNumber(el, '--hl-ruler-tick-gap')
      setFit({ gap, span: gap ? Math.ceil(el.clientWidth / 2 / gap) + 1 : 24, width: el.clientWidth, tag: tagRef.current?.offsetWidth ?? 0 })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [sc.ref, strongLabel])

  // The ticks lean and grow only while the ruler moves. The lean eases in as it starts and settles flat as it stops.
  const [lean, setLean] = useState(0)
  const leaning = useRef<ReturnType<typeof follow> | null>(null)
  if (!leaning.current) leaning.current = follow({ time: () => readMotionMs('morph-out'), curve: morphCurve(), onFrame: setLean })
  useEffect(() => {
    leaning.current?.set(sc.moving && readMotionMs('morph-out') > 0 ? 1 : 0)
  }, [sc.moving])
  useEffect(() => () => leaning.current?.stop(), [])

  const shown = land(sc.at)
  useOnChange(shown, onScrub)

  return (
    <div className={cx(styles.root, className)} {...rest}>
      <div className={styles.head}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        <Roll text={formatValue(shown)} className={styles.readout} />
        {detail && (
          <span id={detailId} className={styles.detail}>
            {detail}
          </span>
        )}
      </div>
      <div
        ref={sc.ref}
        className={styles.track}
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-describedby={detail ? detailId : undefined}
        aria-valuemin={min}
        aria-valuemax={top}
        aria-valuenow={value}
        aria-valuetext={formatValue(value)}
        data-moving={sc.moving || undefined}
        data-leaning={lean > 0 || undefined}
        {...sc.handlers}
      >
        <span className={styles.needle} aria-hidden />
        <div className={styles.clip} aria-hidden>
          {all.map((v, i) => {
            const d = (v - sc.at) / step
            if (Math.abs(d) > fit.span) return null
            const on = pull(d, 1)
            const near = pull(d, 5)
            const tilt = -Math.sign(d) * 14 * Math.sin(Math.PI * Math.min(1, Math.abs(d) / 6)) * (1 - on)
            const tier = labelled.has(v) ? 'major' : i % 2 === 0 ? 'mid' : 'minor'
            return (
              <span key={v} className={styles.mark} style={{ transform: `translateX(calc(${d.toFixed(3)} * var(--hl-ruler-tick-gap)))` }}>
                <i
                  className={styles.tick}
                  data-tier={tier}
                  style={{
                    background: ink(on, tier === 'major' ? 'var(--hl-color-fg-muted)' : 'var(--hl-color-border-strong)', 'var(--hl-color-accent)'),
                    transform: lean > 0 ? `rotate(${(tilt * lean).toFixed(2)}deg) scaleY(${(1 + near * 0.9 * lean).toFixed(3)})` : undefined,
                  }}
                />
                {tier === 'major' && (
                  <span className={styles.num} style={{ color: ink(pull(d, 2)) }}>
                    {markText(v)}
                  </span>
                )}
              </span>
            )
          })}
        </div>
        {strongLabel && (
          <div className={styles.tags} aria-hidden>
            {/* Measured once, so a tag near an end can stay whole inside the ruler. */}
            <span ref={tagRef} className={styles.tag} data-measure>
              {strongLabel}
            </span>
            {[...strongSet].map((v) => {
              const x = ((v - sc.at) / step) * fit.gap
              const room = (fit.width - fit.tag) / 2
              if (!fit.gap || Math.abs(x) > fit.width / 2) return null
              return (
                <span key={v} className={styles.tag} style={{ transform: `translateX(calc(${clamp(x, -room, room).toFixed(1)}px - 50%))` }}>
                  {strongLabel}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
