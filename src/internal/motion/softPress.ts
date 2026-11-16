import { boxRing, clamp01, lerp, nearest, polyPath, seg, softRing, type Pt } from '../liquidPath'
import { morphEase, motionFor } from './liquidMatter'
import { motionMs, prefersReducedMotion } from '../motion'

// Soft press (Button): while someone presses, hovers or lets go, an SVG draws the button's own shape
// with a soft edge. The edge dents where the finger is (the middle, for a key) and follows it, a mouse
// near the edge pulls it out a little, and a let-go sends one small wave round the edge. A wet spot
// spreads under the press and fades after. The label never moves. At rest the SVG is gone and the
// button's CSS shape is back, exact.

const NS = 'http://www.w3.org/2000/svg'
let ids = 0

export type SoftLook = { layer: string; fill: string; ring: string; wet: string }

type Ring = Array<[number, number, number, number]>

type Live = {
  el: HTMLElement
  svg: SVGSVGElement
  fill: SVGPathElement
  ring: SVGPathElement
  clip: SVGPathElement
  wet: SVGCircleElement
  outer: Ring
  inner: Ring
  w: number
  h: number
  top: number
  bottom: number
  meet: number
}

const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches

export type SoftPressOptions = {
  /** Class names for the layer and its parts. */
  look: SoftLook
  /** Keys that press it, such as Enter and Space. */
  keys: string[]
  /** True while it must not respond, such as when disabled or loading. */
  inert?: boolean
}

type PointerLike = Pick<PointerEvent, 'button' | 'clientX' | 'clientY' | 'pointerId' | 'pointerType'> & { currentTarget: EventTarget | null }
type KeyLike = Pick<KeyboardEvent, 'key' | 'repeat'> & { currentTarget: EventTarget | null }

/**
 * Soft press for one button. Options are read at each event, so they can change. Feed it the button's
 * events, or call `listen` on the button. Call `destroy` when the button goes, and `stop` when it turns inert.
 */
