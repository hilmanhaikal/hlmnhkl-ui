import { rubber, speedTracker } from '../feel'
import { release } from './fling'
import { returnTarget } from './focus'

// A sheet that rests at set heights (low, half, full), the same in every framework: drag, flick, keys on
// the grabber, and where focus goes. The framework keeps the state (the height, the target the drag
// aims at, whether it is dragging, the spoken text) and hands it over through the host.

/** A height a sheet can rest at: low with only its title showing, half the screen, or nearly all of it. */
export type SheetDetent = 'peek' | 'half' | 'full'

// Shares of the screen, from the heights Apple Maps on the web and Vaul rest at.
const SHARE: Record<SheetDetent, number> = { peek: 0.19, half: 0.5, full: 0.96 }
const ORDER: SheetDetent[] = ['peek', 'half', 'full']
export const DETENT_NAME: Record<SheetDetent, string> = { peek: 'Low', half: 'Half', full: 'Full' }
// px per second: faster than this, a let-go is a flick and moves one height its way.
const FLICK = 400
// How far ahead, in seconds, a slow let-go is carried before the nearest height is picked.
const PROJECT = 0.2
// A press is not a drag until it moves this far, so taps on the content still work.
const SLOP = 6

/** The detents asked for, low to high. */
export const detentOrder = (detents: SheetDetent[]) => ORDER.filter((d) => detents.includes(d))
/** Each detent's height in px for a screen `vh` tall. */
export const detentHeights = (order: SheetDetent[], vh: number) => order.map((d) => Math.round(vh * SHARE[d]))

const nearest = (v: number, hs: number[]) => hs.reduce((best, h, i) => (Math.abs(h - v) < Math.abs(hs[best] - v) ? i : best), 0)

// A flick moves one height from where the drag began, never two, even when the hand has already
// passed the next one. Real sheets measured all do this.
function pick(pos: number, v: number, start: number, hs: number[]) {
  if (Math.abs(v) <= FLICK) return nearest(pos + v * PROJECT, hs)
  return Math.max(0, Math.min(hs.length - 1, start + Math.sign(v)))
}

export type DetentHost = {
  panel: () => HTMLElement | null
  overlay: () => HTMLElement | null
  grabber: () => HTMLElement | null
  body: () => HTMLElement | null
  /** The detents, low to high (detentOrder). */
  order: () => SheetDetent[]
  /** Their heights now, in px (detentHeights). */
  heights: () => number[]
  /** The height it rests at now. */
  index: () => number
  open: () => boolean
  /** Asked to rest at height `i`. */
  change: (i: number) => void
  /** Asked to close. */
  close: () => void
  /** The height a drag or a settle aims at, for the grabber's look. */
  target: (i: number) => void
  dragging: (on: boolean) => void
  /** Text for the polite live region. */
  say: (text: string) => void
}

type PointerLike = { pointerType: string; button: number; target: EventTarget | null; clientY: number; pointerId: number }
type KeyLike = { key: string; preventDefault(): void }

