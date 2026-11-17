// NumberInput: reading typed numbers in any locale, and the repeat while a step button is held.

export type NumberInputLabels = {
  /** Name of the minus button. A function gets the field label; a string is used as it is. */
  decrease: string | ((label: string) => string)
  /** Name of the plus button. A function gets the field label; a string is used as it is. */
  increase: string | ((label: string) => string)
}

// Input timings, so reduced motion does not change them
export function tokenMs(name: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!raw) return fallback
  // The browser may report 500ms as .5s
  return raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000
}

export function parseNumber(text: string, locale?: string): number | null {
  const parts = new Intl.NumberFormat(locale).formatToParts(-12345.6)
  const group = parts.find((p) => p.type === 'group')?.value ?? ','
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.'
  const minus = parts.find((p) => p.type === 'minusSign')?.value ?? '-'
  // sv, nb and fi write minus as U+2212, which the cleanup below would drop
  const clean = text
    .split(minus).join('-')
    .replace(/−/g, '-')
    .split(group).join('')
    .split(decimal).join('.')
    .replace(/[^\d.-]/g, '')
  if (clean === '' || clean === '-' || clean === '.') return null
  const n = Number(clean)
  return Number.isFinite(n) ? n : null
}

/** Hold to repeat: one step at once, then steps that speed up (big after 12) until the end is reached or the pointer lifts. */
export function createHold() {
  let timer: number | undefined
  let count = 0
  const stop = () => {
    window.clearTimeout(timer)
    count = 0
  }
  const start = (bump: (big: boolean) => void, atEnd: () => boolean) => {
    bump(false)
    // A disabled button gets no pointerup, so listen on the window
    window.addEventListener('pointerup', stop, { once: true })
    const tick = () => {
      if (atEnd()) return stop()
      count++
      bump(count > 12)
      timer = window.setTimeout(tick, tokenMs('--gooee-motion-repeat', 70))
    }
    timer = window.setTimeout(tick, tokenMs('--gooee-motion-repeat-delay', 400))
  }
  return { start, stop }
}
