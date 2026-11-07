// Feel: how a value moves under the hand. Marks pull it in, a flick coasts a capped distance, and one
// spring settles it without a bounce. Plain TypeScript with no framework and no styling, so it can
// stand on its own. Every time is passed in, so a period of 0 (reduced motion) keeps each result and
// drops the motion.

/** A place a moving value is drawn onto. A strong mark reaches further and wins over a plain one. */
export type Mark = { at: number; strong?: boolean }

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** `n` folded into 0 to `size`, for lists that loop. */
export const wrap = (n: number, size: number) => ((n % size) + size) % size

/** `v` on the nearest step counted from `origin`, without float dust, so 0.1 + 0.2 is 0.3. */
export const roundTo = (v: number, step: number, origin = 0) => Number((Math.round((v - origin) / step) * step + origin).toFixed(10))

/** The last step at or below `max`, counted from `min`. */
export const lastStep = (min: number, max: number, step: number) => roundTo(min + Math.floor((max - min) / step + 1e-9) * step, step, min)

/** Every step from `min` to `max`. */
export const steps = (min: number, max: number, step: number) => Array.from({ length: Math.floor((max - min) / step + 1e-9) + 1 }, (_, i) => roundTo(min + i * step, step, min))

/** The mark nearest to `value`, or null when there are none. */
export function nearestMark(value: number, marks: number[]): number | null {
  let best: number | null = null
  for (const m of marks) if (best === null || Math.abs(m - value) < Math.abs(best - value)) best = m
  return best
}

/** `raw` drawn toward the nearest mark within `reach`: sticky close to the mark, free at the edge. */
export function magnetTo(raw: number, marks: number[], reach: number): number {
  const mark = nearestMark(raw, marks)
  if (mark === null || reach <= 0) return raw
  const d = raw - mark
  if (Math.abs(d) >= reach) return raw
  const t = Math.abs(d) / reach
  return mark + Math.sign(d) * reach * t * t
}

/** 1 on the mark, 0 at the edge of its reach, smooth in between. Drives size, ink and lean. */
export function pull(distance: number, reach: number) {
  if (reach <= 0) return distance === 0 ? 1 : 0
  const t = Math.min(1, Math.abs(distance) / reach)
  return 0.5 + 0.5 * Math.cos(Math.PI * t)
}

/** How far marks reach, as a share of the gap between two marks. */
export type Reach = { reach?: number; strong?: number }

/** `raw` drawn onto the mark whose reach it is in. A strong mark wins inside its wider reach. */
export function attract(raw: number, marks: Mark[], gap: number, { reach = 0.35, strong = 1.5 }: Reach = {}) {
  let best: Mark | null = null
  let size = 0
  for (const m of marks) {
    const r = gap * (m.strong ? strong : reach)
    const d = Math.abs(raw - m.at)
    if (d >= r) continue
    const better = !best || (m.strong && !best.strong) || (!!m.strong === !!best.strong && d < Math.abs(raw - best.at))
    if (better) {
      best = m
      size = r
    }
  }
  return best ? magnetTo(raw, [best.at], size) : raw
}

/** Past an edge a drag still moves, less the further it goes, and never more than `size`. */
export function rubber(over: number, size: number) {
  if (size <= 0) return 0
  return Math.sign(over) * (1 - 1 / ((Math.abs(over) * 0.55) / size + 1)) * size
}

/** The hand's speed when it lets go, in units per second, from its last moves inside `window` ms. */
export function speedTracker(window = 100) {
  let samples: { t: number; x: number }[] = []
  return {
    add(x: number, t = performance.now()) {
      samples = [...samples.filter((s) => t - s.t <= window), { t, x }]
    },
    speed(t = performance.now()) {
      const recent = samples.filter((s) => t - s.t <= window)
      if (recent.length < 2) return 0
      const a = recent[0]
      const b = recent[recent.length - 1]
      return b.t > a.t ? ((b.x - a.x) / (b.t - a.t)) * 1000 : 0
    },
    reset() {
      samples = []
    },
  }
}

export type SpringOptions = {
  from: number
  to: number
  /** Units per second at the start, so a let-go carries on at the hand's speed. */
  velocity?: number
  /** One swing in ms. 0 jumps straight to `to`. */
  period: number
  /** Below 1 it settles without a bounce you can see. */
  damping?: number
  /** Close enough to stop, in units. */
  rest?: number
  onFrame: (value: number) => void
  onDone?: () => void
}

