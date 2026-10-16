import { useEffect, useState, type ReactNode } from 'react'
import { cx } from './cx'
import { motionMs } from './motion'
import styles from './FieldMessage.module.css'

type Props = { helpId: string; errorId: string; help?: ReactNode; error?: ReactNode }

export function FieldMessage({ helpId, errorId, help, error }: Props) {
  const hasError = Boolean(error)
  // The last error stays visible while it animates out.
  const [lastError, setLastError] = useState<ReactNode>(error)
  if (hasError && error !== lastError) setLastError(error)
  useEffect(() => {
    if (hasError) return
    const t = window.setTimeout(() => setLastError(undefined), motionMs('base'))
    return () => window.clearTimeout(t)
  }, [hasError])
  const shown = hasError ? error : lastError
  return (
    <>
      {help && (
        <div className={cx(styles.collapse, !hasError && styles.open)}>
          <div className={styles.inner}>
            <p id={helpId} className={styles.help}>{help}</p>
          </div>
        </div>
      )}
      <div className={cx(styles.collapse, hasError && styles.open)} aria-live="polite">
        <div className={styles.inner}>
          {shown ? (
            // Hidden from screen readers while it closes, so only the live error is read.
            <p id={hasError ? errorId : undefined} className={styles.error} aria-hidden={hasError ? undefined : true}>
              <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.mark}>
                <circle cx="8" cy="8" r="7" />
                <path d="M8 4.5v4.25M8 11v.01" />
              </svg>
              {shown}
            </p>
          ) : null}
        </div>
      </div>
    </>
  )
}
