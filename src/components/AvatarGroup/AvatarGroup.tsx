import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import type { AvatarProps } from '../Avatar'
import styles from './AvatarGroup.module.css'

export type AvatarGroupProps = {
  /** The Avatar elements to stack, in order. */
  children: ReactNode
  /** Avatars shown before the "+N" counter. */
  max?: number
  /** Size of the "+N" counter. Set it to match the avatars inside. */
  size?: AvatarProps['size']
  /** What the people are, such as "Project members". Screen readers hear it with every name. */
  label?: string
  /** Extra class for the root element. */
  className?: string
}

const list = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`)

export function AvatarGroup({ children, max = 4, size = 'md', label, className }: AvatarGroupProps) {
  const all = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[]
  const shown = all.slice(0, max)
  const extra = all.length - shown.length
  // The names of the hidden people too, so a screen reader hears everyone the "+N" stands for.
  const everyone = list(all.map((a) => a.props.name))
  return (
    <div className={cx(styles.root, className)} role="group" aria-label={label ? `${label}: ${everyone}` : everyone}>
      {shown.map((child, i) => (
        <span key={child.key ?? i} className={styles.slot} style={{ ['--i' as string]: i }}>
          <span className={styles.face}>{child}</span>
        </span>
      ))}
      {extra > 0 && (
        <span className={styles.slot} style={{ ['--i' as string]: shown.length }}>
          <span className={cx(styles.face, styles.more, styles[size])} role="img" aria-label={`${extra} more`} title={list(all.slice(max).map((a) => a.props.name))}>
            <span aria-hidden="true">+{extra}</span>
          </span>
        </span>
      )}
    </div>
  )
}
