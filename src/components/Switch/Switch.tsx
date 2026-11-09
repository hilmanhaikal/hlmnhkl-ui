'use client'

import { useId, useLayoutEffect, useRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { body, BEND, dropScene, loopsPath, pincher, trace, type Blob } from '../../internal/liquidPath'
import { frames, layer, morphEase, motionFor, shadowOf } from '../../internal/liquidMatter'
import { useControllable } from '../../internal/useControllable'
import styles from './Switch.module.css'

export type SwitchProps = Omit<ComponentPropsWithRef<'button'>, 'onChange' | 'value'> & {
  /** Visible text next to the switch, also its accessible name. */
  label: ReactNode
  /** Extra text under the label, also read by screen readers. */
  description?: ReactNode
  /** Whether the switch is on, when you control it. */
  checked?: boolean
  /** Starting state when you do not control it. */
  defaultChecked?: boolean
  /** Called when the switch is toggled, with the new on or off state. */
  onCheckedChange?: (checked: boolean) => void
  /** Puts the label before the switch, like a settings row. */
  labelPosition?: 'start' | 'end'
  /** Form field name. The form gets "on" while the switch is on, and nothing while it is off. */
  name?: string
}

export function Switch({
  label,
  description,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  labelPosition = 'end',
  id,
  className,
  disabled,
  onClick,
  name,
  'aria-describedby': describedByProp,
  ...rest
}: SwitchProps) {
  const auto = useId()
  const switchId = id ?? auto
  const [checked, setChecked] = useControllable(checkedProp, defaultChecked, onCheckedChange)
  const describedBy = [description && `${switchId}-desc`, describedByProp].filter(Boolean).join(' ')
  // The thumb pinches off a drop that runs to the far end, then flows after it and swallows it. While
  // it moves the thumb hides and an SVG draws both; at rest the thumb is back, exact.
  const thumbRef = useRef<HTMLSpanElement>(null)
  const was = useRef(checked)
  const run = useRef<{ thumb: Blob; drop: Blob; stop: () => void; svg: SVGSVGElement; pin: ReturnType<typeof pincher> } | null>(null)
  const end = () => {
    const r = run.current
    if (!r) return
    r.stop()
    r.svg.remove()
    run.current = null
    delete thumbRef.current?.dataset.flowing
  }
  useLayoutEffect(() => {
    const thumb = thumbRef.current
    const track = thumb?.parentElement
    if (was.current === checked || !thumb || !track) return
    was.current = checked
    const ms = motionFor('slow')
    if (!ms) {
      end()
      return
    }
    const R = thumb.offsetWidth / 2
    const off = thumb.offsetLeft + R
    const to = checked ? track.clientWidth - off : off
    const cy = thumb.offsetTop + R
    const e = morphEase()
    let r = run.current
    const from = r ? { thumb: r.thumb, drop: r.drop } : { thumb: { x: track.clientWidth - to, r: R }, drop: { x: track.clientWidth - to, r: Math.max(BEND + 0.5, R * 0.6) } }
    if (r) r.stop()
    else {
      const { svg } = layer(track, styles.liquid, null)
      r = { ...from, stop: () => {}, svg, pin: pincher(e, motionFor('fast')) }
      run.current = r
      thumb.dataset.flowing = ''
    }
    const live = r
    const path = live.svg.firstElementChild as SVGPathElement
    live.svg.style.filter = shadowOf(thumb).filter
    live.stop = frames(
      ms,
      (u, now) => {
        const s = dropScene(e, u, from.thumb, from.drop, to, R)
        live.thumb = s.thumb
        live.drop = s.drop
        const circle = (b: Blob) => body({ cx: b.x, cy, hw: b.r, hh: b.r, r: b.r })
        const p = live.pin(circle(s.thumb), circle(s.drop), now)
        // The thumb's colour changes as it goes, so the drawing follows the hidden thumb's.
        path.style.fill = getComputedStyle(thumb).backgroundColor
        path.setAttribute('d', loopsPath(trace(p.sdf, [[s.thumb.x, cy, 0, -1], [s.drop.x, cy, 0, -1]])))
      },
      end,
    )
  }, [checked])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => () => end(), [])
  return (
    <div className={cx(styles.root, labelPosition === 'start' && styles.start, className)} data-disabled={disabled || undefined}>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={describedBy || undefined}
        className={styles.track}
        data-on={checked || undefined}
        disabled={disabled}
        onClick={(e) => {
          setChecked(!checked)
          onClick?.(e)
        }}
        {...rest}
      >
        <span ref={thumbRef} className={styles.thumb} aria-hidden="true" />
      </button>
      <span className={styles.text}>
        <label htmlFor={switchId} className={styles.label}>{label}</label>
        {description && <span id={`${switchId}-desc`} className={styles.description}>{description}</span>}
      </span>
      {/* Submits like a checkbox: "on" when on, nothing when off */}
      {name && checked && <input type="hidden" name={name} value="on" />}
    </div>
  )
}