/** Runs from `from` to `to` and stops there. Returns a stop function. */
export function springTo({ from, to, velocity = 0, period, damping = 0.88, rest = 0.3, onFrame, onDone }: SpringOptions) {
  if (!period) {
    onFrame(to)
    onDone?.()
    return () => {}
  }
  const w = (2 * Math.PI) / (period / 1000)
  let x = from
  let v = velocity
  let last = performance.now()
  let raf = 0
  const finish = () => {
    cancelAnimationFrame(raf)
    clearTimeout(backstop)
    onFrame(to)
    onDone?.()
  }
  // Frames can stall (a hidden tab, a slow phone), so a timer lands it in real time if they do.
  const backstop = setTimeout(finish, period * 4)
  raf = requestAnimationFrame(function step(now) {
    // Real elapsed time in small slices: a slow frame moves the spring as far as the clock did.
    let dt = Math.min(1, Math.max(0, now - last) / 1000)
    last = now
    while (dt > 0) {
      const h = Math.min(dt, 1 / 240)
      v += (-w * w * (x - to) - 2 * damping * w * v) * h
      x += v * h
      dt -= h
    }
    if (Math.abs(x - to) < rest && Math.abs(v) < rest * 13) return finish()
    onFrame(x)
    raf = requestAnimationFrame(step)
  })
  return () => {
    cancelAnimationFrame(raf)
    clearTimeout(backstop)
  }
}

export type GlideOptions = Omit<SpringOptions, 'to' | 'onDone'> & {
  /** Where it comes to rest, given where the coast would end. */
  land: (end: number) => number
  /** How far a flick carries: its speed times this, in seconds. 0 lands under the hand. */
  coast?: number
  /** The fastest a flick may go, in units per second, so a hard throw still stops near the hand. */
  maxSpeed?: number
  onDone?: (to: number) => void
}

/**
 * A let-go: coast at the hand's speed, slowing, then the spring lands on `land(end)`. With a period
 * of 0 it lands at once, on the place under the hand.
 */
export function glide({ from, velocity = 0, land, coast = 0.2, maxSpeed = Infinity, period, damping, rest, onFrame, onDone }: GlideOptions) {
  if (!period) {
    const to = land(from)
    onFrame(to)
    onDone?.(to)
    return { to, stop: () => {} }
  }
  const v = clamp(velocity, -maxSpeed, maxSpeed)
  const to = land(from + v * coast)
  const D = to - from
  const settle = (at: number, speed: number) => springTo({ from: at, to, velocity: speed, period, damping, rest, onFrame, onDone: () => onDone?.(to) })
  if (!coast || !v || !D || Math.abs(v * coast) < Math.abs(D) * 0.2 || Math.sign(D) !== Math.sign(v)) {
    // Straight to the spring: only speed toward the target carries over, and no more than it can lose
    // without passing it, so a fast let-go never flies past and springs back.
    const toward = Math.sign(v) === Math.sign(D) ? Math.sign(D) * Math.min(Math.abs(v), Math.abs(D) / 0.06) : 0
    return { to, stop: settle(from, toward) }
  }
  const T = clamp(D / v, 0.06, 0.4)
  const end = T * Math.log(5)
  const t0 = performance.now()
  let stopSpring = () => {}
  let raf = 0
  const toSpring = () => {
    cancelAnimationFrame(raf)
    clearTimeout(backstop)
    const k = Math.exp(-end / T)
    stopSpring = settle(from + D * (1 - k), (D / T) * k)
  }
  const backstop = setTimeout(toSpring, end * 1000 + period)
  raf = requestAnimationFrame(function step(now) {
    const t = (now - t0) / 1000
    if (t >= end) return toSpring()
    onFrame(from + D * (1 - Math.exp(-t / T)))
    raf = requestAnimationFrame(step)
  })
  return {
    to,
    stop: () => {
      cancelAnimationFrame(raf)
      clearTimeout(backstop)
      stopSpring()
    },
  }
}

/** A number that eases toward a target over about `time()` ms and stops there. A time of 0 jumps. */
export function follow({ value = 0, time, onFrame }: { value?: number; time: () => number; onFrame: (value: number) => void }) {
  let at = value
  let to = value
  let raf = 0
  let last = 0
  const step = (now: number) => {
    const tau = time() / 3
    const dt = now - last
    last = now
    at = tau ? to + (at - to) * Math.exp(-dt / tau) : to
    if (Math.abs(at - to) < 0.002) at = to
    onFrame(at)
    raf = at === to ? 0 : requestAnimationFrame(step)
  }
  return {
    get value() {
      return at
    },
    set(target: number) {
      to = target
      if (raf || at === to) return
      if (!time()) {
        at = to
        onFrame(at)
        return
      }
      last = performance.now()
      raf = requestAnimationFrame(step)
    },
    stop() {
      cancelAnimationFrame(raf)
      raf = 0
    },
  }
}

export type KeyRange = { min: number; max: number; step: number; marks?: number[] }

/**
 * The same keys everywhere: Up or Right one step more, Down or Left one step less, Page Up and Page
 * Down to the next mark (or ten steps), Home and End to the ends. Null for any other key.
 */
export function stepKey(key: string, value: number, { min, max: end, step, marks = [] }: KeyRange) {
  const max = lastStep(min, end, step)
  const by = (n: number) => clamp(roundTo(value + n * step, step, min), min, max)
  const sorted = [...marks].sort((a, b) => a - b)
  if (key === 'ArrowUp' || key === 'ArrowRight') return by(1)
  if (key === 'ArrowDown' || key === 'ArrowLeft') return by(-1)
  if (key === 'PageUp') return sorted.length ? (sorted.find((m) => m > value + 1e-9) ?? max) : by(10)
  if (key === 'PageDown') return sorted.length ? ([...sorted].reverse().find((m) => m < value - 1e-9) ?? min) : by(-10)
  if (key === 'Home') return min
  if (key === 'End') return max
  return null
}

