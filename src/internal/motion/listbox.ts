export type ListItem = { label: string; disabled?: boolean }

/**
 * What a key does in a select-only combobox: `open` opens the list with `active` as the active option,
 * `active` alone moves it, `choose` picks the active option, `tab` keeps it and closes.
 */
export type ListKey = { prevent?: boolean; open?: boolean; active?: number; choose?: boolean; tab?: boolean }

type Key = { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }

/** The keys of a select-only combobox: arrows, Home, End, Enter, Space, Tab and type-ahead. Disabled options are skipped. */
export function createListbox(items: () => ListItem[]) {
  const typed = { text: '', at: 0 }
  const enabled = (i: number) => {
    const o = items()
    return i >= 0 && i < o.length && !o[i].disabled
  }
  const step = (from: number, dir: 1 | -1) => {
    const n = items().length
    let i = from
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n
      if (enabled(i)) return i
    }
    return from
  }
  const first = () => step(-1, 1)
  const last = () => step(items().length, -1)

  // Letters typed within 600ms of each other search together; one letter again moves to the next match.
  const typeahead = (ch: string, active: number) => {
    const o = items()
    const now = Date.now()
    typed.text = now - typed.at > 600 ? ch.toLowerCase() : typed.text + ch.toLowerCase()
    typed.at = now
    const start = Math.max(active, 0)
    for (let n = 0; n < o.length; n++) {
      const i = (start + n + (typed.text.length === 1 ? 1 : 0)) % o.length
      if (enabled(i) && o[i].label.toLowerCase().startsWith(typed.text)) return i
    }
    return -1
  }

  const key = (e: Key, open: boolean, active: number, selected: number): ListKey | null => {
    const k = e.key
    if (!open) {
      if (k === 'ArrowDown' || k === 'Enter' || k === ' ') return { prevent: true, open: true, active: enabled(selected) ? selected : first() }
      if (k === 'ArrowUp') return { prevent: true, open: true, active: enabled(selected) ? selected : last() }
      if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const found = typeahead(k, active)
        return { open: true, active: found >= 0 ? found : enabled(selected) ? selected : first() }
      }
      return null
    }
    if (k === 'ArrowDown') return { prevent: true, active: step(active, 1) }
    if (k === 'ArrowUp') return { prevent: true, active: step(active, -1) }
    if (k === 'Home') return { prevent: true, active: first() }
    if (k === 'End') return { prevent: true, active: last() }
    if (k === 'Enter' || k === ' ') return { prevent: true, choose: true }
    if (k === 'Tab') return { tab: true }
    if (k.length === 1) {
      const found = typeahead(k, active)
      return found >= 0 ? { active: found } : null
    }
    return null
  }

  return { enabled, first, last, key }
}
