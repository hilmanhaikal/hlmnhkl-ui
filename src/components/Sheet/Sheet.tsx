'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from 'react'
import { cx } from '../../internal/cx'
import { readMotionMs } from '../../internal/motion'
import { rubber, speedTracker, spring, useFling } from '../../internal/spring'
import { returnTarget, useFocusTrap } from '../../internal/focus'
import { XIcon } from '../../internal/icons'
import { useDismiss, useScrollLock } from '../../internal/layers'
import { Portal } from '../../internal/Portal'
import { usePresence } from '../../internal/usePresence'
import styles from './Sheet.module.css'

/** A height a sheet can rest at: low with only its title showing, half the screen, or nearly all of it. */
export type SheetDetent = 'peek' | 'half' | 'full'

export type SheetProps = {
  /** Whether the sheet is open. You always control it. */
  open: boolean
  /** Called when the sheet asks to close, by Esc, outside tap, drag or close button, with false. */
  onOpenChange: (open: boolean) => void
  /** Visible heading, also the dialog's accessible name. */
  title: ReactNode
  /** Text under the title, also read as the dialog's description. */
  description?: ReactNode
  /** Main content of the sheet. */
  children?: ReactNode
  /** Sticky actions at the bottom of the sheet. */
  footer?: ReactNode
  /** Screen reader name for the close button. */
  closeLabel?: string
  /** Element to focus first. Defaults to the first focusable element in the content. */
  initialFocus?: RefObject<HTMLElement | null>
  /** Extra class for the panel. */
  className?: string
  /** Heights the sheet rests at, such as ['peek', 'half', 'full']. Below the highest one it is not modal: the page behind stays usable. */
  detents?: SheetDetent[]
  /** The height it rests at, when you control it. */
  detent?: SheetDetent
  /** The height it opens at when you do not control it. Defaults to the lowest. */
  defaultDetent?: SheetDetent
  /** Called with the new height after a drag, a tap or a key on the grabber, or Esc. */
  onDetentChange?: (detent: SheetDetent) => void
  /** Screen reader name for the grabber, which sets the height. */
  heightLabel?: string
}

type BaseProps = Omit<SheetProps, 'detents' | 'detent' | 'defaultDetent' | 'onDetentChange' | 'heightLabel' | 'closeLabel'> & { closeLabel: string }