export function createSoftPress(o: SoftPressOptions) {
  const s = ({
    live: null as Live | null,
    dent: 0,
    press: null as null | { into: boolean; from: number; t0: number; ms: number; wave: boolean },
    held: false,
    byKey: false,
    at: [0, 0] as Pt,
    aim: [0, 0] as Pt,
    pull: 0,
    pullAim: 0,
    to: [0, 0] as Pt,
    toAim: [0, 0] as Pt,
    wave: null as null | { t0: number; ms: number; from: number[] },
    wet: null as null | { t0: number; ms: number; fade: { t0: number; ms: number } | null },
    last: 0,
    raf: 0,
    off: () => {},
  })

  // The shape for the button's size now. Runs again when the size changes while the layer is up, such
  // as a label that changes on click.
  const fit = (L: Pick<Live, 'el' | 'svg'>) => {
    const { el, svg } = L
    const w = el.offsetWidth
    const h = el.offsetHeight
    const css = getComputedStyle(el)
    const line = parseFloat(css.borderTopWidth) || 0
    const r = Math.min(h / 2, parseFloat(css.borderTopLeftRadius) || 0)
    const outer = boxRing({ cx: w / 2, cy: h / 2, hw: w / 2, hh: h / 2, r }, 1)
    const inner = boxRing({ cx: w / 2, cy: h / 2, hw: w / 2 - line, hh: h / 2 - line, r: Math.max(0, r - line) }, 1)
    svg.setAttribute('width', String(w))
    svg.setAttribute('height', String(h))
    let len = 0
    outer.forEach((p, i) => (len += Math.hypot(outer[(i + 1) % outer.length][0] - p[0], outer[(i + 1) % outer.length][1] - p[1])))
    return { outer, inner, w, h, top: nearest(outer, w / 2, 0), bottom: nearest(outer, w / 2, h), meet: len / 2 }
  }

  const build = (el: HTMLElement): Live => {
    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('class', o.look.layer)
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('data-gooee-liquid', '')
    const id = `gooee-soft-${++ids}`
    const defs = svg.appendChild(document.createElementNS(NS, 'defs'))
    const grad = defs.appendChild(document.createElementNS(NS, 'radialGradient'))
    grad.id = `${id}-wet`
    for (const [at, o] of [['0', '0.9'], ['0.5', '0.6'], ['1', '0']]) {
      const stop = grad.appendChild(document.createElementNS(NS, 'stop'))
      stop.setAttribute('offset', at)
      stop.setAttribute('stop-opacity', o)
    }
    const clipEl = defs.appendChild(document.createElementNS(NS, 'clipPath'))
    clipEl.id = `${id}-clip`
    const clip = clipEl.appendChild(document.createElementNS(NS, 'path'))
    const fill = svg.appendChild(document.createElementNS(NS, 'path'))
    fill.setAttribute('class', o.look.fill)
    const ring = svg.appendChild(document.createElementNS(NS, 'path'))
    ring.setAttribute('class', o.look.ring)
    ring.setAttribute('fill-rule', 'evenodd')
    const wet = svg.appendChild(document.createElementNS(NS, 'circle'))
    wet.setAttribute('class', o.look.wet)
    wet.setAttribute('fill', `url(#${id}-wet)`)
    wet.setAttribute('clip-path', `url(#${id}-clip)`)
    wet.setAttribute('r', '0')
    el.prepend(svg)
    el.dataset.soft = ''
    return { el, svg, fill, ring, clip, wet, ...fit({ el, svg }) }
  }

  const teardown = () => {
    cancelAnimationFrame(s.raf)
    s.raf = 0
    s.off()
    s.off = () => {}
    if (s.live) {
      const el = s.live.el
      s.live.svg.remove()
      // The button's own paint comes back at once, with no fade, so the hand-over does not show.
      const own = el.style.transition
      el.style.transition = 'none'
      delete el.dataset.soft
      delete el.dataset.held
      void getComputedStyle(el).backgroundColor
      el.style.transition = own
    }
    s.live = null
    s.dent = 0
    s.press = null
    s.held = false
    s.pull = 0
    s.pullAim = 0
    s.wave = null
    s.wet = null
  }

  const frame = (now: number) => {
    s.raf = 0
    const L = s.live
    if (!L) return
    if (L.el.offsetWidth !== L.w || L.el.offsetHeight !== L.h) Object.assign(L, fit(L))
    const dt = Math.max(0, now - s.last)
    s.last = now
    const e = morphEase()
    const still = prefersReducedMotion()
    const fast = motionMs('fast') || 1
    const follow = still ? 1 : 1 - Math.exp(-dt / (fast / 3.5))
    s.at = [s.at[0] + (s.aim[0] - s.at[0]) * follow, s.at[1] + (s.aim[1] - s.at[1]) * follow]
    const pullTo = s.held || s.press || s.wave ? 0 : s.pullAim
    s.pull = still ? 0 : s.pull + (pullTo - s.pull) * (1 - Math.exp(-dt / (fast / 1.5)))
    if (pullTo === 0 && s.pull < 0.01) s.pull = 0
    const ease = still ? 1 : 1 - Math.exp(-dt / (fast / 2.3))
    s.to = [s.to[0] + (s.toAim[0] - s.to[0]) * ease, s.to[1] + (s.toAim[1] - s.to[1]) * ease]
    const depth = parseFloat(getComputedStyle(L.el).getPropertyValue('--gooee-press-depth')) || 0
    const p = s.press
    if (p) {
      const k = p.ms ? clamp01((now - p.t0) / p.ms) : 1
      if (p.into) s.dent = lerp(p.from, depth, e(k))
      else s.dent = p.wave ? p.from * (1 - e(seg(k, 0, 0.45))) : 0
      if (!p.into && k >= 1) {
        s.press = null
        s.dent = 0
      }
    }
    let wave = 0
    let run = 0
    if (s.wave) {
      const k = s.wave.ms ? clamp01((now - s.wave.t0) / s.wave.ms) : 1
      if (k >= 1) s.wave = null
      else {
        // It slows near the far side and fades out on the morph curve in its second half.
        wave = Math.sin((Math.PI / 2) * clamp01(k / 0.12)) * (1 - e(seg(k, 0.55, 1)))
        run = (1 - (1 - k) ** 2) * (L.meet / s.wave.from.length)
      }
    }
    let wetOn = false
    if (s.wet) {
      const r = lerp(L.h * 0.21, L.h, s.wet.ms ? e(clamp01((now - s.wet.t0) / s.wet.ms)) : 1)
      const f = s.wet.fade
      const o = f ? (f.ms ? 1 - e(clamp01((now - f.t0) / f.ms)) : 0) : 1
      if (o <= 0.002) s.wet = null
      else {
        wetOn = true
        L.wet.setAttribute('cx', s.at[0].toFixed(2))
        L.wet.setAttribute('cy', s.at[1].toFixed(2))
        L.wet.setAttribute('r', r.toFixed(2))
        L.wet.setAttribute('opacity', o.toFixed(3))
      }
    }
    L.wet.style.display = wetOn ? '' : 'none'
    const shape = { dent: s.dent, at: s.at, pull: s.pull, to: s.to, wave, run, from: s.wave?.from ?? [] }
    if (!s.dent && !s.pull && !wave && !wetOn && !s.held && !s.press && !s.pullAim) {
      teardown()
      return
    }
    const outer = polyPath(softRing(L.outer, L.h, shape))
    L.fill.setAttribute('d', outer)
    L.clip.setAttribute('d', outer)
    L.ring.setAttribute('d', outer + polyPath(softRing(L.inner, L.h, shape)))
    s.raf = requestAnimationFrame(frame)
  }

  const wake = (el: HTMLElement) => {
    if (!s.live) {
      s.live = build(el)
      s.at = [...s.aim]
      s.to = [...s.toAim]
      s.last = performance.now()
    }
    if (!s.raf) s.raf = requestAnimationFrame(frame)
  }

  const local = (el: HTMLElement, x: number, y: number): Pt => {
    const r = el.getBoundingClientRect()
    return [x - r.left, y - r.top]
  }

  const press = (el: HTMLElement, at: Pt, byKey: boolean) => {
    s.aim = at
    if (!s.held) s.at = [...at]
    s.held = true
    s.byKey = byKey
    s.wave = null
    el.dataset.held = ''
    wake(el)
    const L = s.live!
    s.at = [...at]
    s.press = { into: true, from: s.dent, t0: performance.now(), ms: motionFor('fast'), wave: false }
    s.wet = { t0: performance.now(), ms: motionFor('slower'), fade: null }
    // The wet spot darkens a light fill and lightens a dark one.
    const rgb = getComputedStyle(L.fill).fill.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255, 0]
    const light = (rgb[3] ?? 1) < 0.1 || 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] > 140
    L.svg.dataset.wet = light ? 'dark' : 'light'
  }

  const release = () => {
    if (!s.held || !s.live) return
    s.held = false
    delete s.live.el.dataset.held
    s.off()
    s.off = () => {}
    const ms = motionFor('slow')
    s.press = { into: false, from: s.dent, t0: performance.now(), ms, wave: ms > 0 }
    if (ms) s.wave = { t0: performance.now(), ms, from: s.byKey ? [s.live.top, s.live.bottom] : [nearest(s.live.outer, s.at[0], s.at[1])] }
    if (s.wet) s.wet.fade = { t0: performance.now(), ms: motionFor('slow') }
    wake(s.live.el)
  }

  const down = (e: PointerLike) => {
    if (o.inert || e.button !== 0) return
    const el = e.currentTarget as HTMLElement
    press(el, local(el, e.clientX, e.clientY), false)
    const move = (m: PointerEvent) => {
      if (m.pointerId === e.pointerId) s.aim = local(el, m.clientX, m.clientY)
    }
    const up = (m: PointerEvent) => {
      if (m.pointerId === e.pointerId) release()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    s.off = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }
  const hover = (e: PointerLike) => {
    if (o.inert || e.pointerType !== 'mouse' || !fine() || prefersReducedMotion() || s.held) return
    const el = e.currentTarget as HTMLElement
    const [x, y] = local(el, e.clientX, e.clientY)
    const w = el.offsetWidth
    const h = el.offsetHeight
    // Strongest at the edge, less toward the middle.
    const edge = Math.min(x, w - x, y, h - y)
    s.pullAim = Math.exp(-(edge * edge) / (2 * (h * 0.58) ** 2))
    const ring = s.live?.outer ?? boxRing({ cx: w / 2, cy: h / 2, hw: w / 2, hh: h / 2, r: h / 2 }, 1)
    const p = ring[nearest(ring, x, y)]
    s.toAim = [p[0], p[1]]
    wake(el)
  }
  const leave = () => {
    s.pullAim = 0
  }
  const keyDown = (e: KeyLike) => {
    if (o.inert || e.repeat || !o.keys.includes(e.key)) return
    const el = e.currentTarget as HTMLElement
    press(el, [el.offsetWidth / 2, el.offsetHeight / 2], true)
  }
  const keyUp = (e: KeyLike) => {
    if (o.keys.includes(e.key) && s.byKey) release()
  }
  const blur = () => {
    if (s.byKey) release()
  }

  return {
    down,
    hover,
    leave,
    keyDown,
    keyUp,
    blur,
    /** Ends any press at once and removes the drawing. */
    stop: teardown,
    destroy: teardown,
    /** Listens on the button. Returns a function that stops listening and removes the drawing. */
    listen(button: HTMLElement) {
      const ac = new AbortController()
      const opts = { signal: ac.signal }
      button.addEventListener('pointerdown', down, opts)
      button.addEventListener('pointermove', hover, opts)
      button.addEventListener('pointerleave', leave, opts)
      button.addEventListener('keydown', keyDown, opts)
      button.addEventListener('keyup', keyUp, opts)
      button.addEventListener('blur', blur, opts)
      return () => {
        ac.abort()
        teardown()
      }
    },
  }
}
