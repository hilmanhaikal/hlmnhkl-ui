// Gooee UI, MIT licence. https://gooee.dev
// CopyButton's browser work with no framework: the clipboard write and the icon placed on the label's capitals.

export async function writeText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for http pages and older browsers.
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    const prev = document.activeElement as HTMLElement | null
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    prev?.focus()
    return ok
  }
}

/** With a label, the icon sits on the middle of the label's capital letters, not of its line. Returns a cleanup. */
export function capShift(root: HTMLElement | null, icons: HTMLElement | null, text: Node | null | undefined) {
  root?.style.removeProperty('--cap-shift')
  if (!root || !icons || !text) return () => {}
  const place = () => {
    root.style.removeProperty('--cap-shift')
    const range = document.createRange()
    range.selectNodeContents(text)
    const box = range.getBoundingClientRect()
    const look = getComputedStyle(root)
    const pen = document.createElement('canvas').getContext('2d')
    if (!pen || !box.height) return
    pen.font = `${look.fontWeight} ${look.fontSize} ${look.fontFamily}`
    const m = pen.measureText('H')
    const cap = box.top + m.fontBoundingBoxAscent - m.actualBoundingBoxAscent / 2
    const r = icons.getBoundingClientRect()
    root.style.setProperty('--cap-shift', `${Math.round((cap - r.top - r.height / 2) * 100) / 100}px`)
  }
  place()
  let live = true
  document.fonts?.ready.then(() => live && place())
  return () => {
    live = false
  }
}
