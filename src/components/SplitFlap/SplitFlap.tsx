'use client'

import { useEffect, useRef, useState, type ComponentPropsWithRef } from 'react'
import { cx } from '../../internal/cx'
import { easing, readMotionMs } from '../../internal/motion'
import styles from './SplitFlap.module.css'

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

/** The drum of a real board: a blank, letters, digits and a few marks. */
export const SPLIT_FLAP_CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:.,-+%/'

// A fold of about 90ms, fast steps of 40ms, and the last three slow down. A cell passes 8 letters at
// most, and the cells start one after another within 350ms, so a whole change ends inside a second.
const FOLD = 90
const FAST = 40
const TAIL = [70, 100, 140]
const MAX_STEPS = 8
const STAGGER = 35
const CASCADE_CAP = 350
// The fast motion token at its base, so Retime scales the board with everything else.
const FAST_TOKEN = 140

type Cell = { root: HTMLSpanElement; top: HTMLSpanElement; bottom: HTMLSpanElement; shown: string }

/** The letters a cell passes on its way from `from` to `to`, at most MAX_STEPS, ending on `to`. */
function route(from: string, to: string, drum: string) {
  const a = drum.indexOf(from)
  const b = drum.indexOf(to)
  if (a < 0 || b < 0) return from === to ? [] : [to]
  const n = Math.min((b - a + drum.length) % drum.length, MAX_STEPS)
  return Array.from({ length: n }, (_, i) => drum[(b - n + 1 + i + drum.length) % drum.length])
}

/** The wait before each step: fast in the middle, slow for the last three. */
const gaps = (n: number) => Array.from({ length: n }, (_, i) => (n - 1 - i < TAIL.length ? TAIL[TAIL.length - n + i] : FAST))

const NBSP = ' '
const shownChar = (ch: string) => (ch === ' ' ? NBSP : ch)
const escape = (ch: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch] ?? ch

const halfHtml = (cls: string, ch: string) => `<span class="${cls}"><span class="${styles.glyph}">${escape(shownChar(ch))}</span></span>`
const cellHtml = (ch: string) => `<span class="${styles.cell}">${halfHtml(styles.top, ch)}${halfHtml(styles.bottom, ch)}</span>`

const fromHtml = (html: string) => {
  const t = document.createElement('template')
  t.innerHTML = html
  return t.content.firstElementChild as HTMLSpanElement
}

const makeCell = (ch: string): Cell => {
  const root = fromHtml(cellHtml(ch))
  return { root, top: root.children[0] as HTMLSpanElement, bottom: root.children[1] as HTMLSpanElement, shown: ch }
}

const setHalf = (h: Element, ch: string) => {
  ;(h.firstElementChild as HTMLElement).textContent = shownChar(ch)
}

