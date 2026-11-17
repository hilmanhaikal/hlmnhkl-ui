// The keys of a menu button and its menu (WAI-ARIA menu button pattern), the same in every framework.

/** What the keys need from a key event: native and React events both have these. */
export type KeyLike = { key: string; preventDefault(): void }

/** The items focus can land on: disabled ones are skipped. */
export const menuItems = (root: HTMLElement | null) => Array.from(root?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [])

/** Down or Up on the menu button opens the menu at its first or last item. */
export function menuButtonKey(e: KeyLike): 'first' | 'last' | null {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return null
  e.preventDefault()
  return e.key === 'ArrowDown' ? 'first' : 'last'
}

/** Type-ahead: letters typed within 600ms of each other build a word, and focus moves to the next item after `i` that starts with it. */
export function createTypeahead() {
  const typeahead = { text: '', at: 0 }
  return (key: string, list: HTMLElement[], i: number) => {
    const now = Date.now()
    typeahead.text = now - typeahead.at > 600 ? key.toLowerCase() : typeahead.text + key.toLowerCase()
    typeahead.at = now
    for (let n = 1; n <= list.length; n++) {
      const el = list[(i + n) % list.length]
      if (el.textContent?.trim().toLowerCase().startsWith(typeahead.text)) {
        el.focus()
        break
      }
    }
  }
}

/** Arrows, Home, End and type-ahead move focus between the items of `root`; Tab calls `onTab`. Returns the key handler. */
export function createMenuKeys(root: () => HTMLElement | null, onTab: () => void) {
  const typeahead = createTypeahead()
  return (e: KeyLike) => {
    const list = menuItems(root())
    const i = list.indexOf(document.activeElement as HTMLElement)
    const go = (n: number) => {
      e.preventDefault()
      list[(n + list.length) % list.length]?.focus()
    }
    if (e.key === 'ArrowDown') go(i + 1)
    else if (e.key === 'ArrowUp') go(i - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(list.length - 1)
    // The menu is portalled, so focus goes back to the trigger and Tab carries on from there.
    else if (e.key === 'Tab') onTab()
    else if (e.key.length === 1 && /\S/.test(e.key)) typeahead(e.key, list, i)
  }
}

/** Enter and Space on an item click it. */
export function itemKey(e: KeyLike & { currentTarget: EventTarget | null }) {
  if (e.key !== 'Enter' && e.key !== ' ') return
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).click()
}
