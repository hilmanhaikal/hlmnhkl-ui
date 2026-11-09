// Feel: how a value moves under the hand. A drag follows the hand one to one; a let-go coasts a capped
// distance and lands on the morph curve, starting at the hand's speed. Plain TypeScript with no
// framework and no styling, so it can stand on its own. Every time is passed in, so a duration of 0
// (reduced motion) keeps each result and drops the motion.

/** A cubic-bezier's four numbers. */
export type Curve = [number, number, number, number]

/** The numbers of --hl-ease-morph, for when the token cannot be read. */
export const MORPH: Curve = [0.32, 0.72, 0, 1]

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

/** 1 on the mark, 0 at the edge of its reach, smooth in between. Drives size and ink. */
export function pull(distance: number, reach: number) {
  if (reach <= 0) return distance === 0 ? 1 : 0
  const t = Math.min(1, Math.abs(distance) / reach)
  return 0.5 + 0.5 * Math.cos(Math.PI * t)
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

/** A cubic-bezier as a function from a share of the time (0 to 1) to a share of the way. */
export function bezier([x1, y1, x2, y2]: Curve) {
  const along = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0
    let hi = 1
    let t = x
    for (let i = 0; i < 24; i++) {
      const at = along(x1, x2, t)
      if (Math.abs(at - x) < 1e-5) break
      if (at < x) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return along(y1, y2, t)
  }
}

export type MorphOptions = {
  from: number
  to: number
  /** Units per second at the start. Toward `to`, a let-go carries on at the hand's speed, so the move takes less time. */
  velocity?: number
  /** How long the move takes from rest, in ms. 0 jumps straight to `to`. */
  duration: number
  /** The curve. Defaults to the morph curve. */
  curve?: Curve
  onFrame: (value: number) => void
  onDone?: () => void
}

/** Runs from `from` to `to` on the curve and stops there. Returns a stop function. */
export function morphTo({ from, to, velocity = 0, duration, curve = MORPH, onFrame, onDone }: MorphOptions) {
  if (!duration || from === to) {
    onFrame(to)
    onDone?.()
    return () => {}
  }
  const D = to - from
  // The curve starts at y1 / x1 times its average speed. A let-go toward `to` shortens the move until
  // that start speed is the hand's, but never below 40% of the time, so a hard throw still lands softly.
  const lead = curve[0] > 0 ? curve[1] / curve[0] : 1
  const toward = Math.sign(velocity) === Math.sign(D) ? Math.abs(velocity) : 0
  const ms = toward ? clamp(((lead * Math.abs(D)) / toward) * 1000, duration * 0.4, duration) : duration
  const ease = bezier(curve)
  const t0 = performance.now()
  let raf = 0
  const finish = () => {
    cancelAnimationFrame(raf)
    clearTimeout(backstop)
    onFrame(to)
    onDone?.()
  }
  // Frames can stall (a hidden tab, a slow phone), so a timer lands it in real time if they do.
  const backstop = setTimeout(finish, ms + 50)
  raf = requestAnimationFrame(function step(now) {
    const t = (now - t0) / ms
    if (t >= 1) return finish()
    onFrame(from + D * ease(t))
    raf = requestAnimationFrame(step)
  })
  return () => {
    cancelAnimationFrame(raf)
    clearTimeout(backstop)
  }
}

export type GlideOptions = Omit<MorphOptions, 'to' | 'onDone'> & {
  /** Where it comes to rest, given where the coast would end. */
  land: (end: number) => number
  /** How far a flick carries: its speed times this, in seconds. 0 lands under the hand. */
  coast?: number
  /** The fastest a flick may go, in units per second, so a hard throw still stops near the hand. */
  maxSpeed?: number
  onDone?: (to: number) => void
}

/**
 * A let-go: it lands on `land(end)`, where `end` is as far as the flick would coast, on the morph
 * curve at the hand's speed. With a duration of 0 it lands at once, on the place under the hand.
 */
export function glide({ from, velocity = 0, land, coast = 0.2, maxSpeed = Infinity, duration, curve, onFrame, onDone }: GlideOptions) {
  if (!duration) {
    const to = land(from)
    onFrame(to)
    onDone?.(to)
    return { to, stop: () => {} }
  }
  const v = clamp(velocity, -maxSpeed, maxSpeed)
  const to = land(from + v * coast)
  return { to, stop: morphTo({ from, to, velocity: v, duration, curve, onFrame, onDone: () => onDone?.(to) }) }
}

/** A number that moves toward a target on the curve, over `time()` ms from where it is. A time of 0 jumps. */
export function follow({ value = 0, time, curve, onFrame }: { value?: number; time: () => number; curve?: Curve; onFrame: (value: number) => void }) {
  let at = value
  let to = value
  let stop = () => {}
  return {
    get value() {
      return at
    },
    set(target: number) {
      if (target === to) return
      to = target
      stop()
      stop = morphTo({ from: at, to, duration: time(), curve, onFrame: (v) => onFrame((at = v)) })
    },
    stop() {
      stop()
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
  /** The value a position comes to rest on. */
  land: (at: number) => number
  /** How far a flick coasts: its speed times this, in seconds. */
  coast?: number
  /** The fastest a flick may go, in units per second. */
  maxSpeed?: number
  /** How long a glide takes in ms, read at each start. 0 is reduced motion: the same result, no glide. */
  duration: () => number
  /** The glide's curve, read at each start. */
  curve?: () => Curve
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
    const g = glide({ from: at, velocity, land, coast, maxSpeed: o.maxSpeed, duration: o.duration(), curve: o.curve?.(), onFrame: paint, onDone: done })
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
      paint(stretch(raw))
    },
    /** The hand lets go: it coasts at the hand's speed and lands on a value. */
    release(t?: number) {
      // Let go past an end, it glides back from the stretch with no speed of its own.
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
