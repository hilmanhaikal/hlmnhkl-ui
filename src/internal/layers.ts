import { useEffect, useRef, type RefObject } from 'react'

// A stack of open layers, so Esc and outside clicks only close the top one.
const stack: Array<{ id: symbol; hint: boolean }> = []

export function useDismiss(
  active: boolean,
  refs: Array<RefObject<HTMLElement | null>>,
  onDismiss: (reason: 'escape' | 'outside') => void,
  /** hint: a tooltip-like layer. It takes Esc first, but clicks pass to the layer below it. */
  options: { outside?: boolean; hint?: boolean } = {},
) {
  const { outside = true, hint = false } = options
  const cb = useRef(onDismiss)
  cb.current = onDismiss
  const refsRef = useRef(refs)
  refsRef.current = refs

  useEffect(() => {
    if (!active) return
    const id = Symbol('layer')
    stack.push({ id, hint })
    const isTop = () => stack[stack.length - 1]?.id === id
    const isTopForPointer = () => stack.filter((l) => !l.hint).pop()?.id === id

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTop()) {
        e.stopPropagation()
        cb.current('escape')
      }
    }
    const onPointer = (e: PointerEvent) => {
      if (!outside || !isTopForPointer()) return
      const target = e.target as Node
      if (refsRef.current.some((r) => r.current?.contains(target))) return
      // Things like the toast stack sit above every layer and never count as outside.
      if (target instanceof Element && target.closest('[data-hl-layer-ignore]')) return
      cb.current('outside')
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
      const i = stack.findIndex((l) => l.id === id)
      if (i >= 0) stack.splice(i, 1)
    }
  }, [active, outside, hint])
}

let lockCount = 0
let saved = ''
let savedPadding = ''

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
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
  }, [active])
}
