// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { clamp, pull, roundTo, wheelSteps } from '../../internal/feel'
import { arcTouch, CX, CY, DOT, dialScale, dialScrub, H, KNOB, polar, SWEEP, W, type Rim } from '../../internal/motion/dial'
import { Roll } from '../../internal/Roll'
import { useControllable } from '../../internal/useControllable'
import { ink, tokenNumber, useOnChange, useScrub } from '../../internal/useScrub'
import styles from './Dial.module.css'

export type DialProps = Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange' | 'children'> & {
  /** Visible name of the dial, also read by screen readers. */
  label: string
  /** The value, when you control it. */
  value?: number
  /** Starting value when you do not control it. Undefined starts at min. */
  defaultValue?: number
  /** Called once the dial comes to rest on a new value. */
  onValueChange?: (value: number) => void
  /** Called with the value under the index while the dial still turns. */
  onScrub?: (value: number) => void
  /** Lowest value. */
  min?: number
  /** Highest value. */
  max?: number
  /** Size of one step. Every step is a mark the dial is drawn onto. */
  step?: number
  /** Values with a printed label. Page Up and Page Down jump between them. Defaults to min and max. */
  marks?: number[]
  /** Values drawn stronger, such as the usual setting. */
  strong?: number[]
  /** "printed": the scale is printed on the knob and turns under a fixed index. "mercury": a solid knob with a few named levels. "arc": the rim of a large dial, swiped sideways. */
  variant?: 'printed' | 'mercury' | 'arc'
  /** Turns the value into the readout and what screen readers hear. */
  formatValue?: (value: number) => string
  /** Turns a mark into its printed label. Defaults to formatValue. */
  formatMark?: (value: number) => string
  /** A line under the readout, such as what the value means. */
  detail?: ReactNode
  /** A double click goes back to this value. */
  resetValue?: number
  /** A short buzz on each step while it turns, on phones that can (Android). */
  haptics?: boolean
}

