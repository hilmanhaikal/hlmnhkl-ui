'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cx } from '../../internal/cx'
import { FieldMessage } from '../../internal/FieldMessage'
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons/icons'
import { motionMs } from '../../internal/motion'
import { createMorph } from '../../internal/motion/liquid'
import { Roll } from '../../internal/Roll'
import { useControllable } from '../../internal/useControllable'
import { defaultPaginationLabels, readPage, splitPageOf, type PaginationLabels } from './labels'
import { pageRange } from './range'
import styles from './Pagination.module.css'

export type { PaginationLabels }

export type PaginationProps = {
  /** Total number of pages. Pages count from 1. */
  pageCount: number
  /** Current page, counting from 1, when you control it. */
  page?: number
  /** Starting page when you do not control it. */
  defaultPage?: number
  /** Called when the page changes, with the new page number. */
  onPageChange?: (page: number) => void
  /** "row" shows the page numbers. "compact" shows Page 5 of 12 over a line that fills, and the number opens a Go to page field. */
  variant?: 'row' | 'compact'
  /** Pages shown on each side of the current one, in the row. */
  siblings?: number
  /** Screen reader name for the nav landmark. */
  label?: string
  /** The words it shows and says. Pass only the ones you change. */
  labels?: Partial<PaginationLabels>
  /** Extra class for the root element. */
  className?: string
}

