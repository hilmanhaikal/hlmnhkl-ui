'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { holdKey } from '../../internal/motion/keys'
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
    return holdKey(listen, setDown)
  }, [listen])
  return (
    <kbd className={cx(styles.root, className)} data-down={down || undefined}>
      {children}
    </kbd>
  )
}