export function createDetentSheet(host: DetentHost) {
  let at = 0
  let aimed = -1
  let stopGlide = () => {}
  let unlisten = () => {}
  let opener: HTMLElement | null = null
  let drag: { y0: number; at0: number; start: number; pointer: number; live: boolean; speed: ReturnType<typeof speedTracker> } | null = null
  const top = () => host.heights().length - 1

  const paint = (v: number) => {
    at = v
    const hs = host.heights()
    const panel = host.panel()
    if (!panel) return
    panel.style.transform = `translateY(${hs[hs.length - 1] - v}px)`
    // The dim follows the height between the two highest, so it never jumps.
    const lo = hs.length > 1 ? hs[hs.length - 2] : 0
    const dim = Math.max(0, Math.min(1, (v - lo) / (hs[hs.length - 1] - lo || 1)))
    host.overlay()?.style.setProperty('opacity', String(dim))
  }

  const settle = (to: number, v: number, done?: () => void) => {
    stopGlide()
    stopGlide = release(at, to, v, paint, done)
  }

  const shownHidden = () => {
    const active = document.activeElement as HTMLElement | null
    return !!active && !!host.body()?.contains(active) && active.getBoundingClientRect().top > window.innerHeight - 8
  }

  const go = (i: number, v = 0, spoken = true) => {
    const hs = host.heights()
    if (i < 0) {
      // A glide carries it off at the hand's speed, so the CSS close stays out of the way.
      host.panel()?.setAttribute('data-fluid', '')
      settle(0, v)
      host.close()
      requestAnimationFrame(() => {
        if (host.open()) {
          host.panel()?.removeAttribute('data-fluid')
          settle(host.heights()[host.index()], 0)
        }
      })
      return
    }
    aimed = i
    host.target(i)
    if (i !== host.index()) {
      host.change(i)
      if (spoken) host.say(`${DETENT_NAME[host.order()[i]]} height`)
    }
    // Shrunk below a focused control: focus goes to the grabber, so it never sits on something hidden.
    settle(hs[i], v, () => shownHidden() && host.grabber()?.focus({ preventScroll: true }))
  }

  // The hand often leaves the sheet before the drag counts as one, so the moves are followed on the window.
  const block = (e: Event) => e.preventDefault()

  const endDrag = () => {
    drag = null
    unlisten()
  }

  const onMove = (e: PointerEvent) => {
    const d = drag
    const hs = host.heights()
    if (!d || d.pointer !== e.pointerId) return
    const dy = d.y0 - e.clientY
    if (!d.live) {
      if (Math.abs(dy) < SLOP) return
      if (host.body()?.contains(e.target as Node) && host.index() === top() && dy > 0) return endDrag()
      // A tap must not stop a settle half way, so the glide is caught only once it is a drag.
      stopGlide()
      d.live = true
      d.at0 = at
      d.start = nearest(at, hs)
      d.speed.add(at)
      d.y0 = e.clientY + (dy > 0 ? SLOP : -SLOP)
      // Only now, so a tap on a button inside still clicks it.
      const panel = host.panel()
      if (e.target instanceof Element && panel?.contains(e.target)) panel.setPointerCapture?.(e.pointerId)
      window.addEventListener('selectstart', block)
      host.dragging(true)
    }
    // A drag moves the sheet, never selects the page's text: a selection left over from one drag
    // would turn the next press on it into the browser's own drag, which cancels the pointer. Safari
    // keeps growing the selection it began on the press, so it is cleared on every move.
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) selection.removeAllRanges()
    let raw = d.at0 + (d.y0 - e.clientY)
    const full = hs[hs.length - 1]
    if (raw > full) raw = full + rubber(raw - full, window.innerHeight - full)
    if (raw < 0) raw = 0
    d.speed.add(raw)
    paint(raw)
    host.target(pick(raw, d.speed.speed(), d.start, hs))
  }

  const onUp = (e: PointerEvent) => {
    const d = drag
    if (!d || d.pointer !== e.pointerId) return
    endDrag()
    if (!d.live) return
    host.dragging(false)
    const hs = host.heights()
    const cancelled = e.type === 'pointercancel'
    const v = cancelled ? 0 : d.speed.speed()
    if (!cancelled && d.start === 0 && (v < -FLICK || at < hs[0] * 0.5)) return go(-1, v)
    go(pick(at, v, d.start, hs), v)
  }

  return {
    /** Call as it opens, before focus moves: it remembers the opener and starts fresh. */
    opening() {
      opener = returnTarget()
      aimed = -1
    },
    /** Call once it is in the page, and when the height or the screen changes. */
    sync(initialFocus?: HTMLElement | null) {
      const i = host.index()
      const hs = host.heights()
      if (aimed === -1) {
        aimed = i
        host.target(i)
        paint(hs[i])
        if (i !== top()) (initialFocus ?? host.grabber())?.focus({ preventScroll: true })
        return
      }
      if (drag?.live) return
      if (aimed !== i) {
        aimed = i
        host.target(i)
        settle(hs[i], 0)
      } else paint(hs[i])
    },
    /** Call once it has closed: focus goes back to its opener. */
    closed() {
      const panel = host.panel()
      const active = document.activeElement
      if (panel && opener?.isConnected && (!active || active === document.body || panel.contains(active))) opener.focus({ preventScroll: true })
    },
    /** Esc: down one height, and closed from the lowest. */
    stepDown: () => (host.index() > 0 ? go(host.index() - 1) : host.close()),
    /** The panel's pointerdown. */
    down(e: PointerLike) {
      if ((e.pointerType === 'mouse' && e.button !== 0) || drag) return
      const el = e.target as Element
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return
      const hs = host.heights()
      const body = host.body()
      // At the top the content scrolls; a drag on it moves the sheet only from the top of the content.
      if (body?.contains(el) && host.index() === top() && (body.scrollTop ?? 0) > 0) return
      drag = { y0: e.clientY, at0: at, start: nearest(at, hs), pointer: e.pointerId, live: false, speed: speedTracker() }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
      window.addEventListener('dragstart', block)
      // Safari starts a text selection on the press itself, so a press outside the content (the grabber,
      // the edges) blocks it at once. Text in the content can still be selected by dragging inside it.
      if (!body?.contains(el)) window.addEventListener('selectstart', block)
      unlisten = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        window.removeEventListener('dragstart', block)
        window.removeEventListener('selectstart', block)
      }
    },
    /** The grabber's keydown: it is a slider for the height. */
    grabKey(e: KeyLike) {
      const i = host.index()
      const t = top()
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        return go(i === t ? 0 : i + 1, 0, false)
      }
      const keys: Record<string, number> = { ArrowUp: i + 1, ArrowRight: i + 1, ArrowDown: i - 1, ArrowLeft: i - 1, Home: 0, End: t, PageUp: t, PageDown: 0 }
      if (!(e.key in keys)) return
      e.preventDefault()
      go(Math.max(0, Math.min(t, keys[e.key])), 0, false)
    },
    /** The grabber's click: up one height, and from the top back to the lowest. */
    grabClick: () => go(host.index() === top() ? 0 : host.index() + 1),
    /** The panel's focusin: tabbing onto a control hidden below the screen's edge grows the sheet to the top, so it shows. */
    focusIn(target: EventTarget | null) {
      if (!host.body()?.contains(target as Node) || host.index() === top()) return
      if ((target as Element).getBoundingClientRect().bottom > window.innerHeight - 4) go(top())
    },
    /** A touch at the top of the content, moving down, belongs to the sheet: the browser would scroll it. Returns a stop. */
    holdTouch(body: HTMLElement) {
      let y = 0
      const start = (e: TouchEvent) => (y = e.touches[0].clientY)
      const move = (e: TouchEvent) => {
        if (drag?.live || (host.index() === top() && body.scrollTop <= 0 && e.touches[0].clientY > y)) e.preventDefault()
      }
      body.addEventListener('touchstart', start, { passive: true })
      body.addEventListener('touchmove', move, { passive: false })
      return () => {
        body.removeEventListener('touchstart', start)
        body.removeEventListener('touchmove', move)
      }
    },
    destroy() {
      stopGlide()
      unlisten()
    },
  }
}
