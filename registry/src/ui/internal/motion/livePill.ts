// Gooee UI, MIT licence. https://gooee.dev
import { motionMs } from '../motion'

/** The pill's shut shape: the card cut back to the button's box, the ring's offset to its slot, the row's height. */
export type PillShape = { shut: string; ringAt?: [number, number]; rowH: number }

/**
 * Measures the shut shape now and on every resize, while the pill is shut. Open, the pill's button shrinks
 * to the ring, so the shut shape is read only while it is shut. Returns a stop function.
 */
export function measurePill(
  shell: HTMLElement,
  button: HTMLElement,
  parts: { slot: () => HTMLElement | null; lead: () => HTMLElement | null; isOpen: () => boolean },
  onShape: (shape: PillShape) => void,
) {
  const measure = () => {
    if (parts.isOpen()) return
    // Real fractions, not whole pixels: a half-pixel miss shows as an outline thin on one side and thick on the other.
    const s = shell.getBoundingClientRect()
    const r = button.getBoundingClientRect()
    // A page that scales its content (a zoom, an entrance) scales these boxes too; k turns them back into CSS pixels.
    const k = s.width / shell.offsetWidth || 1
    const shut = `inset(${(r.top - s.top) / k}px ${(s.right - r.right) / k}px ${(s.bottom - r.bottom) / k}px ${(r.left - s.left) / k}px round ${r.height / k / 2}px)`
    // Shut, the card's ring sits on the pill's ring slot: the distance between the two, read from layout.
    const sl = parts.slot()?.getBoundingClientRect()
    const ld = parts.lead()
    const ringAt: [number, number] | undefined = sl && ld ? [(sl.left - s.left) / k - ld.offsetLeft, (sl.top - s.top) / k - ld.offsetTop] : undefined
    onShape({ shut, ringAt, rowH: (button.parentElement as HTMLElement).offsetHeight })
  }
  measure()
  const ro = new ResizeObserver(measure)
  ro.observe(shell)
  ro.observe(button)
  return () => ro.disconnect()
}

/** The CSS variables that carry the shut shape. */
export const pillVars = (shut?: string, rowH?: number, ringAt?: [number, number]) => ({
  '--pill-shut': shut,
  '--pill-row': rowH === undefined ? undefined : `${rowH}px`,
  '--ring-x': ringAt && `${ringAt[0]}px`,
  '--ring-y': ringAt && `${ringAt[1]}px`,
})

// What the pill can hand focus to when it closes from a tap outside, so a tap on another control keeps it.
const TAKES_FOCUS = 'a[href], button, input, select, textarea, label, [tabindex]:not([tabindex="-1"])'

/** Whether focus is inside the open card (not on the pill's own button). */
export const focusInCard = (shell: HTMLElement | null, button: HTMLElement | null) => !!shell?.contains(document.activeElement) && document.activeElement !== button

/**
 * While open: a press outside folds it back. If focus was in the card and the press was not on another
 * control, focus goes back to the pill. Returns a stop function.
 */
export function pillOutside(shell: () => HTMLElement | null, button: () => HTMLElement | null, close: () => void) {
  const outside = (e: PointerEvent) => {
    const target = e.target instanceof Element ? e.target : null
    if (!target || shell()?.contains(target)) return
    const inside = focusInCard(shell(), button())
    close()
    if (inside && !target.closest(TAKES_FOCUS)) window.setTimeout(() => button()?.focus({ preventScroll: true }))
  }
  document.addEventListener('pointerdown', outside)
  return () => document.removeEventListener('pointerdown', outside)
}

/** A card an alert opened shrinks back after alertMs, never sooner than its own open motion. Returns a stop function. */
export function pillAlertTimer(alertMs: number, onDone: () => void) {
  const t = window.setTimeout(onDone, Math.max(alertMs, motionMs('liquid')))
  return () => window.clearTimeout(t)
}