export function Pagination({
  pageCount,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  variant = 'row',
  siblings = 1,
  label = 'Pagination',
  labels: labelsProp,
  className,
}: PaginationProps) {
  const labels = { ...defaultPaginationLabels, ...labelsProp }
  const [rawPage, setPage] = useControllable(pageProp, defaultPage, onPageChange)
  const count = Math.max(pageCount, 1)
  // A stored page can sit past the end after pageCount drops.
  const page = Math.min(Math.max(rawPage, 1), count)
  const listRef = useRef<HTMLUListElement>(null)
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null)
  const [ready, setReady] = useState(false)
  const pages = pageRange(page, pageCount, siblings)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const el = list.querySelector<HTMLElement>('[aria-current="page"]')
      setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null)
    }
    measure()
    if (!ready) requestAnimationFrame(() => setReady(true))
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [page, pageCount, siblings, ready, variant])

  // Keeps the current page in view when the list scrolls on a narrow screen.
  useLayoutEffect(() => {
    const list = listRef.current
    const el = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!list || !el || list.scrollWidth <= list.clientWidth) return
    list.scrollLeft = el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2
  }, [page, pageCount, siblings, variant])

  const go = (p: number) => {
    const next = Math.min(Math.max(p, 1), count)
    if (next !== page) setPage(next)
  }

  return (
    <nav aria-label={label} className={cx(styles.root, className)} data-slot="pagination" data-variant={variant}>
      <button type="button" className={cx(styles.btn, styles.edge)} data-slot="pagination-previous" aria-label={labels.previous} disabled={page <= 1} onClick={() => go(page - 1)}>
        <ChevronLeftIcon />
      </button>
      {variant === 'compact' ? (
        <Compact page={page} count={count} go={go} labels={labels} />
      ) : (
        <ul ref={listRef} className={styles.list} data-slot="pagination-list">
          {pill && (
            <li aria-hidden="true" className={styles.pill} data-slot="pagination-indicator" data-ready={ready || undefined} style={{ transform: `translateX(${pill.x}px)`, width: pill.w }} />
          )}
          {pages.map((p, i) =>
            p === 'gap' ? (
              <li key={`gap-${i}`} className={styles.gap} data-slot="pagination-ellipsis" aria-hidden="true">…</li>
            ) : (
              <li key={p}>
                <button
                  type="button"
                  className={styles.btn}
                  data-slot="pagination-item"
                  aria-label={labels.page(p)}
                  aria-current={p === page ? 'page' : undefined}
                  onClick={() => go(p)}
                >
                  {p}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
      <button type="button" className={cx(styles.btn, styles.edge)} data-slot="pagination-next" aria-label={labels.next} disabled={page >= pageCount} onClick={() => go(page + 1)}>
        <ChevronRightIcon />
      </button>
    </nav>
  )
}

function Compact({ page, count, go, labels }: { page: number; count: number; go: (page: number) => void; labels: PaginationLabels }) {
  const id = useId()
  const [editing, setEditing] = useState(false)
  // The field stays shown while it folds back into the number.
  const [shown, setShown] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [said, setSaid] = useState('')
  const numRef = useRef<HTMLButtonElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const refocus = useRef(false)
  const opened = useRef(false)
  const liquid = useRef<ReturnType<typeof createMorph>>(null)
  liquid.current ??= createMorph(() => fieldRef.current, { origin: () => numRef.current })
  useEffect(() => () => liquid.current?.destroy(), [])

  // Presses faster than the roll swap the number in place, so a held key never stacks rolls.
  const last = useRef({ page, at: 0, still: false })
  if (last.current.page !== page) {
    const now = performance.now()
    last.current = { page, at: now, still: now - last.current.at < motionMs('fast') }
  }

  // Read out after a change only, not when the page first shows.
  const spoken = useRef(page)
  useEffect(() => {
    if (spoken.current === page) return
    spoken.current = page
    setSaid(labels.pageOf(page, count))
    // The words follow the page, not each new labels object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, count])

  // The field grows out of the number and folds back into it. Only its clip moves.
  useLayoutEffect(() => {
    if (editing) {
      opened.current = true
      inputRef.current?.focus({ preventScroll: true })
      liquid.current!.play('open')
      return
    }
    if (!opened.current) return
    liquid.current!.play('closed')
    if (refocus.current) numRef.current?.focus({ preventScroll: true })
    refocus.current = false
    const t = setTimeout(() => setShown(false), motionMs('morph-out'))
    return () => clearTimeout(t)
  }, [editing])

  const open = () => {
    setText('')
    setError('')
    setShown(true)
    setEditing(true)
  }

  const fold = (focus: boolean) => {
    refocus.current = focus
    setEditing(false)
    setError('')
  }

  const submit = () => {
    const n = readPage(text, count)
    if (n === null) {
      setError(labels.outOfRange(count))
      const field = fieldRef.current
      if (field) {
        // Replays the shake on every wrong try.
        delete field.dataset.shake
        void field.offsetWidth
        field.dataset.shake = ''
      }
      return
    }
    go(n)
    fold(true)
  }

  const keys = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      fold(true)
    }
  }

  const words = labels.pageOf(page, count)
  const parts = splitPageOf(words, page)

  return (
    <div className={styles.middle}>
      <button ref={numRef} type="button" className={cx(styles.btn, styles.current)} data-slot="pagination-current" aria-label={`${words}, ${labels.goTo}`} inert={editing} onClick={open}>
        <span className={styles.words}>
          {parts ? (
            <>
              {parts[0]}
              <span className={styles.num}>
                <span className={styles.ghost}>{count}</span>
                <Roll text={String(page)} still={last.current.still} />
              </span>
              {parts[1]}
            </>
          ) : (
            words
          )}
        </span>
        <span className={styles.line} aria-hidden="true">
          <span className={styles.fill} style={{ transform: `scaleX(${page / count})` }} />
        </span>
      </button>
      <div
        ref={fieldRef}
        className={styles.jump}
        data-slot="pagination-jump"
        data-state={shown ? 'open' : 'closed'}
        data-invalid={error ? '' : undefined}
        inert={!editing}
        // A press on the label or the border would take focus off the input and fold the field.
        onMouseDown={(e) => {
          if (e.target !== inputRef.current) e.preventDefault()
        }}
        onBlur={(e) => {
          if (editing && !e.currentTarget.contains(e.relatedTarget as Node | null)) fold(false)
        }}
      >
        <label htmlFor={`${id}-to`} className={styles.jumpLabel} data-slot="field-label">
          {labels.goTo}
        </label>
        <input
          ref={inputRef}
          id={`${id}-to`}
          className={styles.input}
          data-slot="pagination-jump-input"
          type="text"
          inputMode="numeric"
          enterKeyHint="go"
          autoComplete="off"
          size={String(count).length + 1}
          placeholder={String(page)}
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => {
            setText(e.target.value)
            setError('')
          }}
          onKeyDown={keys}
        />
      </div>
      <div className={styles.message}>
        <FieldMessage helpId={`${id}-help`} errorId={`${id}-error`} error={error || undefined} />
      </div>
      <span className={styles.srOnly} aria-live="polite">
        {said}
      </span>
    </div>
  )
}
