// Gooee UI, MIT licence. https://gooee.dev
// Textarea: the field grows smoothly with its text between minRows and maxRows, and the live count follows.
export function growTextarea(el: HTMLTextAreaElement | null, count: HTMLElement | null, o: { autoGrow: boolean; minRows: number; maxRows: number; maxLength?: number }) {
  if (!el) return
  if (count) count.textContent = `${el.value.length} / ${o.maxLength}`
  if (!o.autoGrow) return
  const cs = getComputedStyle(el)
  const line = parseFloat(cs.lineHeight) || 24
  const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
  const border = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
  const prev = el.style.height
  el.style.transition = 'none'
  el.style.height = 'auto'
  const min = line * o.minRows + pad + border
  const max = line * o.maxRows + pad + border
  const next = Math.min(Math.max(el.scrollHeight + border, min), max)
  // Restore the old height and force layout, so the transition runs
  el.style.height = prev || `${next}px`
  void el.offsetHeight
  el.style.transition = ''
  el.style.height = `${next}px`
  el.style.overflowY = el.scrollHeight + border > max ? 'auto' : 'hidden'
}
