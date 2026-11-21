'use client'

import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent } from 'react'
import { cx } from '../../internal/cx'
import { SearchIcon, XIcon } from '../../icons/icons'
import { leavesField, onFormReset, watchValue } from '../../internal/formCore'
import { mergeRefs } from '../../internal/mergeRefs'
import { shortcutFocus } from '../../internal/motion/keys'
import { useControllable } from '../../internal/useControllable'
import { retarget, setNativeValue } from '../../internal/useField'
import { Input, type InputLabels, type InputProps } from '../Input'
import { Kbd } from '../Kbd'
import styles from './SearchInput.module.css'

export type SearchInputLabels = InputLabels & {
  /** Screen reader name for the clear button. */
  clear: string
}

export type SearchInputProps = Omit<InputProps, 'type' | 'leading' | 'trailing' | 'value' | 'defaultValue' | 'onChange' | 'labels'> & {
  /** Search text, when you control it. */
  value?: string
  /** Starting value when you do not control it. */
  defaultValue?: string
  /** Called when the text changes, with the new text. Also fires on clear. */
  onValueChange?: (value: string) => void
  /** Called on Enter with the current text. */
  onSearch?: (value: string) => void
  /** A single key, such as "/". Pressing it anywhere on the page focuses the field. */
  shortcut?: string
  /** Text for the label and the clear button, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<SearchInputLabels>
}

export function SearchInput({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onSearch,
  shortcut,
  labels,
  className,
  ref,
  onKeyDown,
  onBlur,
  ...props
}: SearchInputProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange)
  // A form library's onChange runs after the field's own instead of being dropped.
  const { onChange, ...rest } = props as typeof props & Pick<InputProps, 'onChange'>
  const inputRef = useRef<HTMLInputElement>(null)
  const latest = useRef(value)
  latest.current = value
  const [firstValue] = useState(value)
  const resetTo = useRef(valueProp === undefined ? defaultValue : firstValue)
  resetTo.current = valueProp === undefined ? defaultValue : firstValue

  // Text written by code (a form library's setValue or reset) fires no change, and a form reset puts back
  // what the field started with, so the clear button follows both.
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    const stopWatch = watchValue(el, () => el.value !== latest.current && setValue(el.value))
    const stopReset = onFormReset(el, () => setValue(resetTo.current))
    if (el.value !== latest.current) setValue(el.value)
    return () => {
      stopWatch()
      stopReset()
    }
  }, [setValue])

  // A person's clear: the input fires a real change event, so onChange and a form library hear it.
  const clear = () => {
    const el = inputRef.current
    if (!el || !setNativeValue(el, '')) setValue('')
  }
  // onBlur fires when focus leaves the field, not when it moves to the clear button.
  const leave = (e: FocusEvent<HTMLElement>) => {
    const el = inputRef.current
    if (leavesField(e.nativeEvent, el?.closest('[data-slot="input-field"]') ?? null)) onBlur?.(retarget(e, el) as FocusEvent<HTMLInputElement>)
  }

  useEffect(() => {
    if (!shortcut) return
    return shortcutFocus(shortcut, () => inputRef.current)
  }, [shortcut])

  return (
    <Input
      {...rest}
      labels={labels}
      ref={mergeRefs(inputRef, ref)}
      className={cx(styles.root, className)}
      type="search"
      enterKeyHint="search"
      value={value}
      leading={<SearchIcon />}
      aria-keyshortcuts={shortcut}
      onChange={(e) => {
        setValue(e.target.value)
        onChange?.(e)
      }}
      onBlur={leave}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        // Enter during IME composition picks a word, not a search
        if (e.nativeEvent.isComposing || e.keyCode === 229) return
        if (e.key === 'Enter') onSearch?.(value)
        else if (e.key === 'Escape' && value) {
          e.preventDefault()
          e.stopPropagation()
          clear()
        }
      }}
      trailing={
        value ? (
          <button
            type="button"
            className={styles.clear}
            data-slot="search-input-clear"
            aria-label={labels?.clear ?? 'Clear search'}
            onClick={() => {
              clear()
              inputRef.current?.focus()
            }}
            onBlur={leave}
          >
            <XIcon />
          </button>
        ) : shortcut ? (
          <span className={styles.hint} data-slot="search-input-shortcut" aria-hidden="true">
            <Kbd listen={shortcut}>{shortcut}</Kbd>
          </span>
        ) : null
      }
    />
  )
}
