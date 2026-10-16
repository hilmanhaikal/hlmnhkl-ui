'use client'

import { useCallback, useId, useLayoutEffect, useRef, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { mergeRefs } from '../../internal/mergeRefs'
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
  const countRef = useRef<HTMLSpanElement>(null)

  const resize = useCallback(() => {
    const el = inner.current
    if (!el) return
    if (countRef.current) countRef.current.textContent = `${el.value.length} / ${maxLength}`
    if (!autoGrow) return
    const cs = getComputedStyle(el)
    const line = parseFloat(cs.lineHeight) || 24
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    const border = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
    const prev = el.style.height
    el.style.transition = 'none'
    el.style.height = 'auto'
    const min = line * minRows + pad + border
    const max = line * maxRows + pad + border
    const next = Math.min(Math.max(el.scrollHeight + border, min), max)
    // Restore the old height and force layout, so the transition runs
    el.style.height = prev || `${next}px`
    void el.offsetHeight
    el.style.transition = ''
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight + border > max ? 'auto' : 'hidden'
  }, [autoGrow, minRows, maxRows, maxLength])

  useLayoutEffect(resize, [resize, value])

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
      <FieldMessage helpId={helpId} errorId={errorId} help={help} error={error} />
    </div>
  )
}
