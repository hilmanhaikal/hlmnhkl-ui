// Gooee UI, MIT licence. https://gooee.dev
// Which pages show, the same in every framework.

const span = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

/** Always the same number of slots, so the row keeps its width. A gap hides at least two pages. */
export function pageRange(page: number, count: number, siblings: number): Array<number | 'gap'> {
  const total = siblings * 2 + 5
  if (count <= total) return span(1, count)
  const side = total - 2
  const leftGap = page - siblings > 3
  const rightGap = page + siblings < count - 2
  if (!leftGap) return [...span(1, side), 'gap', count]
  if (!rightGap) return [1, 'gap', ...span(count - side + 1, count)]
  return [1, 'gap', ...span(page - siblings, page + siblings), 'gap', count]
}
