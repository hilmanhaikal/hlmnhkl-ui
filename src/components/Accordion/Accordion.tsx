'use client'

import { createContext, useContext, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { ChevronDownIcon } from '../../internal/icons'
import { useControllable } from '../../internal/useControllable'
import styles from './Accordion.module.css'

type Ctx = { open: string[]; toggle: (v: string) => void }
const AccCtx = createContext<Ctx | null>(null)

export type AccordionProps = {
  /** "single" keeps one item open at a time. */
  type?: 'single' | 'multiple'
  /** Values of the open items, when you control it. */
  value?: string[]
  /** Starting open items when you do not control it. */
  defaultValue?: string[]
  /** Called when the open items change, with the new list of values. */
  onValueChange?: (value: string[]) => void
  /** Heading level for item titles, to fit the page outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /** Extra class for the root element. */
  className?: string
  /** The AccordionItem elements. */
  children: ReactNode
}

const LevelCtx = createContext<number>(3)

export function Accordion({
  type = 'single',
  value,
  defaultValue = [],
  onValueChange,
  headingLevel = 3,
  className,
  children,
}: AccordionProps) {
  const [open, setOpen] = useControllable(value, defaultValue, onValueChange)
  const rootRef = useRef<HTMLDivElement>(null)
  const toggle = (v: string) => {
    const isOpen = open.includes(v)
    if (type === 'single') setOpen(isOpen ? [] : [v])
    else setOpen(isOpen ? open.filter((x) => x !== v) : [...open, v])
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const root = rootRef.current
    // Skips triggers of nested accordions, which handle their own keys.
    const triggers = Array.from(root?.querySelectorAll<HTMLButtonElement>(`.${styles.trigger}:not(:disabled)`) ?? []).filter(
      (t) => t.closest(`.${styles.root}`) === root,
    )
    const i = triggers.indexOf(document.activeElement as HTMLButtonElement)
    if (i < 0) return
    let next = -1
    if (e.key === 'ArrowDown') next = (i + 1) % triggers.length
    else if (e.key === 'ArrowUp') next = (i - 1 + triggers.length) % triggers.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = triggers.length - 1
    if (next < 0) return
    e.preventDefault()
    e.stopPropagation()
    triggers[next].focus()
  }

  return (
    <AccCtx.Provider value={{ open, toggle }}>
      <LevelCtx.Provider value={headingLevel}>
        <div ref={rootRef} className={cx(styles.root, className)} onKeyDown={onKeyDown}>
          {children}
        </div>
      </LevelCtx.Provider>
    </AccCtx.Provider>
  )
}

export type AccordionItemProps = {
  /** Unique id for this item, used in the Accordion value list. */
  value: string
  /** Text on the button that opens and closes the item. */
  title: ReactNode
  /** Stops the item from opening or closing. */
  disabled?: boolean
  /** Content shown when the item is open. */
  children: ReactNode
}

export function AccordionItem({ value, title, disabled, children }: AccordionItemProps) {
  const ctx = useContext(AccCtx)
  const level = useContext(LevelCtx)
  if (!ctx) throw new Error('AccordionItem must be inside Accordion')
  const id = useId()
  const isOpen = ctx.open.includes(value)
  const Heading = `h${level}` as 'h3'
  return (
    <div className={styles.item} data-open={isOpen || undefined}>
      <Heading className={styles.heading}>
        <button
          id={`${id}-trigger`}
          type="button"
          className={styles.trigger}
          aria-expanded={isOpen}
          aria-controls={`${id}-panel`}
          disabled={disabled}
          onClick={() => ctx.toggle(value)}
        >
          <span className={styles.title}>{title}</span>
          <ChevronDownIcon className={styles.chevron} />
        </button>
      </Heading>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className={styles.panel}
        inert={!isOpen}
      >
        <div className={styles.panelInner}>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </div>
  )
}
