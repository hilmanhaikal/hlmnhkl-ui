import { bezier } from '../feel'
import { body, boxPath, lerp, loopsPath, pincher, seg, trace, type Box } from '../liquidPath'
import { morphCurve, readMotionMs } from '../motion'
import { frames, layer, morphEase, motionFor } from './liquidMatter'

// The hold to confirm button's motion: the burning line on its edge and the cancel drop that buds out of it.

// A press shorter than this is a tap: it opens the confirm step, like one key press does.
export const TAP = 250
// Held this long, the hint changes to "Keep holding".
export const HINT_AFTER = 300
// A finger that slides this far off the button lets go.
export const LEAVE = 16
// How long the done state shows before the button can be used again.
export const DONE_FOR = 2400
// A click this soon after the step opens is the rest of a double-click, not a choice.
export const GUARD = 500

/**
 * The cancel drop buds out of the button's right edge, its neck stretches and breaks, and it grows into
 * the round cancel button (`in`), or flows back into the button (`out`). The button keeps its own look:
 * the drawing is cut out where it is. `cls` is the drawing's class. Returns a stop, or null when motion is reduced.
 */
export function bud(row: HTMLElement, shell: HTMLElement, x: HTMLElement, way: 'in' | 'out', cls: string) {
  // 400ms both ways: the drop is small, and at the morph's 600ms the cancel button felt late to arrive.
  const ms = motionFor('reveal')
  if (!ms) return null
  const box = (el: HTMLElement): Box => {
    const r = el.getBoundingClientRect(),
      o = row.getBoundingClientRect()
    return { cx: r.left - o.left + r.width / 2, cy: r.top - o.top + r.height / 2, hw: r.width / 2, hh: r.height / 2, r: r.height / 2 }
  }
  const O = box(shell)
  const look = getComputedStyle(x)
  const line = parseFloat(look.getPropertyValue('--gooee-line-thick')) || 1.5
  const T = box(x)
  const T2: Box = { ...T, hw: T.hw - line / 2, hh: T.hh - line / 2, r: T.r - line / 2 }
  const { svg, paths } = layer(row, cls, null)
  const path = paths[0]
  path.style.fill = look.backgroundColor
  path.style.stroke = look.getPropertyValue('--gooee-color-border-strong')
  path.style.strokeWidth = `${line}px`
  const clip = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'clipPath'))
  clip.id = `gooee-hold-${Math.random().toString(36).slice(2)}`
  const hole = clip.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'path'))
  hole.setAttribute('clip-rule', 'evenodd')
  hole.setAttribute('d', `M-4000 -4000H4000V4000H-4000Z${boxPath({ ...O, hw: O.hw + 0.5, hh: O.hh + 0.5, r: O.r + 0.5 })}`)
  path.setAttribute('clip-path', `url(#${clip.id})`)
  const e = morphEase()
  const pin = pincher(e, motionFor('fast'))
  const edge = O.cx + O.hw - O.hh
  const r0 = O.hh * 0.45
  x.style.opacity = '0'
  const stop = frames(
    ms,
    (k, now) => {
      const u = way === 'in' ? k : 1 - k
      const f = e(u)
      const r = lerp(r0, T2.hh, e(seg(u, 0.25, 1)))
      const D: Box = { cx: lerp(O.cx + O.hw - r0, T2.cx, f), cy: O.cy, hw: r, hh: r, r }
      const p = pin(body(O, [edge, O.cy]), body(D), now)
      path.setAttribute(
        'd',
        loopsPath(
          trace(p.sdf, [
            [edge, O.cy, 0, 1],
            [D.cx, D.cy, 0, 1],
          ]),
        ),
      )
    },
    () => {
      svg.remove()
      x.style.opacity = ''
    },
  )
  return () => {
    stop()
    svg.remove()
    x.style.opacity = ''
  }
}

// The pill's outline as one closed path that starts on the bottom edge at x and runs left first. The
// line is drawn at both ends of the path at once, so it burns out both ways from x and meets opposite.
export function outline(w: number, h: number, inset: number, x: number) {
  const r = h / 2 - inset
  const t = inset
  const b = h - inset
  const l = h / 2
  const rr = w - h / 2
  const px = Math.max(l, Math.min(rr, x))
  return `M${px},${b} H${l} A${r},${r} 0 0 1 ${l},${t} H${rr} A${r},${r} 0 0 1 ${rr},${b} Z`
}

export const cssMs = (el: Element | null, name: string, fallback: number) => {
  const raw = el ? getComputedStyle(el).getPropertyValue(name).trim() : ''
  const v = parseFloat(raw)
  if (!Number.isFinite(v)) return fallback
  return raw.endsWith('ms') ? v : raw.endsWith('s') ? v * 1000 : v
}

/**
 * The burning line on the button's edge, drawn on `run` (a path with pathLength 1). `forward` burns at an
 * even speed, since it is a clock, and calls `tick` each frame and `done` at the end. `rewind` runs back
 * fast on the morph curve: a rubber band, not a clock.
 */
export function createFuse(run: () => SVGPathElement | null) {
  let p = 0
  let raf = 0
  const paint = (v: number) => {
    p = v
    const el = run()
    if (!el) return
    el.style.strokeDasharray = `${v / 2} ${1 - v} ${v / 2} 0`
    el.style.opacity = v > 0 ? '1' : '0'
  }
  const stop = () => cancelAnimationFrame(raf)
  const forward = (total: number, tick: (now: number) => void, done: () => void) => {
    stop()
    let last = performance.now()
    const step = (now: number) => {
      const next = Math.min(1, p + (now - last) / total)
      last = now
      paint(next)
      tick(now)
      if (next >= 1) return done()
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }
  const rewind = () => {
    stop()
    const from = p
    const length = readMotionMs('fast')
    if (!length || !from) return paint(0)
    const ease = bezier(morphCurve())
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / length)
      paint(from * (1 - ease(t)))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }
  return { paint, forward, rewind, stop }
}
