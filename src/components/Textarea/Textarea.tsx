'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { useEdgeFlow } from '../../internal/liquidMore'
import { mergeRefs } from '../../internal/mergeRefs'
import { growTextarea } from '../../internal/motion/textarea'
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

  // A native form reset changes the value without an onChange
  useEffect(() => {
    const form = inner.current?.form
    if (!form) return
    let frame = 0
    const onReset = () => {
      frame = requestAnimationFrame(resize)
    }
    form.addEventListener('reset', onReset)
    return () => {
      form.removeEventListener('reset', onReset)
      cancelAnimationFrame(frame)
    }
  }, [resize])

  const describedBy = [help && !error ? helpId : null, error ? errorId : null, showCount && maxLength ? countId : null, describedByProp]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cx(styles.root, className)}>
      <div className={styles.labelRow}>
        <label htmlFor={fieldId} className={styles.label}>{label}</label>
        {showCount && maxLength !== undefined && (
          <span id={countId} ref={countRef} className={styles.count} aria-live="off" />
        )}
      </div>
      <div ref={boxRef} className={styles.box}>
        <textarea
          id={fieldId}
          ref={mergeRefs(inner, ref)}
          rows={minRows}
          className={styles.textarea}
          data-invalid={error ? true : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          onChange={(e) => {
            resize()
            onChange?.(e)
          }}
          {...rest}
        />
      </div>
      <FieldMessage helpId={helpId} errorId={errorId} help={help} error={error} />
    </div>
  )
}
