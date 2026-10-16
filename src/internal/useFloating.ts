import { useCallback, useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

export type Side = 'top' | 'bottom' | 'left' | 'right'
export type Align = 'start' | 'center' | 'end'

const MARGIN = 8

type Options = {
  open: boolean
  side?: Side
  align?: Align
  offset?: number
  matchWidth?: boolean
}

// Before the first measure the layer is see-through, not hidden, so focus can still move into it.
export function useFloating(
  anchorRef: RefObject<HTMLElement | null>,
  floatingRef: RefObject<HTMLElement | null>,
  { open, side = 'bottom', align = 'center', offset = 8, matchWidth = false }: Options,
) {
  const [pos, setPos] = useState<{ top: number; left: number; side: Side; width?: number } | null>(null)

  const update = useCallback(() => {
    const a = anchorRef.current
    const f = floatingRef.current
    if (!a || !f) return
    const r = a.getBoundingClientRect()
    const width = matchWidth ? r.width : undefined
    const fw = width ?? f.offsetWidth
    const fh = f.offsetHeight
    const vw = window.innerWidth
    const vh = window.innerHeight

    let s = side
    if (s === 'bottom' && r.bottom + offset + fh > vh - MARGIN && r.top - offset - fh > MARGIN) s = 'top'
    else if (s === 'top' && r.top - offset - fh < MARGIN && r.bottom + offset + fh < vh - MARGIN) s = 'bottom'
    else if (s === 'right' && r.right + offset + fw > vw - MARGIN && r.left - offset - fw > MARGIN) s = 'left'
    else if (s === 'left' && r.left - offset - fw < MARGIN && r.right + offset + fw < vw - MARGIN) s = 'right'

    let top = 0
    let left = 0
    if (s === 'bottom' || s === 'top') {
      top = s === 'bottom' ? r.bottom + offset : r.top - offset - fh
      left = align === 'start' ? r.left : align === 'end' ? r.right - fw : r.left + r.width / 2 - fw / 2
    } else {
      left = s === 'right' ? r.right + offset : r.left - offset - fw
      top = align === 'start' ? r.top : align === 'end' ? r.bottom - fh : r.top + r.height / 2 - fh / 2
    }
    left = Math.min(Math.max(MARGIN, left), Math.max(MARGIN, vw - fw - MARGIN))
    top = Math.min(Math.max(MARGIN, top), Math.max(MARGIN, vh - fh - MARGIN))
    setPos({ top, left, side: s, width })
  }, [anchorRef, floatingRef, side, align, offset, matchWidth])

  useLayoutEffect(() => {
    if (!open) return
    update()
    const f = floatingRef.current
    const ro = new ResizeObserver(update)
    if (f) ro.observe(f)
    if (anchorRef.current) ro.observe(anchorRef.current)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, update, floatingRef, anchorRef])

  const style: CSSProperties = pos
    ? { position: 'fixed', top: pos.top, left: pos.left, width: pos.width }
    : { position: 'fixed', top: 0, left: 0, opacity: 0, pointerEvents: 'none' }

  return { style, side: pos?.side ?? side, update }
}