/** Wheel deltas into whole steps of `per` px: by default about one mouse wheel notch, while a trackpad adds up. */
export function wheelSteps() {
  let acc = 0
  let last = 0
  return (delta: number, per = 100, t = performance.now()) => {
    // A pause starts a fresh gesture, so half a step left from before does not count.
    if (t - last > 400) acc = 0
    last = t
    acc += delta
    const n = Math.trunc(acc / per)
    acc -= n * per
    return n
  }
}

export type ScrubOptions = {
  /** Where it starts. */
  value: number
  /** Leave both out for a loop. */
  min?: number
  max?: number
  /** How far a drag stretches past an end, in units. */
  edge?: number
  /** Draws the position toward its marks while the hand moves it. */
  attract?: (raw: number) => number
  /** The value a position comes to rest on. */
  land: (at: number) => number
  /** How far a flick coasts: its speed times this, in seconds. */
  coast?: number
  /** The fastest a flick may go, in units per second. */
  maxSpeed?: number
  /** One spring swing in ms, read at each start. 0 is reduced motion: the same result, no glide. */
  period: () => number
  /** Close enough to stop, in units. */
  rest?: number
  onFrame?: (at: number) => void
  onMoving?: (moving: boolean) => void
  /** A new resting value came under the hand. */
  onMark?: (value: number) => void
  /** It came to rest on a value. */
  onSettle?: (value: number) => void
}

/** One value under a hand: grab, drag, let go, or go straight to a value. */
export function createScrub(options: ScrubOptions) {
  let o = options
  let at = o.value
  let raw = o.value
  let target = o.value
  let moving = false
  let dragged = false
  let lastMark = o.value
  let stop = () => {}
  const tracker = speedTracker()

  const bounded = () => o.min !== undefined && o.max !== undefined
  const inRange = (v: number) => (bounded() ? clamp(v, o.min!, o.max!) : v)
  const stretch = (r: number) => {
    if (!bounded()) return r
    const edge = o.edge ?? 0
    if (r < o.min!) return o.min! + rubber(r - o.min!, edge)
    if (r > o.max!) return o.max! + rubber(r - o.max!, edge)
    return r
  }
  const setMoving = (m: boolean) => {
    if (moving === m) return
    moving = m
    o.onMoving?.(m)
  }
  const paint = (p: number) => {
    at = p
    o.onFrame?.(p)
    const m = o.land(inRange(p))
    if (m !== lastMark) {
      lastMark = m
      o.onMark?.(m)
    }
  }
  const done = (to: number) => {
    target = to
    setMoving(false)
    o.onSettle?.(to)
  }
  const run = (velocity: number, land: (end: number) => number, coast: number) => {
    stop()
    setMoving(true)
    const g = glide({ from: at, velocity, land, coast, maxSpeed: o.maxSpeed, period: o.period(), rest: o.rest, onFrame: paint, onDone: done })
    target = g.to
    stop = g.stop
  }

  return {
    /** Where it is drawn now, between values while it moves. */
    get at() {
      return at
    },
    /** Where it is going, or where it rests. */
    get target() {
      return target
    },
    get moving() {
      return moving
    },
    /** Swaps in new options, such as fresh callbacks after a render. */
    update(next: Partial<ScrubOptions>) {
      o = { ...o, ...next }
    },
    /** The hand comes down: whatever moved stops where it is. */
    grab(t?: number) {
      stop()
      raw = at
      dragged = false
      tracker.reset()
      tracker.add(raw, t)
    },
    /** The hand moves it by `delta` units. */
    drag(delta: number, t?: number) {
      dragged = true
      setMoving(true)
      raw += delta
      tracker.add(raw, t)
      paint(o.attract ? o.attract(stretch(raw)) : stretch(raw))
    },
    /** The hand lets go: it coasts at the hand's speed and lands on a value. */
    release(t?: number) {
      // Let go past an end, it springs back from the stretch with no speed of its own.
      const outside = bounded() && (at < o.min! || at > o.max!)
      const speed = dragged && !outside ? tracker.speed(t) : 0
      dragged = false
      run(speed, (end) => o.land(inRange(end)), o.coast ?? 0.2)
    },
    /** The hand was taken away (the page scrolled instead): it lands where it is, with no speed. */
    cancel() {
      dragged = false
      run(0, (end) => o.land(inRange(end)), 0)
    },
    /** Glides to `to` and rests there. */
    go(to: number) {
      run(0, () => to, 0)
    },
    /** Puts it on `to` at once, with no motion. */
    place(to: number) {
      stop()
      raw = to
      lastMark = to
      paint(to)
      done(to)
    },
    /** Stops any motion where it is. */
    stop() {
      stop()
      setMoving(false)
    },
  }
}

export type Scrub = ReturnType<typeof createScrub>
