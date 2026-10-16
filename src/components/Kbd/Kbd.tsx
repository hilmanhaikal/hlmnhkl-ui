'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import styles from './Kbd.module.css'

export type KbdProps = {
  /** The key name to show, such as "Esc" or "⌘". */
  children: ReactNode
  /** A KeyboardEvent.key value. When set, the key presses down while the real key is held. */
  listen?: string
  /** Extra class for the kbd element. */
  className?: string
}

export function Kbd({ children, listen, className }: KbdProps) {
  const [down, setDown] = useState(false)
  useEffect(() => {
    if (!listen) return
    const match = (e: KeyboardEvent) => e.key.toLowerCase() === listen.toLowerCase()
    const onDown = (e: KeyboardEvent) => match(e) && setDown(true)
    const onUp = (e: KeyboardEvent) => match(e) && setDown(false)
    const reset = () => setDown(false)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', reset)
    }
  }, [listen])
  return (
    <kbd className={cx(styles.root, className)} data-down={down || undefined}>
      {children}
    </kbd>
  )
}
