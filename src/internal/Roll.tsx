import { useRef } from 'react'
import styles from './Roll.module.css'

/** Text that rolls in from the side it moved toward. With reduced motion it just changes. */
export function Roll({ text, className }: { text: string; className?: string }) {
  const last = useRef(text)
  const dir = useRef<'up' | 'down'>('up')
  if (last.current !== text) {
    dir.current = text.localeCompare(last.current, undefined, { numeric: true }) > 0 ? 'up' : 'down'
    last.current = text
  }
  return (
    <span className={className ? `${styles.roll} ${className}` : styles.roll}>
      <span key={text} className={styles.in} data-dir={dir.current}>
        {text}
      </span>
    </span>
  )
}
