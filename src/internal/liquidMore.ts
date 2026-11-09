import { useEffect, type RefObject } from 'react'
import { boxPath, boxRing, clamp01, lerp, polyPath, sdBox, seg, trace, type Box, type Pt, type Sdf } from './liquidPath'
import { frames, layer, morphEase, motionFor } from './liquidMatter'

// Liquid matter for Checkbox (a cup that fills), the fields (an edge that flows round), CopyButton (a
// drop that fills the icon and turns into the check) and the menus (a bead that follows the pointer).
// Same contract as liquidMatter.ts: the SVG exists only while the part moves, and its last frame is
// the part's own CSS shape.

const NS = 'http://www.w3.org/2000/svg'
let ids = 0

function clipOf(svg: SVGSVGElement) {
  const defs = svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild)
  const clip = defs.appendChild(document.createElementNS(NS, 'clipPath'))
  clip.id = `hl-liquid-clip-${++ids}`
  const path = clip.appendChild(document.createElementNS(NS, 'path'))
  return { path, url: `url(#${clip.id})` }
}

// ---------- cup ----------

/** A container's inner walls, floor and rim, and how much the surface tips and curves. */
export type Cup = { x0: number; x1: number; top: number; bot: number; tilt: number; men: number }

/**
 * The surface at fill `f` (0 on the floor, 1 over the rim), poured from side `s` (-1 left, 1 right,
 * 0 evenly from below): high on the poured side at first, then it rises and levels, with a meniscus.
 */
export function cupLevel(f: number, s: number, cup: Cup) {
  const cx = (cup.x0 + cup.x1) / 2
  const hw = (cup.x1 - cup.x0) / 2
  const T = cup.tilt * (1 - f) * (1 - f)
  const M = cup.men * (0.4 + 0.6 * (1 - f))
  const L = lerp(cup.bot + cup.tilt * Math.abs(s) + cup.men, cup.top - 1, f)
  return (x: number) => {
    const q = (x - cx) / hw
    return L - s * T * q - M * q * q
  }
}

/** The liquid under `y` from x0 to x1, closed along `floor`. */
export function cupPath(y: (x: number) => number, x0: number, x1: number, floor: number) {
  const pts: Pt[] = []
  for (let x = x0; x <= x1 + 1e-6; x += 0.5) pts.push([x, y(x)])
  pts.push([x1, floor], [x0, floor])
  return polyPath(pts)
}

const cupAttr = (c: Cup) => `${c.x0} ${c.x1} ${c.top} ${c.bot}`

// ---------- Checkbox ----------

export type Pour = { u: number; side: number; done: boolean; stop: () => void }

/**
 * Checkbox: ink pours into `box` from `side` (the side tapped; 0 fills evenly from below), rises with
 * a meniscus and levels, then `mark` draws. Emptying runs it back. While it pours the box carries
 * data-pouring, so its CSS fill stands down. A pour caught half way turns from where it is.
 */
