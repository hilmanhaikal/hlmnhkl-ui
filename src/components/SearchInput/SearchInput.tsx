'use client'

import { useEffect, useRef } from 'react'
import { cx } from '../../internal/cx'
import { SearchIcon, XIcon } from '../../internal/icons'
import { mergeRefs } from '../../internal/mergeRefs'
import { useControllable } from '../../internal/useControllable'
import { Input, type InputProps } from '../Input'
import { Kbd } from '../Kbd'
import styles from './SearchInput.module.css'

export type SearchInputProps = Omit<InputProps, 'type' | 'leading' | 'trailing' | 'value' | 'defaultValue' | 'onChange'> & {
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
  /** Screen reader name for the clear button. */
  clearLabel?: string
}

const isTyping = (el: Element | null) =>
  !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el as HTMLElement).isContentEditable)

export function SearchInput({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onSearch,
  shortcut,
  clearLabel = 'Clear search',
  className,
  ref,
  onKeyDown,
  ...rest
}: SearchInputProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange)
  const inputRef = useRef<HTMLInputElement>(null)

  // Ignored while another field has focus, so it never steals typed text
  useEffect(() => {
    if (!shortcut) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== shortcut || e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return
      e.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcut])

  return (
    <Input
      {...rest}
      ref={mergeRefs(inputRef, ref)}
      className={cx(styles.root, className)}
      type="search"
      enterKeyHint="search"
      value={value}
      leading={<SearchIcon />}
      aria-keyshortcuts={shortcut}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        // Enter during IME composition picks a word, not a search
        if (e.nativeEvent.isComposing || e.keyCode === 229) return
        if (e.key === 'Enter') onSearch?.(value)
        else if (e.key === 'Escape' && value) {
          e.preventDefault()
          e.stopPropagation()
          setValue('')
        }
      }}
      trailing={
        value ? (
          <button
            type="button"
            className={styles.clear}
            aria-label={clearLabel}
            onClick={() => {
              setValue('')
              inputRef.current?.focus()
            }}
          >
            <XIcon />
          </button>
        ) : shortcut ? (
          <span className={styles.hint} aria-hidden="true">
            <Kbd listen={shortcut}>{shortcut}</Kbd>
          </span>
        ) : null
      }
    />
  )
}
