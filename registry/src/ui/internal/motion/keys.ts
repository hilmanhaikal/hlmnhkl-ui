// Gooee UI, MIT licence. https://gooee.dev
// Page-wide key watchers shared by the React and Vue parts. Each returns a function that stops it.

// Calls down(true) while the key is held and down(false) when it is let go or the window loses focus.
export function holdKey(key: string, down: (held: boolean) => void) {
  const match = (e: KeyboardEvent) => e.key.toLowerCase() === key.toLowerCase()
  const onDown = (e: KeyboardEvent) => match(e) && down(true)
  const onUp = (e: KeyboardEvent) => match(e) && down(false)
  const reset = () => down(false)
  window.addEventListener('keydown', onDown)
  window.addEventListener('keyup', onUp)
  window.addEventListener('blur', reset)
  return () => {
    window.removeEventListener('keydown', onDown)
    window.removeEventListener('keyup', onUp)
    window.removeEventListener('blur', reset)
  }
}

const isTyping = (el: Element | null) =>
  !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el as HTMLElement).isContentEditable)

// Pressing the key anywhere focuses and selects the field. Ignored while another field has focus, so it
// never steals typed text, and while a modal the field is not in is open, so focus never leaves the modal.
export function shortcutFocus(key: string, field: () => HTMLInputElement | null) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== key || e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return
    const modals = document.querySelectorAll('[aria-modal="true"]')
    if (modals.length && !modals[modals.length - 1].contains(field())) return
    e.preventDefault()
    field()?.focus()
    field()?.select()
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}

// A textarea grows with its text.
export function fitHeight(el: HTMLTextAreaElement | null) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
