// A row with no room wraps onto more rows. Each row stays joined, with round ends of its own, so the
// buttons that start and end a row are marked as they fall. Returns the function that stops watching.
export function markRows(root: HTMLElement) {
  const mark = () => {
    const kids = [...root.children] as HTMLElement[]
    kids.forEach((k, i) => {
      const prev = kids[i - 1], next = kids[i + 1]
      k.toggleAttribute('data-row-start', !prev || prev.offsetTop !== k.offsetTop)
      k.toggleAttribute('data-row-end', !next || next.offsetTop !== k.offsetTop)
    })
  }
  mark()
  const ro = new ResizeObserver(mark)
  ro.observe(root)
  const mo = new MutationObserver(mark)
  mo.observe(root, { childList: true })
  return () => {
    ro.disconnect()
    mo.disconnect()
  }
}
