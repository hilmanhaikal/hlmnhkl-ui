// Liquid matter: the shapes behind Button, Switch, SegmentedControl, Tabs and Toast while they move.
// Each frame is a signed distance field (rounded boxes and circles) whose zero line is walked into an
// SVG path. Two bodies join through concave arcs of a fixed radius, so the outline never bends tighter
// than that radius: a neck thins with no point, and breaks while it still has a waist. At rest the part
// shows its own CSS shape and this layer is gone.
// No imports, so the maths can be checked on its own.

export type Pt = [number, number]
export type Sdf = (x: number, y: number) => number
/** A rounded box by its centre, half sizes and corner radius. A circle is hw = hh = r. */
export type Box = { cx: number; cy: number; hw: number; hh: number; r: number }
export type Body = { sdf: Sdf; at: Pt }

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const seg = (u: number, a: number, b: number) => clamp01((u - a) / (b - a))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** No outline bends tighter than this: 2px of it turn about 18 degrees. */
export const BEND = 6.5
// A neck breaks when its waist is this thin on each side, before the arcs could meet in a point.
const WAIST = 0.75

export function sdBox(x: number, y: number, b: Box) {
  const r = Math.min(b.r, b.hw, b.hh)
  const qx = Math.abs(x - b.cx) - b.hw + r
  const qy = Math.abs(y - b.cy) - b.hh + r
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r
}

/** Cubic smooth-min: the union of two fields, rounded over `k` px. */
export function smin(a: number, b: number, k: number) {
  if (k <= 1e-6) return Math.min(a, b)
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - (h * h * h * k) / 6
}

/** The smallest smooth-min k that still bridges a gap of `gap` px, plus `margin` (k = 3 x gap closes it). */
export const kFromGap = (gap: number, margin = 0) => Math.max(0, 3 * gap + margin)

export const body = (b: Box, at: Pt = [b.cx, b.cy]): Body => ({ sdf: (x, y) => sdBox(x, y, b), at })

/** A box's exact outline, as CSS draws it. */
export function boxPath(b: Box) {
  const r = Math.min(b.r, b.hw, b.hh)
  const x = b.cx - b.hw
  const y = b.cy - b.hh
  const w = b.hw * 2
  const h = b.hh * 2
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
}

/** Points every `step` px round a box's outline, each with its outward normal. */
export function boxRing(b: Box, step: number): Array<[number, number, number, number]> {
  const r = Math.min(b.r, b.hw, b.hh)
  const x = b.cx - b.hw
  const y = b.cy - b.hh
  const w = b.hw * 2
  const h = b.hh * 2
  const st = w - 2 * r
  const sv = h - 2 * r
  const q = (Math.PI * r) / 2
  const arc = (cx: number, cy: number, a: number): [number, number, number, number] => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.cos(a), Math.sin(a)]
  const pieces: Array<[number, (s: number) => [number, number, number, number]]> = [
    [st, (s) => [x + r + s, y, 0, -1]],
    [q, (s) => arc(x + w - r, y + r, -Math.PI / 2 + s / r)],
    [sv, (s) => [x + w, y + r + s, 1, 0]],
    [q, (s) => arc(x + w - r, y + h - r, s / r)],
    [st, (s) => [x + w - r - s, y + h, 0, 1]],
    [q, (s) => arc(x + r, y + h - r, Math.PI / 2 + s / r)],
    [sv, (s) => [x, y + h - r - s, -1, 0]],
    [q, (s) => arc(x + r, y + r, Math.PI + s / r)],
  ]
  const total = pieces.reduce((a, p) => a + p[0], 0)
  const n = Math.max(8, Math.round(total / step))
  const out: Array<[number, number, number, number]> = []
  for (let i = 0; i < n; i++) {
    let s = (i * total) / n
    let k = 0
    while (k < pieces.length - 1 && s > pieces[k][0]) {
      s -= pieces[k][0]
      k++
    }
    out.push(pieces[k][1](s))
  }
  return out
}