export function pour(box: HTMLElement, mark: SVGPathElement | null, to: 0 | 1, side: number, cls: string, prev: Pour | null): Pour | null {
  const live = prev && !prev.done ? (prev as Pour & { svg?: SVGSVGElement; halt?: () => void }) : null
  const from = live ? live.u : 1 - to
  live?.halt?.()
  const ms = motionFor('slow') * Math.abs(to - from)
  if (!ms) {
    live?.stop()
    return null
  }
  // A run caught half way may hand over to the other mark (tick or dash): the old one rests.
  box.querySelectorAll<SVGElement>('[data-mark]').forEach((m) => m !== mark && m.style.removeProperty('stroke-dashoffset'))
  const W = box.offsetWidth
  const bw = box.clientLeft
  const look = getComputedStyle(box)
  const r = parseFloat(look.borderTopLeftRadius) || 0
  const fill = box.querySelector<HTMLElement>('[data-pour-fill]')
  const outer = boxPath({ cx: W / 2, cy: W / 2, hw: W / 2, hh: W / 2, r })
  const inner = W - 2 * bw
  const cup: Cup = { x0: bw, x1: W - bw, top: bw, bot: W - bw, tilt: inner / 3, men: inner / 9 }
  let svg = live?.svg
  let liquid: SVGPathElement
  let clipUrl: string
  if (svg) {
    liquid = svg.querySelector('path[data-measure]')!
    clipUrl = liquid.getAttribute('clip-path') ?? ''
  } else {
    const l = layer(box, cls, box.firstChild)
    svg = l.svg
    liquid = l.paths[0]
    const clip = clipOf(svg)
    clip.path.setAttribute('d', outer)
    clipUrl = clip.url
    svg.setAttribute('width', `${W}`)
    svg.setAttribute('height', `${W}`)
    svg.style.left = svg.style.top = `${-bw}px`
    liquid.style.fill = fill ? getComputedStyle(fill).backgroundColor : 'currentColor'
    liquid.setAttribute('data-measure', 'surface')
    liquid.setAttribute('data-cup', cupAttr(cup))
  }
  box.dataset.pouring = ''
  const e = morphEase()
  const s = live ? live.side : side
  const layerSvg = svg
  const run = {
    u: from,
    side: s,
    done: false,
    svg: layerSvg,
    halt: () => {},
    stop: () => {
      run.done = true
      run.halt()
      layerSvg.remove()
      box.querySelectorAll<SVGElement>('[data-mark]').forEach((m) => m.style.removeProperty('stroke-dashoffset'))
      delete box.dataset.pouring
    },
  }
  const draw = (p: number) => {
    run.u = lerp(from, to, e(p))
    const f = seg(run.u, 0, 0.78)
    const cp = seg(run.u, 0.7, 1)
    mark?.style.setProperty('stroke-dashoffset', `${1.01 * (1 - cp)}`)
    if (p >= 1) {
      liquid.removeAttribute('clip-path')
      liquid.setAttribute('d', to ? outer : '')
      return
    }
    liquid.setAttribute('clip-path', clipUrl)
    liquid.setAttribute('d', f > 0 ? cupPath(cupLevel(f, s, cup), -1, W + 1, W + 2) : '')
  }
  run.halt = frames(ms, draw, () => run.stop())
  return run
}

// ---------- field edge ----------

type Ring = Array<[number, number, number, number]>

