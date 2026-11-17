// Gooee UI, MIT licence. https://gooee.dev
import { clamp, pull, speedTracker } from '../feel'
import { easing, readMotionMs } from '../motion'
import { release } from './fling'

// A stack of cards: the top one is thrown to either side to decide. The part keeps the decisions as its
// own state and draws the cards; this core drags, throws and brings back the top card, and fills the
// ruler and the two buttons as it goes.

export type DeckSide = -1 | 1
export type DeckDir = 'start' | 'end'

/** What a drag needs from a pointer event: native and React events both have these. */
type Press = { clientX: number; clientY: number; pointerId: number; pointerType: string; button: number; timeStamp: number; currentTarget: EventTarget | null }

// A press is a drag only once it moves this far sideways, so a tap on a card's own button stays a tap.
const SLOP = 8
// The throw rule: past --gooee-deck-throw of the card's width, or a flick this fast that has moved at least FLICK_MIN.
const FLICK = 600
const FLICK_MIN = 40
const TILT = 0.06
const TILT_MAX = 14
// The speed a card leaves at, or comes back at on undo, when no hand threw it.
const THROW_SPEED = 1800

export type SwipeDeckOptions = {
  root: () => HTMLElement | null
  deck: () => HTMLElement | null
  /** The top card, the one the hand moves. */
  top: () => HTMLElement | null
  knob: () => HTMLElement | null
  button: (side: DeckSide) => HTMLElement | null
  setArmed: (side: DeckSide | 0) => void
  /** Whether any card is left to decide. */
  hasCards: () => boolean
  /**
   * Decides the top card. The next card must be in the page when it returns (or when its promise
   * settles), before the thrown card's transform resets: React uses flushSync, Vue nextTick.
   */
  commit: (side: DeckSide) => void | Promise<void>
}

