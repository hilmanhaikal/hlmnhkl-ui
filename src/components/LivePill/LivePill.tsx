'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { motionMs } from '../../internal/motion'
import { useControllable } from '../../internal/useControllable'
import styles from './LivePill.module.css'

export type LivePillProps = Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> & {
  /** Screen reader name of the pill, the whole state in words, such as "Map download, 63%". */
  label: string
  /** What the small pill shows, such as an icon, a word and a number. It stays on its spot when the pill opens. */
  compact: ReactNode
  /** What the open card shows above (or below) the pill's own row. */
  children: ReactNode
  /** Whether it is open, when you control it. */
  open?: boolean
  /** Starting open state when you do not control it. */
  defaultOpen?: boolean
  /** Called with the new open state. */
  onOpenChange?: (open: boolean) => void
  /** Where it sits. At the bottom it is in thumb reach and grows up; at the top it grows down. */
  placement?: 'bottom' | 'top'
  /** Pins it to the screen edge, clear of the safe area. Leave off to place it yourself. */
  fixed?: boolean
  /** From 0 to 1: the pill fills from its start like a progress bar, and its words change ink under the fill. */
  progress?: number
  /** "paper" is a light pill with an outline; "ink" is a solid dark one. */
  tone?: 'paper' | 'ink'
  /** News for screen readers, said once each time it changes, such as "Download paused". Never a ticking number. */
  news?: string
  /** News that opens the pill by itself, such as "Rider is at your door". Said once, and the pill shrinks back after alertMs. */
  alert?: string
  /** How long an alert keeps it open, in ms. A hand or focus on the pill holds it open. */
  alertMs?: number
}

// What the pill can hand focus to when it closes from a tap outside, so a tap on another control keeps it.
const TAKES_FOCUS = 'a[href], button, input, select, textarea, label, [tabindex]:not([tabindex="-1"])'

export function LivePill({
  label,
  compact,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom',
  fixed = false,
  progress,
  tone = 'paper',
  news,
  alert,
  alertMs = 5000,
  className,
  style,
  ...rest
}: LivePillProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const shell = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const [shut, setShut] = useState<string>()
  const [rowH, setRowH] = useState<number>()
  const [byAlert, setByAlert] = useState(false)
  const [held, setHeld] = useState(false)
  const [said, setSaid] = useState('')
  const lastNews = useRef(news)
  const lastAlert = useRef(alert)

  // Shut, the card is cut back to the button's own box, so the pill grows out of its own spot.
  useLayoutEffect(() => {
    const sh = shell.current
    const b = button.current
    if (!sh || !b) return
    const measure = () => {
      // Real fractions, not whole pixels: a half-pixel miss shows as an outline thin on one side and thick on the other.
      const s = sh.getBoundingClientRect()
      const r = b.getBoundingClientRect()
      setShut(`inset(${r.top - s.top}px ${s.right - r.right}px ${s.bottom - r.bottom}px ${r.left - s.left}px round ${r.height / 2}px)`)
      const row = b.parentElement as HTMLElement
      setRowH(row.offsetHeight)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(sh)
    ro.observe(b)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (news === lastNews.current) return
    lastNews.current = news
    if (news) setSaid(news)
  }, [news])

  useEffect(() => {
    if (alert === lastAlert.current) return
    lastAlert.current = alert
    if (!alert) return
    setSaid(alert)
    // Only a card the alert opened shrinks back by itself; one the person opened stays.
    if (open) return
    setByAlert(true)
    setOpen(true)
  }, [alert, setOpen])

  const close = (refocus: boolean) => {
    setByAlert(false)
    setOpen(false)
    if (refocus) button.current?.focus({ preventScroll: true })
  }
  const focusInside = () => !!shell.current?.contains(document.activeElement) && document.activeElement !== button.current

  useEffect(() => {
    if (!open) {
      setByAlert(false)
      return
    }
    const outside = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null
      if (!target || shell.current?.contains(target)) return
      const inside = focusInside()
      close(false)
      if (inside && !target.closest(TAKES_FOCUS)) window.setTimeout(() => button.current?.focus({ preventScroll: true }))
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  useEffect(() => {
    if (!open || !byAlert || held) return
    const t = window.setTimeout(() => close(focusInside()), Math.max(alertMs, motionMs('liquid')))
    return () => window.clearTimeout(t)
  }, [open, byAlert, held, alertMs])

  const p = progress === undefined ? undefined : Math.min(1, Math.max(0, progress))
  const vars = { '--pill-shut': shut, '--pill-row': rowH === undefined ? undefined : `${rowH}px`, '--p': p, ...style } as CSSProperties

  return (
    <div className={cx(styles.root, className)} data-placement={placement} data-fixed={fixed || undefined} style={vars} {...rest}>
      <div
        ref={shell}
        className={styles.shell}
        data-open={open || undefined}
        data-measured={shut ? '' : undefined}
        data-tone={tone}
        onKeyDown={(e) => {
          if (e.key !== 'Escape' || !open) return
          e.stopPropagation()
          close(true)
        }}
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeld(false)
        }}
      >
        <div className={styles.row}>
          <button ref={button} type="button" className={styles.button} data-fill={p === undefined ? undefined : ''} aria-expanded={open} aria-label={label} onClick={() => (open ? close(false) : setOpen(true))}>
            {p === undefined ? (
              <span className={styles.face}>{compact}</span>
            ) : (
              <span className={styles.stack}>
                <span className={styles.face}>{compact}</span>
                <span className={cx(styles.face, styles.over)} aria-hidden="true">
                  {compact}
                </span>
              </span>
            )}
          </button>
        </div>
        <div className={styles.body} inert={!open} aria-hidden={!open || undefined}>
          {children}
        </div>
      </div>
      <span className={styles.sr} role="status" aria-live="polite" aria-atomic="true">
        {said}
      </span>
    </div>
  )
}
