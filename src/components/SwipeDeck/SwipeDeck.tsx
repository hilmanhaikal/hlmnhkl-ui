'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { clamp, magnetTo, pull, speedTracker, springTo } from '../../internal/feel'
import { UndoIcon } from '../../internal/icons'
import { easing, readMotionMs } from '../../internal/motion'
import { tokenNumber } from '../../internal/useScrub'
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

type Side = -1 | 1
type Done<T> = { item: T; side: Side; dir: SwipeDeckSide }

// A press is a drag only once it moves this far sideways, so a tap on a card's own button stays a tap.
const SLOP = 8
// The throw rule: past --hl-deck-throw of the card's width, or a flick this fast that has moved at least FLICK_MIN.
const FLICK = 600
const FLICK_MIN = 40
const TILT = 0.06
const TILT_MAX = 14
// How far round each throw mark it draws the card in, as a share of the distance to the mark.
const MARK_REACH = 0.3
// The speed a card leaves at, or comes back at on undo, when no hand threw it.
const THROW_SPEED = 1800

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
  const at = useRef(0)
  const stop = useRef(() => {})
  const busy = useRef(false)
  const queued = useRef<Side | null>(null)
  const moved = useRef(false)
  const undoing = useRef<Side | null>(null)
  const drag = useRef<{ x: number; y: number; base: number; id: number; sideways: boolean; speed: ReturnType<typeof speedTracker> } | null>(null)
  // The top card is the first one not yet decided, found by key, so the app may trim or replace items.
  const gone = new Set(done.map((d) => getKey(d.item)))
  const left = items.filter((item) => !gone.has(getKey(item)))
  const latest = useRef({ left, count: done.length, onDecide, getName, decided })
  latest.current = { left, count: done.length, onDecide, getName, decided }

  const rtl = () => !!root.current && getComputedStyle(root.current).direction === 'rtl'
  // Right is the end side, or the start side in a right-to-left page.
  const named = (side: Side): SwipeDeckSide => ((side > 0) !== rtl() ? 'end' : 'start')
  const physical = (dir: SwipeDeckSide): Side => ((dir === 'end') !== rtl() ? 1 : -1)
  const widthOf = () => top.current?.offsetWidth || deck.current?.offsetWidth || 300
  const share = useRef(0.35)
  const line = () => widthOf() * share.current
  const reduced = () => readMotionMs('fling') === 0

  const paint = (x: number) => {
    at.current = x
    const el = top.current
    if (el) {
      el.style.transform = x ? `translate3d(${x.toFixed(1)}px, 0, 0) rotate(${clamp(x * TILT, -TILT_MAX, TILT_MAX).toFixed(2)}deg)` : ''
      // Past a card's width away it fades as it goes, so it leaves before any edge cuts it.
      const w = widthOf()
      const fade = clamp(1 - (Math.abs(x) - w) / (w * 0.8), 0, 1)
      el.style.opacity = fade < 1 ? fade.toFixed(3) : ''
    }
    const T = line()
    const near = pull(T - Math.min(Math.abs(x), T), T)
    deck.current?.style.setProperty('--rise', near.toFixed(3))
    const side: Side | 0 = x > 0 ? 1 : x < 0 ? -1 : 0
    for (const dir of ['start', 'end'] as SwipeDeckSide[]) {
      const btn = buttons.current[dir === 'start' ? -1 : 1]
      if (btn) btn.style.setProperty('--fill', side === physical(dir) ? near.toFixed(3) : '0')
    }
    setArmed(Math.abs(x) >= T - 0.5 ? side : 0)
    if (knob.current) knob.current.style.transform = `translateX(${clamp(x, -widthOf() / 2, widthOf() / 2).toFixed(1)}px)`
  }

  const offStage = (side: Side) => side * ((root.current?.offsetWidth ?? 400) / 2 + widthOf() * 1.2)

  const commit = (side: Side) => {
    const { left, count, onDecide, getName, decided } = latest.current
    const [item, next] = left
    if (!item) return void (busy.current = false)
    const dir = named(side)
    setDone((d) => [...d, { item, side, dir }])
    latest.current = { ...latest.current, left: left.slice(1), count: count + 1 }
    const said = `${decided[dir === 'start' ? 0 : 1]}: ${getName(item)}.`
    setNews(next ? `${said} Card ${count + 2} of ${count + left.length}: ${getName(next)}.` : `${said} No more cards.`)
    onDecide?.(item, dir)
  }

  const finish = (side: Side) => {
    stop.current = () => {}
    paint(0)
    commit(side)
  }

  const fly = (side: Side, velocity: number) => {
    const el = top.current
    if (!el || !latest.current.left.length) return
    if (busy.current) {
      queued.current = side
      return
    }
    busy.current = true
    stop.current()
    if (reduced()) {
      const anim = el.animate({ opacity: [1, 0] }, { duration: readMotionMs('base'), easing: easing('out'), fill: 'forwards' })
      let ended = false
      const end = () => {
        if (ended) return
        ended = true
        anim.cancel()
        finish(side)
      }
      anim.finished.then(end, end)
      // Stopped (the deck went away mid-fade): the fade ends and nothing is decided.
      stop.current = () => {
        ended = true
        anim.cancel()
      }
      return
    }
    const speed = side * Math.max(Math.abs(velocity), THROW_SPEED)
    stop.current = springTo({ from: at.current, to: offStage(side), velocity: speed, period: readMotionMs('fling'), rest: 2, onFrame: paint, onDone: () => finish(side) })
  }

  const back = (velocity = 0) => {
    stop.current()
    stop.current = springTo({ from: at.current, to: 0, velocity, period: readMotionMs('fling'), damping: 1, rest: 0.5, onFrame: paint })
  }

  const undo = () => {
    if (!done.length) return
    if (busy.current) return
    const last = done[done.length - 1]
    busy.current = true
    queued.current = null
    undoing.current = last.side
    setDone((d) => d.slice(0, -1))
    const count = done.length - 1
    setNews(`Brought back: ${getName(last.item)}. Card ${count + 1} of ${count + left.length + 1}.`)
    onUndo?.(last.item)
  }

  // A key pressed mid-move plays once, when the move has ended.
  const playQueue = () => {
    busy.current = false
    const q = queued.current
    queued.current = null
    if (q !== null) fly(q, 0)
  }

  // Undo plays the throw backwards: the card comes in from where it left.
  useLayoutEffect(() => {
    const side = undoing.current
    const el = top.current
    if (side === null) return playQueue()
    undoing.current = null
    if (!el) return playQueue()
    if (reduced()) {
      const anim = el.animate({ opacity: [0, 1] }, { duration: readMotionMs('base'), easing: easing('out') })
      let ended = false
      anim.finished.then(
        () => !ended && playQueue(),
        () => !ended && playQueue(),
      )
      stop.current = () => {
        ended = true
        anim.cancel()
      }
      return
    }
    paint(offStage(side))
    stop.current = springTo({ from: offStage(side), to: 0, velocity: -side * THROW_SPEED, period: readMotionMs('fling'), damping: 1, rest: 0.5, onFrame: paint, onDone: playQueue })
  }, [done.length])

  useLayoutEffect(() => {
    share.current = tokenNumber(root.current, '--hl-deck-throw') || share.current
  }, [])
  useEffect(() => () => stop.current(), [])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || busy.current) return
    moved.current = false
    drag.current = { x: e.clientX, y: e.clientY, base: at.current, id: e.pointerId, sideways: false, speed: speedTracker() }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.sideways) {
      // Up or down first means the page scrolls, and the card lets go.
      if (Math.abs(dy) > SLOP && Math.abs(dy) > Math.abs(dx)) return void (drag.current = null)
      if (Math.abs(dx) < SLOP) return
      d.sideways = true
      moved.current = true
      stop.current()
      d.base = at.current - dx
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // A pointer the browser no longer knows cannot be captured, and needs no capture.
      }
      deck.current?.setAttribute('data-dragging', '')
    }
    const raw = d.base + dx
    d.speed.add(raw, e.timeStamp)
    const T = line()
    paint(magnetTo(raw, [-T, T], T * MARK_REACH))
  }

  const letGo = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (!d.sideways) return
    deck.current?.removeAttribute('data-dragging')
    if (cancelled) return back()
    const x = at.current
    const v = d.speed.speed(e.timeStamp)
    if (Math.abs(x) >= line()) return fly(x > 0 ? 1 : -1, v)
    if (Math.abs(v) > FLICK && Math.abs(x) >= FLICK_MIN && Math.sign(v) === Math.sign(x)) return fly(v > 0 ? 1 : -1, v)
    back(v)
  }

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
                onPointerDown={depth === 0 ? onPointerDown : undefined}
                onPointerMove={depth === 0 ? onPointerMove : undefined}
                onPointerUp={depth === 0 ? (e) => letGo(e, false) : undefined}
                onPointerCancel={depth === 0 ? (e) => letGo(e, true) : undefined}
                onClickCapture={(e) => {
                  if (!moved.current) return
                  moved.current = false
                  e.preventDefault()
                  e.stopPropagation()
                }}
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
