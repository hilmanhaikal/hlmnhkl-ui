'use client'

import { useRef, useState, type FocusEvent } from 'react'
import { cx } from '../../internal/cx'
import { leavesField } from '../../internal/formCore'
import { mergeRefs } from '../../internal/mergeRefs'
import { retarget } from '../../internal/useField'
import { Input, type InputLabels, type InputProps } from '../Input'
import styles from './PasswordInput.module.css'

export type PasswordInputLabels = InputLabels & {
  /** Name of the toggle. It stays the same; aria-pressed says whether it is on. */
  toggle: string
}

export type PasswordInputProps = Omit<InputProps, 'type' | 'trailing' | 'labels'> & {
  /** Start with the password shown. */
  defaultVisible?: boolean
  /** Whether the password shows as plain text, when you control it. */
  visible?: boolean
  /** Called when the show button is pressed, with the new visible state. */
  onVisibleChange?: (visible: boolean) => void
  /** Text for the label and the toggle, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<PasswordInputLabels>
}

export function PasswordInput({
  defaultVisible = false,
  visible: visibleProp,
  onVisibleChange,
  labels,
  autoComplete = 'current-password',
  disabled,
  className,
  ref,
  onBlur,
  ...rest
}: PasswordInputProps) {
  const input = useRef<HTMLInputElement>(null)
  // onBlur fires when focus leaves the field, not when it moves between the text and the toggle.
  const leave = (e: FocusEvent<HTMLElement>) => {
    if (leavesField(e.nativeEvent, input.current?.closest('[data-slot="input-field"]') ?? null)) onBlur?.(retarget(e, input.current) as FocusEvent<HTMLInputElement>)
  }
  const [inner, setInner] = useState(defaultVisible)
  const visible = visibleProp ?? inner
  const toggle = () => {
    if (visibleProp === undefined) setInner(!visible)
    onVisibleChange?.(!visible)
  }

  return (
    <Input
      {...rest}
      ref={mergeRefs(input, ref)}
      onBlur={leave}
      labels={labels}
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
          data-slot="password-input-toggle"
          data-state={visible ? 'on' : 'off'}
          aria-label={labels?.toggle ?? 'Show password'}
          aria-pressed={visible}
          disabled={disabled}
          onClick={toggle}
          onBlur={leave}
        >
          <svg viewBox="0 0 24 24" className={styles.eye} aria-hidden="true" focusable="false">
            <path className={styles.lid} d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
            <circle className={styles.pupil} cx="12" cy="12" r="2.75" />
            <path className={styles.slash} d="M4 4l16 16" pathLength={1} />
          </svg>
        </button>
      }
    />
  )
}
