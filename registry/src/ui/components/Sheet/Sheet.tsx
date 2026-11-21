// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { cx } from '../../internal/cx'
import { useDragClose } from '../../internal/fling'
import { useFocusTrap } from '../../internal/focus'
import { XIcon } from '../../icons/icons'
import { createDetentSheet, DETENT_NAME, detentHeights, detentOrder, type SheetDetent } from '../../internal/motion/sheetDetents'
import { useDismiss, useScrollLock } from '../../internal/layers'
import { Portal } from '../../internal/Portal'
import { usePresence } from '../../internal/usePresence'
import styles from './Sheet.module.css'

export type { SheetDetent }

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
  /** Text for the sheet's controls, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<SheetLabels>
}

export type SheetLabels = {
  /** Screen reader name for the close button. */
  close: string
  /** Screen reader name for the grabber, which sets the height. */
  height: string
}

const defaultLabels: SheetLabels = { close: 'Close', height: 'Sheet height' }

type BaseProps = Omit<SheetProps, 'detents' | 'detent' | 'defaultDetent' | 'onDetentChange' | 'labels'> & { labels: SheetLabels }

/** With detents, the grabber becomes a control for the height, and the sheet is modal only at its highest. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  initialFocus,
  className,
  detents,
  detent,
  defaultDetent,
  onDetentChange,
  labels: labelsProp,
}: SheetProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const base = { open, onOpenChange, title, description, children, footer, labels, initialFocus, className }
  if (!detents?.length) return <PlainSheet {...base} />
  return <DetentSheet {...base} detents={detents} detent={detent} defaultDetent={defaultDetent} onDetentChange={onDetentChange} />
}

function PlainSheet({ open, onOpenChange, title, description, children, footer, labels, initialFocus, className }: BaseProps) {
  const id = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const { mounted, state } = usePresence(open, 'morph-out')
  const grab = useDragClose(panelRef, open, () => onOpenChange(false))

  useScrollLock(open)
  useDismiss(open, [panelRef], () => onOpenChange(false))
  useFocusTrap(panelRef, open && mounted, { initialFocus })

  if (!mounted) return null
  return (
    <Portal>
      <div className={styles.overlay} data-slot="sheet-overlay" data-state={state} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        className={cx(styles.sheet, className)}
        data-slot="sheet-content"
        data-state={state}
        onAnimationEnd={(e) => {
          if (e.target === panelRef.current && state === 'open') panelRef.current.style.transform = ''
        }}
      >
        <div
          className={styles.grab}
          {...grab}
        >
          <span className={styles.handle} data-slot="sheet-handle" aria-hidden="true" />
          <header className={styles.header} data-slot="sheet-header">
            <div className={styles.titles}>
              <h2 id={`${id}-title`} className={styles.title} data-slot="sheet-title">{title}</h2>
              {description && <p id={`${id}-desc`} className={styles.description} data-slot="sheet-description">{description}</p>}
            </div>
            <button type="button" className={styles.close} data-slot="sheet-close" aria-label={labels.close} data-skip-initial-focus onClick={() => onOpenChange(false)}>
              <XIcon />
            </button>
          </header>
        </div>
        {children && <div className={styles.body} data-slot="sheet-body">{children}</div>}
        {footer && <footer className={styles.footer} data-slot="sheet-footer">{footer}</footer>}
      </div>
    </Portal>
  )
}

type DetentProps = BaseProps & Required<Pick<SheetProps, 'detents'>> & Pick<SheetProps, 'detent' | 'defaultDetent' | 'onDetentChange'>

function DetentSheet({ open, onOpenChange, title, description, children, footer, labels, initialFocus, className, detents, detent, defaultDetent, onDetentChange }: DetentProps) {
  const id = useId()
  const order = detentOrder(detents)
  const top = order.length - 1
  const [inner, setInner] = useState<SheetDetent>(defaultDetent ?? order[0])
  const index = Math.max(0, order.indexOf(detent ?? inner))
  const atTop = index === top
  const { mounted, state } = usePresence(open, 'morph-out')
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 0 : window.innerHeight))
  const heights = detentHeights(order, vh)
  const [dragging, setDragging] = useState(false)
  const [target, setTarget] = useState(index)
  const [said, setSaid] = useState('')

  const panelRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const grabRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const trapStart = useRef<HTMLElement | null>(null)
  const live = useRef({ order, heights, index, open, onOpenChange, change: (_: number) => {} })
  live.current = {
    order,
    heights,
    index,
    open,
    onOpenChange,
    change: (i: number) => {
      if (detent === undefined) setInner(order[i])
      onDetentChange?.(order[i])
    },
  }

  // Drag, flick, the grabber's keys and where focus goes (motion/sheetDetents.ts).
  const core = useRef<ReturnType<typeof createDetentSheet>>(null)
  core.current ??= createDetentSheet({
    panel: () => panelRef.current,
    overlay: () => overlayRef.current,
    grabber: () => grabRef.current,
    body: () => bodyRef.current,
    order: () => live.current.order,
    heights: () => live.current.heights,
    index: () => live.current.index,
    open: () => live.current.open,
    change: (i) => live.current.change(i),
    close: () => live.current.onOpenChange(false),
    target: setTarget,
    dragging: setDragging,
    say: setSaid,
  })
  const sheet = core.current

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useLayoutEffect(() => {
    if (open) sheet.opening()
  }, [open, sheet])

  useLayoutEffect(() => {
    if (open && mounted) sheet.sync(initialFocus?.current)
    // Synced when the height or the screen changes; initialFocus is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted, index, vh])

  // Closed, it gives focus back to its opener, and opens next time at the default height.
  useEffect(() => {
    if (open) return
    setInner(defaultDetent ?? order[0])
    sheet.closed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => () => sheet.destroy(), [sheet])

  // Before the trap's own effect: at the top, focus stays where it is in the sheet.
  useLayoutEffect(() => {
    if (!atTop || !open) return
    const active = document.activeElement as HTMLElement | null
    trapStart.current = active && panelRef.current?.contains(active) ? active : (initialFocus?.current ?? null)
  }, [atTop, open])
  useScrollLock(open && atTop)
  useFocusTrap(panelRef, open && mounted && atTop, { initialFocus: trapStart, restore: false })
  useDismiss(open, [panelRef], sheet.stepDown, { outside: atTop })

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    return sheet.holdTouch(body)
  }, [mounted, sheet])

  if (!mounted) return null
  const shown = order[dragging ? target : index]
  return (
    <Portal>
      <div ref={overlayRef} className={styles.overlay} data-slot="sheet-overlay" data-state={state} data-detents data-top={atTop || undefined} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={atTop || undefined}
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        id={`${id}-sheet`}
        className={cx(styles.sheet, className)}
        data-slot="sheet-content"
        data-state={state}
        data-detents
        data-top={atTop || undefined}
        data-dragging={dragging || undefined}
        style={{ height: heights[top] }}
        onPointerDown={sheet.down}
        onFocus={(e) => sheet.focusIn(e.target)}
      >
        <div
          ref={grabRef}
          className={styles.grabber}
          data-slot="sheet-grabber"
          role="slider"
          tabIndex={0}
          aria-label={labels.height}
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={top}
          aria-valuenow={index}
          aria-valuetext={DETENT_NAME[order[index]]}
          aria-controls={`${id}-sheet`}
          data-detent={shown}
          onKeyDown={sheet.grabKey}
          onClick={sheet.grabClick}
        >
          <span className={styles.pill} data-slot="sheet-handle" />
        </div>
        <header className={styles.header} data-slot="sheet-header">
          <div className={styles.titles}>
            <h2 id={`${id}-title`} className={styles.title} data-slot="sheet-title">{title}</h2>
            {description && <p id={`${id}-desc`} className={styles.description} data-slot="sheet-description">{description}</p>}
          </div>
          <button type="button" className={styles.close} data-slot="sheet-close" aria-label={labels.close} data-skip-initial-focus onClick={() => onOpenChange(false)}>
            <XIcon />
          </button>
        </header>
        {children && <div ref={bodyRef} className={styles.body} data-slot="sheet-body">{children}</div>}
        {footer && <footer className={styles.footer} data-slot="sheet-footer">{footer}</footer>}
        <p className={styles.srOnly} aria-live="polite">{said}</p>
      </div>
    </Portal>
  )
}
