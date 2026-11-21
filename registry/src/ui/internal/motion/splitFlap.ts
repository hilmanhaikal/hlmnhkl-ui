// Gooee UI, MIT licence. https://gooee.dev
import { easing, motionMs } from '../motion'

// SplitFlap's board with no framework: each cell runs forward through its drum to the new letter, and
// the board's edge grows or folds when the text gets longer or shorter.

/** The class names the board draws with (SplitFlap.module.css). */
export type FlapLook = { cell: string; top: string; bottom: string; glyph: string; flap: string; front: string; back: string }

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

const halfHtml = (look: FlapLook, cls: string, ch: string) => `<span class="${cls}"><span class="${look.glyph}">${escape(shownChar(ch))}</span></span>`
const cellHtml = (look: FlapLook, ch: string) => `<span class="${look.cell}">${halfHtml(look, look.top, ch)}${halfHtml(look, look.bottom, ch)}</span>`

/** The first cells as markup, so a server page shows the board before any script runs. */
export const flapCellsHtml = (look: FlapLook, target: string) => [...target].map((ch) => cellHtml(look, ch)).join('')

const fromHtml = (html: string) => {
  const t = document.createElement('template')
  t.innerHTML = html
  return t.content.firstElementChild as HTMLSpanElement
}

const makeCell = (look: FlapLook, ch: string): Cell => {
  const root = fromHtml(cellHtml(look, ch))
  return { root, top: root.children[0] as HTMLSpanElement, bottom: root.children[1] as HTMLSpanElement, shown: ch }
}

const setHalf = (h: Element, ch: string) => {
  ;(h.firstElementChild as HTMLElement).textContent = shownChar(ch)
}

/**
 * Runs a board whose cells are already in `b` and show `first`. `show` flips them to new text and calls
 * `onDone` once every cell has landed; a call in the middle of a run goes straight on to the newest text.
 */
export function createSplitFlap(b: HTMLElement, look: FlapLook, first: string) {
  let cells: Cell[] = [...b.children].map((root, i) => ({
    root: root as HTMLSpanElement,
    top: root.children[0] as HTMLSpanElement,
    bottom: root.children[1] as HTMLSpanElement,
    shown: [...first][i] ?? ' ',
  }))
  let timers: number[] = []
  const anims = new Set<Animation>()
  let run = 0
  let shrinkEnd: (() => void) | null = null

  const stopAll = () => {
    timers.forEach(clearTimeout)
    timers = []
    anims.forEach((a) => a.finish())
    anims.clear()
    shrinkEnd?.()
    // Caught mid-run, each cell carries on from the letter it was showing.
    for (const c of cells) setHalf(c.bottom, c.shown)
  }

  const show = (target: string, chars: string, onDone: () => void) => {
    const id = ++run
    const live = () => id === run
    const running = timers.length > 0 || anims.size > 0
    stopAll()
    const done = () => {
      if (!live()) return
      timers = []
      onDone()
    }
    const list = cells
    if (list.map((c) => c.shown).join('') === target) {
      if (running) done()
      return
    }

    const scale = motionMs('fast') / FAST_TOKEN
    // Reduced motion: the new text at once, with no flips and no morph.
    if (!scale) {
      cells = [...target].map((ch) => makeCell(look, ch))
      b.replaceChildren(...cells.map((c) => c.root))
      done()
      return
    }

    const n0 = list.length
    const n1 = target.length
    const radius = getComputedStyle(b).borderRadius || '0px'
    const grow = { duration: motionMs('morph'), easing: easing('morph') }
    const shrink = { duration: motionMs('morph-out'), easing: easing('morph') }
    let left = 0
    const landed = () => {
      if (--left === 0) done()
    }

    // Longer: the new cells are laid out at once, and the board's edge grows over them.
    if (n1 > n0) {
      const before = b.offsetWidth
      for (let i = n0; i < n1; i++) {
        const c = makeCell(look, ' ')
        list.push(c)
        b.append(c.root)
      }
      const wider = b.offsetWidth - before
      const a = b.animate({ clipPath: [`inset(0 ${wider}px 0 0 round ${radius})`, `inset(0 0 0 0 round ${radius})`] }, grow)
      anims.add(a)
      a.finished.then(
        () => anims.delete(a),
        () => {},
      )
    }

    // Shorter: the board's edge folds over the extra cells while the rest flip, then they go.
    if (n1 < n0) {
      const keep = list.slice(0, n1)
      const box = b.getBoundingClientRect()
      const edge = keep.length ? keep[keep.length - 1].root.getBoundingClientRect().right : box.left
      const a = b.animate({ clipPath: [`inset(0 0 0 0 round ${radius})`, `inset(0 ${box.right - edge}px 0 0 round ${radius})`] }, { ...shrink, fill: 'forwards' })
      left++
      const end = () => {
        shrinkEnd = null
        list.slice(n1).forEach((c) => c.root.remove())
        cells = keep
        a.cancel()
        if (live()) landed()
      }
      shrinkEnd = end
      a.finished.then(
        () => shrinkEnd === end && end(),
        () => {},
      )
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
      const flap = fromHtml(`<span class="${look.flap}">${halfHtml(look, look.front, prev)}${halfHtml(look, look.back, next)}</span>`)
      cell.root.append(flap)
      const a = flap.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-180deg)' }], { duration: fold, easing: easing('morph') })
      anims.add(a)
      const end = () => {
        anims.delete(a)
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
        timers.push(window.setTimeout(() => flip(cell, next, k === path.length - 1, Math.max(FOLD, wait[k]) * scale), t * scale))
        t += wait[k]
      })
    })
  }

  // Gone: the run is over, so a cancelled flip ends without calling onDone.
  const destroy = () => {
    run++
    timers.forEach(clearTimeout)
    anims.forEach((a) => a.cancel())
  }

  return { show, destroy }
}
