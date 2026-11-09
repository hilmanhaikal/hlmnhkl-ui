'use client'

import { useId, useLayoutEffect, useRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { frames, morphEase, motionFor } from '../../internal/liquidMatter'
import { useControllable } from '../../internal/useControllable'
import styles from './Switch.module.css'

// The front edge moves over this share of the time; the back edge starts the rest of the way in.
const LEAD = 0.75
// The longest the thumb gets, as a share of its round size.
const STRETCH = 1.4

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
  // The thumb stretches: its front edge leaves first and the back edge catches up, so it stays one
  // shape. The on fill's edge rides on the thumb's edge, so the colour never sits apart from it.
  const thumbRef = useRef<HTMLSpanElement>(null)
  const was = useRef(checked)
  const run = useRef<{ a: number; b: number; stop: () => void } | null>(null)
  const end = () => {
    const thumb = thumbRef.current
    run.current?.stop()
    run.current = null
    if (!thumb) return
    thumb.style.removeProperty('transform')
    thumb.style.removeProperty('width')
    const track = thumb.parentElement
    if (track) {
      delete track.dataset.moving
      track.style.removeProperty('--fill')
    }
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
    const s = getComputedStyle(track)
    const line = parseFloat(s.borderLeftWidth) || 0
    const pad = parseFloat(s.getPropertyValue('--pad')) || 0
    const size = thumb.offsetHeight
    const rest = thumb.offsetLeft
    const offX = rest
    const onX = track.clientWidth - rest - size
    const to = checked ? onX : offX
    const from = run.current ? { a: run.current.a, b: run.current.b } : { a: checked ? offX : onX, b: (checked ? offX : onX) + size }
    run.current?.stop()
    const ahead = to + size / 2 >= (from.a + from.b) / 2
    const e = morphEase()
    const outer = track.offsetWidth
    const live = { ...from, stop: () => {} }
    run.current = live
    track.dataset.moving = ''
    live.stop = frames(
      ms,
      (u) => {
        const lead = e(Math.min(1, u / LEAD))
        const trail = e(Math.max(0, (u - 1 + LEAD) / LEAD))
        live.a = from.a + (to - from.a) * (ahead ? trail : lead)
        live.b = from.b + (to + size - from.b) * (ahead ? lead : trail)
        // A short pill at most, so the fill behind it stays in view.
        const long = live.b - live.a - size * STRETCH
        if (long > 0) {
          if (ahead) live.a += long
          else live.b -= long
        }
        thumb.style.transform = `translateX(${live.a - rest}px)`
        thumb.style.width = `${live.b - live.a}px`
        // How far on the thumb is, 0 to 1: the fill opens out to the track's edge as it goes.
        const p = Math.min(1, Math.max(0, ((live.a + live.b) / 2 - offX - size / 2) / (onX - offX)))
        const side = (pad + line) * (1 - p)
        const right = outer - live.b - line + line * (1 - p) - pad * p
        track.style.setProperty('--fill', `inset(${side}px ${Math.max(0, right)}px ${side}px ${side}px round var(--hl-radius-full))`)
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