// One side's joining arc: a circle of radius R touching both bodies from outside.
type Arc = { c: Pt; ta: Pt; tb: Pt; s: number; waist: number }

function grad(f: Sdf, x: number, y: number): Pt {
  const e = 0.05
  const gx = (f(x + e, y) - f(x - e, y)) / (2 * e)
  const gy = (f(x, y + e) - f(x, y - e)) / (2 * e)
  const l = Math.hypot(gx, gy) || 1
  return [gx / l, gy / l]
}

function arcOn(A: Body, B: Body, R: number, side: 1 | -1): Arc | 'apart' | 'inside' {
  const [ax, ay] = A.at
  const L = Math.hypot(B.at[0] - ax, B.at[1] - ay)
  const ux = (B.at[0] - ax) / L
  const uy = (B.at[1] - ay) / L
  const nx = -uy * side
  const ny = ux * side
  // t is a distance along the axis from A's anchor.
  const P = (t: number, s: number): Pt => [ax + ux * t + nx * s, ay + uy * t + ny * s]
  const reach = L + 4 * R + 200
  // Along a line beside the axis, where the two bodies are equally far.
  const middle = (s: number) => {
    let lo = -reach
    let hi = reach
    const g = (t: number) => {
      const p = P(t, s)
      return A.sdf(p[0], p[1]) - B.sdf(p[0], p[1])
    }
    if (g(lo) >= 0 || g(hi) <= 0) return null
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2
      if (g(m) < 0) lo = m
      else hi = m
    }
    return (lo + hi) / 2
  }
  const t0 = middle(0)
  if (t0 === null) return 'inside'
  const p0 = P(t0, 0)
  if (A.sdf(p0[0], p0[1]) >= R) return 'apart'
  const h = (s: number) => {
    const t = middle(s)
    if (t === null) return null
    const p = P(t, s)
    return A.sdf(p[0], p[1]) - R
  }
  let lo = 0
  let hi = R
  for (let i = 0; i < 12; i++) {
    const v = h(hi)
    if (v === null) return 'inside'
    if (v > 0) break
    lo = hi
    hi *= 2
  }
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2
    const v = h(m)
    if (v === null) return 'inside'
    if (v < 0) lo = m
    else hi = m
  }
  const s = (lo + hi) / 2
  const t = middle(s) ?? t0
  const c = P(t, s)
  const ga = grad(A.sdf, c[0], c[1])
  const gb = grad(B.sdf, c[0], c[1])
  const ta: Pt = [c[0] - ga[0] * R, c[1] - ga[1] * R]
  const tb: Pt = [c[0] - gb[0] * R, c[1] - gb[1] * R]
  // The arc's lowest point is only on the outline when it falls between where it touches each body.
  const along = (p: Pt) => (p[0] - ax) * ux + (p[1] - ay) * uy
  const lowIn = along(c) > Math.min(along(ta), along(tb)) && along(c) < Math.max(along(ta), along(tb))
  const off = (p: Pt) => (p[0] - ax) * nx + (p[1] - ay) * ny
  // Bodies that overlap on the axis have no neck to break.
  const waist = A.sdf(p0[0], p0[1]) < 0 ? Infinity : lowIn ? s - R : Math.min(off(ta), off(tb))
  return { c, ta, tb, s, waist }
}

// The side of the line through a and b that holds m, as a signed distance (inside is negative).
function half(a: Pt, b: Pt, m: Pt): Sdf {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  let nx = (b[1] - a[1]) / l
  let ny = -(b[0] - a[0]) / l
  if ((m[0] - a[0]) * nx + (m[1] - a[1]) * ny > 0) {
    nx = -nx
    ny = -ny
  }
  return (x, y) => (x - a[0]) * nx + (y - a[1]) * ny
}

/**
 * Two bodies as one: where they come close, a concave arc of radius `R` on each side meets both
 * tangentially. `joined` is false once the neck is thinner than it may get (or they are apart): the
 * caller then draws them separately.
 */
