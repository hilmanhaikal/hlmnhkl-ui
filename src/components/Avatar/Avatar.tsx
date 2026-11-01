'use client'

import { useState } from 'react'
import { cx } from '../../internal/cx'
import styles from './Avatar.module.css'

export type AvatarProps = {
  /** Used for the alt text and the initials fallback. */
  name: string
  /** Image URL. Initials show while it loads and if it fails. */
  src?: string
  /** Diameter of the avatar. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Shows a status dot and adds the status to the spoken name. */
  status?: 'online' | 'away' | 'offline'
  /** Extra class for the root element. */
  className?: string
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

export function Avatar({ name, src, size = 'md', status, className }: AvatarProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error')
  const [lastSrc, setLastSrc] = useState(src)
  if (src !== lastSrc) {
    setLastSrc(src)
    setState(src ? 'loading' : 'error')
  }
  return (
    <span className={cx(styles.root, styles[size], className)} role="img" aria-label={status ? `${name}, ${status}` : name}>
      <span className={styles.fallback} aria-hidden="true">{initials(name)}</span>
      {src && state !== 'error' && (
        <img
          className={styles.img}
          src={src}
          alt=""
          data-loaded={state === 'loaded' || undefined}
          // A server-rendered image can finish before React hydrates, so its load event is gone by then.
          ref={(img) => {
            if (img?.complete && state === 'loading') setState(img.naturalWidth ? 'loaded' : 'error')
          }}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
        />
      )}
      {status && <span className={styles.status} data-status={status} aria-hidden="true" />}
    </span>
  )
}
