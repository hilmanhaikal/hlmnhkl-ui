// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type KeyboardEvent, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { cx } from '../../internal/cx'
import { UndoIcon } from '../../internal/icons'
import { createSwipeDeck, type DeckSide } from '../../internal/motion/swipeDeck'
import styles from './SwipeDeck.module.css'

export type SwipeDeckSide = 'start' | 'end'

export type SwipeDeckProps<T> = Omit<ComponentPropsWithRef<'div'>, 'children' | 'onChange'> & {
  /** The cards, top card first. The top card is the first whose key is not decided yet, so you may remove decided ones. */
  items: T[]
  /** A key that stays the same for each item. */
  getKey: (item: T) => string
  /** A short name for an item, said by screen readers after each decision. */
  getName: (item: T) => string
  /** Draws one card. */
  renderCard: (item: T) => ReactNode
  /** Screen reader name of the deck, such as "Flats to rent". */
  label: string
  /** The two button words, for the start side then the end side. */
  actions?: [string, string]
  /** What screen readers say was done, start then end, such as "Passed" and "Saved". */
  decided?: [string, string]
  /** Called once for each card, when it has been thrown or a button or key decided it. */
  onDecide?: (item: T, side: SwipeDeckSide) => void
  /** Called when Undo brings a card back. If you removed it from items, put it back here. */
  onUndo?: (item: T) => void
  /** Screen reader name of the undo button. */
  undoLabel?: string
  /** Shown when every card has been decided. */
  empty?: ReactNode
}

type Side = DeckSide
type Done<T> = { item: T; side: Side; dir: SwipeDeckSide }

export function SwipeDeck<T>({
  items,
  getKey,
  getName,
  renderCard,
  label,
  actions = ['Pass', 'Save'],
  decided = ['Passed', 'Saved'],
  onDecide,
  onUndo,
  undoLabel = 'Undo the last decision',
  empty = 'That was the last card.',
  className,
  ...rest
}: SwipeDeckProps<T>) {
  const [done, setDone] = useState<Done<T>[]>([])
  const [news, setNews] = useState('')
  const [armed, setArmed] = useState<Side | 0>(0)
  const root = useRef<HTMLDivElement>(null)
  const deck = useRef<HTMLDivElement>(null)
  const top = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLSpanElement>(null)
  const buttons = useRef<Record<Side, HTMLButtonElement | null>>({ [-1]: null, [1]: null })
  // The top card is the first one not yet decided, found by key, so the app may trim or replace items.
  const gone = new Set(done.map((d) => getKey(d.item)))
  const left = items.filter((item) => !gone.has(getKey(item)))
  const latest = useRef({ left, count: done.length, onDecide, getName, decided })
  latest.current = { left, count: done.length, onDecide, getName, decided }

  // The drag, the throw and undo's way back (motion/swipeDeck.ts).
  const core = useRef<ReturnType<typeof createSwipeDeck>>(null)
  core.current ??= createSwipeDeck({
    root: () => root.current,
    deck: () => deck.current,
    top: () => top.current,
    knob: () => knob.current,
    button: (side) => buttons.current[side],
    setArmed,
    hasCards: () => latest.current.left.length > 0,
    // The next card must be in place before the top card's transform resets, or the thrown card
    // shows in the middle for a frame.
    commit: (side) => flushSync(() => commit(side)),
  })
  const swipe = core.current
  const { named, physical, fly } = swipe

  const commit = (side: Side) => {
    const { left, count, onDecide, getName, decided } = latest.current
    const [item, next] = left
    if (!item) return
    const dir = named(side)
    setDone((d) => [...d, { item, side, dir }])
    latest.current = { ...latest.current, left: left.slice(1), count: count + 1 }
    const said = `${decided[dir === 'start' ? 0 : 1]}: ${getName(item)}.`
    setNews(next ? `${said} Card ${count + 2} of ${count + left.length}: ${getName(next)}.` : `${said} No more cards.`)
    onDecide?.(item, dir)
  }

  const undo = () => {
    if (!done.length) return
    const last = done[done.length - 1]
    if (!swipe.undo(last.side)) return
    setDone((d) => d.slice(0, -1))
    const count = done.length - 1
    setNews(`Brought back: ${getName(last.item)}. Card ${count + 1} of ${count + left.length + 1}.`)
    onUndo?.(last.item)
  }

  // Undo plays the throw backwards, and a key pressed mid-move plays once the move has ended.
  useLayoutEffect(() => swipe.changed(), [done.length])
  useLayoutEffect(() => swipe.mount(), [])
  useEffect(() => () => swipe.destroy(), [])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return
    if (e.key === 'ArrowLeft') fly(-1, 0)
    else if (e.key === 'ArrowRight') fly(1, 0)
    else if (e.key === 'Backspace') undo()
    else return
    e.preventDefault()
  }

  const shown = left.slice(0, 3)
  const over = !left.length
  const armedDir = armed ? named(armed) : undefined
  const choice = (dir: SwipeDeckSide) => (
    <button
      ref={(b) => void (buttons.current[dir === 'start' ? -1 : 1] = b)}
      type="button"
      className={styles.choice}
      data-side={dir}
      aria-disabled={over || undefined}
      onClick={() => !over && fly(physical(dir), 0)}
    >
      <span className={styles.word}>{actions[dir === 'start' ? 0 : 1]}</span>
      <span className={styles.fill} aria-hidden="true">
        <span className={styles.word}>{actions[dir === 'start' ? 0 : 1]}</span>
      </span>
    </button>
  )

  return (
    <div ref={root} className={cx(styles.root, className)} data-armed={armedDir} {...rest}>
      <div className={styles.stage}>
        <div ref={deck} className={styles.deck} role="group" aria-roledescription="card deck" aria-label={label} aria-keyshortcuts="ArrowLeft ArrowRight Backspace" tabIndex={0} onKeyDown={onKeyDown}>
          {over && <div className={styles.empty}>{empty}</div>}
          {shown
            .map((item, depth) => (
              <div
                key={getKey(item)}
                ref={depth === 0 ? top : undefined}
                className={styles.card}
                data-depth={depth}
                inert={depth > 0}
                aria-hidden={depth > 0 || undefined}
                onPointerDown={depth === 0 ? swipe.down : undefined}
                onPointerMove={depth === 0 ? swipe.move : undefined}
                onPointerUp={depth === 0 ? swipe.up : undefined}
                onPointerCancel={depth === 0 ? swipe.cancel : undefined}
                onClickCapture={swipe.clickCapture}
                onDragStart={(e) => e.preventDefault()}
              >
                {renderCard(item)}
              </div>
            ))
            .reverse()}
        </div>
      </div>
      <div className={styles.ruler} aria-hidden="true">
        <span className={styles.mark} data-side="left" data-armed={armed === -1 || undefined} />
        <span className={styles.centre} />
        <span className={styles.mark} data-side="right" data-armed={armed === 1 || undefined} />
        <span ref={knob} className={styles.knob} data-armed={armed !== 0 || undefined} />
      </div>
      <div className={styles.bar}>
        {choice('start')}
        <button type="button" className={styles.undo} aria-label={undoLabel} aria-disabled={!done.length || undefined} onClick={undo}>
          <UndoIcon />
        </button>
        {choice('end')}
      </div>
      <span className={styles.sr} role="status" aria-live="polite" aria-atomic="true">
        {news}
      </span>
    </div>
  )
}
