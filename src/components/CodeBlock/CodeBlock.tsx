import type { ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { CopyButton } from '../CopyButton'
import { guessLanguage, tokenize, type CodeLanguage } from './highlight'
import styles from './CodeBlock.module.css'

export type { CodeLanguage } from './highlight'

export type CodeBlockProps = {
  /** The code to show and copy. */
  code: string
  /** Sets the colouring. Undefined guesses from the first line. */
  language?: CodeLanguage
  /** File name or short title in the header row. Undefined shows the language. */
  title?: string
  /** Replaces the title in the header row, for example with tabs that switch the code. */
  header?: ReactNode
  /** Shows a line number before each line. They are never copied or read out. */
  lineNumbers?: boolean
  /** Shows the copy button in the header row. */
  copyable?: boolean
  /** Screen reader name for the copy button. */
  copyLabel?: string
  /** Screen reader name for the scrollable code. Undefined uses the title. */
  label?: string
  /** Extra class for the root element. */
  className?: string
}

const NAMES: Record<CodeLanguage, string> = { tsx: 'TSX', html: 'HTML', css: 'CSS', shell: 'Terminal' }

export function CodeBlock({ code, language, title, header, lineNumbers = false, copyable = true, copyLabel = 'Copy code', label, className }: CodeBlockProps) {
  const lang = language ?? guessLanguage(code)
  const lines = code.replace(/\n$/, '').split('\n').length
  return (
    <div className={cx(styles.root, className)}>
      <div className={styles.head}>
        {header ?? <span className={styles.title}>{title ?? NAMES[lang]}</span>}
        {copyable && <CopyButton value={code} label={copyLabel} size="sm" className={styles.copy} />}
      </div>
      <pre className={styles.pre} tabIndex={0} aria-label={label ?? (title ? `${title} code` : 'Code example')} data-lines={lineNumbers || undefined}>
        {lineNumbers && (
          <span className={styles.gutter} aria-hidden="true">
            {Array.from({ length: lines }, (_, i) => i + 1).join('\n')}
          </span>
        )}
        <code className={styles.code}>
          {tokenize(code, lang).map((t, i) => (t.kind ? <span key={i} className={styles[t.kind]}>{t.text}</span> : t.text))}
        </code>
      </pre>
    </div>
  )
}
