// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { bezier } from '../../internal/feel'
import { morphCurve, motionMs, prefersReducedMotion } from '../../internal/motion'
import { themeReveal } from '../../internal/themeReveal'
import { IconButton } from '../IconButton'
import styles from './ThemeToggle.module.css'

export type Theme = 'light' | 'dark'

export type ThemeToggleProps = {
  /** The theme, when your app keeps it. Leave it out and the toggle sets data-theme on <html> itself. */
  theme?: Theme
  /** Called with the new theme on every flip. */
  onThemeChange?: (theme: Theme) => void
  /** Where the choice is remembered when the toggle runs the page. Match it in themeScript. */
  storageKey?: string
  /** The new theme grows from the button in a circle over the screen. Turn it off for an instant change. */
  reveal?: boolean
  /** The button's size, the same as IconButton. */
  size?: 'sm' | 'md' | 'lg'
  /** Extra class for the button. */
  className?: string
}

/** Put in <head>, before the page paints, so a saved dark theme never flashes light first. */
export const themeScript = (storageKey = 'gooee-theme') =>
  `try{var t=localStorage.getItem(${JSON.stringify(storageKey)});if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}`

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
function bodyAt(t: number) {
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
const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4
  return `M${f(C + 7 * Math.cos(a))} ${f(C + 7 * Math.sin(a))}L${f(C + 9.5 * Math.cos(a))} ${f(C + 9.5 * Math.sin(a))}`
}).join('')
// The rays draw in toward the disc, turn a little and fade, all within the first 40%.
const raysAt = (t: number) => {
  const k = part(t, 0, 0.4)
  return { transform: `rotate(${f(-30 * k)}deg) scale(${f(1 - 0.45 * k)})`, opacity: String(f(1 - k)) }
}
function draw(body: SVGPathElement, t: number) {
  body.setAttribute('d', bodyAt(t))
  const rays = body.nextElementSibling as SVGPathElement | null
  if (rays) Object.assign(rays.style, raysAt(t))
}

const pageTheme = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

// One button that flips between the light and dark theme. The sun morphs into the moon and back.
export function ThemeToggle({ theme: themeProp, onThemeChange, storageKey = 'gooee-theme', reveal = true, size = 'sm', className }: ThemeToggleProps) {
  const controlled = themeProp !== undefined
  const [own, setOwn] = useState<Theme>('light')
  const theme = controlled ? themeProp : own

  // Read after mount: the server cannot know the page's theme, and themeScript has already set it.
  useEffect(() => {
    if (!controlled) setOwn(pageTheme())
  }, [controlled])

  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  // Shows the theme the button switches to: the moon in light, the sun in dark. The body morphs on the
  // morph curve, in the reveal's time, so the icon and the circle end together; the rays are drawn on
  // the same frames.
  const body = useRef<SVGPathElement>(null)
  const shown = useRef(theme === 'dark' ? 0 : 1)
  const aim = useRef(shown.current)
  const raf = useRef(0)
  const morphTo = (to: number) => {
    const el = body.current
    aim.current = to
    cancelAnimationFrame(raf.current)
    if (!el) return
    const from = shown.current
    const length = motionMs('reveal')
    if (from === to || !length || prefersReducedMotion()) {
      shown.current = to
      draw(el, to)
      return
    }
    const ease = bezier(morphCurve())
    const t0 = performance.now()
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / length)
      shown.current = from + (to - from) * ease(u)
      draw(el, shown.current)
      if (u < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }
  // A theme set from outside (or the first paint): morph to it, unless a press already started that morph.
  useLayoutEffect(() => {
    const to = theme === 'dark' ? 0 : 1
    if (aim.current !== to) morphTo(to)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])
  useLayoutEffect(() => () => cancelAnimationFrame(raf.current), [])
  // The icon answers the press at once; the theme change, and its circle, start two frames later, so
  // the first motion is on screen before the page is held still to be photographed.
  const flip = (e: MouseEvent<HTMLButtonElement>) => {
    const origin = e.currentTarget
    morphTo(next === 'dark' ? 0 : 1)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (reveal) themeReveal(origin, apply)
        else apply()
      }),
    )
  }
  const apply = () => {
    if (!controlled) {
      document.documentElement.dataset.theme = next
      try {
        localStorage.setItem(storageKey, next)
      } catch {
        // Not saved, so it lasts only this visit; the theme still changes.
      }
      setOwn(next)
    }
    onThemeChange?.(next)
  }

  return (
    <IconButton
      label={`Switch to ${next} theme`}
      variant="secondary"
      size={size}
      className={className}
      onClick={flip}
      icon={
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path ref={body} d={bodyAt(shown.current)} />
          <path className={styles.rays} d={RAYS} style={raysAt(shown.current)} />
        </svg>
      }
    />
  )
}
