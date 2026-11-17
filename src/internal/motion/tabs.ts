import { bezier } from '../feel'
import { morphCurve, motionMs, prefersReducedMotion } from '../motion'

// The parts of Tabs that are the same in every framework: where the chosen tab is, the tab stop, the
// arrow keys and the rise that stretches over to a new choice.

export type TabBar = { x: number; w: number; room: number; value: string }

/** The chosen tab's place in the row, or null when no tab is chosen. */
export function measureTab(list: HTMLElement, value: string): TabBar | null {
  const el = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
  return el ? { x: el.offsetLeft, w: el.offsetWidth, room: list.offsetWidth, value } : null
}

/** A Tab only knows itself, so the list picks the tab stop when the value matches no enabled tab. */
export function setTabStop(list: HTMLElement | null) {
  const tabs = Array.from(list?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])
  const enabled = tabs.filter((t) => !t.disabled)
  const stop = enabled.find((t) => t.getAttribute('aria-selected') === 'true') ?? enabled[0]
  for (const t of tabs) t.tabIndex = t === stop ? 0 : -1
}

/** Automatic activation, per the WAI-ARIA tabs pattern. */
export function tabKey(list: HTMLElement | null, e: { key: string; preventDefault(): void }) {
  const tabs = Array.from(list?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)') ?? [])
  const i = tabs.indexOf(document.activeElement as HTMLButtonElement)
  if (i < 0) return
  let next = -1
  if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
  else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = tabs.length - 1
  if (next < 0) return
  e.preventDefault()
  tabs[next].focus()
  tabs[next].click()
}

/** Brings a picked tab into view in a row that scrolls sideways. */
export function revealTab(id: string) {
  document.getElementById(id)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

/**
 * The rise moves by script, so each frame knows how far each edge is from the row's ends. Near an end the
 * panel's corner and the rise's inside corner shrink together; at the end the rise and the panel share
 * one straight edge. Call `place` with each new measure.
 */
export function createTabsRise() {
  let drawn: { l: number; r: number; value: string } | null = null
  let raf = 0
  // Where a running move is heading. A re-measure of the same tab (the size watcher reports once more
  // after every change) only updates this; it never restarts or cuts the move short.
  let aim: { l: number; r: number; value: string } | null = null

  const place = (rise: HTMLElement | null, bar: TabBar | null) => {
    const root = rise?.closest<HTMLElement>('[data-gooee-tabs]')
    if (!bar || !rise || !root) return
    const R = parseFloat(getComputedStyle(root).getPropertyValue('--tabs-r')) || 0
    // Within two corners of an end, the panel's corner and the inside corner each take half the room, so
    // they meet as one even S; at the end both are gone.
    const curve = (gap: number) => `${Math.max(0, Math.min(R, gap / 2))}px`
    const draw = (l: number, r: number) => {
      rise.style.left = `${l}px`
      rise.style.right = `${r}px`
      rise.style.setProperty('--tabs-in-start', curve(l))
      rise.style.setProperty('--tabs-in-end', curve(r))
      root.style.setProperty('--tabs-corner-start', curve(l))
      root.style.setProperty('--tabs-corner-end', curve(r))
      drawn = { l, r, value: aim?.value ?? bar.value }
    }
    const to = { l: bar.x, r: bar.room - bar.x - bar.w }
    if (aim?.value === bar.value) {
      aim = { ...to, value: bar.value }
      return
    }
    const from = drawn
    cancelAnimationFrame(raf)
    aim = null
    const length = motionMs('morph-out')
    // Only a new choice moves; a resize or the first paint just puts it in place.
    if (!from || from.value === bar.value || !length || prefersReducedMotion()) return draw(to.l, to.r)
    // The edge on the way leads; the other follows a beat later, so the rise stretches, then settles.
    const lag = motionMs('instant')
    const ease = bezier(morphCurve())
    const toEnd = to.l > from.l
    const t0 = performance.now()
    aim = { ...to, value: bar.value }
    const step = (now: number) => {
      const at = aim
      if (!at) return
      const t = now - t0
      const lead = ease(Math.min(1, t / length))
      const trail = ease(Math.min(1, Math.max(0, (t - lag) / length)))
      const ul = toEnd ? trail : lead
      const ur = toEnd ? lead : trail
      draw(from.l + (at.l - from.l) * ul, from.r + (at.r - from.r) * ur)
      if (t < length + lag) raf = requestAnimationFrame(step)
      else aim = null
    }
    raf = requestAnimationFrame(step)
  }

  return { place, destroy: () => cancelAnimationFrame(raf) }
}
