// Gooee UI, MIT licence. https://gooee.dev
// The parts of a segmented row that are the same in every framework: the ink copy of the labels under
// the flowing pill, the tight mode, and the arrow keys.

/**
 * Labels under the liquid take the chosen colour, from a copy of the row clipped to the drawn outline.
 * Returns the `ink` callback for createFlow: an outline draws the copy, null removes it.
 */
export function segmentInk(root: () => HTMLElement | null, items: () => Array<HTMLElement | null>, cls: string) {
  let layer: HTMLDivElement | null = null
  return (outline: string | null) => {
    const host = root()
    if (!outline || !host) {
      layer?.remove()
      layer = null
      return
    }
    if (!layer) {
      layer = document.createElement('div')
      layer.className = cls
      layer.setAttribute('aria-hidden', 'true')
      layer.inert = true
      for (const el of items()) {
        if (!el) continue
        const copy = el.cloneNode(true) as HTMLElement
        copy.removeAttribute('id')
        copy.style.left = `${el.offsetLeft}px`
        copy.style.top = `${el.offsetTop}px`
        copy.style.width = `${el.offsetWidth}px`
        copy.style.height = `${el.offsetHeight}px`
        layer.append(copy)
      }
      host.append(layer)
    }
    layer.style.clipPath = `path('${outline}')`
  }
}

/** Tight mode only when the segments overflow at their normal size, so a wide screen keeps the normal look. Returns the chosen segment's place. */
export function measureSegments(root: HTMLElement | null, chosen: HTMLElement | null | undefined) {
  if (root) {
    root.removeAttribute('data-tight')
    if (root.scrollWidth > root.clientWidth) root.setAttribute('data-tight', '')
  }
  return chosen ? { x: chosen.offsetLeft, w: chosen.offsetWidth } : null
}

/** The segment a key moves to, skipping disabled ones, or -1 for a key it leaves alone. */
export function segmentKey(key: string, from: number, disabled: boolean[]) {
  const n = disabled.length
  const step = (start: number, dir: 1 | -1) => {
    let i = start
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n
      if (!disabled[i]) return i
    }
    return start
  }
  if (key === 'ArrowRight' || key === 'ArrowDown') return step(from, 1)
  if (key === 'ArrowLeft' || key === 'ArrowUp') return step(from, -1)
  if (key === 'Home') return step(-1, 1)
  if (key === 'End') return step(n, -1)
  return -1
}