export function join(A: Body, B: Body, R = BEND): { sdf: Sdf; joined: boolean } {
  const both: Sdf = (x, y) => Math.min(A.sdf(x, y), B.sdf(x, y))
  if (Math.hypot(B.at[0] - A.at[0], B.at[1] - A.at[1]) < 1e-3) return { sdf: both, joined: true }
  const top = arcOn(A, B, R, 1)
  const bottom = arcOn(A, B, R, -1)
  if (top === 'inside' || bottom === 'inside') return { sdf: both, joined: true }
  if (top === 'apart' || bottom === 'apart' || top.waist < WAIST || bottom.waist < WAIST) return { sdf: both, joined: false }
  // Each side fills the wedge its circle spans toward the axis (and 1px past it, so the two halves
  // overlap with no seam), outside both circles. The wedge edges run along each body's normal, so the
  // fill meets the bodies cleanly.
  const [ax, ay] = A.at
  const L = Math.hypot(B.at[0] - ax, B.at[1] - ay)
  const nx = -(B.at[1] - ay) / L
  const ny = (B.at[0] - ax) / L
  const c1 = top.c
  const c2 = bottom.c
  const wedge = (w: Arc, side: number) => {
    const e1 = half(w.c, w.ta, w.tb)
    const e2 = half(w.c, w.tb, w.ta)
    // It reaches the axis and no further, so it never runs on through a body and out its far side.
    const k = Math.max(w.s, R) + 2
    return (x: number, y: number) => Math.max(e1(x, y), e2(x, y), -side * ((x - ax) * nx + (y - ay) * ny) - 1, Math.hypot(x - w.c[0], y - w.c[1]) - k)
  }
  const w1 = wedge(top, 1)
  const w2 = wedge(bottom, -1)
  const neck: Sdf = (x, y) =>
    Math.max(Math.min(w1(x, y), w2(x, y)), R - Math.hypot(x - c1[0], y - c1[1]), R - Math.hypot(x - c2[0], y - c2[1]))
  return { sdf: (x, y) => Math.min(A.sdf(x, y), B.sdf(x, y), neck(x, y)), joined: true }
}

/** Where a ray from inside `A` toward `to` leaves it. */
export function edgeToward(A: Body, to: Pt): Pt {
  const [x, y] = A.at
  const l = Math.hypot(to[0] - x, to[1] - y) || 1
  const ux = (to[0] - x) / l
  const uy = (to[1] - y) / l
  let lo = 0
  let hi = 1
  while (A.sdf(x + ux * hi, y + uy * hi) < 0 && hi < 4000) {
    lo = hi
    hi *= 2
  }
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2
    if (A.sdf(x + ux * m, y + uy * m) < 0) lo = m
    else hi = m
  }
  return [x + ux * lo, y + uy * lo]
}

/**
 * What is left of a neck on one side just after it breaks: a round lobe at A's edge facing `to`,
 * standing out `out` px (0 = gone), joined to A by the same arcs.
 */
export function stub(A: Body, to: Pt, out: number, r = BEND + 0.5): Body {
  if (out <= 0.05) return A
  const e = edgeToward(A, to)
  // It stands along A's normal there, and joins A along that line.
  const [nx, ny] = grad(A.sdf, e[0], e[1])
  const c: Pt = [e[0] + nx * (out - r), e[1] + ny * (out - r)]
  const lobe: Body = { sdf: (x, y) => Math.hypot(x - c[0], y - c[1]) - r, at: c }
  return { sdf: join({ sdf: A.sdf, at: [e[0] - nx * 2 * r, e[1] - ny * 2 * r] }, lobe).sdf, at: A.at }
}

// ---------- contour ----------

function project(f: Sdf, p: Pt) {
  for (let i = 0; i < 3; i++) {
    const v = f(p[0], p[1])
    if (Math.abs(v) < 1e-5) break
    const g = grad(f, p[0], p[1])
    p[0] -= v * g[0]
    p[1] -= v * g[1]
  }
  return p
}

