'use client'

import { useId, useRef, type ComponentPropsWithRef, type PointerEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { mergeRefs } from '../../internal/mergeRefs'
import styles from './InputGroup.module.css'

export type InputGroupProps = Omit<ComponentPropsWithRef<'input'>, 'size' | 'prefix'> & {
  /** Always required. A placeholder is only an example, never the label. */
  label: string
  /** Hides the label visually but keeps it as the field's name, for a field whose purpose is plain from what is around it. */
  hideLabel?: boolean
  /** Joined before the field: text or an icon in a shaded cell, or a Button, IconButton or CopyButton. */
  prefix?: ReactNode
  /** Joined after the field, the same way as prefix. */
  suffix?: ReactNode
  /** Hint under the field. Hidden while there is an error. */
  help?: ReactNode
  /** Error message under the field. Marks the group invalid. */
  error?: ReactNode
  /** Height of the group, matching Input. */
  size?: 'sm' | 'md' | 'lg'
}

export function InputGroup({
  label,
  hideLabel,
  prefix,
  suffix,
  help,
  error,
  size = 'md',
  id,
  className,
  disabled,
  ref,
  'aria-describedby': describedByProp,
  ...rest
}: InputGroupProps) {
  const auto = useId()
  const inputId = id ?? auto
  const inner = useRef<HTMLInputElement>(null)
  const helpId = `${inputId}-help`
  const errorId = `${inputId}-error`
  // Text beside the field, such as a unit or "https://", is read as part of its description.
  const text = (node: ReactNode) => typeof node === 'string' || typeof node === 'number'
  const describedBy = [
    text(prefix) ? `${inputId}-prefix` : null,
    text(suffix) ? `${inputId}-suffix` : null,
    help && !error ? helpId : null,
    error ? errorId : null,
    describedByProp,
  ]
    .filter(Boolean)
    .join(' ')

  // A press on a shaded cell puts the caret in the field, as it would on the field itself.
  const focusField = (e: PointerEvent) => {
    if (e.target instanceof Element && e.target.closest('button, a, input, select, textarea')) return
    e.preventDefault()
    inner.current?.focus()
  }

  const addon = (node: ReactNode, side: 'prefix' | 'suffix') => (
    <span id={text(node) ? `${inputId}-${side}` : undefined} className={styles.addon} data-side={side} onPointerDown={focusField}>
      {node}
    </span>
  )

  return (
    <div className={cx(styles.root, className)}>
      <label htmlFor={inputId} className={cx(styles.label, hideLabel && styles.srOnly)}>{label}</label>
      <div className={cx(styles.group, styles[size])} data-invalid={error ? true : undefined} data-disabled={disabled || undefined}>
        {prefix !== undefined && prefix !== null && addon(prefix, 'prefix')}
        <input
          {...rest}
          id={inputId}
          ref={mergeRefs(inner, ref)}
          className={styles.input}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
        />
        {suffix !== undefined && suffix !== null && addon(suffix, 'suffix')}
      </div>
      <FieldMessage helpId={helpId} errorId={errorId} help={help} error={error} />
    </div>
  )
}