/** With detents, the grabber becomes a control for the height, and the sheet is modal only at its highest. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel = 'Close',
  initialFocus,
  className,
  detents,
  detent,
  defaultDetent,
  onDetentChange,
  heightLabel = 'Sheet height',
}: SheetProps) {
  const base = { open, onOpenChange, title, description, children, footer, closeLabel, initialFocus, className }
  if (!detents?.length) return <PlainSheet {...base} />
  return <DetentSheet {...base} detents={detents} detent={detent} defaultDetent={defaultDetent} onDetentChange={onDetentChange} heightLabel={heightLabel} />
}

const CLOSE_RATIO = 0.3
// px per second: a flick down this fast closes the sheet from anywhere.
const CLOSE_SPEED = 500

function PlainSheet({ open, onOpenChange, title, description, children, footer, closeLabel, initialFocus, className }: BaseProps) {
  const id = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number; dy: number; pointer: number; speed: ReturnType<typeof speedTracker> } | null>(null)
  const { mounted, state } = usePresence(open, 'slow')
  const openRef = useRef(open)
  openRef.current = open
  const { at, paint, fling, stop } = useFling(panelRef, open, 'y')

  useScrollLock(open)
  useDismiss(open, [panelRef], () => onOpenChange(false))
  useFocusTrap(panelRef, open && mounted, { initialFocus })

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    stop()
    // Caught mid-spring, it carries on from where it is.
    drag.current = { y: e.clientY - at.current, dy: at.current, pointer: e.pointerId, speed: speedTracker() }
    drag.current.speed.add(at.current)
    e.currentTarget.setPointerCapture(e.pointerId)
    panelRef.current?.setAttribute('data-dragging', '')
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const panel = panelRef.current
    if (!d || !panel || d.pointer !== e.pointerId) return
    const raw = e.clientY - d.y
    d.dy = raw >= 0 ? raw : rubber(raw, panel.offsetHeight)
    d.speed.add(d.dy)
    paint(d.dy)
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const panel = panelRef.current
    drag.current = null
    if (!d || !panel) return
    e.currentTarget.releasePointerCapture(d.pointer)
    panel.removeAttribute('data-dragging')
    const cancelled = e.type === 'pointercancel'
    const speed = cancelled ? 0 : d.speed.speed()
    const h = panel.offsetHeight
    if (!cancelled && (d.dy > h * CLOSE_RATIO || (speed > CLOSE_SPEED && d.dy > 24))) {
      fling(h, speed)
      onOpenChange(false)
      // If the parent keeps it open, it springs back.
      requestAnimationFrame(() => {
        if (openRef.current) fling(0, 0)
      })
    } else fling(0, speed)
  }

  if (!mounted) return null
  return (
    <Portal>
      <div className={styles.overlay} data-state={state} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        className={cx(styles.sheet, className)}
        data-state={state}
        onAnimationEnd={(e) => {
          if (e.target === panelRef.current && state === 'open') panelRef.current.style.transform = ''
        }}
      >
        <div
          className={styles.grab}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className={styles.handle} aria-hidden="true" />
          <header className={styles.header}>
            <div className={styles.titles}>
              <h2 id={`${id}-title`} className={styles.title}>{title}</h2>
              {description && <p id={`${id}-desc`} className={styles.description}>{description}</p>}
            </div>
            <button type="button" className={styles.close} aria-label={closeLabel} data-skip-initial-focus onClick={() => onOpenChange(false)}>
              <XIcon />
            </button>
          </header>
        </div>
        {children && <div className={styles.body}>{children}</div>}
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </Portal>
  )
}

// Shares of the screen, from the heights Apple Maps on the web and Vaul rest at.
const SHARE: Record<SheetDetent, number> = { peek: 0.19, half: 0.5, full: 0.96 }
const ORDER: SheetDetent[] = ['peek', 'half', 'full']
const NAME: Record<SheetDetent, string> = { peek: 'Low', half: 'Half', full: 'Full' }
// px per second: faster than this, a let-go is a flick and moves one height its way.
const FLICK = 400
// How far ahead, in seconds, a slow let-go is carried before the nearest height is picked.
const PROJECT = 0.2
// A press is not a drag until it moves this far, so taps on the content still work.
const SLOP = 6

const nearest = (v: number, hs: number[]) => hs.reduce((best, h, i) => (Math.abs(h - v) < Math.abs(hs[best] - v) ? i : best), 0)

// A flick moves one height from where the drag began, never two, even when the hand has already
// passed the next one. Real sheets measured all do this.
function pick(pos: number, v: number, start: number, hs: number[]) {
  if (Math.abs(v) <= FLICK) return nearest(pos + v * PROJECT, hs)
  return Math.max(0, Math.min(hs.length - 1, start + Math.sign(v)))
}

type DetentProps = BaseProps & Required<Pick<SheetProps, 'detents' | 'heightLabel'>> & Pick<SheetProps, 'detent' | 'defaultDetent' | 'onDetentChange'>

function DetentSheet({ open, onOpenChange, title, description, children, footer, closeLabel, initialFocus, className, detents, detent, defaultDetent, onDetentChange, heightLabel }: DetentProps) {
  const id = useId()
  const order = ORDER.filter((d) => detents.includes(d))
  const top = order.length - 1
  const [inner, setInner] = useState<SheetDetent>(defaultDetent ?? order[0])
  const index = Math.max(0, order.indexOf(detent ?? inner))
  const atTop = index === top
  const { mounted, state } = usePresence(open, 'slow')
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 0 : window.innerHeight))
  const heights = order.map((d) => Math.round(vh * SHARE[d]))
  const [dragging, setDragging] = useState(false)
  const [target, setTarget] = useState(index)
  const [said, setSaid] = useState('')

  const panelRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const grabRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const at = useRef(0)
  const aimed = useRef(-1)
  const stopSpring = useRef(() => {})
  const unlisten = useRef(() => {})
  const opener = useRef<HTMLElement | null>(null)
  const trapStart = useRef<HTMLElement | null>(null)
  const drag = useRef<{ y0: number; at0: number; start: number; pointer: number; live: boolean; speed: ReturnType<typeof speedTracker> } | null>(null)
  const live = useRef({ heights, index, open })
  live.current = { heights, index, open }

  const change = (i: number) => {
    if (detent === undefined) setInner(order[i])
    onDetentChange?.(order[i])
  }

  const paint = (v: number) => {
    at.current = v
    const hs = live.current.heights
    const panel = panelRef.current
    if (!panel) return
    panel.style.transform = `translateY(${hs[hs.length - 1] - v}px)`
    // The dim follows the height between the two highest, so it never jumps.
    const lo = hs.length > 1 ? hs[hs.length - 2] : 0
    const dim = Math.max(0, Math.min(1, (v - lo) / (hs[hs.length - 1] - lo || 1)))
    overlayRef.current?.style.setProperty('opacity', String(dim))
  }

  // No bounce at a height: critically damped, and never thrown at it faster than it can stop.
  const settle = (to: number, v: number, done?: () => void) => {
    stopSpring.current()
    const period = readMotionMs('fling') / 1000
    const d = at.current - to
    const toward = Math.sign(v) === -Math.sign(d)
    const w = period ? (2 * Math.PI) / period : 0
    const speed = toward ? Math.sign(v) * Math.min(Math.abs(v), w * Math.abs(d)) : v
    stopSpring.current = spring(at.current, to, speed, paint, done, 1)
  }

  const shownHidden = () => {
    const active = document.activeElement as HTMLElement | null
    return !!active && !!bodyRef.current?.contains(active) && active.getBoundingClientRect().top > window.innerHeight - 8
  }

  const go = (i: number, v = 0, spoken = true) => {
    const hs = live.current.heights
    if (i < 0) {
      // A spring carries it off at the hand's speed, so the CSS close stays out of the way.
      panelRef.current?.setAttribute('data-fluid', '')
      settle(0, v)
      onOpenChange(false)
      requestAnimationFrame(() => {
        if (live.current.open) {
          panelRef.current?.removeAttribute('data-fluid')
          settle(hs[live.current.index], 0)
        }
      })
      return
    }
    aimed.current = i
    setTarget(i)
    if (i !== live.current.index) {
      change(i)
      if (spoken) setSaid(`${NAME[order[i]]} height`)
    }
    // Shrunk below a focused control: focus goes to the grabber, so it never sits on something hidden.
    settle(hs[i], v, () => shownHidden() && grabRef.current?.focus({ preventScroll: true }))
  }

  const stepDown = () => (live.current.index > 0 ? go(live.current.index - 1) : onOpenChange(false))

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    opener.current = returnTarget()
    aimed.current = -1
  }, [open])

  useLayoutEffect(() => {
    if (!open || !mounted) return
    if (aimed.current === -1) {
      aimed.current = index
      setTarget(index)
      paint(heights[index])
      if (!atTop) (initialFocus?.current ?? grabRef.current)?.focus({ preventScroll: true })
      return
    }
    if (drag.current?.live) return
    if (aimed.current !== index) {
      aimed.current = index
      setTarget(index)
      settle(heights[index], 0)
    } else paint(heights[index])
  }, [open, mounted, index, vh])

  // Closed, it gives focus back to its opener, and opens next time at the default height.
  useEffect(() => {
    if (open) return
    setInner(defaultDetent ?? order[0])
    const panel = panelRef.current
    const active = document.activeElement
    if (panel && opener.current?.isConnected && (!active || active === document.body || panel.contains(active))) opener.current.focus({ preventScroll: true })
  }, [open])

  useEffect(() => () => stopSpring.current(), [])

  // Before the trap's own effect: at the top, focus stays where it is in the sheet.
  useLayoutEffect(() => {
    if (!atTop || !open) return
    const active = document.activeElement as HTMLElement | null
    trapStart.current = active && panelRef.current?.contains(active) ? active : (initialFocus?.current ?? null)
  }, [atTop, open])
  useScrollLock(open && atTop)
  useFocusTrap(panelRef, open && mounted && atTop, { initialFocus: trapStart, restore: false })
  useDismiss(open, [panelRef], stepDown, { outside: atTop })

  const onPointerMove = (e: globalThis.PointerEvent) => {
    const d = drag.current
    const hs = live.current.heights
    if (!d || d.pointer !== e.pointerId) return
    const dy = d.y0 - e.clientY
    if (!d.live) {
      if (Math.abs(dy) < SLOP) return
      if (bodyRef.current?.contains(e.target as Node) && live.current.index === top && dy > 0) return endDrag()
      // A tap must not stop a settle half way, so the spring is caught only once it is a drag.
      stopSpring.current()
      d.live = true
      d.at0 = at.current
      d.start = nearest(at.current, hs)
      d.speed.add(at.current)
      d.y0 = e.clientY + (dy > 0 ? SLOP : -SLOP)
      // Only now, so a tap on a button inside still clicks it.
      if (e.target instanceof Element && panelRef.current?.contains(e.target)) panelRef.current.setPointerCapture?.(e.pointerId)
      window.addEventListener('selectstart', block)
      setDragging(true)
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
    const next = pick(raw, d.speed.speed(), d.start, hs)
    setTarget((t) => (t === next ? t : next))
  }

  const onPointerUp = (e: globalThis.PointerEvent) => {
    const d = drag.current
    if (!d || d.pointer !== e.pointerId) return
    endDrag()
    if (!d.live) return
    setDragging(false)
    const hs = live.current.heights
    const cancelled = e.type === 'pointercancel'
    const v = cancelled ? 0 : d.speed.speed()
    const pos = at.current
    if (!cancelled && d.start === 0 && (v < -FLICK || pos < hs[0] * 0.5)) return go(-1, v)
    go(pick(pos, v, d.start, hs), v)
  }

  // The hand often leaves the sheet before the drag counts as one, so the moves are followed on the window.
  const block = (e: Event) => e.preventDefault()

  const endDrag = () => {
    drag.current = null
    unlisten.current()
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || drag.current) return
    const el = e.target as Element
    if (el.closest('input, textarea, select, [contenteditable="true"]')) return
    const hs = live.current.heights
    // At the top the content scrolls; a drag on it moves the sheet only from the top of the content.
    if (bodyRef.current?.contains(el) && live.current.index === top && (bodyRef.current?.scrollTop ?? 0) > 0) return
    drag.current = { y0: e.clientY, at0: at.current, start: nearest(at.current, hs), pointer: e.pointerId, live: false, speed: speedTracker() }
    const move = onPointerMove
    const up = onPointerUp
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('dragstart', block)
    unlisten.current = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('dragstart', block)
      window.removeEventListener('selectstart', block)
    }
  }

  useEffect(() => () => unlisten.current(), [])

  // A touch at the top of the content, moving down, belongs to the sheet: the browser would scroll it.
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    let y = 0
    const start = (e: TouchEvent) => (y = e.touches[0].clientY)
    const move = (e: TouchEvent) => {
      if (drag.current?.live || (live.current.index === live.current.heights.length - 1 && body.scrollTop <= 0 && e.touches[0].clientY > y)) e.preventDefault()
    }
    body.addEventListener('touchstart', start, { passive: true })
    body.addEventListener('touchmove', move, { passive: false })
    return () => {
      body.removeEventListener('touchstart', start)
      body.removeEventListener('touchmove', move)
    }
  }, [mounted])

  const onGrabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = live.current.index
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      return go(i === top ? 0 : i + 1, 0, false)
    }
    const keys: Record<string, number> = { ArrowUp: i + 1, ArrowRight: i + 1, ArrowDown: i - 1, ArrowLeft: i - 1, Home: 0, End: top, PageUp: top, PageDown: 0 }
    if (!(e.key in keys)) return
    e.preventDefault()
    go(Math.max(0, Math.min(top, keys[e.key])), 0, false)
  }

  // Tabbing onto a control hidden below the screen's edge grows the sheet to the top, so it shows.
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    if (!bodyRef.current?.contains(e.target) || live.current.index === top) return
    if (e.target.getBoundingClientRect().bottom > window.innerHeight - 4) go(top)
  }

  if (!mounted) return null
  const shown = order[dragging ? target : index]
  return (
    <Portal>
      <div ref={overlayRef} className={styles.overlay} data-state={state} data-detents data-top={atTop || undefined} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={atTop || undefined}
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        id={`${id}-sheet`}
        className={cx(styles.sheet, className)}
        data-state={state}
        data-detents
        data-top={atTop || undefined}
        data-dragging={dragging || undefined}
        style={{ height: heights[top] }}
        onPointerDown={onPointerDown}
        onFocus={onFocus}
      >
        <div
          ref={grabRef}
          className={styles.grabber}
          role="slider"
          tabIndex={0}
          aria-label={heightLabel}
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={top}
          aria-valuenow={index}
          aria-valuetext={NAME[order[index]]}
          aria-controls={`${id}-sheet`}
          data-detent={shown}
          onKeyDown={onGrabKey}
          onClick={() => go(index === top ? 0 : index + 1)}
        >
          <span className={styles.pill} />
        </div>
        <header className={styles.header}>
          <div className={styles.titles}>
            <h2 id={`${id}-title`} className={styles.title}>{title}</h2>
            {description && <p id={`${id}-desc`} className={styles.description}>{description}</p>}
          </div>
          <button type="button" className={styles.close} aria-label={closeLabel} data-skip-initial-focus onClick={() => onOpenChange(false)}>
            <XIcon />
          </button>
        </header>
        {children && <div ref={bodyRef} className={styles.body}>{children}</div>}
        {footer && <footer className={styles.footer}>{footer}</footer>}
        <p className={styles.srOnly} aria-live="polite">{said}</p>
      </div>
    </Portal>
  )
}
