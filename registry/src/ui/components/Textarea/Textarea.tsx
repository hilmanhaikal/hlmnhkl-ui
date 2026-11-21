// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useCallback, useId, useLayoutEffect, useRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { useEdgeFlow } from '../../internal/liquidMore'
import { mergeRefs } from '../../internal/mergeRefs'
import { growTextarea } from '../../internal/motion/textarea'
import { useField } from '../../internal/useField'
import styles from './Textarea.module.css'

export type TextareaProps = ComponentPropsWithRef<'textarea'> & {
  /** Visible name of the field, also read by screen readers. */
  label: string
  /** Hint under the field. Hidden while an error shows. */
  help?: ReactNode
  /** Error message under the field. Also marks the field invalid. */
  error?: ReactNode
  /** Grows with the text. Default true. */
  autoGrow?: boolean
  /** Height in lines when empty. */
  minRows?: number
  /** Most lines it grows to before it scrolls. Only used with autoGrow. */
  maxRows?: number
  /** Shows a live "n / max" count when maxLength is set. */
  showCount?: boolean
}

export function Textarea({
  label,
  help,
  error,
  autoGrow = true,
  minRows = 3,
  maxRows = 10,
  showCount,
  id,
  className,
  ref,
  onChange,
  onBlur,
  value,
  defaultValue,
  maxLength,
  'aria-describedby': describedByProp,
  ...rest
}: TextareaProps) {
  const auto = useId()
  const fieldId = id ?? auto
  const helpId = `${fieldId}-help`
  const errorId = `${fieldId}-error`
  const countId = `${fieldId}-count`
  const inner = useRef<HTMLTextAreaElement>(null)
  // Focus draws the dark edge round the field from where it was pressed, or from its start edge for a key.
  const boxRef = useRef<HTMLDivElement>(null)
  useEdgeFlow(inner, boxRef, ':focus', styles.edge)
  const countRef = useRef<HTMLSpanElement>(null)

  const resize = useCallback(() => growTextarea(inner.current, countRef.current, { autoGrow, minRows, maxRows, maxLength }), [autoGrow, minRows, maxRows, maxLength])

  useLayoutEffect(resize, [resize, value])

  // Values written by code (a form library's setValue or reset) and a form reset fire no onChange, so grow to fit them.
  const field = useField({ input: inner, name: rest.name, error, onSync: resize })
  const shownError = field.error

  const describedBy = [help && !shownError ? helpId : null, shownError ? errorId : null, showCount && maxLength ? countId : null, describedByProp]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cx(styles.root, className)} data-slot="textarea">
      <div className={styles.labelRow}>
        <label htmlFor={fieldId} className={styles.label} data-slot="field-label">{label}</label>
        {showCount && maxLength !== undefined && (
          <span id={countId} ref={countRef} className={styles.count} data-slot="textarea-count" aria-live="off" />
        )}
      </div>
      <div ref={boxRef} className={styles.box}>
        <textarea
          id={fieldId}
          ref={mergeRefs(inner, ref)}
          rows={minRows}
          className={styles.textarea}
          data-slot="textarea-input"
          data-invalid={shownError ? true : undefined}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={describedBy || undefined}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          onChange={(e) => {
            resize()
            field.changed()
            onChange?.(e)
          }}
          onBlur={(e) => {
            field.blurred()
            onBlur?.(e)
          }}
          {...rest}
        />
      </div>
      <FieldMessage helpId={helpId} errorId={errorId} help={help} error={shownError} />
    </div>
  )
}
