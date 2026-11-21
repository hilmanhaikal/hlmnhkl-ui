// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useEffect, useRef } from 'react'
import { cx } from '../../internal/cx'
import { SearchIcon, XIcon } from '../../icons/icons'
import { mergeRefs } from '../../internal/mergeRefs'
import { shortcutFocus } from '../../internal/motion/keys'
import { useControllable } from '../../internal/useControllable'
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
  ...rest
}: SearchInputProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange)
  const inputRef = useRef<HTMLInputElement>(null)

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
            data-slot="search-input-clear"
            aria-label={labels?.clear ?? 'Clear search'}
            onClick={() => {
              setValue('')
              inputRef.current?.focus()
            }}
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
