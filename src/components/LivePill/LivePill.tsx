'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { CheckIcon } from '../../internal/icons'
import { focusInCard, measurePill, pillAlertTimer, pillOutside, pillVars } from '../../internal/motion/livePill'
import { useControllable } from '../../internal/useControllable'
import styles from './LivePill.module.css'

export type LivePillProps = Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> & {
  /** Screen reader name of the pill: start with the words it shows, then the rest of the state, such as "City map 63%, download". People using voice control say what they see. */
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
  /** "center" keeps the pill in the middle of its row, like a status bar. "start" puts it at the row's start edge, and the card grows from there. */
  align?: 'center' | 'start'
  /** Pins it to the screen edge, clear of the safe area. Leave off to place it yourself. */
  fixed?: boolean
  /** From 0 to 1: a ring at the pill's start shows it. Open, the ring grows on its spot with the percent inside. */
  progress?: number
  /** "done" closes the ring into a tick (also at progress 1). "stopped" turns it red with a mark; say why in the words. */
  status?: 'done' | 'stopped'
  /** "paper" is a light pill with an outline; "ink" is a solid dark one. */
  tone?: 'paper' | 'ink'
  /** News for screen readers, said once each time it changes, such as "Download paused". Never a ticking number. */
  news?: string
  /** News that opens the pill by itself, such as "Rider is at your door". Said once, and the pill shrinks back after alertMs. */
  alert?: string
  /** How long an alert keeps it open, in ms. A hand or focus on the pill holds it open. */
  alertMs?: number
}

export function LivePill({
  label,
  compact,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom',
  align = 'center',
  fixed = false,
  progress,
  status,
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
  const [ringAt, setRingAt] = useState<[number, number]>()
  const slot = useRef<HTMLSpanElement>(null)
  const lead = useRef<HTMLSpanElement>(null)
  const [byAlert, setByAlert] = useState(false)
  const [held, setHeld] = useState(false)
  const [said, setSaid] = useState('')
  const lastNews = useRef(news)
  const lastAlert = useRef(alert)
  const openNow = useRef(open)
  openNow.current = open

  // Shut, the card is cut back to the button's own box, so the pill grows out of its own spot (motion/livePill.ts).
  useLayoutEffect(() => {
    const sh = shell.current
    const b = button.current
    if (!sh || !b) return
    return measurePill(sh, b, { slot: () => slot.current, lead: () => lead.current, isOpen: () => openNow.current }, (shape) => {
      setShut(shape.shut)
      if (shape.ringAt) setRingAt(shape.ringAt)
      setRowH(shape.rowH)
    })
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
  const focusInside = () => focusInCard(shell.current, button.current)

  useEffect(() => {
    if (!open) {
      setByAlert(false)
      return
    }
    return pillOutside(() => shell.current, () => button.current, () => close(false))
  }, [open])

  useEffect(() => {
    if (!open || !byAlert || held) return
    return pillAlertTimer(alertMs, () => close(focusInside()))
  }, [open, byAlert, held, alertMs])

  const p = progress === undefined ? undefined : Math.min(1, Math.max(0, progress))
  const state = status ?? (p === 1 ? 'done' : undefined)
  const ring = p !== undefined || state !== undefined
  const vars = { ...pillVars(shut, rowH, ringAt), ...style } as CSSProperties

  return (
    <div className={cx(styles.root, className)} data-placement={placement} data-align={align} data-ring={ring || undefined} data-fixed={fixed || undefined} style={vars} {...rest}>
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
        {ring && (
          <span ref={lead} className={styles.lead} data-state={state} aria-hidden="true">
            <svg className={styles.ring} viewBox="0 0 44 44">
              <circle className={styles.track} cx="22" cy="22" r="20" />
              <circle className={styles.arc} cx="22" cy="22" r="20" pathLength={100} strokeDasharray={`${state ? 100 : (p ?? 0) * 100} 100`} />
            </svg>
            {state === 'done' ? (
              <CheckIcon className={styles.mark} />
            ) : state === 'stopped' ? (
              <svg className={styles.mark} viewBox="0 0 24 24">
                <path d="M12 7v6M12 17v.01" />
              </svg>
            ) : (
              <span className={styles.pct}>{Math.round((p ?? 0) * 100)}%</span>
            )}
          </span>
        )}
        <div className={styles.row}>
          <button ref={button} type="button" className={styles.button} aria-expanded={open} aria-label={label} onClick={() => (open ? close(false) : setOpen(true))}>
            {ring && <span ref={slot} className={styles.slot} />}
            <span className={styles.face}>{compact}</span>
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
