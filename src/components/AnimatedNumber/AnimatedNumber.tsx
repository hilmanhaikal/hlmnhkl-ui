'use client'

import { useMemo } from 'react'
import { cx } from '../../internal/cx'
import styles from './AnimatedNumber.module.css'

export type AnimatedNumberProps = {
  /** Number to show. Digits roll to the new value when it changes. */
  value: number
  /** Passed to Intl.NumberFormat, for currency, percent, decimals and so on. */
  format?: Intl.NumberFormatOptions
  /** Locale for number formatting. Undefined uses the browser locale. */
  locale?: string
  /** Extra class for the root element. */
  className?: string
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export function AnimatedNumber({ value, format, locale, className }: AnimatedNumberProps) {
  const text = useMemo(() => new Intl.NumberFormat(locale, format).format(value), [value, format, locale])
  const chars = text.split('')

  return (
    <span className={cx(styles.root, className)}>
      <span className={styles.srOnly}>{text}</span>
      <span className={styles.visual} aria-hidden="true">
        {chars.map((ch, i) => {
          // Keyed from the right, so the ones column stays the ones column when the number grows.
          const key = chars.length - i
          const d = Number(ch)
          if (ch >= '0' && ch <= '9') {
            return (
              <span key={`d${key}`} className={styles.digit}>
                <span className={styles.strip} style={{ transform: `translateY(${-d * 10}%)` }}>
                  {DIGITS.map((n) => (
                    <span key={n} className={styles.cell}>{n}</span>
                  ))}
                </span>
              </span>
            )
          }
          return (
            <span key={`s${key}${ch}`} className={styles.symbol}>
              {ch}
            </span>
          )
        })}
      </span>
    </span>
  )
}
