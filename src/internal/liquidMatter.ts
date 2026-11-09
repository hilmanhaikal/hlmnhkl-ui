import { useLayoutEffect, useRef, type RefObject } from 'react'
import { bezier } from './feel'
import { body, BEND, boxPath, flowScene, loopsPath, pincher, trace, type Box } from './liquidPath'
import { morphCurve, motionMs, prefersReducedMotion, type MotionToken } from './motion'

// The page side of liquid matter (the maths is in liquidPath.ts): an SVG layer that exists only while a
// part moves, a frame loop, and the flowing highlight Tabs and SegmentedControl share.

const NS = 'http://www.w3.org/2000/svg'

export const morphEase = () => bezier(morphCurve())

/** A duration token in ms, or 0 when motion is reduced. */
export const motionFor = (token: MotionToken) => (prefersReducedMotion() ? 0 : motionMs(token))

/**
 * An element's outer box shadows as drop-shadow filters, so a drawn shape casts the same shadow. A
 * shadow that is only a spread (a 1px ring) comes back as `ring`, to draw as a stroke.
 */
export function shadowOf(el: Element) {
  const filters: string[] = []
  let ring: { colour: string; width: number } | null = null
  for (const part of getComputedStyle(el).boxShadow.split(/,(?![^(]*\))/)) {
    if (part.trim() === 'none' || part.includes('inset')) continue
    const colour = part.match(/rgba?\([^)]*\)|#[\da-f]+/i)?.[0] ?? 'currentColor'
    const [x = 0, y = 0, blur = 0, spread = 0] = (part.replace(colour, '').match(/-?[\d.]+px/g) ?? []).map(parseFloat)
    if (spread > 0 && !x && !y && !blur) ring = { colour, width: spread }
    else filters.push(`drop-shadow(${x}px ${y}px ${blur}px ${colour})`)
  }
  return { filter: filters.join(' ') || 'none', ring }
}

/** An SVG in `host`, before `before`, with `count` paths. It is marked data-hl-liquid. */
export function layer(host: Element, className: string, before: Node | null, count = 1) {
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('class', className)
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('data-hl-liquid', '')
  const paths = Array.from({ length: count }, () => svg.appendChild(document.createElementNS(NS, 'path')))
  host.insertBefore(svg, before)
  return { svg, paths }
}

/**
 * Draws frame 0 now (so the part's new CSS state never shows first), then one per frame over `ms`
 * with progress 0 to 1, then calls `done`. Returns a stop.
 */
export function frames(ms: number, draw: (u: number, now: number) => void, done: () => void) {
  const t0 = performance.now()
  draw(0, t0)
  let id = 0
  const tick = (now: number) => {
    const u = Math.min(1, Math.max(0, (now - t0) / ms))
    draw(u, now)
    if (u >= 1) done()
    else id = requestAnimationFrame(tick)
  }
  id = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(id)
}

/** A highlight's place in its row: its start edge and its width. */
export type Place = { x: number; w: number }

type Flow = { front: Box; rest: Box; stop: () => void; svg: SVGSVGElement; pin: ReturnType<typeof pincher> }

/**
 * Flow: when the choice changes, the highlight `mark` runs to the new place on a neck that thins and
 * breaks, and what is left drains after it and joins by 60% of the move (liquidPath flowScene). While
 * it moves the mark is hidden and an SVG in `host` draws it; at rest the mark is back, exact. A flow
 * caught half way starts from the shape on screen. `line` draws a thin underline, which only splits
 * and joins. `ink` gets the drawn outline each frame (null at the end), for text that changes colour
 * under the liquid. `cls` is the layer's class.
 */
export function useFlow(
  host: RefObject<HTMLElement | null>,
  mark: RefObject<HTMLElement | null>,
  place: Place | null,
  choice: unknown,
  ready: boolean,
  cls: string,
  line = false,
  ink?: (outline: string | null) => void,
) {
  const last = useRef<{ place: Place; choice: unknown } | null>(null)
  const run = useRef<Flow | null>(null)
  const end = () => {
    const f = run.current
    if (!f) return
    f.stop()
    f.svg.remove()
    run.current = null
    delete mark.current?.dataset.flowing
    delete host.current?.dataset.flowing
    ink?.(null)
  }
  useLayoutEffect(() => {
    const root = host.current
    const m = mark.current
    const prev = last.current
    // A new choice arrives a render before its place is measured: wait for the place.
    if (!place || (prev && prev.place.x === place.x && prev.place.w === place.w)) return
    last.current = { place, choice }
    if (!root || !m || !prev || !ready || prev.choice === choice) {
      end()
      return
    }
    const ms = motionFor('slow')
    if (!ms) {
      end()
      return
    }
    const hh = m.offsetHeight / 2
    const cy = m.offsetTop + hh
    const r = Math.min(hh, parseFloat(getComputedStyle(m).borderTopLeftRadius) || 0)
    const boxOf = (p: Place): Box => ({ cx: p.x + p.w / 2, cy, hw: p.w / 2, hh, r })
    const to = boxOf(place)
    const from = run.current ?? { front: boxOf(prev.place), rest: boxOf(prev.place) }
    const e = morphEase()
    let f = run.current
    if (f) f.stop()
    else {
      const { svg, paths } = layer(root, cls, m.nextSibling)
      const look = getComputedStyle(m)
      const { filter, ring } = shadowOf(m)
      paths[0].style.fill = look.backgroundColor
      if (ring && !line) {
        paths[0].style.stroke = ring.colour
        paths[0].style.strokeWidth = `${ring.width * 2}px`
        paths[0].style.paintOrder = 'stroke'
      }
      svg.style.filter = filter
      f = { front: from.front, rest: from.rest, stop: () => {}, svg, pin: pincher(e, motionFor('fast')) }
      run.current = f
      m.dataset.flowing = ''
      root.dataset.flowing = ''
    }
    const flow = f
    const path = flow.svg.firstElementChild as SVGPathElement
    const lift = Math.max(BEND + 0.5, hh / 2)
    const settle = Math.max(BEND + 0.5, hh / 3)
    const start = { front: from.front, rest: from.rest }
    const draw = (u: number, now: number) => {
      const s = line ? flowScene(e, u, start.front, start.rest, to, 0, [BEND, hh], [hh, hh]) : flowScene(e, u, start.front, start.rest, to, hh / 6, [lift, lift], [settle, settle])
      flow.front = s.front
      flow.rest = s.rest
      let d: string
      if (line) {
        const a = s.front
        const b = s.rest
        // Two lines of one thickness on one row: one where they overlap, two apart.
        const lo = Math.min(a.cx - a.hw, b.cx - b.hw)
        const hi = Math.max(a.cx + a.hw, b.cx + b.hw)
        d = Math.abs(a.cx - b.cx) <= a.hw + b.hw ? boxPath({ cx: (lo + hi) / 2, cy, hw: (hi - lo) / 2, hh, r: hh }) : boxPath(a) + boxPath(b)
      } else {
        const p = flow.pin(body(s.front), body(s.rest), now)
        d = loopsPath(trace(p.sdf, [[s.front.cx, cy, 0, -1], [s.rest.cx, cy, 0, -1]]))
      }
      path.setAttribute('d', d)
      ink?.(d)
    }
    flow.stop = frames(ms, draw, end)
    // Keyed on the choice and the place; the rest is read when it runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, place?.x, place?.w, ready])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => () => end(), [])
}
