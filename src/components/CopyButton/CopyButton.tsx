'use client'

import { useEffect, useRef, useState } from 'react'
import { cx } from '../../internal/cx'
import { CopyIcon, XIcon } from '../../internal/icons'
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

  const copy = async () => {
    const ok = await writeText(value)
    setStatus(ok ? 'copied' : 'failed')
    if (ok) onCopy?.(value)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setStatus('idle'), resetAfter)
  }

  return (
    <button
      type="button"
      className={cx(styles.root, styles[size], showLabel && styles.withLabel, className)}
      data-copied={status === 'copied' || undefined}
      data-failed={status === 'failed' || undefined}
      aria-label={showLabel ? undefined : label}
      onClick={copy}
    >
      <span className={styles.icons} aria-hidden="true">
        <CopyIcon className={styles.copy} />
        <svg viewBox="0 0 24 24" className={styles.check}>
          <path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" />
        </svg>
        <XIcon className={styles.fail} />
      </span>
      {showLabel && (
        <span className={styles.labels}>
          <span className={styles.labelIdle}>{label}</span>
          <span className={styles.labelDone} aria-hidden="true">{copiedLabel}</span>
          <span className={styles.labelFailed} aria-hidden="true">{failedLabel}</span>
        </span>
      )}
      <span className={styles.srOnly} aria-live="polite">{status === 'copied' ? copiedLabel : status === 'failed' ? failedLabel : ''}</span>
    </button>
  )
}
