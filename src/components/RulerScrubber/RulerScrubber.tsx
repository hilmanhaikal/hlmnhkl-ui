'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { clamp, follow, pull, roundTo, wheelSteps } from '../../internal/feel'
import { morphCurve, motionMs } from '../../internal/motion'
import { measureRuler, rulerScale, rulerScrub, type RulerFit } from '../../internal/motion/ruler'
import { Roll } from '../../internal/Roll'
import { useControllable } from '../../internal/useControllable'
import { ink, useScrub } from '../../internal/useScrub'
import styles from './RulerScrubber.module.css'

export type RulerScrubberProps = Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange' | 'children'> & {
  /** Visible name of the ruler, also read by screen readers. */
  label: string
  /** The value, when you control it. */
  value?: number
  /** Starting value when you do not control it. Undefined starts at min. */
  defaultValue?: number
  /** Called with each new value under the needle, while the ruler still moves. */
  onValueChange?: (value: number) => void
  /** Called once the ruler comes to rest on a new value. */
  onValueCommit?: (value: number) => void
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
  onValueCommit,
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
  const scale = { min, max, step, marks }
  const { top, all, labelled, land } = rulerScale(scale)
  const [raw, setValue] = useControllable(valueProp, defaultValue ?? min, onValueChange)
  const value = clamp(raw, min, top)
  const strongSet = new Set(strong.map((v) => roundTo(v, step, min)))
  const markText = formatMark ?? formatValue
  // The px between two ticks (a token) and how many ticks fit either side of the needle.
  const [fit, setFit] = useState<RulerFit>({ gap: 0, span: 24, width: 0, tag: 0 })
  const tagRef = useRef<HTMLSpanElement>(null)
  const wheel = useRef(wheelSteps())

  // The drag, keys, tap and wheel (motion/ruler.ts) on the shared scrubber.
  const sc = useScrub({ value, ...rulerScrub(scale, fit, wheel.current), onMark: setValue, onSettle: (v) => onValueCommit?.(v), haptics })

  useLayoutEffect(() => {
    const el = sc.ref.current
    if (!el) return
    const measure = () => setFit(measureRuler(el, tagRef.current))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [sc.ref, strongLabel])

  // The ticks lean and grow only while the ruler moves. The lean eases in as it starts and settles flat as it stops.
  const [lean, setLean] = useState(0)
  const leaning = useRef<ReturnType<typeof follow> | null>(null)
  if (!leaning.current) leaning.current = follow({ time: () => motionMs('morph-out'), curve: morphCurve(), onFrame: setLean })
  useEffect(() => {
    leaning.current?.set(sc.moving && motionMs('morph-out') > 0 ? 1 : 0)
  }, [sc.moving])
  useEffect(() => () => leaning.current?.stop(), [])

  const shown = land(sc.at)

  return (
    <div className={cx(styles.root, className)} data-slot="ruler-scrubber" {...rest}>
      <div className={styles.head}>
        <span id={labelId} className={styles.label} data-slot="field-label">
          {label}
        </span>
        <Roll text={formatValue(shown)} className={styles.readout} />
        {detail && (
          <span id={detailId} className={styles.detail} data-slot="ruler-scrubber-detail">
            {detail}
          </span>
        )}
      </div>
      <div
        ref={sc.ref}
        className={styles.track}
        data-slot="ruler-scrubber-track"
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
        <span className={styles.needle} data-slot="ruler-scrubber-needle" aria-hidden />
        <div className={styles.clip} aria-hidden>
          {all.map((v, i) => {
            const d = (v - sc.at) / step
            if (Math.abs(d) > fit.span) return null
            const on = pull(d, 1)
            const near = pull(d, 5)
            const tilt = -Math.sign(d) * 14 * Math.sin(Math.PI * Math.min(1, Math.abs(d) / 6)) * (1 - on)
            const tier = labelled.has(v) ? 'major' : i % 2 === 0 ? 'mid' : 'minor'
            return (
              <span key={v} className={styles.mark} style={{ transform: `translateX(calc(${d.toFixed(3)} * var(--gooee-ruler-scrubber-tick-gap)))` }}>
                <i
                  className={styles.tick}
                  data-slot="ruler-scrubber-tick"
                  data-tier={tier}
                  style={{
                    background: ink(on, tier === 'major' ? 'var(--gooee-color-fg-muted)' : 'var(--gooee-color-border-strong)', 'var(--gooee-color-accent)'),
                    transform: lean > 0 ? `rotate(${(tilt * lean).toFixed(2)}deg) scaleY(${(1 + near * 0.9 * lean).toFixed(3)})` : undefined,
                  }}
                />
                {tier === 'major' && (
                  <span className={styles.num} data-slot="ruler-scrubber-number" style={{ color: ink(pull(d, 2)) }}>
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
            <span ref={tagRef} className={styles.tag} data-slot="ruler-scrubber-tag" data-measure>
              {strongLabel}
            </span>
            {[...strongSet].map((v) => {
              const x = ((v - sc.at) / step) * fit.gap
              const room = (fit.width - fit.tag) / 2
              if (!fit.gap || Math.abs(x) > fit.width / 2) return null
              return (
                <span key={v} className={styles.tag} data-slot="ruler-scrubber-tag" style={{ transform: `translateX(calc(${clamp(x, -room, room).toFixed(1)}px - 50%))` }}>
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
