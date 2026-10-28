'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { CheckIcon, ChevronDownIcon } from '../../internal/icons'
import { useDismiss } from '../../internal/layers'
import { Portal } from '../../internal/Portal'
import { useControllable } from '../../internal/useControllable'
import { useFloating } from '../../internal/useFloating'
import { usePresence } from '../../internal/usePresence'
import { FieldMessage } from '../../internal/FieldMessage'
import styles from './Select.module.css'

export type SelectOption = { value: string; label: string; disabled?: boolean; hint?: string }

export type SelectProps = {
  /** Visible name of the field, also read by screen readers. */
  label: string
  /** Keeps the label for screen readers only, for a list where a column heading already names the field. */
  hideLabel?: boolean
  /** Choices in the list, in order. */
  options: SelectOption[]
  /** Selected value, when you control it. Null means nothing is chosen. */
  value?: string | null
  /** Starting value when you do not control it. */
  defaultValue?: string | null
  /** Called when the selected value changes, with the new value. */
  onValueChange?: (value: string) => void
  /** Shown when nothing is chosen yet. */
  placeholder?: string
  /** Hint under the field. Hidden while an error shows. */
  help?: ReactNode
  /** Error message under the field. Also marks the field invalid. */
  error?: ReactNode
  /** Stops the list from opening. */
  disabled?: boolean
  /** Submits the selected value in a hidden field with this name. */
  name?: string
  /** Id of the button, so a `<label htmlFor>` can point at it. Inner ids add a suffix to it. */
  id?: string
  /** Extra class for the root element. */
  className?: string
}

export function Select({
  label,
  hideLabel = false,
  options,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  placeholder = 'Choose one',
  help,
  error,
  disabled,
  name,
  id,
  className,
}: SelectProps) {
  const auto = useId()
  const baseId = id ?? auto
  const labelId = `${baseId}-label`
  const listId = `${baseId}-list`
  const helpId = `${baseId}-help`
  const errorId = `${baseId}-error`
  const triggerId = id ?? `${auto}-trigger`
  const [value, setValue] = useControllable<string | null>(valueProp, defaultValue, (v) => v !== null && onValueChange?.(v))
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLDivElement | null>>([])
  const typeahead = useRef({ text: '', at: 0 })
  const { mounted, state } = usePresence(open, 'fast')
  const { style, side } = useFloating(triggerRef, listRef, { open: mounted, side: 'bottom', align: 'start', offset: 6, matchWidth: true })
  const [hl, setHl] = useState<{ top: number; height: number } | null>(null)

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  const enabled = (i: number) => i >= 0 && i < options.length && !options[i].disabled
  const step = (from: number, dir: 1 | -1) => {
    let i = from
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length
      if (enabled(i)) return i
    }
    return from
  }
  const first = () => step(-1, 1)
  const last = () => step(options.length, -1)

  const openList = (at?: number) => {
    if (disabled) return
    setOpen(true)
    setActive(at ?? (enabled(selectedIndex) ? selectedIndex : first()))
  }
  const close = (focusTrigger = true) => {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }
  const choose = (i: number) => {
    if (!enabled(i)) return
    setValue(options[i].value)
    close()
  }

  useDismiss(open, [triggerRef, listRef], (reason) => close(reason === 'escape'))

  useLayoutEffect(() => {
    const el = optionRefs.current[active]
    if (!open || !el) return
    setHl({ top: el.offsetTop, height: el.offsetHeight })
    el.scrollIntoView({ block: 'nearest' })
  }, [active, open, mounted])

  useEffect(() => {
    if (!open) setHl(null)
  }, [open])

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const k = e.key
    if (!open) {
      if (k === 'ArrowDown' || k === 'Enter' || k === ' ') {
        e.preventDefault()
        openList()
      } else if (k === 'ArrowUp') {
        e.preventDefault()
        openList(enabled(selectedIndex) ? selectedIndex : last())
      } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        openList()
        runTypeahead(k)
      }
      return
    }
    if (k === 'ArrowDown') { e.preventDefault(); setActive((a) => step(a, 1)) }
    else if (k === 'ArrowUp') { e.preventDefault(); setActive((a) => step(a, -1)) }
    else if (k === 'Home') { e.preventDefault(); setActive(first()) }
    else if (k === 'End') { e.preventDefault(); setActive(last()) }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(active) }
    else if (k === 'Tab') { if (enabled(active)) setValue(options[active].value); setOpen(false) }
    else if (k.length === 1) runTypeahead(k)
  }

  const runTypeahead = (ch: string) => {
    const now = Date.now()
    const t = typeahead.current
    t.text = now - t.at > 600 ? ch.toLowerCase() : t.text + ch.toLowerCase()
    t.at = now
    const start = Math.max(active, 0)
    for (let n = 0; n < options.length; n++) {
      const i = (start + n + (t.text.length === 1 ? 1 : 0)) % options.length
      if (enabled(i) && options[i].label.toLowerCase().startsWith(t.text)) {
        setActive(i)
        return
      }
    }
  }

  const describedBy = [help && !error ? helpId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={cx(styles.root, className)}>
      <span id={labelId} className={cx(styles.label, hideLabel && styles.hiddenLabel)} onClick={() => triggerRef.current?.focus()}>
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        id={triggerId}
        className={styles.trigger}
        data-open={open || undefined}
        data-invalid={error ? true : undefined}
        aria-labelledby={`${labelId} ${triggerId}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${baseId}-opt-${active}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
      >
        <span className={cx(styles.value, !selected && styles.placeholder)}>
          <span key={selected?.value ?? 'none'} className={styles.valueText}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDownIcon className={styles.chevron} />
      </button>
      {name && <input type="hidden" name={name} value={value ?? ''} />}
      <FieldMessage helpId={helpId} errorId={errorId} help={help} error={error} />
      {mounted && (
        <Portal>
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            tabIndex={-1}
            className={styles.list}
            data-state={state}
            data-side={side}
            style={style}
            onMouseDown={(e) => e.preventDefault()}
          >
            {hl && <span className={styles.highlight} style={{ transform: `translateY(${hl.top}px)`, height: hl.height }} aria-hidden="true" />}
            {options.map((o, i) => (
              <div
                key={o.value}
                ref={(el) => {
                  optionRefs.current[i] = el
                }}
                id={`${baseId}-opt-${i}`}
                role="option"
                aria-selected={o.value === value}
                aria-disabled={o.disabled || undefined}
                className={styles.option}
                data-active={i === active || undefined}
                style={{ ['--i' as string]: i }}
                onPointerMove={() => enabled(i) && active !== i && setActive(i)}
                onClick={() => choose(i)}
              >
                <span className={styles.optionText}>
                  {o.label}
                  {o.hint && <span className={styles.hint}>{o.hint}</span>}
                </span>
                <CheckIcon className={styles.check} data-on={o.value === value || undefined} />
              </div>
            ))}
          </div>
        </Portal>
      )}
    </div>
  )
}
