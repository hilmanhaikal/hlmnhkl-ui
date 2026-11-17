// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { CheckIcon, XIcon } from '../../internal/icons'
import { prefersReducedMotion } from '../../internal/motion'
import { bud, createFuse, cssMs, DONE_FOR, GUARD, HINT_AFTER, LEAVE, outline, TAP } from '../../internal/motion/holdToConfirm'
import styles from './HoldToConfirm.module.css'

export type HoldToConfirmProps = {
  /** The action, as the button's label, such as "Delete workspace". */
  children: ReactNode
  /** Called once the hold runs to the end, or the button is pressed again in the confirm step. */
  onConfirm: () => void
  /** Called when a hold is let go early, or the confirm step is cancelled. */
  onCancel?: () => void
  /** The action as a verb for the confirm step's line, such as "Delete": "Press it again to delete, or Cancel." */
  confirmLabel?: string
  /** The name of the round cancel button that buds out beside it in the confirm step. */
  cancelLabel?: string
  /** Shown in place of the label once it is done, such as "Workspace deleted". */
  doneLabel?: ReactNode
  /** The line under the button. Defaults to how to use it. */
  hint?: ReactNode
  /** The line under the button while the confirm step is open. */
  stepHint?: ReactNode
  /** Blocks the button. Say why in the hint. */
  disabled?: boolean
  /** Extra class for the outer box. */
  className?: string
}

type Phase = 'idle' | 'step' | 'done'

