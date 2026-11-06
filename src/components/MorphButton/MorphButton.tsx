'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { cx } from '../../internal/cx'
import { focusables } from '../../internal/focus'
import { XIcon } from '../../internal/icons'
import { useDismiss } from '../../internal/layers'
import { useControllable } from '../../internal/useControllable'
import styles from './MorphButton.module.css'

export type MorphButtonProps = {
  /** The button's text. It stays on the same spot and becomes the panel's title and name. */
  label: ReactNode
  /** Icon before the label. */
  icon?: ReactNode
  /** What the panel holds, such as a short form or a list of choices. */
  children: ReactNode
  /** Whether the panel is open, when you control it. */
  open?: boolean
  /** Starting open state when you do not control it. */
  defaultOpen?: boolean
  /** Called with the new open state. */
  onOpenChange?: (open: boolean) => void
  /** How wide the panel grows. It never runs past the edge of the screen. */
  width?: 'sm' | 'md'
  /** Screen reader name for the close button. */
  closeLabel?: string
  /** Element to focus when it opens. Defaults to the first control in the panel. */
  initialFocus?: RefObject<HTMLElement | null>
  /** Extra class for the outer box, which keeps the button's place in the page. */
  className?: string
}

type Corner = 'tl' | 'tr' | 'bl' | 'br'

// The space kept between the panel and the edge of the screen.
const EDGE = 16

export function MorphButton({
  label,
  icon,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  width = 'sm',
  closeLabel = 'Close',
  initialFocus,
  className,
}: MorphButtonProps) {
  const id = useId()
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange)
  const [corner, setCorner] = useState<Corner>('tl')
  const [room, setRoom] = useState<number>()
  const [box, setBox] = useState({ tw: 0, th: 0, pw: 0, ph: 0 })
  const anchorRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const t = triggerRef.current
    const s = shellRef.current
    if (!t || !s) return
    const measure = () => setBox({ tw: t.offsetWidth, th: t.offsetHeight, pw: s.offsetWidth, ph: s.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(t)
    ro.observe(s)
    return () => ro.disconnect()
  }, [])

  // It grows toward the side with room, decided before the move starts and never during it.
  const place = () => {
    const a = anchorRef.current?.getBoundingClientRect()
    const s = shellRef.current
    if (!a || !s) return
    const right = window.innerWidth - EDGE - a.left
    const left = a.right - EDGE
    const below = window.innerHeight - EDGE - a.top
    const above = a.bottom - EDGE
    const flipX = right < box.pw && left > right
    const up = below < box.ph && above > below
    setCorner(`${up ? 'b' : 't'}${flipX ? 'r' : 'l'}` as Corner)
    setRoom(Math.max(box.tw, flipX ? left : right))
  }

  const show = (next: boolean) => {
    if (next) place()
    setOpen(next)
  }
  const backToButton = () => triggerRef.current?.focus({ preventScroll: true })

  // A controlled open from outside picks its side too.
  useLayoutEffect(() => {
    if (open) place()
  }, [open])

  useEffect(() => {
    if (!open || !panelRef.current) return
    const first = initialFocus?.current ?? focusables(panelRef.current).find((el) => !el.hasAttribute('data-skip-initial-focus')) ?? panelRef.current
    first.focus({ preventScroll: true })
  }, [open])

  // Esc, a press outside, or focus moving on closes it. A layer it opened, such as a Select's list, is
  // above it, so picking there does not count. Focus goes back to the button unless the press landed on
  // something that takes focus itself.
  useDismiss(
    open,
    [shellRef],
    (reason, e) => {
      setOpen(false)
      const target = e.target instanceof Element ? e.target : null
      if (reason === 'escape') backToButton()
      else if (e.type === 'pointerdown' && !target?.closest('a[href], button, input, select, textarea, label, [tabindex]:not([tabindex="-1"])')) window.setTimeout(backToButton)
    },
    { focusOut: true },
  )

  // Shut, the surface is cut back to the button's own box in the chosen corner.
  const dx = Math.max(0, box.pw - box.tw)
  const dy = Math.max(0, box.ph - box.th)
  const shut = { tl: [0, dx, dy, 0], tr: [0, 0, dy, dx], bl: [dy, dx, 0, 0], br: [dy, 0, 0, dx] }[corner]
  const [t, r, b, l] = open ? [0, 0, 0, 0] : shut
  const vars = {
    '--t': `${t}px`,
    '--r': `${r}px`,
    '--b': `${b}px`,
    '--l': `${l}px`,
    '--pill': `${box.th / 2}px`,
    maxWidth: room,
  } as CSSProperties

  return (
    <div ref={anchorRef} className={cx(styles.anchor, className)} style={{ width: box.tw || undefined, height: box.th || undefined }}>
      <div ref={shellRef} className={styles.shell} data-open={open || undefined} data-corner={corner} data-width={width} style={vars}>
        <div className={styles.surface} aria-hidden="true" />
        <div className={styles.content}>
          <button
            ref={triggerRef}
            type="button"
            className={styles.trigger}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-controls={`${id}-panel`}
            onClick={() => show(!open)}
          >
            {icon && (
              <span className={styles.icon} aria-hidden="true">
                {icon}
              </span>
            )}
            <span id={`${id}-label`}>{label}</span>
          </button>
          <div ref={panelRef} id={`${id}-panel`} role="dialog" aria-labelledby={`${id}-label`} tabIndex={-1} className={styles.panel} inert={!open} aria-hidden={!open || undefined}>
            <button
              type="button"
              className={styles.close}
              aria-label={closeLabel}
              data-skip-initial-focus
              onClick={() => {
                setOpen(false)
                backToButton()
              }}
            >
              <XIcon />
            </button>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