function ringLength(cl: Ring) {
  let len = 0
  for (let i = 0; i < cl.length; i++) {
    const a = cl[i]
    const b = cl[(i + 1) % cl.length]
    len += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  return len
}

/**
 * The edge at progress `e` (0 to 1): two heads run both ways round the centre line `cl` from `i0`, a
 * little fuller than the edge, and meet on the far side; the joined bump then relaxes into the ring.
 */
export function edgeLoops(cl: Ring, i0: number, e: number, band: number, head = 1.2, over = 10): Pt[][] {
  const N = cl.length
  const P = ringLength(cl)
  const ds = P / N
  const at = (i: number) => cl[((i % N) + N) % N]
  const wAt = (d: number) => band + head * Math.exp(-(d * d) / 9)
  const a = e * (P / 2 + over)
  const g = P - 2 * a
  if (g > wAt(0)) {
    const k = Math.max(1, Math.round(a / ds))
    const out: Pt[] = []
    const inn: Pt[] = []
    for (let j = -k; j <= k; j++) {
      const p = at(i0 + j)
      const w = wAt((k - Math.abs(j)) * ds) / 2
      out.push([p[0] + p[2] * w, p[1] + p[3] * w])
      inn.push([p[0] - p[2] * w, p[1] - p[3] * w])
    }
    // A round drop head on each end.
    const cap = (p: Ring[number], dir: number, from: number): Pt[] => {
      const r = wAt(0) / 2
      const n = [p[2] * from, p[3] * from]
      const t = [-p[3] * dir, p[2] * dir]
      const c: Pt[] = []
      for (let q = 1; q < 10; q++) {
        const th = (q / 10) * Math.PI
        c.push([p[0] + r * (n[0] * Math.cos(th) + t[0] * Math.sin(th)), p[1] + r * (n[1] * Math.cos(th) + t[1] * Math.sin(th))])
      }
      return c
    }
    return [out.concat(cap(at(i0 + k), 1, 1), inn.reverse(), cap(at(i0 - k), -1, -1))]
  }
  const iM = (i0 + Math.round(N / 2)) % N
  const m = clamp01((g + 2 * over) / (wAt(0) + 2 * over))
  const out: Pt[] = []
  const inn: Pt[] = []
  for (let i = 0; i < N; i++) {
    let dj = Math.abs(i - iM) % N
    dj = Math.min(dj, N - dj) * ds
    const p = cl[i]
    const w = (band + head * m * Math.exp(-(dj * dj) / 16)) / 2
    out.push([p[0] + p[2] * w, p[1] + p[3] * w])
    inn.push([p[0] - p[2] * w, p[1] - p[3] * w])
  }
  return [out, inn]
}

function nearestOn(cl: Ring, x: number, y: number) {
  let best = 0
  let m = Infinity
  cl.forEach((p, i) => {
    const d = (p[0] - x) ** 2 + (p[1] - y) ** 2
    if (d < m) {
      m = d
      best = i
    }
  })
  return best
}

/**
 * Field focus: while `target` matches `on`, it carries data-edge, which its CSS draws as the dark edge
 * (the field's focus indicator, --hl-line-focus thick).
 * When it starts to match, the edge first flows both ways round from where it was pressed (or from the
 * start edge for a key) and meets on the far side, then data-edge lands; when it stops mid-flow, the
 * drawing fades. The layer sits in `host` (the target itself, or a wrapper for a textarea).
 */
export function useEdgeFlow(target: RefObject<HTMLElement | null>, host: RefObject<HTMLElement | null>, on: string, cls: string) {
  useEffect(() => {
    const el = target.current
    const root = host.current
    if (!el || !root) return
    let shown = el.matches(on)
    if (shown) el.dataset.edge = ''
    let pressed: { x: number; y: number; t: number } | null = null
    let run: { svg: SVGSVGElement; stop: () => void } | null = null
    const end = () => {
      run?.stop()
      run?.svg.remove()
      run = null
    }
    const settle = () => {
      end()
      if (shown) el.dataset.edge = ''
    }
    const start = () => {
      end()
      const ms = motionFor('base') + motionFor('instant')
      if (!ms) return settle()
      const look = getComputedStyle(el)
      // The settled edge is a focus indicator: --hl-line-focus thick, inside the border box.
      const bw = parseFloat(look.getPropertyValue('--hl-line-focus')) || 2
      const r = parseFloat(look.borderTopLeftRadius) || 0
      const rect = el.getBoundingClientRect()
      let W = el.offsetWidth
      let H = el.offsetHeight
      const ringOf = () => boxRing({ cx: W / 2, cy: H / 2, hw: (W - bw) / 2, hh: (H - bw) / 2, r: Math.max(0, r - bw / 2) }, 0.5)
      let cl = ringOf()
      const fresh = pressed && performance.now() - pressed.t < 1000
      const rtl = look.direction === 'rtl'
      const i0 = fresh ? nearestOn(cl, pressed!.x - rect.left, pressed!.y - rect.top) : nearestOn(cl, rtl ? W : 0, H / 2)
      let at = i0 / cl.length
      pressed = null
      const { svg, paths } = layer(root, cls, null)
      const path = paths[0]
      path.style.fill = look.getPropertyValue('--hl-flow-edge').trim() || 'currentColor'
      path.setAttribute('fill-rule', 'evenodd')
      path.setAttribute('data-measure', 'shape')
      const place = () => {
        svg.setAttribute('width', `${W}`)
        svg.setAttribute('height', `${H}`)
        svg.style.left = `${el === root ? -el.clientLeft : el.offsetLeft}px`
        svg.style.top = `${el === root ? -el.clientTop : el.offsetTop}px`
      }
      place()
      const e = morphEase()
      const draw = (u: number) => {
        // A field that grows while it flows (a textarea) keeps the flow on its edge.
        if (el.offsetWidth !== W || el.offsetHeight !== H) {
          W = el.offsetWidth
          H = el.offsetHeight
          cl = ringOf()
          place()
        }
        if (u >= 1) {
          path.setAttribute('d', boxPath({ cx: W / 2, cy: H / 2, hw: W / 2, hh: H / 2, r }) + boxPath({ cx: W / 2, cy: H / 2, hw: W / 2 - bw, hh: H / 2 - bw, r: Math.max(0, r - bw) }))
          return
        }
        path.setAttribute('d', edgeLoops(cl, Math.round(at * cl.length), e(u), bw).map((l) => polyPath(l)).join(''))
      }
      run = { svg, stop: frames(ms, draw, settle) }
    }
    const leave = () => {
      if (!run) return
      const r = run
      r.stop()
      const ms = motionFor('fast')
      if (!ms || typeof r.svg.animate !== 'function') return end()
      const fade = r.svg.animate({ opacity: [1, 0] }, { duration: ms, easing: 'linear', fill: 'forwards' })
      r.stop = () => fade.cancel()
      fade.finished.then(() => run === r && end(), () => {})
    }
    const check = () => {
      const now = el.matches(on)
      if (now === shown) return
      shown = now
      if (now) start()
      else {
        delete el.dataset.edge
        leave()
      }
    }
    const later = () => queueMicrotask(check)
    const down = (ev: PointerEvent) => {
      pressed = { x: ev.clientX, y: ev.clientY, t: performance.now() }
    }
    const watch = new MutationObserver(check)
    watch.observe(el, { attributes: true, attributeFilter: ['data-open', 'data-invalid'] })
    el.addEventListener('pointerdown', down, true)
    el.addEventListener('focusin', later)
    el.addEventListener('focusout', later)
    return () => {
      watch.disconnect()
      el.removeEventListener('pointerdown', down, true)
      el.removeEventListener('focusin', later)
      el.removeEventListener('focusout', later)
      end()
      delete el.dataset.edge
    }
  }, [target, host, on, cls])
}

// ---------- CopyButton ----------

const sdSeg = (x: number, y: number, a: Pt, b: Pt) => {
  const bx = b[0] - a[0]
  const by = b[1] - a[1]
  const L = bx * bx + by * by
  const h = L > 0 ? clamp01(((x - a[0]) * bx + (y - a[1]) * by) / L) : 0
  return Math.hypot(x - a[0] - bx * h, y - a[1] - by * h)
}

/**
 * Distance to a stroke of half width `w`: two arms from B (directions u1 and u2, lengths L1 and L2)
 * joined by an arc of radius rc. Its outline is an exact offset of a smooth centre line, so it is as
 * wide everywhere and has no point.
 */
function strokeSdf(B: Pt, u1: Pt, u2: Pt, L1: number, L2: number, rc: number, w: number): Sdf {
  const e1: Pt = [B[0] + u1[0] * L1, B[1] + u1[1] * L1]
  const e2: Pt = [B[0] + u2[0] * L2, B[1] + u2[1] * L2]
  const phi = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1])))
  const beta = Math.PI - phi
  if (beta < 1e-4) return (x, y) => Math.min(sdSeg(x, y, B, e1), sdSeg(x, y, B, e2)) - w
  const T = rc * Math.tan(beta / 2)
  const p1: Pt = [B[0] + u1[0] * T, B[1] + u1[1] * T]
  const p2: Pt = [B[0] + u2[0] * T, B[1] + u2[1] * T]
  const bl = Math.hypot(u1[0] + u2[0], u1[1] + u2[1])
  const oc = rc / Math.sin(phi / 2)
  const O: Pt = [B[0] + ((u1[0] + u2[0]) / bl) * oc, B[1] + ((u1[1] + u2[1]) / bl) * oc]
  const a: Pt = [p1[0] - O[0], p1[1] - O[1]]
  const b: Pt = [p2[0] - O[0], p2[1] - O[1]]
  const cr = (m: Pt, n: Pt) => m[0] * n[1] - m[1] * n[0]
  const sg = Math.sign(cr(a, b))
  return (x, y) => {
    let d = Math.min(sdSeg(x, y, p1, e1), sdSeg(x, y, p2, e2))
    const v: Pt = [x - O[0], y - O[1]]
    if (cr(a, v) * sg >= 0 && cr(v, b) * sg >= 0) d = Math.min(d, Math.abs(Math.hypot(v[0], v[1]) - rc))
    return d - w
  }
}