export function createSwipeDeck(o: SwipeDeckOptions) {
  let at = 0
  let stop = () => {}
  let busy = false
  let queued: DeckSide | null = null
  let moved = false
  let undoing: DeckSide | null = null
  let drag: { x: number; y: number; base: number; id: number; sideways: boolean; speed: ReturnType<typeof speedTracker> } | null = null
  let share = 0.35

  const rtl = () => {
    const root = o.root()
    return !!root && getComputedStyle(root).direction === 'rtl'
  }
  // Right is the end side, or the start side in a right-to-left page.
  const named = (side: DeckSide): DeckDir => ((side > 0) !== rtl() ? 'end' : 'start')
  const physical = (dir: DeckDir): DeckSide => ((dir === 'end') !== rtl() ? 1 : -1)
  const widthOf = () => o.top()?.offsetWidth || o.deck()?.offsetWidth || 300
  const line = () => widthOf() * share
  const reduced = () => readMotionMs('morph-out') === 0

  const paint = (x: number) => {
    at = x
    const el = o.top()
    if (el) {
      el.style.transform = x ? `translate3d(${x.toFixed(1)}px, 0, 0) rotate(${clamp(x * TILT, -TILT_MAX, TILT_MAX).toFixed(2)}deg)` : ''
      // Past a card's width away it fades as it goes, so it leaves before any edge cuts it.
      const w = widthOf()
      const fade = clamp(1 - (Math.abs(x) - w) / (w * 0.8), 0, 1)
      el.style.opacity = fade < 1 ? fade.toFixed(3) : ''
    }
    const T = line()
    const near = pull(T - Math.min(Math.abs(x), T), T)
    o.deck()?.style.setProperty('--rise', near.toFixed(3))
    const side: DeckSide | 0 = x > 0 ? 1 : x < 0 ? -1 : 0
    for (const dir of ['start', 'end'] as DeckDir[]) {
      const btn = o.button(dir === 'start' ? -1 : 1)
      if (btn) btn.style.setProperty('--fill', side === physical(dir) ? near.toFixed(3) : '0')
    }
    o.setArmed(Math.abs(x) >= T - 0.5 ? side : 0)
    const knob = o.knob()
    if (knob) knob.style.transform = `translateX(${clamp(x, -widthOf() / 2, widthOf() / 2).toFixed(1)}px)`
  }

  const offStage = (side: DeckSide) => side * ((o.root()?.offsetWidth ?? 400) / 2 + widthOf() * 1.2)

  const finish = (side: DeckSide) => {
    stop = () => {}
    if (!o.hasCards()) {
      busy = false
      return paint(0)
    }
    const applied = o.commit(side)
    if (applied) applied.then(() => paint(0))
    else paint(0)
  }

  const fly = (side: DeckSide, velocity: number) => {
    const el = o.top()
    if (!el || !o.hasCards()) return
    if (busy) {
      queued = side
      return
    }
    busy = true
    stop()
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
      stop = () => {
        ended = true
        anim.cancel()
      }
      return
    }
    const speed = side * Math.max(Math.abs(velocity), THROW_SPEED)
    stop = release(at, offStage(side), speed, paint, () => finish(side))
  }

  const back = (velocity = 0) => {
    stop()
    stop = release(at, 0, velocity, paint)
  }

  // A key pressed mid-move plays once, when the move has ended.
  const playQueue = () => {
    busy = false
    const q = queued
    queued = null
    if (q !== null) fly(q, 0)
  }

  const letGo = (e: Press, cancelled: boolean) => {
    const d = drag
    if (!d || d.id !== e.pointerId) return
    drag = null
    if (!d.sideways) return
    o.deck()?.removeAttribute('data-dragging')
    if (cancelled) return back()
    const x = at
    const v = d.speed.speed(e.timeStamp)
    if (Math.abs(x) >= line()) return fly(x > 0 ? 1 : -1, v)
    if (Math.abs(v) > FLICK && Math.abs(x) >= FLICK_MIN && Math.sign(v) === Math.sign(x)) return fly(v > 0 ? 1 : -1, v)
    back(v)
  }

  return {
    named,
    physical,
    fly,
    /** Reads the throw line from --gooee-deck-throw. Call once the deck is in the page. */
    mount() {
      const root = o.root()
      share = (root ? parseFloat(getComputedStyle(root).getPropertyValue('--gooee-deck-throw')) || 0 : 0) || share
    },
    destroy: () => stop(),
    /** Asks to bring the last card back from `side`. False while a card is moving: then nothing changes. */
    undo(side: DeckSide) {
      if (busy) return false
      busy = true
      queued = null
      undoing = side
      return true
    },
    /** Call after the part has drawn a new count of decisions. Undo plays the throw backwards: the card comes in from where it left. */
    changed() {
      const side = undoing
      const el = o.top()
      if (side === null) return playQueue()
      undoing = null
      if (!el) return playQueue()
      if (reduced()) {
        const anim = el.animate({ opacity: [0, 1] }, { duration: readMotionMs('base'), easing: easing('out') })
        let ended = false
        anim.finished.then(
          () => !ended && playQueue(),
          () => !ended && playQueue(),
        )
        stop = () => {
          ended = true
          anim.cancel()
        }
        return
      }
      paint(offStage(side))
      stop = release(offStage(side), 0, -side * THROW_SPEED, paint, playQueue)
    },
    down(e: Press) {
      if ((e.pointerType === 'mouse' && e.button !== 0) || busy) return
      moved = false
      drag = { x: e.clientX, y: e.clientY, base: at, id: e.pointerId, sideways: false, speed: speedTracker() }
    },
    move(e: Press) {
      const d = drag
      if (!d || d.id !== e.pointerId) return
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (!d.sideways) {
        // Up or down first means the page scrolls, and the card lets go.
        if (Math.abs(dy) > SLOP && Math.abs(dy) > Math.abs(dx)) return void (drag = null)
        if (Math.abs(dx) < SLOP) return
        d.sideways = true
        moved = true
        stop()
        d.base = at - dx
        try {
          ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
        } catch {
          // A pointer the browser no longer knows cannot be captured, and needs no capture.
        }
        o.deck()?.setAttribute('data-dragging', '')
      }
      const raw = d.base + dx
      d.speed.add(raw, e.timeStamp)
      paint(raw)
    },
    up: (e: Press) => letGo(e, false),
    cancel: (e: Press) => letGo(e, true),
    // A drag is not a tap on the card's own buttons.
    clickCapture(e: { preventDefault: () => void; stopPropagation: () => void }) {
      if (!moved) return
      moved = false
      e.preventDefault()
      e.stopPropagation()
    },
  }
}
