'use client'

import { useRef, useState, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { CheckIcon, XIcon } from '../../internal/icons'
import { easing, motionMs } from '../../internal/motion'
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
  /** Label for the remove button. Wins over labels.remove, which defaults to "Remove <text>". */
  removeLabel?: string
  /** Makes the tag a toggle chip (aria-pressed). */
  selected?: boolean
  /** Called when a toggle chip is pressed, with the new selected state. */
  onSelectedChange?: (selected: boolean) => void
  /** Icon before the text. Not shown on toggle chips, which show a check. */
  icon?: ReactNode
  /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<TagLabels>
  /** Extra class for the root element. */
  className?: string
}

export function Tag({ children, onRemove, removeLabel, selected, onSelectedChange, icon, labels: labelsProp, className }: TagProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const ref = useRef<HTMLSpanElement>(null)
  const [leaving, setLeaving] = useState(false)
  const selectable = selected !== undefined

  // Collapse first so neighbours slide in, then tell the parent
  const remove = () => {
    const el = ref.current
    if (!el || leaving) return
    setLeaving(true)
    const ms = motionMs('base')
    if (ms === 0 || !el.animate) {
      onRemove?.()
      return
    }
    const w = el.offsetWidth
    const anim = el.animate(
      [
        { width: `${w}px`, opacity: 1, transform: 'scale(1)' },
        { width: '0px', opacity: 0, transform: 'scale(0.8)', marginInlineEnd: '0px', paddingInline: '0px', borderWidth: '0px' },
      ],
      { duration: ms, easing: easing('in-out'), fill: 'forwards' },
    )
    anim.onfinish = () => onRemove?.()
  }

  const label = typeof children === 'string' ? children : labels.item
  const content = (
    <>
      {selectable ? (
        <span className={styles.check} data-on={selected || undefined} aria-hidden="true">
          <CheckIcon />
        </span>
      ) : (
        icon && <span className={styles.icon}>{icon}</span>
      )}
      <span className={styles.text}>{children}</span>
    </>
  )

  return (
    <span ref={ref} className={cx(styles.root, selected && styles.selected, className)} data-leaving={leaving || undefined}>
      {selectable ? (
        <button type="button" className={styles.toggle} aria-pressed={selected} onClick={() => onSelectedChange?.(!selected)}>
          {content}
        </button>
      ) : (
        <span className={styles.static}>{content}</span>
      )}
      {onRemove && (
        <button type="button" className={styles.remove} aria-label={removeLabel ?? labels.remove(label)} onClick={remove} disabled={leaving}>
          <XIcon />
        </button>
      )}
    </span>
  )
}