function follow(f: Sdf, p0: Pt, step: number): Pt[] {
  const pts: Pt[] = [[p0[0], p0[1]]]
  let p: Pt = [p0[0], p0[1]]
  for (let i = 0; i < 20000; i++) {
    let g = grad(f, p[0], p[1])
    const mx = p[0] - g[1] * step * 0.5
    const my = p[1] + g[0] * step * 0.5
    g = grad(f, mx, my)
    const q = project(f, [p[0] - g[1] * step, p[1] + g[0] * step])
    if (i > 4 && Math.hypot(q[0] - p0[0], q[1] - p0[1]) < step * 1.2) break
    pts.push(q)
    p = q
  }
  return pts
}

/** Walks the outline of `f` from each seed: a point inside a body, and the way out to cast from it. */
export function trace(f: Sdf, seeds: Array<[number, number, number, number]>, step = 0.6): Pt[][] {
  const loops: Pt[][] = []
  for (const [x, y, dx, dy] of seeds) {
    if (f(x, y) >= 0) continue
    let a = 0
    let b = 0.5
    while (f(x + dx * b, y + dy * b) < 0 && b < 4000) {
      a = b
      b *= 2
    }
    for (let i = 0; i < 30; i++) {
      const m = (a + b) / 2
      if (f(x + dx * m, y + dy * m) < 0) a = m
      else b = m
    }
    const p0: Pt = [x + dx * a, y + dy * a]
    if (loops.some((l) => l.some((q) => Math.hypot(q[0] - p0[0], q[1] - p0[1]) < 0.5))) continue
    loops.push(follow(f, p0, step))
  }
  return loops
}

const f2 = (v: number) => (Math.round(v * 100) / 100).toString()

export function polyPath(pts: Array<readonly number[]>, every = 1) {
  let s = `M${f2(pts[0][0])} ${f2(pts[0][1])}`
  for (let i = every; i < pts.length; i += every) s += `L${f2(pts[i][0])} ${f2(pts[i][1])}`
  return `${s}Z`
}

export const loopsPath = (loops: Pt[][]) => loops.map((l) => polyPath(l, 2)).join('')

// ---------- scenes ----------

export type Ease = (x: number) => number
export type Blob = { x: number; r: number }

/** The switch drop's timing, as shares of the move: the drop runs, the thumb shrinks, moves and grows back. */
export const DROP = { run: 0.35, shrink: 0.2, move: 0.45, grow: 0.5 }

/**
 * Switch: the thumb gives up some of itself as a drop that runs to the far end; the thumb, smaller,
 * flows after it and swallows it there. `t` and `d` are where the thumb and the drop start (rest: the
 * same place, the drop inside); `to` is the thumb's end centre, `R` its resting radius.
 */
export function dropScene(e: Ease, u: number, t: Blob, d: Blob, to: number, R: number, k = DROP) {
  const dir = Math.sign(to - t.x) || Math.sign(to - d.x) || 1
  const rd = Math.max(BEND + 0.5, R * 0.6)
  const small = Math.max(BEND + 0.5, R * 0.7)
  const far = to + dir * (R - rd)
  const drop: Blob = { x: lerp(d.x, far, e(seg(u, 0, k.run))), r: lerp(d.r, rd, e(seg(u, 0, 0.2))) }
  // It shrinks with its back edge still, then grows back as it moves.
  const back = t.x - dir * t.r
  const shrunk = lerp(t.r, Math.min(t.r, small), e(seg(u, 0, k.shrink)))
  const r = lerp(shrunk, R, e(seg(u, k.grow, 1)))
  const thumb: Blob = { x: lerp(back + dir * r, to, e(seg(u, k.move, 1))), r }
  return { thumb, drop }
}

/**
 * A highlight flowing from one item to the next: the front runs to the new item, thinning on the way;
 * what is left drains (shrinks at its leading edge, then follows) and joins it by 60% of the move.
 * `front` and `rest` are where the two start (from rest, both the old box). `mid` and `end` are the
 * leftover's half sizes as it drains and as it lands.
 */