export function Dial({
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
  variant = 'printed',
  formatValue = String,
  formatMark,
  detail,
  resetValue,
  haptics = false,
  className,
  ...rest
}: DialProps) {
  const labelId = useId()
  const detailId = useId()
  const goo = useId().replace(/:/g, '')
  const scale = { min, max, step, marks, variant }
  const { top, all, labelled, land, stepDeg } = dialScale(scale)
  const [raw, setValue] = useControllable(valueProp, defaultValue ?? min, onValueChange)
  const value = clamp(raw, min, top)
  const strongSet = new Set(strong.map((v) => roundTo(v, step, min)))
  const markText = formatMark ?? formatValue
  // The arc's rim: its radius and the length of one step along it, both tokens.
  const [rim, setRim] = useState<Rim | null>(null)
  const wheel = useRef(wheelSteps())

  // The drag, keys, tap and wheel (motion/dial.ts) on the shared scrubber.
  const sc = useScrub({ value, ...dialScrub(scale, rim, wheel.current), onSettle: setValue, haptics })

  useLayoutEffect(() => {
    if (variant !== 'arc') return
    const el = sc.ref.current
    setRim({ r: tokenNumber(el, '--gooee-dial-arc-radius'), gap: tokenNumber(el, '--gooee-dial-arc-gap') })
  }, [variant, sc.ref])

  // The arc takes only sideways touches, so the page still scrolls under a finger on it (motion/dial.ts).
  useEffect(() => {
    const el = sc.ref.current
    if (variant !== 'arc' || !el) return
    return arcTouch(el)
  }, [variant, sc.ref])

  const shown = land(sc.at)
  useOnChange(shown, onScrub)

  const index = all.indexOf(value)
  const slider = {
    ref: sc.ref,
    role: 'slider',
    tabIndex: 0,
    'aria-labelledby': labelId,
    'aria-describedby': detail ? detailId : undefined,
    'aria-valuemin': min,
    'aria-valuemax': top,
    'aria-valuenow': value,
    'aria-valuetext': variant === 'mercury' && index >= 0 ? `${formatValue(value)}, ${index + 1} of ${all.length}` : formatValue(value),
    'data-moving': sc.moving || undefined,
    onDoubleClick: resetValue === undefined ? undefined : () => sc.go(land(resetValue)),
    ...sc.handlers,
  }

  const head = (
    <div className={styles.head}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      <Roll text={formatValue(shown)} className={styles.readout} still={sc.moving} />
      {detail && (
        <span id={detailId} className={styles.detail}>
          {detail}
        </span>
      )}
    </div>
  )

  if (variant === 'mercury') {
    const angle = -135 + ((sc.at - min) / step) * stepDeg
    const [bx, by] = polar(angle, KNOB)
    return (
      <div className={cx(styles.root, styles.mercury, className)} {...rest}>
        {head}
        <div className={styles.mercuryHit} {...slider}>
          <svg viewBox={`0 0 ${W} ${H}`} className={styles.mercurySvg} aria-hidden>
            <defs>
              <filter id={goo} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
              </filter>
            </defs>
            {all.map((v, i) => {
              const a = -135 + i * stepDeg
              const [x, y] = polar(a, DOT)
              const [lx, ly] = polar(a, DOT + 22)
              const on = v === shown
              return (
                <g key={v}>
                  <circle cx={x} cy={y} r={3.5} className={styles.dot} data-on={on || undefined} />
                  <text x={lx} y={ly} textAnchor={Math.abs(a) < 1 ? 'middle' : a < 0 ? 'end' : 'start'} dominantBaseline="middle" className={styles.level} data-on={on || undefined}>
                    {markText(v)}
                  </text>
                </g>
              )
            })}
            <g filter={`url(#${goo})`} className={styles.metal}>
              <circle cx={CX} cy={CY} r={KNOB} />
              <circle cx={bx} cy={by} r={10} />
              {all.map((v, i) => {
                const p = pull(sc.at - v, step)
                const [x, y] = polar(-135 + i * stepDeg, DOT - 12 * p)
                return <circle key={v} cx={x} cy={y} r={p * 9} />
              })}
            </g>
            <circle cx={CX} cy={CY} r={KNOB - 14} className={styles.groove} />
          </svg>
        </div>
      </div>
    )
  }

  if (variant === 'arc') {
    const degPerStep = rim && rim.r ? (rim.gap / rim.r) * (180 / Math.PI) : 0
    return (
      <div className={cx(styles.root, styles.arc, className)} {...rest}>
        {head}
        <div className={styles.arcStage} {...slider}>
          <span className={styles.arcIndex} aria-hidden />
          <div className={styles.arcClip} aria-hidden>
            <div className={styles.hub}>
              <span className={styles.disc} />
              {degPerStep > 0 &&
                all.map((v, i) => {
                  const a = ((v - sc.at) / step) * degPerStep
                  if (Math.abs(a) > 22) return null
                  const p = pull(sc.at - v, step * 1.2)
                  const tier = labelled.includes(v) ? 'major' : i % 2 === 0 ? 'mid' : 'minor'
                  return (
                    <span key={v} className={styles.arcMark} style={{ transform: `rotate(${a}deg) translateY(calc(var(--gooee-dial-arc-radius) * -1))` }}>
                      <i className={styles.arcTick} data-tier={tier} style={{ background: ink(p, 'var(--gooee-color-border-strong)', 'var(--gooee-color-accent)'), transform: `scaleY(${1 + p * 0.7})` }} />
                      {tier === 'major' && (
                        <span className={styles.arcNum} style={{ color: ink(p), transform: `translateX(-50%) scale(${1 + p * 0.3})` }}>
                          {markText(v)}
                        </span>
                      )}
                      {strongSet.has(v) && <span className={styles.arcStrong} />}
                    </span>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const turned = ((sc.at - min) / (max - min || 1)) * SWEEP
  // The face prints min, the middle and max unless marks say otherwise; the keys still jump by marks.
  const printed = marks ? labelled : [...new Set([min, roundTo((min + max) / 2, step, min), top])]
  // A longer tick every ten steps on a long scale, so the amount can be counted at a glance.
  const tenth = all.length > 20 ? step * 10 : 0
  const isMajor = (v: number) => printed.includes(v) || (tenth > 0 && Math.abs((v - min) / tenth - Math.round((v - min) / tenth)) < 1e-6)
  // Every step gets a tick while they fit round the knob (thinner past 49); past that only the long ones.
  const dense = all.length > 49
  const ticks = all.length <= 121 ? all : all.filter((v) => isMajor(v) || strongSet.has(v))
  return (
    <div className={cx(styles.root, styles.printed, className)} {...rest}>
      {head}
      <div className={styles.bezel}>
        <span className={styles.index} aria-hidden />
        {/* How much: the ring fills from min (where the face has turned it) up to the index. */}
        <svg className={styles.fill} aria-hidden>
          {/* A negative dash length is invalid and draws the whole ring, so the arc is clamped and left out at min. */}
          {turned > 0.5 && <circle pathLength={360} strokeDasharray={`${Math.min(turned, 360)} 360`} />}
        </svg>
        <div className={styles.knob} {...slider}>
          <div className={styles.face} style={{ transform: `rotate(${turned}deg)` }} aria-hidden>
            {ticks.map((v) => {
              const at = (-(v - min) / (max - min || 1)) * SWEEP
              const p = pull(sc.at - v, step)
              const major = isMajor(v)
              return (
                <span key={v} className={styles.spoke} style={{ transform: `rotate(${at}deg)` }}>
                  <i className={styles.tick} data-major={major || undefined} data-fine={(dense && !major) || undefined} data-strong={strongSet.has(v) || undefined} data-current={v === shown || undefined} style={{ background: ink(p, 'var(--gooee-color-border-strong)', 'var(--gooee-color-accent)'), transform: `scaleY(${1 + p * 0.5})` }} />
                  {printed.includes(v) && (
                    <span className={styles.numAt} style={{ transform: `translateY(var(--num-r)) rotate(${-(at + turned)}deg)` }}>
                      <span className={styles.num} style={{ color: ink(p), transform: `translate(-50%, -50%) scale(${1 + p * 0.45})`, fontWeight: `calc(var(--gooee-weight-medium) + (var(--gooee-weight-semibold) - var(--gooee-weight-medium)) * ${p.toFixed(3)})` }}>
                        {markText(v)}
                      </span>
                    </span>
                  )}
                </span>
              )
            })}
            <span className={styles.cap} />
          </div>
          {/* The grip: an indent on the cap that points at the value under the index, so it reads as a knob to turn. */}
          <span className={styles.grip} aria-hidden />
        </div>
      </div>
    </div>
  )
}
