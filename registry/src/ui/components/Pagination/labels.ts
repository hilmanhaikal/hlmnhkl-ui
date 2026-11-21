// Gooee UI, MIT licence. https://gooee.dev
// Pagination's text, shared by React and Vue.

export type PaginationLabels = {
  /** Screen reader name for the previous button. */
  previous: string
  /** Screen reader name for the next button. */
  next: string
  /** Screen reader name for each page button in the row. */
  page: (page: number) => string
  /** The compact view's words. The page number in them rolls when it changes. */
  pageOf: (page: number, count: number) => string
  /** The visible label of the compact view's Go to page field. */
  goTo: string
  /** Shown under the field when the typed page does not exist. */
  outOfRange: (count: number) => string
}

export const defaultPaginationLabels: PaginationLabels = {
  previous: 'Previous page',
  next: 'Next page',
  page: (page) => `Page ${page}`,
  pageOf: (page, count) => `Page ${page} of ${count}`,
  goTo: 'Go to page',
  outOfRange: (count) => `Pick a page from 1 to ${count}`,
}

/** The compact words cut around the page number, so only the number rolls. With no number in them, they show whole. */
export function splitPageOf(words: string, page: number): [string, string] | null {
  const at = words.search(new RegExp(`(?<!\\d)${page}(?!\\d)`))
  return at < 0 ? null : [words.slice(0, at), words.slice(at + String(page).length)]
}

/** The typed page, or null when it is not a whole page from 1 to count. */
export function readPage(text: string, count: number): number | null {
  const t = text.trim()
  const n = Number(t)
  return /^\d+$/.test(t) && n >= 1 && n <= count ? n : null
}
