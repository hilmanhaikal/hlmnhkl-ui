// A stack of open layers, so Esc and outside clicks only close the top one.
const stack: Array<{ id: symbol; hint: boolean }> = []

export type DismissOptions = {
  /** A press outside counts. On by default. */
  outside?: boolean
  /** A tooltip-like layer: it takes Esc first, but clicks pass to the layer below it. */
  hint?: boolean
  /** Focus moving outside it, while no layer is open above it, counts as outside too. */
  focusOut?: boolean
}

/**
 * Joins the layer stack until the returned function is called. Esc, and a press outside the elements
 * `inside` returns (or focus leaving them, with focusOut), call `onDismiss` while this is the top layer.
 */
export function dismissable(inside: () => Array<HTMLElement | null>, onDismiss: (reason: 'escape' | 'outside', event: Event) => void, { outside = true, hint = false, focusOut = false }: DismissOptions = {}) {
  const id = Symbol('layer')
  stack.push({ id, hint })
  const isTop = () => stack[stack.length - 1]?.id === id
  const isTopForPointer = () => stack.filter((l) => !l.hint).pop()?.id === id
  const within = (target: Node) => inside().some((el) => el?.contains(target))

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isTop()) {
      e.stopPropagation()
      onDismiss('escape', e)
    }
  }
  const onPointer = (e: PointerEvent) => {
    if (!outside || !isTopForPointer()) return
    const target = e.target as Node
    if (within(target)) return
    // Things like the toast stack sit above every layer and never count as outside.
    if (target instanceof Element && target.closest('[data-gooee-layer-ignore]')) return
    onDismiss('outside', e)
  }
  const onFocus = (e: FocusEvent) => {
    if (!focusOut || !isTopForPointer()) return
    if (within(e.target as Node)) return
    onDismiss('outside', e)
  }
  document.addEventListener('keydown', onKey)
  document.addEventListener('pointerdown', onPointer)
  document.addEventListener('focusin', onFocus)
  return () => {
    document.removeEventListener('keydown', onKey)
    document.removeEventListener('pointerdown', onPointer)
    document.removeEventListener('focusin', onFocus)
    const i = stack.findIndex((l) => l.id === id)
    if (i >= 0) stack.splice(i, 1)
  }
}

let lockCount = 0
let saved = ''
let savedPadding = ''

/** Stops the page from scrolling until the returned function is called. Locks can nest. */
export function lockScroll() {
  if (lockCount === 0) {
    const body = document.body
    // Fills the space the scrollbar leaves, so the page does not shift sideways.
    const bar = window.innerWidth - document.documentElement.clientWidth
    saved = body.style.overflow
    savedPadding = body.style.paddingRight
    if (bar > 0) body.style.paddingRight = `calc(${getComputedStyle(body).paddingRight} + ${bar}px)`
    body.style.overflow = 'hidden'
  }
  lockCount++
  return () => {
    lockCount--
    if (lockCount === 0) {
      document.body.style.overflow = saved
      document.body.style.paddingRight = savedPadding
    }
  }
}
