// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useEffect, useRef, useState, type ComponentPropsWithRef } from 'react'
import { cx } from '../../internal/cx'
import { createSplitFlap, flapCellsHtml, SPLIT_FLAP_CHARS, type FlapLook } from '../../internal/motion/splitFlap'
import styles from './SplitFlap.module.css'

export { SPLIT_FLAP_CHARS }

export type SplitFlapProps = Omit<ComponentPropsWithRef<'span'>, 'children'> & {
  /** The text the board shows. A change flips each cell forward through the drum to its new letter. */
  value: string
  /** At least this many cells: shorter text is padded with blank ones, so a column keeps its width. */
  length?: number
  /** Text size of the cells. */
  size?: 'sm' | 'md' | 'lg'
  /** The drum's letters, in the order a cell passes them. A letter that is not on it flips straight in. */
  chars?: string
  /** Says the new text to screen readers once, when the board has landed. Turn off when one message covers several boards. */
  announce?: boolean
  /** Called once with the text when every cell has landed. */
  onSettle?: (value: string) => void
}

const LOOK: FlapLook = { cell: styles.cell, top: styles.top, bottom: styles.bottom, glyph: styles.glyph, flap: styles.flap, front: styles.front, back: styles.back }

export function SplitFlap({ value, length = 0, size = 'md', chars = SPLIT_FLAP_CHARS, announce = true, onSettle, className, ...rest }: SplitFlapProps) {
  const target = value.padEnd(length, ' ')
  // The first cells come with the markup, so a server page shows the board before any script runs.
  const [first] = useState(() => ({ __html: flapCellsHtml(LOOK, target) }))
  const [said, setSaid] = useState(value)
  const board = useRef<HTMLSpanElement>(null)
  const flap = useRef<ReturnType<typeof createSplitFlap> | null>(null)
  const settle = useRef(onSettle)
  settle.current = onSettle

  // The board runs in motion/splitFlap.ts. The first cells came with the markup.
  useEffect(() => {
    const b = board.current
    if (!b) return
    if (!flap.current) {
      flap.current = createSplitFlap(b, LOOK, target)
      return
    }
    flap.current.show(target, chars, () => {
      setSaid(value)
      settle.current?.(value)
    })
  }, [target])

  useEffect(() => () => flap.current?.destroy(), [])

  return (
    <span className={cx(styles.root, className)} data-size={size} {...rest}>
      <span className={styles.sr} aria-live={announce ? 'polite' : undefined} aria-atomic="true">
        {said}
      </span>
      <span ref={board} className={styles.board} aria-hidden="true" dangerouslySetInnerHTML={first} />
    </span>
  )
}