export function SplitFlap({ value, length = 0, size = 'md', chars = SPLIT_FLAP_CHARS, announce = true, onSettle, className, ...rest }: SplitFlapProps) {
  const target = value.padEnd(length, ' ')
  // The first cells come with the markup, so a server page shows the board before any script runs.
  const [first] = useState(() => ({ __html: [...target].map(cellHtml).join('') }))
  const [said, setSaid] = useState(value)
  const board = useRef<HTMLSpanElement>(null)
  const cells = useRef<Cell[] | null>(null)
  const timers = useRef<number[]>([])
  const anims = useRef(new Set<Animation>())
  const run = useRef(0)
  const shrinkEnd = useRef<(() => void) | null>(null)
  const settle = useRef(onSettle)
  settle.current = onSettle

  const stopAll = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    anims.current.forEach((a) => a.finish())
    anims.current.clear()
    shrinkEnd.current?.()
    // Caught mid-run, each cell carries on from the letter it was showing.
    for (const c of cells.current ?? []) setHalf(c.bottom, c.shown)
  }

  useEffect(() => {
    const b = board.current
    if (!b) return
    if (!cells.current) {
      cells.current = [...b.children].map((root, i) => ({ root: root as HTMLSpanElement, top: root.children[0] as HTMLSpanElement, bottom: root.children[1] as HTMLSpanElement, shown: [...target][i] ?? ' ' }))
      return
    }
    const id = ++run.current
    const live = () => id === run.current
    const running = timers.current.length > 0 || anims.current.size > 0
    stopAll()
    const done = () => {
      if (!live()) return
      timers.current = []
      setSaid(value)
      settle.current?.(value)
    }
    const list = cells.current
    if (list.map((c) => c.shown).join('') === target) {
      if (running) done()
      return
    }

    const scale = readMotionMs('fast') / FAST_TOKEN
    // Reduced motion: the new text at once, with no flips and no morph.
    if (!scale) {
      cells.current = [...target].map(makeCell)
      b.replaceChildren(...cells.current.map((c) => c.root))
      done()
      return
    }

    const n0 = list.length
    const n1 = target.length
    const radius = getComputedStyle(b).borderRadius || '0px'
    const grow = { duration: readMotionMs('morph'), easing: easing('morph') }
    const shrink = { duration: readMotionMs('morph-out'), easing: easing('morph') }
    let left = 0
    const landed = () => {
      if (--left === 0) done()
    }

    // Longer: the new cells are laid out at once, and the board's edge grows over them.
    if (n1 > n0) {
      const before = b.offsetWidth
      for (let i = n0; i < n1; i++) {
        const c = makeCell(' ')
        list.push(c)
        b.append(c.root)
      }
      const wider = b.offsetWidth - before
      const a = b.animate({ clipPath: [`inset(0 ${wider}px 0 0 round ${radius})`, `inset(0 0 0 0 round ${radius})`] }, grow)
      anims.current.add(a)
      a.finished.then(() => anims.current.delete(a), () => {})
    }

    // Shorter: the board's edge folds over the extra cells while the rest flip, then they go.
    if (n1 < n0) {
      const keep = list.slice(0, n1)
      const box = b.getBoundingClientRect()
      const edge = keep.length ? keep[keep.length - 1].root.getBoundingClientRect().right : box.left
      const a = b.animate({ clipPath: [`inset(0 0 0 0 round ${radius})`, `inset(0 ${box.right - edge}px 0 0 round ${radius})`] }, { ...shrink, fill: 'forwards' })
      left++
      const end = () => {
        shrinkEnd.current = null
        list.slice(n1).forEach((c) => c.root.remove())
        cells.current = keep
        a.cancel()
        if (live()) landed()
      }
      shrinkEnd.current = end
      a.finished.then(() => shrinkEnd.current === end && end(), () => {})
    }

    const goal = [...target]
    const changed = goal.map((ch, i) => (list[i].shown !== ch ? i : -1)).filter((i) => i >= 0)
    const stagger = Math.min(STAGGER, CASCADE_CAP / Math.max(1, changed.length))
    left += changed.length
    if (!left) return done()

    const flip = (cell: Cell, next: string, last: boolean, fold: number) => {
      const prev = cell.shown
      cell.shown = next
      setHalf(cell.top, next)
      // The falling flap: the old letter's top half in front, the new letter's bottom half behind.
      const flap = fromHtml(`<span class="${styles.flap}">${halfHtml(styles.front, prev)}${halfHtml(styles.back, next)}</span>`)
      cell.root.append(flap)
      const a = flap.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-180deg)' }], { duration: fold, easing: easing('morph') })
      anims.current.add(a)
      const end = () => {
        anims.current.delete(a)
        setHalf(cell.bottom, next)
        flap.remove()
        if (last && live()) landed()
      }
      a.finished.then(end, end)
    }

    changed.forEach((i, order) => {
      const cell = list[i]
      const path = route(cell.shown, goal[i], chars)
      const wait = gaps(path.length)
      let t = order * stagger
      path.forEach((next, k) => {
        timers.current.push(window.setTimeout(() => flip(cell, next, k === path.length - 1, Math.max(FOLD, wait[k]) * scale), t * scale))
        t += wait[k]
      })
    })
  }, [target])

  useEffect(
    () => () => {
      // Gone: the run is over, so a cancelled flip ends without calling onSettle.
      run.current++
      timers.current.forEach(clearTimeout)
      anims.current.forEach((a) => a.cancel())
    },
    [],
  )

  return (
    <span className={cx(styles.root, className)} data-size={size} {...rest}>
      <span className={styles.sr} aria-live={announce ? 'polite' : undefined} aria-atomic="true">
        {said}
      </span>
      <span ref={board} className={styles.board} aria-hidden="true" dangerouslySetInnerHTML={first} />
    </span>
  )
}