export function flowScene(e: Ease, u: number, front: Box, rest: Box, to: Box, thin: number, mid: [number, number], end: [number, number]) {
  const ef = e(seg(u, 0, 0.7))
  const hh = lerp(front.hh, to.hh, ef) - thin * Math.sin(Math.PI * ef)
  const F: Box = { cx: lerp(front.cx, to.cx, ef), cy: lerp(front.cy, to.cy, ef), hw: lerp(front.hw, to.hw, ef), hh, r: Math.min(lerp(front.r, to.r, ef), hh) }
  const ed = e(seg(u, 0.05, 0.35))
  const et = e(seg(u, 0.15, 0.6))
  const dir = Math.sign(to.cx - rest.cx) || 1
  let hw = lerp(rest.hw, Math.min(rest.hw, mid[0]), ed)
  let oh = lerp(rest.hh, Math.min(rest.hh, mid[1]), ed)
  const cx = lerp(rest.cx + dir * (rest.hw - hw), to.cx, et)
  hw = lerp(hw, Math.min(hw, end[0]), et)
  oh = lerp(oh, Math.min(oh, end[1]), et)
  const O: Box = { cx, cy: lerp(rest.cy, to.cy, et), hw, hh: oh, r: Math.min(hw, oh, Math.max(rest.r, Math.min(hw, oh))) }
  return { front: F, rest: O }
}

// ---------- checks ----------

function resample(pts: Pt[], step: number): Pt[] {
  const out: Pt[] = [pts[0]]
  let prev = pts[0]
  let need = step
  for (let i = 1; i <= pts.length; i++) {
    const p = pts[i % pts.length]
    let dx = p[0] - prev[0]
    let dy = p[1] - prev[1]
    let L = Math.hypot(dx, dy)
    while (L >= need) {
      const k = need / L
      const q: Pt = [prev[0] + dx * k, prev[1] + dy * k]
      out.push(q)
      prev = q
      dx = p[0] - prev[0]
      dy = p[1] - prev[1]
      L = Math.hypot(dx, dy)
      need = step
    }
    need -= L
    prev = p
  }
  const last = out[out.length - 1]
  if (Math.hypot(last[0] - pts[0][0], last[1] - pts[0][1]) < step * 0.5) out.pop()
  return out
}

/** The sharpest turn, in degrees, between 2px steps round each loop. */
export function maxTurn(loops: Pt[][]) {
  let m = 0
  for (const l of loops) {
    if (l.length < 3) continue
    const r = resample(l, 2)
    const n = r.length
    for (let i = 0; i < n; i++) {
      const a = r[(i - 1 + n) % n]
      const b = r[i]
      const c = r[(i + 1) % n]
      let d = Math.abs(Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]))
      if (d > Math.PI) d = 2 * Math.PI - d
      m = Math.max(m, d)
    }
  }
  return (m * 180) / Math.PI
}

/**
 * Keeps two bodies joined until their neck breaks, then gives each a lobe that springs back in over
 * `recoil` ms. One per part: it remembers when the neck broke.
 */
export function pincher(e: Ease, recoil: number, out = 3) {
  // Unknown until the first frame: a move that starts apart has no neck to break.
  let joined: boolean | null = null
  let broke = -Infinity
  return (A: Body, B: Body, now: number) => {
    const j = join(A, B)
    if (j.joined) {
      joined = true
      return { sdf: j.sdf, pieces: 1 }
    }
    if (joined) broke = now
    joined = false
    const o = out * (1 - e(recoil ? clamp01((now - broke) / recoil) : 1))
    const a = stub(A, B.at, o)
    const b = stub(B, A.at, o)
    return { sdf: ((x, y) => Math.min(a.sdf(x, y), b.sdf(x, y))) as Sdf, pieces: 2 }
  }
}

