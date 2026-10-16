'use client'

import { useState } from 'react'
import { cx } from '../../internal/cx'
import { Input, type InputProps } from '../Input'
import styles from './PasswordInput.module.css'

export type PasswordInputProps = Omit<InputProps, 'type' | 'trailing'> & {
  /** Start with the password shown. */
  defaultVisible?: boolean
  /** Whether the password shows as plain text, when you control it. */
  visible?: boolean
  /** Called when the show button is pressed, with the new visible state. */
  onVisibleChange?: (visible: boolean) => void
  /** Name of the toggle. It stays the same; aria-pressed says whether it is on. */
  toggleLabel?: string
}

export function PasswordInput({
  defaultVisible = false,
  visible: visibleProp,
  onVisibleChange,
  toggleLabel = 'Show password',
  autoComplete = 'current-password',
  disabled,
  className,
  ...rest
}: PasswordInputProps) {
  const [inner, setInner] = useState(defaultVisible)
  const visible = visibleProp ?? inner
  const toggle = () => {
    if (visibleProp === undefined) setInner(!visible)
    onVisibleChange?.(!visible)
  }

  return (
    <Input
      {...rest}
      className={cx(styles.root, className)}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      spellCheck={false}
      autoCapitalize="off"
      disabled={disabled}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          aria-label={toggleLabel}
          aria-pressed={visible}
          disabled={disabled}
          onClick={toggle}
        >
          <svg viewBox="0 0 24 24" className={styles.eye} data-open={visible || undefined} aria-hidden="true" focusable="false">
            <path className={styles.lid} d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
            <circle className={styles.pupil} cx="12" cy="12" r="2.75" />
            <path className={styles.slash} d="M4 4l16 16" pathLength={1} />
          </svg>
        </button>
      }
    />
  )
}
