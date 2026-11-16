import { flushSync } from 'react-dom'
import { easing, motionMs, prefersReducedMotion } from './motion'

// The new theme grows from the spot you pressed: the page is snapshot as it is, and the new page opens
// over it in a circle from the button's centre to the farthest corner, at an even pace. The old snapshot
// stays still under it, and no element plays its own colour change meanwhile, so nothing flips piece by
// piece. A second press finishes the running one first. Without View Transitions the page fades in once;
// with reduced motion it changes at once.

let running: ViewTransition | null = null

// The radius whose circle covers `share` of the screen, by halving, counted on a coarse grid.
function radiusFor(share: number, x: number, y: number, reach: number) {
  if (share >= 1) return reach
  const cols = 48, rows = 32
  const covered = (r: number) => {
    let n = 0
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (Math.hypot(((i + 0.5) * innerWidth) / cols - x, ((j + 0.5) * innerHeight) / rows - y) <= r) n++
    return n / (cols * rows)
  }
  let lo = 0, hi = reach
  for (let k = 0; k < 18; k++) {
    const m = (lo + hi) / 2
    if (covered(m) < share) lo = m
    else hi = m
  }
  return hi
}

export function themeReveal(origin: Element | null, apply: () => void) {
  const root = document.documentElement
  const ms = motionMs('reveal')
  if (prefersReducedMotion() || !ms) return flushSync(apply)
  running?.skipTransition()
  root.dataset.gooeeThemeSwitch = ''
  const done = () => delete root.dataset.gooeeThemeSwitch
  if (typeof document.startViewTransition !== 'function') {
    flushSync(apply)
    document.body.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: ms * 0.6, easing: easing('morph') }).finished.then(done, done)
    return
  }
  const r = origin?.getBoundingClientRect()
  const x = r ? r.left + r.width / 2 : innerWidth / 2
  const y = r ? r.top + r.height / 2 : 0
  const reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const vt = document.startViewTransition(() => flushSync(apply))
  running = vt
  vt.ready.then(
    // The share of the screen covered grows at an even, calm pace (ease out): a circle's area grows with
    // the radius squared, so each step's radius is solved for its share; linear in between.
    () =>
      root.animate(
        { clipPath: Array.from({ length: 21 }, (_, i) => `circle(${radiusFor(1 - (1 - i / 20) ** 2, x, y, reach)}px at ${x}px ${y}px)`) },
        { duration: ms, easing: 'linear', pseudoElement: '::view-transition-new(root)' },
      ),
    () => {},
  )
  vt.finished.finally(() => {
    if (running !== vt) return
    running = null
    done()
  })
}
