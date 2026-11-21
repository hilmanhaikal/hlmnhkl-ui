// Gooee UI, MIT licence. https://gooee.dev
import { bezier } from '../feel'
import { morphCurve, motionMs, prefersReducedMotion } from '../motion'

// Sun to moon the way the real moon works: a round disc with a shadow passing over it. The disc stays
// round and grows from the sun's size to the moon's; a second circle, the bite, slides in from the top
// right and carves the crescent. The outline is drawn exactly each frame as "disc minus bite", so every
// frame is a true shape. The rays draw back into the disc and fade first, before it grows into them.
const C = 12
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const part = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)))
const f = (n: number) => Math.round(n * 100) / 100
const BITE = 7
const TOWARD = -Math.PI / 4
export function bodyAt(t: number) {
  const r = lerp(4, 8, part(t, 0.2, 1))
  // The bite starts clear of the disc and ends 5.6 from its centre.
  const d = lerp(r + BITE + 1, 5.6, part(t, 0.15, 1))
  if (d >= r + BITE) return `M${C - r} ${C}A${f(r)} ${f(r)} 0 1 1 ${C + r} ${C}A${f(r)} ${f(r)} 0 1 1 ${C - r} ${C}Z`
  const half = Math.acos((r * r + d * d - BITE * BITE) / (2 * r * d))
  const at = (o: [number, number], rad: number, ang: number): [number, number] => [o[0] + rad * Math.cos(ang), o[1] + rad * Math.sin(ang)]
  const centre: [number, number] = [C, C]
  const bite = at(centre, d, TOWARD)
  const A = at(centre, r, TOWARD + half)
  const B = at(centre, r, TOWARD - half)
  // The disc's edge from A the long way round to B, then the bite's edge back to A through the disc.
  const outer = 2 * Math.PI - 2 * half
  // Of the two ways round the bite from B to A, the one whose middle lies inside the disc.
  const angA = Math.atan2(A[1] - bite[1], A[0] - bite[0])
  const angB = Math.atan2(B[1] - bite[1], B[0] - bite[0])
  const up = (((angA - angB) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  const mid = at(bite, BITE, angB + up / 2)
  const sweep = Math.hypot(mid[0] - C, mid[1] - C) < r ? 1 : 0
  const inner = sweep ? up : 2 * Math.PI - up
  return `M${f(A[0])} ${f(A[1])}A${f(r)} ${f(r)} 0 ${outer > Math.PI ? 1 : 0} 1 ${f(B[0])} ${f(B[1])}A${BITE} ${BITE} 0 ${inner > Math.PI ? 1 : 0} ${sweep} ${f(A[0])} ${f(A[1])}Z`
}
export const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4
  return `M${f(C + 7 * Math.cos(a))} ${f(C + 7 * Math.sin(a))}L${f(C + 9.5 * Math.cos(a))} ${f(C + 9.5 * Math.sin(a))}`
}).join('')
// The rays draw in toward the disc, turn a little and fade, all within the first 40%.
export const raysAt = (t: number) => {
  const k = part(t, 0, 0.4)
  return { transform: `rotate(${f(-30 * k)}deg) scale(${f(1 - 0.45 * k)})`, opacity: String(f(1 - k)) }
}
function draw(body: SVGPathElement, t: number) {
  body.setAttribute('d', bodyAt(t))
  const rays = body.nextElementSibling as SVGPathElement | null
  if (rays) Object.assign(rays.style, raysAt(t))
}

/**
 * The theme toggle's icon: 1 is the moon, 0 the sun. The body morphs on the morph curve, in the reveal's
 * time, so the icon and the theme's circle end together; the rays are drawn on the same frames.
 */
export function createThemeIcon(body: () => SVGPathElement | null, start: number) {
  let shown = start
  let aim = start
  let raf = 0
  const morphTo = (to: number) => {
    const el = body()
    aim = to
    cancelAnimationFrame(raf)
    if (!el) return
    const from = shown
    const length = motionMs('morph-out')
    if (from === to || !length || prefersReducedMotion()) {
      shown = to
      draw(el, to)
      return
    }
    const ease = bezier(morphCurve())
    const t0 = performance.now()
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / length)
      shown = from + (to - from) * ease(u)
      draw(el, shown)
      if (u < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }
  return {
    get shown() {
      return shown
    },
    get aim() {
      return aim
    },
    morphTo,
    destroy: () => cancelAnimationFrame(raf),
  }
}
