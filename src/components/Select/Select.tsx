'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { CheckIcon, ChevronDownIcon } from '../../icons/icons'
import { useDismiss } from '../../internal/layers'
import { useLiquid } from '../../internal/liquid'
import { useEdgeFlow } from '../../internal/liquidMore'
import { Portal } from '../../internal/Portal'
import { useControllable } from '../../internal/useControllable'
import { useFloating } from '../../internal/useFloating'
import { usePresence } from '../../internal/usePresence'
import { createListbox } from '../../internal/motion/listbox'
import { FieldMessage } from '../../internal/FieldMessage'
import styles from './Select.module.css'

export type SelectOption = { value: string; label: string; disabled?: boolean; hint?: string }

export type SelectLabels = {
  /** Shown in the open list when there are no options. */
  empty: string
}

const defaultLabels: SelectLabels = { empty: 'No options' }

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
  /** Text in the open list, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<SelectLabels>
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
  labels: labelsProp,
  disabled,
  name,
  id,
  className,
}: SelectProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const auto = useId()
  const baseId = id ?? auto
  const labelId = `${baseId}-label`
  const listId = `${baseId}-list`
  const helpId = `${baseId}-help`
  const errorId = `${baseId}-error`
  const emptyId = `${baseId}-empty`
  const triggerId = id ?? `${auto}-trigger`
  const [value, setValue] = useControllable<string | null>(valueProp, defaultValue, (v) => v !== null && onValueChange?.(v))
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLDivElement | null>>([])
  const { mounted, state } = usePresence(open, 'morph-out')
  const { style, side, ready } = useFloating(triggerRef, listRef, { open: mounted, side: 'bottom', align: 'start', offset: 6, matchWidth: true })
  // The list grows out of the field and folds back into it.
  useLiquid(listRef, triggerRef, state, mounted && ready)
  // Open or keyboard focused, the field's dark edge (its focus indicator) flows round it from where it was pressed, or from its start edge for a key.
  useEdgeFlow(triggerRef, triggerRef, ':is([data-state="open"], :focus-visible)', styles.edge)
  const [hl, setHl] = useState<{ top: number; height: number } | null>(null)

  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null

  // Arrows, Home, End, Enter, Space, Tab and type-ahead (motion/listbox.ts).
  const optionsRef = useRef(options)
  optionsRef.current = options
  const list = useRef<ReturnType<typeof createListbox>>(null)
  list.current ??= createListbox(() => optionsRef.current)
  const { enabled, first } = list.current

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
    const r = list.current!.key(e, open, active, selectedIndex)
    if (!r) return
    if (r.prevent) e.preventDefault()
    if (r.open) openList(r.active)
    else if (r.active !== undefined) setActive(r.active)
    if (r.choose) choose(active)
    if (r.tab) {
      if (enabled(active)) setValue(options[active].value)
      setOpen(false)
    }
  }

  const empty = options.length === 0
  const describedBy = [help && !error ? helpId : null, error ? errorId : null, open && empty ? emptyId : null].filter(Boolean).join(' ')

  return (
    <div className={cx(styles.root, className)} data-slot="select">
      <span id={labelId} className={cx(styles.label, hideLabel && styles.hiddenLabel)} data-slot="field-label" onClick={() => triggerRef.current?.focus()}>
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        id={triggerId}
        className={styles.trigger}
        data-slot="select-trigger"
        data-state={open ? 'open' : 'closed'}
        data-invalid={error ? true : undefined}
        aria-labelledby={`${labelId} ${triggerId}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && enabled(active) ? `${baseId}-opt-${active}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
      >
        <span className={cx(styles.value, !selected && styles.placeholder)} data-slot="select-value">
          <span key={selected?.value ?? 'none'} className={styles.valueText} title={selected ? selected.label : placeholder}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDownIcon className={styles.chevron} data-slot="select-icon" />
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
            data-slot="select-list"
            data-state={state}
            data-side={side}
            style={style}
            onMouseDown={(e) => e.preventDefault()}
          >
            {hl && <span className={styles.highlight} data-slot="select-highlight" style={{ transform: `translateY(${hl.top}px)`, height: hl.height }} aria-hidden="true" />}
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
                data-slot="select-option"
                data-highlighted={i === active || undefined}
                data-selected={o.value === value || undefined}
                data-disabled={o.disabled || undefined}
                style={{ ['--i' as string]: Math.min(i, 12) }}
                onPointerMove={() => enabled(i) && active !== i && setActive(i)}
                onClick={() => choose(i)}
              >
                <span className={styles.optionText} data-slot="select-option-text">
                  {o.label}
                  {o.hint && <span className={styles.hint} data-slot="select-option-hint">{o.hint}</span>}
                </span>
                <CheckIcon className={styles.check} data-slot="select-option-indicator" />
              </div>
            ))}
            {empty && (
              <div id={emptyId} className={styles.empty} data-slot="select-empty">
                {labels.empty}
              </div>
            )}
          </div>
        </Portal>
      )}
    </div>
  )
}
