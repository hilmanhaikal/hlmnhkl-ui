'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { cx } from '../../internal/cx'
import { ArrowUpIcon } from '../../internal/icons'
import { prefersReducedMotion } from '../../internal/motion'
import styles from './TableOfContents.module.css'

export type TocItem = {
  /** The id of the heading on the page. */
  id: string
  label: string
}

export type TableOfContentsProps = {
  /** The sections, in page order: each heading's id and the text to show for it. */
  items: TocItem[]
  /** Heading above the list, also the nav's name. */
  title?: string
  /** Adds a way back to the top once the reader has passed the first section. */
  backToTop?: boolean
  /** Extra class for the root element. */
  className?: string
}

// The sections of a page as links to their headings. Each is a frame on a strip: filled once read, ringed
// where the reader is, open ahead, so it shows how far through the page they are, not only where.
export function TableOfContents({ items, title = 'On this page', backToTop = false, className }: TableOfContentsProps) {
  const [active, setActive] = useState(items[0]?.id)

  // The section being read is the last heading past the top third of the screen.
  useEffect(() => {
    const headings = items.map((t) => document.getElementById(t.id)).filter((h): h is HTMLElement => !!h)
    const update = () => {
      const line = window.innerHeight / 3
      let current = headings[0]?.id
      for (const h of headings) if (h.getBoundingClientRect().top <= line) current = h.id
      // A short last section never reaches the line, so the bottom of the page selects it.
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      setActive(atBottom ? headings[headings.length - 1]?.id : current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [items])

  const plain = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

  // A plain click scrolls there and keeps one history entry; Cmd-click still opens a new tab.
  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const heading = document.getElementById(id)
    if (!plain(e) || !heading) return
    e.preventDefault()
    heading.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
    heading.focus({ preventScroll: true })
    window.history.replaceState(window.history.state, '', `#${id}`)
  }

  const toTop = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!plain(e)) return
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  }

  const at = Math.max(0, items.findIndex((t) => t.id === active))
  return (
    <nav className={cx(styles.root, className)} aria-label={title}>
      <p className={styles.title}>{title}</p>
      <ol className={styles.list}>
        {items.map((t, n) => (
          <li key={t.id} data-state={n < at ? 'read' : n === at ? 'here' : 'ahead'}>
            <a href={`#${t.id}`} className={styles.link} aria-current={active === t.id ? 'location' : undefined} onClick={(e) => go(e, t.id)}>
              <span className={styles.node} aria-hidden="true" />
              {t.label}
            </a>
          </li>
        ))}
      </ol>
      {backToTop && at > 0 && (
        <a href="#" className={styles.toTop} onClick={toTop}>
          <ArrowUpIcon aria-hidden="true" />
          Back to top
        </a>
      )}
    </nav>
  )
}
