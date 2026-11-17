import { frames, morphEase, motionFor } from './liquidMatter'

// The front edge moves over this share of the time; the back edge starts the rest of the way in.
const LEAD = 0.75
// The longest the thumb gets, as a share of its round size.
const STRETCH = 1.4

type El = HTMLElement | (() => HTMLElement | null)
const get = (t: El) => (typeof t === 'function' ? t() : t)

/**
 * A switch's thumb that stretches: its front edge leaves first and the back edge catches up, so it stays
 * one shape. The on fill's edge (--fill on the track, the thumb's parent) rides on the thumb's edge, so
 * the colour never sits apart from it. Call `set` with the new state each time it may have changed.
 */
export function createSwitchThumb(target: El, checked: boolean) {
  let was = checked
  let run: { a: number; b: number; stop: () => void } | null = null
  const end = () => {
    const thumb = get(target)
    run?.stop()
    run = null
    if (!thumb) return
    thumb.style.removeProperty('transform')
    thumb.style.removeProperty('width')
    const track = thumb.parentElement
    if (track) {
      delete track.dataset.moving
      track.style.removeProperty('--fill')
    }
  }
  const set = (checked: boolean) => {
    const thumb = get(target)
    const track = thumb?.parentElement
    if (was === checked || !thumb || !track) return
    was = checked
    const ms = motionFor('slow')
    if (!ms) {
      end()
      return
    }
    const s = getComputedStyle(track)
    const line = parseFloat(s.borderLeftWidth) || 0
    const pad = parseFloat(s.getPropertyValue('--pad')) || 0
    const size = thumb.offsetHeight
    const rest = thumb.offsetLeft
    const offX = rest
    const onX = track.clientWidth - rest - size
    const to = checked ? onX : offX
    const from = run ? { a: run.a, b: run.b } : { a: checked ? offX : onX, b: (checked ? offX : onX) + size }
    run?.stop()
    const ahead = to + size / 2 >= (from.a + from.b) / 2
    const e = morphEase()
    const outer = track.offsetWidth
    const live = { ...from, stop: () => {} }
    run = live
    track.dataset.moving = ''
    live.stop = frames(
      ms,
      (u) => {
        const lead = e(Math.min(1, u / LEAD))
        const trail = e(Math.max(0, (u - 1 + LEAD) / LEAD))
        live.a = from.a + (to - from.a) * (ahead ? trail : lead)
        live.b = from.b + (to + size - from.b) * (ahead ? lead : trail)
        // A short pill at most, so the fill behind it stays in view.
        const long = live.b - live.a - size * STRETCH
        if (long > 0) {
          if (ahead) live.a += long
          else live.b -= long
        }
        thumb.style.transform = `translateX(${live.a - rest}px)`
        thumb.style.width = `${live.b - live.a}px`
        // How far on the thumb is, 0 to 1: the fill opens out to the track's edge as it goes.
        const p = Math.min(1, Math.max(0, ((live.a + live.b) / 2 - offX - size / 2) / (onX - offX)))
        const side = (pad + line) * (1 - p)
        const right = outer - live.b - line + line * (1 - p) - pad * p
        track.style.setProperty('--fill', `inset(${side}px ${Math.max(0, right)}px ${side}px ${side}px round var(--gooee-radius-full))`)
      },
      end,
    )
  }
  return { set, destroy: end }
}
