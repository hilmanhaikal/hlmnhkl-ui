import type { ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { CopyButton } from '../CopyButton'
import { guessLanguage, tokenize, type CodeLanguage } from './highlight'
import styles from './CodeBlock.module.css'

export type { CodeLanguage } from './highlight'

export type CodeBlockLabels = {
  /** Name of the copy button. */
  copy: string
}

const defaultLabels: CodeBlockLabels = { copy: 'Copy code' }

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
  /** Screen reader name for the scrollable code. Undefined uses the title. */
  label?: string
  /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<CodeBlockLabels>
  /** Extra class for the root element. */
  className?: string
}

const NAMES: Record<CodeLanguage, string> = { tsx: 'TSX', html: 'HTML', css: 'CSS', shell: 'Terminal' }

export function CodeBlock({ code, language, title, header, lineNumbers = false, copyable = true, label, labels: labelsProp, className }: CodeBlockProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const lang = language ?? guessLanguage(code)
  const lines = code.replace(/\n$/, '').split('\n').length
  return (
    <div data-slot="code-block" className={cx(styles.root, className)}>
      <div data-slot="code-block-header" className={styles.head}>
        {header ?? <span data-slot="code-block-title" className={styles.title}>{title ?? NAMES[lang]}</span>}
        {copyable && <CopyButton value={code} label={labels.copy} size="sm" className={styles.copy} />}
      </div>
      <pre data-slot="code-block-pre" className={styles.pre} tabIndex={0} aria-label={label ?? (title ? `${title} code` : 'Code example')} data-lines={lineNumbers || undefined}>
        {lineNumbers && (
          <span data-slot="code-block-gutter" className={styles.gutter} aria-hidden="true">
            {Array.from({ length: lines }, (_, i) => i + 1).join('\n')}
          </span>
        )}
        <code data-slot="code-block-code" className={styles.code}>
          {tokenize(code, lang).map((t, i) => (t.kind ? <span key={i} className={styles[t.kind]}>{t.text}</span> : t.text))}
        </code>
      </pre>
    </div>
  )
}
