'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cx } from '../../internal/cx'
import { CopyIcon, XIcon } from '../../internal/icons'
import { copyRun, type CopyRun } from '../../internal/liquidMore'
import styles from './CopyButton.module.css'

export type CopyButtonProps = {
  /** Text to put on the clipboard. */
  value: string
  /** Accessible name, and the visible text when showLabel is on. */
  label?: string
  /** Shown and spoken after a successful copy. */
  copiedLabel?: string
  /** Shown and spoken when the browser blocks the copy. */
  failedLabel?: string
  /** Shows the label as text next to the icon. */
  showLabel?: boolean
  /** Size of the button. */
  size?: 'sm' | 'md'
  /** How long the check or the failed state stays, in ms. */
  resetAfter?: number
  /** Called after the text is copied, with the copied text. Not called if copying fails. */
  onCopy?: (value: string) => void
  /** Extra class for the button. */
  className?: string
}

async function writeText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for http pages and older browsers.
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    const prev = document.activeElement as HTMLElement | null
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    prev?.focus()
    return ok
  }
}

export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  failedLabel = 'Could not copy',
  showLabel = false,
  size = 'md',
  resetAfter = 1800,
  onCopy,
  className,
}: CopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  // A copy pours a drop from where it was pressed into the icon, which fills and turns into the check;
  // going idle plays it back. internal/liquidMore.ts draws it.
  const rootRef = useRef<HTMLButtonElement>(null)
  const iconsRef = useRef<HTMLSpanElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const pressedAt = useRef<[number, number] | null>(null)
  const run = useRef<CopyRun | null>(null)
  const copied = status === 'copied'
  const wasCopied = useRef(copied)
  useLayoutEffect(() => {
    if (wasCopied.current === copied) return
    wasCopied.current = copied
    const icons = iconsRef.current
    // A failed copy shows its cross at once, with nothing poured.
    if (!icons || status === 'failed') {
      run.current?.stop()
      run.current = null
      return
    }
    const at = pressedAt.current
    pressedAt.current = null
    run.current = copyRun(icons, copied ? 1 : 0, at, styles.pour, run.current)
  }, [copied, status])
  useLayoutEffect(() => () => run.current?.stop(), [])

  // With a label, the icon sits on the middle of the label's capital letters, not of its line.
  useLayoutEffect(() => {
    const root = rootRef.current
    const icons = iconsRef.current
    const text = labelRef.current?.firstChild
    root?.style.removeProperty('--cap-shift')
    if (!root || !icons || !text) return
    const place = () => {
      root.style.removeProperty('--cap-shift')
      const range = document.createRange()
      range.selectNodeContents(text)
      const box = range.getBoundingClientRect()
      const look = getComputedStyle(root)
      const pen = document.createElement('canvas').getContext('2d')
      if (!pen || !box.height) return
      pen.font = `${look.fontWeight} ${look.fontSize} ${look.fontFamily}`
      const m = pen.measureText('H')
      const cap = box.top + m.fontBoundingBoxAscent - m.actualBoundingBoxAscent / 2
      const r = icons.getBoundingClientRect()
      root.style.setProperty('--cap-shift', `${Math.round((cap - r.top - r.height / 2) * 100) / 100}px`)
    }
    place()
    let live = true
    document.fonts?.ready.then(() => live && place())
    return () => {
      live = false
    }
  }, [showLabel, label, size])

  const copy = async () => {
    const ok = await writeText(value)
    setStatus(ok ? 'copied' : 'failed')
    if (ok) onCopy?.(value)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setStatus('idle'), resetAfter)
  }

  return (
    <button
      ref={rootRef}
      type="button"
      className={cx(styles.root, styles[size], showLabel && styles.withLabel, className)}
      data-copied={status === 'copied' || undefined}
      data-failed={status === 'failed' || undefined}
      aria-label={showLabel ? undefined : label}
      onClick={(e) => {
        const r = iconsRef.current?.getBoundingClientRect()
        // A key press (no pointer) pours from the icon's middle.
        pressedAt.current = r && e.detail ? [e.clientX - r.left, e.clientY - r.top] : null
        copy()
      }}
    >
      <span ref={iconsRef} className={styles.icons} aria-hidden="true">
        <CopyIcon className={styles.copy} />
        <svg viewBox="0 0 24 24" className={styles.check}>
          <path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" />
        </svg>
        <XIcon className={styles.fail} />
      </span>
      {showLabel && (
        <span className={styles.labels}>
          <span ref={labelRef} className={styles.labelIdle}>{label}</span>
          <span className={styles.labelDone} aria-hidden="true">{copiedLabel}</span>
          <span className={styles.labelFailed} aria-hidden="true">{failedLabel}</span>
        </span>
      )}
      <span className={styles.srOnly} aria-live="polite">{status === 'copied' ? copiedLabel : status === 'failed' ? failedLabel : ''}</span>
    </button>
  )
}
