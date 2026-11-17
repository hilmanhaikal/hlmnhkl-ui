'use client'

import { useId, useLayoutEffect, useRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { createSwitchThumb } from '../../internal/motion/switchThumb'
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
  // The thumb's stretch (motion/switchThumb.ts).
  const thumbRef = useRef<HTMLSpanElement>(null)
  const thumb = useRef<ReturnType<typeof createSwitchThumb>>(null)
  thumb.current ??= createSwitchThumb(() => thumbRef.current, checked)
  useLayoutEffect(() => thumb.current!.set(checked), [checked])
  useLayoutEffect(() => () => thumb.current!.destroy(), [])
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
