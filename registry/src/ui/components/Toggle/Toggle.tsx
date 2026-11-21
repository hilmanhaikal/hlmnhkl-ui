// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useRef, useState, type ComponentPropsWithRef, type MouseEvent, type ReactNode, type Ref } from 'react'
import { cx } from '../../internal/cx'
import { mergeRefs } from '../../internal/mergeRefs'
import { useControllable } from '../../internal/useControllable'
import { setNativeValue, useField, useMirror } from '../../internal/useField'
import styles from './Toggle.module.css'

export type ToggleProps = Omit<ComponentPropsWithRef<'button'>, 'value' | 'defaultValue'> & {
  /** Pressed state, when you control it. */
  pressed?: boolean
  /** Starting pressed state when you do not control it. */
  defaultPressed?: boolean
  /** Called when the button is pressed or let go, with the new state. */
  onPressedChange?: (pressed: boolean) => void
  /** Icon before the label. Without a label the button is round and needs an aria-label. */
  icon?: ReactNode
  /** Height and text size, the same as Button. */
  size?: 'sm' | 'md' | 'lg'
  /** Form field name. A hidden checkbox next to the button sends the value while it is pressed, and nothing while it is not. */
  name?: string
  /** Value sent with the form while pressed. Default "on", like a checkbox. */
  value?: string
  /** The form cannot be sent while the toggle is not pressed. */
  required?: boolean
  /** Keeps the toggle as it is and still sends it with the form. Shown with data-readonly. */
  readOnly?: boolean
  /** Reaches the hidden checkbox that holds the value. With react-hook-form, pass register's ref here (ref stays on the button). */
  inputRef?: Ref<HTMLInputElement>
}

export function Toggle({
  pressed: pressedProp,
  defaultPressed = false,
  onPressedChange,
  icon,
  size = 'md',
  className,
  children,
  type = 'button',
  onClick,
  name,
  value,
  required,
  readOnly,
  inputRef,
  ref,
  ...rest
}: ToggleProps) {
  const [pressed, setPressed] = useControllable(pressedProp, defaultPressed, onPressedChange)
  const button = useRef<HTMLButtonElement>(null)
  // With a name, the hidden checkbox holds the value for the form; a form reset goes back to the first state.
  const input = useRef<HTMLInputElement>(null)
  const [firstPressed] = useState(pressed)
  useMirror(input, pressed, pressedProp === undefined ? defaultPressed : firstPressed)
  const field = useField({ input, name, onSync: () => input.current && input.current.checked !== pressed && setPressed(input.current.checked) })
  const toggle = (
    <button
      {...rest}
      ref={mergeRefs(button, ref)}
      type={type}
      aria-pressed={pressed}
      aria-invalid={field.error ? true : undefined}
      aria-readonly={readOnly || undefined}
      className={cx(styles.root, styles[size], !children && styles.iconOnly, className)}
      data-slot="toggle"
      data-state={pressed ? 'on' : 'off'}
      data-readonly={readOnly || undefined}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)
        if (e.defaultPrevented || readOnly) return
        if (input.current) setNativeValue(input.current, !pressed)
        setPressed(!pressed)
        field.changed()
      }}
    >
      {icon && <span className={styles.icon} data-slot="toggle-icon">{icon}</span>}
      {children}
    </button>
  )
  if (!name) return toggle
  return (
    <>
      {toggle}
      {/* Submits like a checkbox: the value while pressed, nothing while not. Focus moves on to the button. */}
      <input
        ref={mergeRefs(input, inputRef)}
        type="checkbox"
        name={name}
        value={value}
        required={required}
        disabled={rest.disabled}
        tabIndex={-1}
        aria-hidden="true"
        className={styles.input}
        data-slot="toggle-input"
        onFocus={() => button.current?.focus()}
      />
    </>
  )
}
