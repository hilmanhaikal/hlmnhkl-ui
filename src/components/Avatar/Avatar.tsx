'use client'

import { Children, useState, type ReactElement, type ReactNode } from 'react'
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
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
        />
      )}
      {status && <span className={styles.status} data-status={status} aria-hidden="true" />}
    </span>
  )
}

export type AvatarGroupProps = {
  /** The Avatar elements to stack. */
  children: ReactNode
  /** Avatars shown before the "+N" counter. */
  max?: number
  /** Size of the "+N" counter. Set it to match the avatars inside. */
  size?: AvatarProps['size']
  /** Screen reader name for the group. Undefined says "N people". */
  label?: string
  /** Extra class for the root element. */
  className?: string
}

export function AvatarGroup({ children, max = 4, size = 'md', label, className }: AvatarGroupProps) {
  const all = Children.toArray(children) as ReactElement<AvatarProps>[]
  const shown = all.slice(0, max)
  const extra = all.length - shown.length
  return (
    <div className={cx(styles.group, className)} role="group" aria-label={label ?? `${all.length} people`}>
      {shown.map((child, i) => (
        <span key={i} className={styles.slot} style={{ ['--i' as string]: i }}>
          {child}
        </span>
      ))}
      {extra > 0 && (
        <span className={styles.slot} style={{ ['--i' as string]: shown.length }}>
          <span className={cx(styles.root, styles[size], styles.more)} role="img" aria-label={`and ${extra} more`}>
            <span className={styles.fallback} aria-hidden="true">+{extra}</span>
          </span>
        </span>
      )}
    </div>
  )
}