/** The filled square (`sq`) and the check it becomes: its corner B, arm lengths and half width. */
export type CheckMorph = { sq: Box; B: Pt; L1: number; L2: number; w: number }

const ROUND = 0.04

/**
 * The filled square at m = 0 becomes the check at m = 1 in one shape: it rounds into a drop (the first
 * 4%), stretches into a bar, and bends into the check as it thins. Through the bend the join radius
 * stays at least 1.9 times the half width, so its inside never pinches.
 */
export function checkLoops(m: number, g: CheckMorph): Pt[][] {
  const { sq } = g
  if (m < ROUND) {
    const q = m / ROUND
    const r = lerp(sq.r, sq.hw, q * q * (3 - 2 * q))
    return [boxRing({ ...sq, r }, 0.5).map((p) => [p[0], p[1]] as Pt)]
  }
  const t = (m - ROUND) / (1 - ROUND)
  const w = lerp(sq.hw, g.w, t)
  const rc = 1.9 * w + 0.2
  const B: Pt = [lerp(sq.cx, g.B[0], t), lerp(sq.cy, g.B[1], t)]
  const L1 = g.L1 * t
  const L2 = g.L2 * t
  const sm = t * t * (3 - 2 * t)
  const beta = Math.min((Math.PI / 2) * sm, 2 * Math.atan((0.95 * Math.min(L1, L2)) / rc))
  const phi = Math.PI - beta
  const up = -Math.PI / 2
  const u1: Pt = [Math.cos(up - phi / 2), Math.sin(up - phi / 2)]
  const u2: Pt = [Math.cos(up + phi / 2), Math.sin(up + phi / 2)]
  const T = rc * Math.tan(beta / 2)
  return trace(strokeSdf(B, u1, u2, L1, L2, rc, w), [[B[0] + u1[0] * T, B[1] + u1[1] * T, 0, 1]])
}

