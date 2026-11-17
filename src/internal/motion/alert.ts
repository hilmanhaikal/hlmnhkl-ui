import { easing, motionMs } from '../motion'

// Folds an alert's height to zero, so content below slides up instead of jumping, then calls done.
export function foldAway(el: HTMLElement, done: () => void) {
  const ms = motionMs('slow')
  if (ms === 0 || !el.animate) return done()
  const h = el.offsetHeight
  const anim = el.animate(
    [
      { height: `${h}px`, opacity: 1, transform: 'scale(1)' },
      { height: `${h}px`, opacity: 0, transform: 'scale(0.98)', offset: 0.45 },
      { height: '0px', opacity: 0, transform: 'scale(0.98)', paddingTop: '0px', paddingBottom: '0px', marginTop: '0px', marginBottom: '0px', borderWidth: '0px' },
    ],
    { duration: ms, easing: easing('morph'), fill: 'forwards' },
  )
  anim.onfinish = done
}
