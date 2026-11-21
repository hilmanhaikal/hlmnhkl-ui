'use client'

import { useRef, useState, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { CheckIcon, XIcon } from '../../icons/icons'
import { collapseOut, focusPast } from '../../internal/motion/collapseOut'
import styles from './Tag.module.css'

export type TagLabels = {
  /** Name of the remove button, built from the tag's text. */
  remove: (name: string) => string
  /** Used as the name when the tag's text is not plain text. */
  item: string
}

const defaultLabels: TagLabels = {
  remove: (name) => `Remove ${name}`,
  item: 'item',
}

export type TagProps = {
  /** Text of the tag. Plain text also names the remove button. */
  children: ReactNode
  /** Shows a remove button. Called after the exit animation ends. */
  onRemove?: () => void
  /** Makes the tag a toggle chip (aria-pressed). */
  pressed?: boolean
  /** Called when a toggle chip is pressed, with the new pressed state. */
  onPressedChange?: (pressed: boolean) => void
  /** Icon before the text. Not shown on toggle chips, which show a check. */
  icon?: ReactNode
  /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<TagLabels>
  /** Extra class for the root element. */
  className?: string
}

export function Tag({ children, onRemove, pressed, onPressedChange, icon, labels: labelsProp, className }: TagProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const ref = useRef<HTMLSpanElement>(null)
  const [leaving, setLeaving] = useState(false)
  const selectable = pressed !== undefined

  // Collapse first so neighbours slide in (motion/collapseOut.ts), then tell the parent
  const remove = () => {
    const el = ref.current
    if (!el || leaving) return
    setLeaving(true)
    collapseOut(el, () => {
      focusPast(el)
      onRemove?.()
    })
  }

  const label = typeof children === 'string' ? children : labels.item
  const content = (
    <>
      {selectable ? (
        <span className={styles.check} data-slot="tag-indicator" aria-hidden="true">
          <CheckIcon />
        </span>
      ) : (
        icon && <span className={styles.icon} data-slot="tag-icon">{icon}</span>
      )}
      <span className={styles.text} data-slot="tag-label" title={typeof children === 'string' || typeof children === 'number' ? String(children) : undefined}>
        {children}
      </span>
    </>
  )

  return (
    <span ref={ref} className={cx(styles.root, pressed && styles.selected, className)} data-slot="tag" data-leaving={leaving || undefined}>
      {selectable ? (
        <button type="button" className={styles.toggle} data-slot="tag-toggle" data-state={pressed ? 'on' : 'off'} aria-pressed={pressed} onClick={() => onPressedChange?.(!pressed)}>
          {content}
        </button>
      ) : (
        <span className={styles.static} data-slot="tag-content">{content}</span>
      )}
      {onRemove && (
        <button type="button" className={styles.remove} data-slot="tag-remove" aria-label={labels.remove(label)} onClick={remove}>
          <XIcon />
        </button>
      )}
    </span>
  )
}