/** Where a copy run is: front filled, back slid under, square morphed into the check, each 0 to 1. */
export type CopyState = { fill: number; slide: number; morph: number }

// The copy icon (internal/icons CopyIcon) in its 24-unit box, and the check's corner and arms.
const ICON = { front: 8.5, size: 11, r: 2.5, back: 4, stroke: 1.75, B: [9.5, 17] as Pt, L1: 4.5 * Math.SQRT2, L2: 9.5 * Math.SQRT2, check: 2.25 }
const BACK_D = 'M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2'

/**
 * CopyButton: a drop forms where it was pressed (`at`, from the icon's corner; null for a key), falls
 * into the copy icon and fills its front square, the back square slides under and merges, and the
 * filled square turns into the check. `to` 0 plays it back from wherever it is. The icon box carries
 * data-pouring while it runs, so the CSS icons stand down.
 */
export function copyRun(icons: HTMLElement, to: 0 | 1, at: Pt | null, cls: string, prev: CopyRun | null): CopyRun | null {
  if (prev?.done) prev = null
  const from: CopyState = prev ? { ...prev.state } : to ? { fill: 0, slide: 0, morph: 0 } : { fill: 1, slide: 1, morph: 1 }
  prev?.halt()
  const k = motionFor('morph') / 600
  if (!k) {
    prev?.stop()
    return null
  }
  const size = icons.offsetWidth
  const s = size / 24
  const o = (ICON.front - ICON.stroke / 2) * s
  const S = (ICON.size + ICON.stroke) * s
  const sq: Box = { cx: o + S / 2, cy: o + S / 2, hw: S / 2, hh: S / 2, r: (ICON.r + ICON.stroke / 2) * s }
  const ring = ICON.stroke * s
  const hole: Box = { ...sq, hw: S / 2 - ring, hh: S / 2 - ring, r: Math.max(0, sq.r - ring) }
  const frontD = boxPath(sq)
  const g: CheckMorph = { sq, B: [ICON.B[0] * s, ICON.B[1] * s], L1: ICON.L1 * s, L2: ICON.L2 * s, w: (ICON.check / 2) * s }
  const inner = hole.hw * 2
  const cup: Cup = { x0: hole.cx - hole.hw, x1: hole.cx + hole.hw, top: hole.cy - hole.hh, bot: hole.cy + hole.hh, tilt: inner * 0.29, men: inner * 0.1 }
  const entry: Pt = [sq.cx, cup.top + 1]
  const drop = !prev && to === 1
  const P: Pt = at ?? [size / 2, size / 2]
  const side = Math.max(-1, Math.min(1, (P[0] - entry[0]) / 32)) * 0.6
  let svg = prev?.svg
  let p: { back: SVGPathElement; liquid: SVGPathElement; front: SVGPathElement; drop: SVGPathElement; clip: string }
  if (svg && prev) p = prev.paths
  else {
    const l = layer(icons, cls, null, 4)
    svg = l.svg
    svg.setAttribute('width', `${size}`)
    svg.setAttribute('height', `${size}`)
    const [back, liquid, front, dropPath] = l.paths
    const inside = clipOf(svg)
    inside.path.setAttribute('d', frontD)
    // The back square shows only outside the front one, so it slides under it.
    const outside = clipOf(svg)
    outside.path.setAttribute('d', `M-${size} -${size}H${2 * size}V${2 * size}H-${size}Z${frontD}`)
    outside.path.setAttribute('clip-rule', 'evenodd')
    back.setAttribute('d', BACK_D)
    back.setAttribute('clip-path', outside.url)
    back.style.cssText = `fill:none;stroke:currentColor;stroke-width:${ICON.stroke};stroke-linecap:round;stroke-linejoin:round`
    front.setAttribute('fill-rule', 'evenodd')
    for (const q of [liquid, front, dropPath]) q.style.fill = 'currentColor'
    dropPath.setAttribute('data-measure', 'shape')
    p = { back, liquid, front, drop: dropPath, clip: inside.url }
  }
  icons.dataset.pouring = ''
  const e = morphEase()
  const s2 = (rel: number, a: number, b: number) => clamp01((rel - a * k) / ((b - a) * k))
  const toward = (v: number, t: number) => lerp(v, to, e(t))
  const ms = (to ? (drop ? 600 : 440) : 560) * k
  const layerSvg = svg
  const run: CopyRun = {
    state: { ...from },
    done: false,
    svg: layerSvg,
    paths: p,
    halt: () => {},
    stop: () => {
      run.done = true
      run.halt()
      layerSvg.remove()
      delete icons.dataset.pouring
    },
  }
  const frame = (rel: number) => {
    const st = run.state
    let dp: { x: number; y: number; r: number } | null = null
    if (to) {
      // From rest: the drop forms, flies and sinks in, then the front fills, the back slides under and
      // the square becomes the check. From part way: the same order, without the drop.
      const [f0, f1, s0, s1, m0, m1] = drop ? [160, 300, 200, 300, 300, 600] : [0, 140, 40, 140, 140, 440]
      st.fill = toward(from.fill, s2(rel, f0, f1))
      st.slide = toward(from.slide, s2(rel, s0, s1))
      st.morph = toward(from.morph, s2(rel, m0, m1))
      if (drop) {
        const form = s2(rel, 0, 70)
        const fly = s2(rel, 70, 190)
        const sink = s2(rel, 190, 240)
        const q = fly * fly * (3 - 2 * fly)
        const r = size * 0.15 * e(form) * (1 - sink)
        if (r > 0.05) dp = { x: lerp(P[0], entry[0], q), y: lerp(P[1], entry[1], q) - size * 2 * q * (1 - q) + size * 0.25 * sink, r }
      }
    } else {
      st.morph = toward(from.morph, s2(rel, 0, 300))
      st.slide = toward(from.slide, s2(rel, 300, 400))
      st.fill = toward(from.fill, s2(rel, 380, 560))
    }
    const full = st.fill >= 1
    const { liquid } = p
    if (st.fill <= 0) {
      liquid.removeAttribute('clip-path')
      liquid.removeAttribute('data-measure')
      liquid.setAttribute('d', '')
    } else if (!full) {
      liquid.setAttribute('clip-path', p.clip)
      liquid.setAttribute('data-measure', 'surface')
      liquid.setAttribute('data-cup', cupAttr(cup))
      liquid.setAttribute('d', cupPath(cupLevel(st.fill, side, cup), sq.cx - sq.hw - 1, sq.cx + sq.hw + 1, sq.cy + sq.hh + 2))
    } else {
      liquid.removeAttribute('clip-path')
      // The square itself is the icon's own shape; the morph is judged from the first step on.
      if (st.morph > 0) liquid.setAttribute('data-measure', 'morph')
      else liquid.removeAttribute('data-measure')
      liquid.setAttribute('d', st.morph > 0 ? checkLoops(st.morph, g).map((l) => polyPath(l)).join('') : frontD)
    }
    // Once the front is full, its outline and the hidden back square are under the ink.
    p.front.setAttribute('d', full ? '' : frontD + boxPath(hole))
    p.back.setAttribute('d', full && st.slide >= 1 ? '' : BACK_D)
    const off = ICON.back * s * st.slide
    p.back.setAttribute('transform', `translate(${off} ${off}) scale(${s})`)
    p.drop.setAttribute('d', dp ? `M${dp.x - dp.r} ${dp.y}a${dp.r} ${dp.r} 0 1 0 ${2 * dp.r} 0a${dp.r} ${dp.r} 0 1 0 ${-2 * dp.r} 0Z` : '')
  }
  run.halt = frames(ms, (u) => frame(u * ms), () => run.stop())
  return run
}