export function HoldToConfirm({
  children,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  doneLabel = 'Done',
  hint = 'Hold to confirm, or tap for a confirm step.',
  stepHint,
  disabled = false,
  className,
}: HoldToConfirmProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLButtonElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const stepAt = useRef(0)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const runRef = useRef<SVGPathElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [size, setSize] = useState({ w: 0, h: 0, inset: 1 })
  const [path, setPath] = useState('')
  const [keep, setKeep] = useState(false)
  const [said, setSaid] = useState('')

  // The burning line (motion/holdToConfirm.ts).
  const fuse = useRef<ReturnType<typeof createFuse>>(null)
  fuse.current ??= createFuse(() => runRef.current)
  const tapTimer = useRef(0)
  const press = useRef<{ t0: number; pointer: number | 'key'; key?: string } | null>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const calls = useRef({ onConfirm, onCancel })
  calls.current = { onConfirm, onCancel }

  useLayoutEffect(() => {
    const root = rootRef.current
    const main = mainRef.current
    if (!root || !main) return
    const measure = () => {
      const w = main.offsetWidth
      const h = main.offsetHeight
      const inset = parseFloat(getComputedStyle(root).getPropertyValue('--gooee-hold-stroke')) / 2 || 1
      setSize({ w, h, inset })
      setPath(outline(w, h, inset, w / 2))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(main)
    return () => ro.disconnect()
  }, [])

  const paint = (v: number) => fuse.current!.paint(v)

  const finish = () => {
    fuse.current!.stop()
    press.current = null
    paint(1)
    setKeep(false)
    // From the step, focus goes back to the button: the step closes under it. Safari never focused Confirm.
    if (phaseRef.current === 'step') mainRef.current?.focus({ preventScroll: true })
    setPhase('done')
    setSaid(typeof doneLabel === 'string' ? doneLabel : 'Done')
    if (!prefersReducedMotion()) navigator.vibrate?.(12)
    calls.current.onConfirm()
  }

  // Forward at an even speed, and back fast on the morph curve.
  const run = () => fuse.current!.forward(cssMs(shellRef.current, '--gooee-hold-time', 1500), (now) => press.current && now - press.current.t0 > HINT_AFTER && setKeep(true), finish)
  const rewind = () => fuse.current!.rewind()

  const openStep = () => {
    window.clearTimeout(tapTimer.current)
    tapTimer.current = 0
    fuse.current!.stop()
    paint(0)
    stepAt.current = performance.now()
    setPhase('step')
  }

  const closeStep = () => {
    setPhase('idle')
    mainRef.current?.focus({ preventScroll: true })
    calls.current.onCancel?.()
  }

  useEffect(() => {
    if (phase === 'step') cancelRef.current?.focus({ preventScroll: true })
    if (phase !== 'done') return
    const t = window.setTimeout(() => {
      paint(0)
      setPhase('idle')
      setSaid('')
    }, DONE_FOR)
    return () => window.clearTimeout(t)
  }, [phase])

  // The cancel drop buds out when the step opens and flows back when it closes, either way.
  const wasOpen = useRef(false)
  useLayoutEffect(() => {
    const isOpen = phase === 'step'
    if (isOpen === wasOpen.current) return
    wasOpen.current = isOpen
    const row = rowRef.current,
      shell = shellRef.current,
      x = cancelRef.current
    if (!row || !shell || !x) return
    return bud(row, shell, x, isOpen ? 'in' : 'out', styles.bud) ?? undefined
  }, [phase])

  useEffect(
    () => () => {
      fuse.current!.stop()
      window.clearTimeout(tapTimer.current)
    },
    [],
  )

  const start = (pointer: number | 'key', x: number, key?: string) => {
    press.current = { t0: performance.now(), pointer, key }
    setPath(outline(size.w, size.h, size.inset, x))
    shellRef.current?.setAttribute('data-held', '')
    run()
  }

  const letGo = (tapAllowed: boolean) => {
    const pr = press.current
    press.current = null
    shellRef.current?.removeAttribute('data-held')
    setKeep(false)
    if (!pr || phaseRef.current !== 'idle') return
    const tap = tapAllowed && performance.now() - pr.t0 < TAP
    rewind()
    if (!tap) return calls.current.onCancel?.()
    if (pr.pointer === 'key') return openStep()
    // A tapped step opens on the click that follows, after the browser has focused the button, so focus
    // can then move to Cancel. If no click comes, it opens anyway.
    tapTimer.current = window.setTimeout(openStep, TAP)
  }

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || phaseRef.current !== 'idle' || press.current || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    start(e.pointerId, e.clientX - e.currentTarget.getBoundingClientRect().left)
  }

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const pr = press.current
    if (!pr || pr.pointer !== e.pointerId) return
    const r = e.currentTarget.getBoundingClientRect()
    if (e.clientX < r.left - LEAVE || e.clientX > r.right + LEAVE || e.clientY < r.top - LEAVE || e.clientY > r.bottom + LEAVE) letGo(false)
  }

  const onPointerEnd = (e: PointerEvent<HTMLButtonElement>) => {
    if (press.current?.pointer === e.pointerId) letGo(e.type === 'pointerup')
  }

  // Held Enter or Space works like a held finger, from the middle of the button. One press opens the
  // confirm step, since holding a key is hard for many people.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (phaseRef.current === 'step') {
      // In the step the button confirms with its own click; Escape steps back.
      if (e.key === 'Escape') closeStep()
      return
    }
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (e.repeat || disabled || phaseRef.current !== 'idle' || press.current) return
    start('key', size.w / 2, e.key)
  }

  const onKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (phaseRef.current === 'step' || (e.key !== 'Enter' && e.key !== ' ')) return
    e.preventDefault()
    if (press.current?.key === e.key) letGo(true)
  }

  // A screen reader or voice control sends a click with no press: it opens the confirm step.
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    // In the step, pressing the button again confirms it, unless it is the second half of a double-click.
    if (phaseRef.current === 'step') {
      if (e.detail === 0 || performance.now() - stepAt.current > GUARD) finish()
      return
    }
    if (disabled || phaseRef.current !== 'idle' || press.current) return
    if (e.detail === 0 || tapTimer.current) openStep()
  }

  const onCancelKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Escape') return
    e.stopPropagation()
    closeStep()
  }

  const open = phase === 'step'
  const line = open ? (stepHint ?? `Press it again to ${confirmLabel.toLowerCase()}, or ${cancelLabel}.`) : phase === 'done' ? '' : keep ? 'Keep holding' : hint

  return (
    <div ref={rootRef} className={cx(styles.root, className)}>
      <div ref={rowRef} className={styles.row}>
        <div ref={shellRef} className={styles.shell} data-phase={phase} data-disabled={disabled || undefined}>
          <button
            ref={mainRef}
            type="button"
            className={styles.main}
            aria-describedby={`${id}-hint`}
            aria-expanded={open}
            aria-controls={`${id}-step`}
            aria-disabled={disabled || undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onBlur={() => press.current?.pointer === 'key' && letGo(false)}
            onClick={onClick}
          >
            <span className={styles.faces}>
              <span className={styles.face} data-face="idle" aria-hidden={phase === 'done' || undefined}>
                {children}
              </span>
              <span className={styles.face} data-face="done" aria-hidden={phase !== 'done' || undefined}>
                <CheckIcon />
                {doneLabel}
              </span>
            </span>
            <svg className={styles.fuse} width={size.w} height={size.h} aria-hidden="true">
              <path ref={runRef} d={path} className={styles.run} pathLength={1} />
            </svg>
          </button>
        </div>
        <button
          ref={cancelRef}
          id={`${id}-step`}
          type="button"
          className={styles.cancel}
          aria-label={cancelLabel}
          aria-describedby={`${id}-hint`}
          inert={!open}
          onClick={closeStep}
          onKeyDown={onCancelKey}
        >
          <XIcon />
        </button>
      </div>
      <p id={`${id}-hint`} className={styles.hint}>
        {line}
      </p>
      <p className={styles.srOnly} aria-live="polite">
        {said}
      </p>
    </div>
  )
}