/** Where a drop of radius `rd` leaves `O` to reach `T`: a point on the side of O that faces T, and that side's normal. */
export function exitToward(O: Box, T: Box, rd: number): { at: Pt; n: Pt } {
  const dx = T.cx - O.cx
  const dy = T.cy - O.cy
  // On the flat of the side, clear of the corners, so both sides of the neck meet a straight edge.
  const r = Math.min(O.r, O.hw, O.hh) + rd + BEND
  const along = (v: number, c: number, h: number) => (h > r ? Math.min(c + h - r, Math.max(c - h + r, v)) : c)
  if (Math.abs(dy) / O.hh >= Math.abs(dx) / O.hw) {
    const s = Math.sign(dy) || -1
    return { at: [along(T.cx, O.cx, O.hw), O.cy + s * O.hh], n: [0, s] }
  }
  const s = Math.sign(dx) || 1
  return { at: [O.cx + s * O.hw, along(T.cy, O.cy, O.hh)], n: [s, 0] }
}

/**
 * Toast: a drop of radius `rd` buds out of `O` at `exit` (along `n`), hangs on a neck that breaks,
 * then flies to the toast `T` and grows into it. With no `O` (a point), it starts at `exit`.
 */
export function budScene(e: Ease, u: number, O: Box | null, T: Box, exit: Pt, n: Pt, rd: number) {
  let c: Pt
  if (O) {
    const H1 = rd + 10
    const H2 = H1 + 8
    const h = u < 0.22 ? lerp(-rd, H1, e(u / 0.22)) : u < 0.34 ? lerp(H1, H2, ((u - 0.22) / 0.12) ** 2) : H2
    const hang: Pt = [exit[0] + n[0] * h, exit[1] + n[1] * h]
    const f = e(seg(u, 0.34, 0.7))
    c = [lerp(hang[0], T.cx, f), lerp(hang[1], T.cy, f)]
  } else {
    const f = e(seg(u, 0.1, 0.7))
    c = [lerp(exit[0], T.cx, f), lerp(exit[1], T.cy, f)]
  }
  const g = e(seg(u, 0.36, 1))
  const hw = lerp(rd, T.hw, g)
  const hh = lerp(rd, T.hh, g)
  return { cx: c[0], cy: c[1], hw, hh, r: Math.min(hw, hh, lerp(rd, T.r, g)) } as Box
}

/** A soft edge's state: a dent of depth `dent` at `at`, a pull of `pull` toward `to`, a wave `wave` px tall `run` px from `from`. */
export type Soft = { dent: number; at: Pt; pull: number; to: Pt; wave: number; run: number; from: number[] }

/**
 * Button: moves each point of a box's ring along its normal. The dent pushes in where pressed (with a
 * slight swell elsewhere), the pull draws the edge out toward a pointer, and the wave is a bump that
 * runs both ways round the ring from `from`. Sizes scale with the box's height `h`.
 */
export function softRing(ring: Array<[number, number, number, number]>, h: number, s: Soft): Pt[] {
  const n = ring.length
  let len = 0
  for (let i = 0; i < n; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % n]
    len += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  const ds = len / n
  const sig = h * 0.5
  const psig = h * 0.42
  const wsig = h * 0.3
  return ring.map(([px, py, nx, ny], i) => {
    let d = 0
    if (s.dent) {
      const g = Math.exp(-((px - s.at[0]) ** 2 + (py - s.at[1]) ** 2) / (2 * sig * sig))
      d += s.dent * (g - 0.15 * (1 - g))
    }
    if (s.pull) d -= s.pull * Math.exp(-((px - s.to[0]) ** 2 + (py - s.to[1]) ** 2) / (2 * psig * psig))
    if (s.wave) {
      let k = Infinity
      for (const j of s.from) {
        const m = Math.abs(i - j) % n
        k = Math.min(k, Math.min(m, n - m) * ds)
      }
      d -= s.wave * Math.exp(-((k - s.run) ** 2) / (2 * wsig * wsig))
    }
    return [px - nx * d, py - ny * d]
  })
}

/** The ring point nearest (x, y). */
export function nearest(ring: Array<readonly number[]>, x: number, y: number) {
  let best = 0
  let m = Infinity
  ring.forEach((p, i) => {
    const d = (p[0] - x) ** 2 + (p[1] - y) ** 2
    if (d < m) {
      m = d
      best = i
    }
  })
  return best
}