export type CopyRun = {
  state: CopyState
  done: boolean
  svg: SVGSVGElement
  paths: { back: SVGPathElement; liquid: SVGPathElement; front: SVGPathElement; drop: SVGPathElement; clip: string }
  halt: () => void
  stop: () => void
}

// ---------- menu bead ----------

function smin(a: number, b: number, k: number) {
  if (k <= 1e-6) return Math.min(a, b)
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - (h * h * h * k) / 6
}

// Up to SLIDE px apart, front and tail are one stretched box. Past it the tail narrows and a neck
// forms, never longer than NECK px.
const SLIDE = 24
const NECK = 24

/** The bead with its front at F and its tail at T (centres on y), each with its half height. */
export function beadLoops(cx: number, hw: number, r: number, F: { y: number; hh: number }, T: { y: number; hh: number }): Pt[][] {
  const d = Math.abs(F.y - T.y)
  if (d <= SLIDE) {
    const y0 = Math.min(F.y - F.hh, T.y - T.hh)
    const y1 = Math.max(F.y + F.hh, T.y + T.hh)
    return [boxRing({ cx, cy: (y0 + y1) / 2, hw, hh: (y1 - y0) / 2, r }, 0.5).map((p) => [p[0], p[1]] as Pt)]
  }
  const e = clamp01((d - SLIDE) / 30)
  const kk = 18 * e
  const hwT = hw * (1 - 0.1 * e * e)
  const hhT = T.hh - 6 * e
  const my = (F.y + T.y) / 2
  // Wide until the gap between the two is tall enough for round fillets, so no slot opens between them.
  const gq = clamp01((d - F.hh - hhT - 12) / 14)
  const nw = lerp(hwT - 2, Math.min(30, hwT - 2), gq * gq * (3 - 2 * gq))
  const sdf: Sdf = (x, y) =>
    smin(smin(sdBox(x, y, { cx, cy: F.y, hw, hh: F.hh, r }), sdBox(x, y, { cx, cy: T.y, hw: hwT, hh: hhT, r }), kk), sdBox(x, y, { cx, cy: my, hw: nw, hh: d / 2, r: Math.min(nw, 8) }), kk)
  return trace(sdf, [[cx, F.y, 1, 0]])
}

