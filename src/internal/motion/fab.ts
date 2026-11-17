import type { ScrollReader } from './scrollFrame'

/** Extended: down the page it folds to the icon, back up it opens again. It reads the scroll, never a timer. */
export function foldOnScroll(setCompact: (compact: boolean) => void): ScrollReader {
  let last: number | null = null
  return () => {
    const y = window.scrollY
    const prev = last
    last = y
    if (prev === null || Math.abs(y - prev) < 4) return
    const next = y > prev && y > 80
    return () => setCompact(next)
  }
}
