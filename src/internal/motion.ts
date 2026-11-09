import { MORPH, type Curve } from './feel'

export type MotionToken = 'instant' | 'fast' | 'base' | 'slow' | 'slower' | 'liquid' | 'morph' | 'morph-out' | 'fling' | 'delay-tooltip'

// Reads a duration token at run time, so reduced motion (0ms) and Retime's speed are honoured by JS
// timers too.
export function readMotionMs(name: string): number {
  if (typeof window === 'undefined') return 0
  const style = getComputedStyle(document.documentElement)
  const raw = style.getPropertyValue(`--hl-motion-${name}`).trim()
  if (!raw) return 0
  const match = raw.match(/(-?[\d.]+)(ms|s)\b/)
  if (!match) return 0
  const base = match[2] === 's' ? parseFloat(match[1]) * 1000 : parseFloat(match[1])
  // The browser fills the scale in, so a scaled token reads calc(360ms * 2).
  const times = raw.match(/\*\s*(-?[\d.]+)\s*\)/)
  return times ? base * parseFloat(times[1]) : base
}

export function motionMs(token: MotionToken): number {
  return readMotionMs(token)
}

export function easing(name: 'out' | 'in' | 'in-out' | 'spring' | 'bounce' | 'liquid' | 'morph'): string {
  if (typeof window === 'undefined') return 'ease'
  return getComputedStyle(document.documentElement).getPropertyValue(`--hl-ease-${name}`).trim() || 'ease'
}

/** --hl-ease-morph as cubic-bezier numbers, for motion drawn frame by frame in JS. */
export function morphCurve(): Curve {
  const n = easing('morph').match(/cubic-bezier\(([^)]*)\)/)?.[1].split(',').map(parseFloat)
  return n?.length === 4 && n.every(Number.isFinite) ? (n as Curve) : MORPH
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