/**
 * Menu items: the hover fill is a bead that follows focus (which follows the pointer) from item to
 * item. A next item settles in about 100ms with a slight stretch; a jump of two or more stretches a
 * short neck. While it moves `panel` carries data-bead, so the items' own fill stands down; at rest
 * the focused item's CSS fill is back. Focus leaving the panel mid-move fades the bead where it is.
 * Only this panel's own items count (submenus sit inside it).
 */
export function useBead(panel: RefObject<HTMLElement | null>, on: boolean, cls: string) {
  useEffect(() => {
    const root = panel.current
    if (!root || !on) return
    const st = { F: 0, T: 0, hF: 0, hT: 0 }
    let goal: HTMLElement | null = null
    let run: { svg: SVGSVGElement; path: SVGPathElement; id: number; last: number } | null = null
    const itemOf = (t: EventTarget | null) => {
      const el = t instanceof Element ? t.closest<HTMLElement>('[role^="menuitem"]') : null
      return el && el.closest('[role="menu"]') === root ? el : null
    }
    // Layout boxes, not screen ones: the panel and its items may be mid scale or slide as they arrive.
    const boxOf = (el: HTMLElement) => {
      let x = 0
      let y = 0
      for (let n: HTMLElement | null = el; n && n !== root; n = n.offsetParent as HTMLElement | null) {
        x += n.offsetLeft
        y += n.offsetTop
        if (n.offsetParent && n.offsetParent !== root) {
          x += (n.offsetParent as HTMLElement).clientLeft
          y += (n.offsetParent as HTMLElement).clientTop
        }
      }
      return { x, y, w: el.offsetWidth, h: el.offsetHeight }
    }
    const end = () => {
      if (!run) return
      cancelAnimationFrame(run.id)
      run.svg.remove()
      run = null
      // The focused item's own fill comes back at once, not through its fade.
      const el = goal
      if (el) el.style.transition = 'none'
      delete root.dataset.bead
      if (el) {
        void getComputedStyle(el).backgroundColor
        el.style.removeProperty('transition')
      }
    }
    const tick = (now: number) => {
      if (!run || !goal) return
      const dt = Math.min(64, Math.max(0, now - run.last))
      run.last = now
      const fast = motionFor('fast')
      const b = boxOf(goal)
      const gy = b.y + b.h / 2
      const gh = b.h / 2
      st.F += (gy - st.F) * (1 - Math.exp(-dt / (fast / 9)))
      st.hF += (gh - st.hF) * (1 - Math.exp(-dt / (fast / 9)))
      st.T += (st.F - st.T) * (1 - Math.exp(-dt / (fast / 7)))
      st.hT += (st.hF - st.hT) * (1 - Math.exp(-dt / (fast / 7)))
      const most = st.hF + st.hT - 6 + NECK
      if (Math.abs(st.F - st.T) > most) st.T = st.F - Math.sign(st.F - st.T) * most
      const r = parseFloat(getComputedStyle(goal).borderTopLeftRadius) || 0
      if (Math.abs(gy - st.F) < 0.05 && Math.abs(st.F - st.T) < 0.05 && Math.abs(gh - st.hT) < 0.05) {
        run.path.setAttribute('d', boxPath({ cx: b.x + b.w / 2, cy: gy, hw: b.w / 2, hh: gh, r }))
        end()
        return
      }
      const loops = beadLoops(b.x + b.w / 2, b.w / 2, r, { y: st.F, hh: st.hF }, { y: st.T, hh: st.hT })
      run.path.setAttribute('d', loops.map((l) => polyPath(l, 2)).join(''))
      run.id = requestAnimationFrame(tick)
    }
    const focusIn = (ev: FocusEvent) => {
      const to = itemOf(ev.target)
      if (!to) return
      const from = itemOf(ev.relatedTarget)
      goal = to
      if (!motionFor('fast')) return end()
      if (!run) {
        // A first highlight just appears (its CSS fade); only a move between items flows.
        if (!from || from === to) return
        root.dataset.bead = ''
        const b = boxOf(from)
        st.F = st.T = b.y + b.h / 2
        st.hF = st.hT = b.h / 2
        const { svg, paths } = layer(root, cls, root.firstChild)
        svg.setAttribute('width', `${root.scrollWidth}`)
        svg.setAttribute('height', `${root.scrollHeight}`)
        paths[0].setAttribute('data-measure', 'shape')
        run = { svg, path: paths[0], id: 0, last: performance.now() }
        run.id = requestAnimationFrame(tick)
        tick(performance.now())
      }
      if (run) run.path.style.fill = getComputedStyle(to).getPropertyValue('--hl-bead').trim()
    }
    const focusOut = (ev: FocusEvent) => {
      if (!run || itemOf(ev.relatedTarget)) return
      const r = run
      cancelAnimationFrame(r.id)
      run = null
      goal = null
      delete root.dataset.bead
      const ms = motionFor('fast')
      if (!ms || typeof r.svg.animate !== 'function') return r.svg.remove()
      r.svg.animate({ opacity: [1, 0] }, { duration: ms, easing: 'linear', fill: 'forwards' }).finished.then(
        () => r.svg.remove(),
        () => r.svg.remove(),
      )
    }
    root.addEventListener('focusin', focusIn)
    root.addEventListener('focusout', focusOut)
    return () => {
      root.removeEventListener('focusin', focusIn)
      root.removeEventListener('focusout', focusOut)
      end()
    }
  }, [panel, on, cls])
}
