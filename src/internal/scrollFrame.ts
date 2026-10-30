import { useEffect, useLayoutEffect, useRef } from 'react'
import { motionMs, prefersReducedMotion } from './motion'

// One frame loop for every scroll part on the page. It runs only while the page moves, and stops
// after a moment of stillness; a scroll, a resize or a change in the page's size wakes it again.

/** Where the page is (px) and how fast it moves (px/s, signed). */
export type ScrollFrame = { y: number; v: number }

/** Reads layout and returns the writes, so every part reads before any part writes. */
export type ScrollReader = (frame: ScrollFrame) => void | (() => void)

export type ScrollTokens = { ease: number; start: number; end: number; step: number; readEvery: number }

const readers = new Set<{ current: ScrollReader }>()
let frame: ScrollFrame = { y: 0, v: 0 }
let last = { y: 0, t: -1 }
let raf = 0
let still = 0
let observer: ResizeObserver | null = null
let reduce: MediaQueryList | null = null
let tokens: ScrollTokens | null = null

export function readScrollTokens(): ScrollTokens {
  const s = getComputedStyle(document.documentElement)
  const n = (name: string) => parseFloat(s.getPropertyValue(name))
  return { ease: n('--hl-scroll-ease'), start: n('--hl-draft-start'), end: n('--hl-draft-end'), step: n('--hl-ruler-step'), readEvery: motionMs('fast') }
}

/** The tokens, read once each time the loop starts or the window changes size. */
export const scrollTokens = () => (tokens ??= readScrollTokens())

/** Progress from 0 to 1 as an element's top moves from `start` to `end` (shares of the screen height). */
export function bandProgress(top: number, start: number, end: number) {
  const p = (start - top / window.innerHeight) / (start - end)
  return Math.max(0, Math.min(1, p))
}

function run(f: ScrollFrame) {
  const writes: Array<() => void> = []
  readers.forEach((r) => {
    const w = r.current(f)
    if (w) writes.push(w)
  })
  writes.forEach((w) => w())
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
  last = { y, t }
  frame = { y, v }
  run(frame)
  still = !moved && v === 0 ? still + 1 : 0
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
  frame = { y: 0, v: 0 }
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
  const writes: Array<() => void> = []
  const f = { y: window.scrollY, v: frame.v }
  mounting.forEach((r) => {
    const w = r.current(f)
    if (w) writes.push(w)
  })
  mounting.clear()
  writes.forEach((w) => w())
}

// Weighted wheel scrolling, shared by every SmoothScroll on the page. The last one mounted sets the ease.
const wheelUsers: Array<{ ease?: number }> = []
let fine: MediaQueryList | null = null
const glide = { target: 0, current: 0, set: 0, ease: 1, t0: 0, id: 0 }

const maxScroll = () => document.documentElement.scrollHeight - document.documentElement.clientHeight

const locked = () => document.body.style.overflow === 'hidden'

function step(t: number) {
  const g = glide
  // Something else moved the page (a key, the scrollbar, a link), or a dialog locked it: let it lead.
  if (locked() || Math.abs(window.scrollY - g.set) > 2) {
    g.id = 0
    return
  }
  // A frame's time can be a little before the wheel event's, so never step backwards.
  const k = 1 - Math.pow(1 - g.ease, Math.min(4, Math.max(0, t - g.t0) / (1000 / 60)))
  g.t0 = Math.max(g.t0, t)
  g.current += (g.target - g.current) * k
  if (Math.abs(g.target - g.current) < 0.5) g.current = g.target
  g.set = Math.round(g.current)
  // Instant, so a page with scroll-behavior: smooth does not ease each step a second time.
  window.scrollTo({ top: g.set, behavior: 'instant' })
  g.id = g.current === g.target ? 0 : requestAnimationFrame(step)
}

function stopGlide() {
  cancelAnimationFrame(glide.id)
  glide.id = 0
}

// The nearest box that can still scroll this way takes the wheel itself, and so does one that keeps
// its overscroll to itself. The event's path also walks into shadow roots.
function scrollsInside(path: EventTarget[], dy: number) {
  for (const el of path) {
    if (el === document.documentElement) break
    if (!(el instanceof Element)) continue
    const cs = getComputedStyle(el)
    if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      if (cs.overscrollBehaviorY !== 'auto') return true
      if (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight) return true
    }
  }
  return false
}

function onWheel(e: WheelEvent) {
  // A dialog or sheet has locked the page: leave it still.
  if (locked()) return stopGlide()
  // Pinch zoomed, the wheel pans the zoomed view, so it stays native.
  if (prefersReducedMotion() || !fine?.matches || (window.visualViewport?.scale ?? 1) > 1) return
  if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY) || scrollsInside(e.composedPath(), e.deltaY)) return
  e.preventDefault()
  const g = glide
  if (!g.id) {
    g.target = g.current = g.set = window.scrollY
    g.ease = wheelUsers[wheelUsers.length - 1]?.ease ?? readScrollTokens().ease
  }
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1
  g.target = Math.max(0, Math.min(maxScroll(), g.target + e.deltaY * unit))
  if (!g.id) {
    g.t0 = performance.now()
    g.id = requestAnimationFrame(step)
  }
}

// Any other way of moving the page takes over at once, so a key or the scrollbar never fights a glide.
const handOver = ['keydown', 'mousedown', 'touchstart'] as const

/** Weighted wheel scrolling for mouse and trackpad while mounted. Keys, the scrollbar and links stay native. */
export function useSmoothWheel(ease: number | undefined, disabled: boolean) {
  useEffect(() => {
    if (disabled) return
    const user = { ease }
    if (!wheelUsers.length) {
      fine = window.matchMedia('(hover: hover) and (pointer: fine)')
      window.addEventListener('wheel', onWheel, { passive: false })
      handOver.forEach((t) => window.addEventListener(t, stopGlide, { passive: true }))
    }
    wheelUsers.push(user)
    return () => {
      wheelUsers.splice(wheelUsers.indexOf(user), 1)
      if (wheelUsers.length) return
      window.removeEventListener('wheel', onWheel)
      handOver.forEach((t) => window.removeEventListener(t, stopGlide))
      stopGlide()
      fine = null
    }
  }, [ease, disabled])
}
