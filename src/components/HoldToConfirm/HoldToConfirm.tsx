'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { CheckIcon } from '../../internal/icons'
import { prefersReducedMotion, readMotionMs } from '../../internal/motion'
import styles from './HoldToConfirm.module.css'

export type HoldToConfirmProps = {
  /** The action, as the button's label, such as "Delete workspace". */
  children: ReactNode
  /** Called once the hold runs to the end, or Confirm is pressed in the confirm step. */
  onConfirm: () => void
  /** Called when a hold is let go early, or the confirm step is cancelled. */
  onCancel?: () => void
  /** The confirm step's button, such as "Delete". Keep it short. */
  confirmLabel?: string
  /** The confirm step's way back. */
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

// A press shorter than this is a tap: it opens the confirm step, like one key press does.
const TAP = 250
// Held this long, the hint changes to "Keep holding".
const HINT_AFTER = 300
// A finger that slides this far off the button lets go.
const LEAVE = 16
// How long the done state shows before the button can be used again.
const DONE_FOR = 2400

// The pill's outline as one closed path that starts on the bottom edge at x and runs left first. The
// line is drawn at both ends of the path at once, so it burns out both ways from x and meets opposite.
function outline(w: number, h: number, inset: number, x: number) {
  const r = h / 2 - inset
  const t = inset
  const b = h - inset
  const l = h / 2
  const rr = w - h / 2
  const px = Math.max(l, Math.min(rr, x))
  return `M${px},${b} H${l} A${r},${r} 0 0 1 ${l},${t} H${rr} A${r},${r} 0 0 1 ${rr},${b} Z`
}

const ms = (el: Element | null, name: string, fallback: number) => {
  const raw = el ? getComputedStyle(el).getPropertyValue(name).trim() : ''
  const v = parseFloat(raw)
  if (!Number.isFinite(v)) return fallback
  return raw.endsWith('ms') ? v : raw.endsWith('s') ? v * 1000 : v
}

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
  const stepRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const runRef = useRef<SVGPathElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [size, setSize] = useState({ w: 0, h: 0, step: 0, stepH: 0, room: 0, inset: 1 })
  const [path, setPath] = useState('')
  const [keep, setKeep] = useState(false)
  const [said, setSaid] = useState('')

  const p = useRef(0)
  const raf = useRef(0)
  const tapTimer = useRef(0)
  const press = useRef<{ t0: number; pointer: number | 'key'; key?: string } | null>(null)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const calls = useRef({ onConfirm, onCancel })
  calls.current = { onConfirm, onCancel }

  useLayoutEffect(() => {
    const root = rootRef.current
    const main = mainRef.current
    const step = stepRef.current
    if (!root || !main || !step) return
    const measure = () => {
      const w = main.offsetWidth
      const h = main.offsetHeight
      const inset = parseFloat(getComputedStyle(root).getPropertyValue('--hl-hold-stroke')) / 2 || 1
      setSize({ w, h, step: step.offsetWidth, stepH: step.offsetHeight, room: root.clientWidth, inset })
      setPath(outline(w, h, inset, w / 2))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(main)
    ro.observe(step)
    ro.observe(root)
    return () => ro.disconnect()
  }, [])

  const paint = (v: number) => {
    p.current = v
    const run = runRef.current
    if (!run) return
    run.style.strokeDasharray = `${v / 2} ${1 - v} ${v / 2} 0`
    run.style.opacity = v > 0 ? '1' : '0'
  }

  const finish = () => {
    cancelAnimationFrame(raf.current)
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

  // Forward at an even speed: it is a clock.
  const run = () => {
    cancelAnimationFrame(raf.current)
    const total = ms(shellRef.current, '--hl-hold-time', 1500)
    let last = performance.now()
    const step = (now: number) => {
      const next = Math.min(1, p.current + (now - last) / total)
      last = now
      paint(next)
      if (press.current && now - press.current.t0 > HINT_AFTER) setKeep(true)
      if (next >= 1) return finish()
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  // Back fast and easing out: a rubber band, not a clock.
  const rewind = () => {
    cancelAnimationFrame(raf.current)
    const from = p.current
    const length = readMotionMs('fast')
    if (!length || !from) return paint(0)
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / length)
      paint(from * Math.pow(1 - t, 3))
      if (t < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  const openStep = () => {
    window.clearTimeout(tapTimer.current)
    tapTimer.current = 0
    cancelAnimationFrame(raf.current)
    paint(0)
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

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current)
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
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (e.repeat || disabled || phaseRef.current !== 'idle' || press.current) return
    start('key', size.w / 2, e.key)
  }

  const onKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (press.current?.key === e.key) letGo(true)
  }

  // A screen reader or voice control sends a click with no press: it opens the confirm step.
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled || phaseRef.current !== 'idle' || press.current) return
    if (e.detail === 0 || tapTimer.current) openStep()
  }

  const onStepKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape') return
    e.stopPropagation()
    closeStep()
  }

  // No room beside the label, as on a phone: the step opens under it and the pill grows into a card.
  const stack = size.room > 0 && size.w + size.step > size.room
  const open = phase === 'step'
  const shellW = open ? (stack ? Math.max(size.w, size.step) : size.w + size.step) : size.w
  const shellH = open && stack ? size.h + size.stepH : size.h
  const line = open ? (stepHint ?? `Choose ${cancelLabel} or ${confirmLabel}.`) : phase === 'done' ? '' : keep ? 'Keep holding' : hint

  return (
    <div ref={rootRef} className={cx(styles.root, className)}>
      <div
        ref={shellRef}
        className={styles.shell}
        data-phase={phase}
        data-stack={stack || undefined}
        data-disabled={disabled || undefined}
        style={{ width: shellW || undefined, height: shellH || undefined }}
      >
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
        <div ref={stepRef} id={`${id}-step`} className={styles.step} role="group" aria-labelledby={`${id}-hint`} inert={!open} onKeyDown={onStepKey}>
          <button ref={cancelRef} type="button" className={styles.cancel} onClick={closeStep}>
            {cancelLabel}
          </button>
          <button type="button" className={styles.confirm} onClick={finish}>
            {confirmLabel}
          </button>
        </div>
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
