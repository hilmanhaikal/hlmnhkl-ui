// Gooee UI, MIT licence. https://gooee.dev
import { easing, motionMs } from '../motion'
import { focusables } from './focus'

// A part that is about to unmount: focus moves to the next control (or the one before) instead of the body.
export function focusPast(el: HTMLElement) {
  if (!el.contains(document.activeElement)) return
  const others = focusables(document.body).filter((n) => !el.contains(n))
  const next = others.find((n) => el.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING)
  const prev = [...others].reverse().find((n) => el.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING)
  ;(next ?? prev)?.focus({ preventScroll: true })
}

// Folds an inline element's width away so its neighbours slide in, then calls done.
export function collapseOut(el: HTMLElement, done: () => void) {
  const ms = motionMs('base')
  if (ms === 0 || !el.animate) return done()
  const w = el.offsetWidth
  const anim = el.animate(
    [
      { width: `${w}px`, opacity: 1, transform: 'scale(1)' },
      { width: '0px', opacity: 0, transform: 'scale(0.8)', marginInlineEnd: '0px', paddingInline: '0px', borderWidth: '0px' },
    ],
    { duration: ms, easing: easing('morph'), fill: 'forwards' },
  )
  anim.onfinish = done
}
