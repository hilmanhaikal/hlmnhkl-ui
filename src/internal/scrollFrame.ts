import { useLayoutEffect, useRef } from 'react'

// One frame loop for every scroll part on the page. It runs only while the page moves, and stops
// after a moment of stillness; a scroll, a resize or a change in the page's size wakes it again.

/** Where the page is (px), how fast it moves (px/s, signed), and the time since the last frame (ms, 0 on mount). */
export type ScrollFrame = { y: number; v: number; dt: number }

/** Reads layout and returns the writes, so every part reads before any part writes. */
export type ScrollReader = (frame: ScrollFrame) => void | (() => void)

export type ScrollTokens = { ease: number; start: number; end: number; turn: number; turnNarrow: number }

const readers = new Set<{ current: ScrollReader }>()
let frame: ScrollFrame = { y: 0, v: 0, dt: 0 }
let last = { y: 0, t: -1 }
let raf = 0
let still = 0
let observer: ResizeObserver | null = null
let reduce: MediaQueryList | null = null
let tokens: ScrollTokens | null = null

export function readScrollTokens(): ScrollTokens {
  const s = getComputedStyle(document.documentElement)
  const n = (name: string) => parseFloat(s.getPropertyValue(name))
  return { ease: n('--hl-scroll-ease'), start: n('--hl-draft-start'), end: n('--hl-draft-end'), turn: n('--hl-story-turn'), turnNarrow: n('--hl-story-turn-narrow') }
}

/** The tokens, read once each time the loop starts or the window changes size. */
export const scrollTokens = () => (tokens ??= readScrollTokens())

/** Progress from 0 to 1 as an element's top moves from `start` to `end` (shares of the screen height). */
export function bandProgress(top: number, start: number, end: number) {
  const p = (start - top / window.innerHeight) / (start - end)
  return Math.max(0, Math.min(1, p))
}

// Set by a part that is still easing, so the loop keeps going after the page stops.
let settling = false

/** Moves `from` toward `to` by the scroll ease, the same weight at any frame rate. On mount it lands at once. */
export function easeToward(from: number, to: number, dt: number) {
  if (dt <= 0) return to
  const k = 1 - Math.pow(1 - scrollTokens().ease, Math.min(4, dt / (1000 / 60)))
  const next = from + (to - from) * k
  if (Math.abs(to - next) < 0.0005) return to
  settling = true
  return next
}

// One part that throws must not stop the loop for every other part, so each runs on its own and the
// error is reported after the frame.
function guard<T>(fn: () => T): T | undefined {
  try {
    return fn()
  } catch (error) {
    queueMicrotask(() => {
      throw error
    })
  }
}

function runAll(list: Iterable<{ current: ScrollReader }>, f: ScrollFrame) {
  const writes: Array<() => void> = []
  for (const r of list) {
    const w = guard(() => r.current(f))
    if (w) writes.push(w)
  }
  writes.forEach((w) => guard(w))
}

function run(f: ScrollFrame) {
  runAll(readers, f)
}

function tick(t: number) {
  const y = window.scrollY
  // The first frame after a wake only takes its bearings: its time can be earlier than the wake's.
  let v = frame.v
  if (last.t >= 0) {
    v += (((y - last.y) / Math.max(1, t - last.t)) * 1000 - v) * 0.2
    if (Math.abs(v) < 1) v = 0
  }
  const moved = y !== last.y
  const dt = last.t >= 0 ? t - last.t : 0
  last = { y, t }
  frame = { y, v, dt }
  settling = false
  run(frame)
  still = !moved && v === 0 && !settling ? still + 1 : 0
  raf = still > 30 ? 0 : requestAnimationFrame(tick)
}

function wake() {
  still = 0
  if (raf) return
  tokens = null
  last = { y: window.scrollY, t: -1 }
  raf = requestAnimationFrame(tick)
}

function onResize() {
  tokens = null
  wake()
}

function start() {
  window.addEventListener('scroll', wake, { passive: true })
  window.addEventListener('resize', onResize)
  // Fonts, pictures or an opened panel can move things without a scroll.
  observer = new ResizeObserver(wake)
  observer.observe(document.body)
  reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduce.addEventListener('change', wake)
}

function stop() {
  window.removeEventListener('scroll', wake)
  window.removeEventListener('resize', onResize)
  observer?.disconnect()
  observer = null
  reduce?.removeEventListener('change', wake)
  reduce = null
  cancelAnimationFrame(raf)
  raf = 0
  frame = { y: 0, v: 0, dt: 0 }
}

/** Calls `read` once on mount and then every frame while the page moves. */
export function useScrollFrame(read: ScrollReader, active = true) {
  const ref = useRef(read)
  useLayoutEffect(() => {
    ref.current = read
  })
  useLayoutEffect(() => {
    if (!active) return
    if (!readers.size) start()
    readers.add(ref)
    mounting.add(ref)
    if (mounting.size === 1) queueMicrotask(runMounts)
    wake()
    return () => {
      readers.delete(ref)
      mounting.delete(ref)
      if (!readers.size) stop()
    }
  }, [active])
}

// Parts that mount together read once, together, before the first paint, so the page lays out once.
const mounting = new Set<{ current: ScrollReader }>()

function runMounts() {
  const list = [...mounting]
  mounting.clear()
  runAll(list, { y: window.scrollY, v: frame.v, dt: 0 })
}
