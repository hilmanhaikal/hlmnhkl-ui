const STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.35],
  ['month', 12],
  ['year', Infinity],
]

/** "5 minutes ago", "yesterday", "in 2 hours", in the given language. */
export function relativeTime(time: Date, now: Date, locale?: string): string {
  if (!isValidDate(time)) return ''
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  let value = (time.getTime() - now.getTime()) / 1000
  if (Math.abs(value) < 45) return rtf.format(0, 'second')
  for (const [unit, size] of STEPS) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit)
    value /= size
  }
  return rtf.format(Math.round(value), 'year')
}

export const isValidDate = (d: Date) => !Number.isNaN(d.getTime())

export const toDate = (t: Date | string | number) => (t instanceof Date ? t : new Date(t))
