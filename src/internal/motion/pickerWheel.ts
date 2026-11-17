import { clamp, wrap, type wheelSteps } from '../feel'
import type { PointerLike, ScrubberOptions } from './scrubber'
import { tokenNumber } from './scrubLook'

// The PickerWheel's columns, keys, tap and wheel, and the time and date set-ups, for React and Vue.
// The motion is createScrubber's.

export type WheelColumn = {
  /** Name screen readers hear for this column, such as "Hour". */
  label: string
  /** The rows, top to bottom. */
  options: string[]
  /** The last row runs on into the first, as hours do. */
  loop?: boolean
  /** Rows, by index, drawn stronger, such as :00 and :30, or today. Page Up and Page Down jump between them. */
  strong?: number[]
  /** Twice as wide, for words such as month names. */
  wide?: boolean
}

// Rows drawn either side of the band. At the tilt token's 18 degrees a row this far round is nearly edge on.
export const SPAN = 4

/** What a column keeps between events: the row height, the row it last rested on and what was typed. */
export type ColumnState = { row: number; rested: number; typed: { text: string; at: number } }
export const columnState = (index: number): ColumnState => ({ row: 0, rested: index, typed: { text: '', at: 0 } })

/** In a loop the position runs on past the last row; this is the position of row `i` nearest `t`. */
export const nearestRow = (t: number, i: number, n: number, loop: boolean) => (loop ? Math.round(t) + ((((i - wrap(Math.round(t), n)) % n) + n + Math.floor(n / 2)) % n) - Math.floor(n / 2) : i)

/** The scrubber options for one column: rows are the marks, a drag follows the hand, a let-go lands on a row. */
export function columnScrub(column: WheelColumn, index: number, state: ColumnState, wheel: ReturnType<typeof wheelSteps>): Pick<ScrubberOptions<PointerLike>, 'value' | 'min' | 'max' | 'edge' | 'land' | 'maxSpeed' | 'move' | 'key' | 'tap' | 'wheel'> {
  const { options, loop = false } = column
  const n = options.length
  const strong = new Set(column.strong ?? [])
  const nearest = (t: number, i: number) => nearestRow(t, i, n, loop)
  const fit = (v: number) => (loop ? v : clamp(v, 0, n - 1))
  const strongFrom = (t: number, dir: 1 | -1) => {
    const i = wrap(Math.round(t), n)
    for (let d = 1; d < n; d++) if (strong.has(wrap(i + dir * d, n)) && (loop || (i + dir * d >= 0 && i + dir * d < n))) return fit(Math.round(t) + dir * d)
    return fit(Math.round(t) + dir * 5)
  }
  return {
    value: nearest(state.rested, clamp(index, 0, n - 1)),
    min: loop ? undefined : 0,
    max: loop ? undefined : n - 1,
    edge: 0.6,
    land: (p) => fit(Math.round(p)),
    maxSpeed: 40,
    move: (e, last) => -(e.clientY - last.y) / (state.row || 1),
    // The APG spinbutton keys: Up is the next, higher value and Down the one before.
    key: (k, t) => {
      if (k === 'ArrowUp') return fit(Math.round(t) + 1)
      if (k === 'ArrowDown') return fit(Math.round(t) - 1)
      if (k === 'PageUp') return strongFrom(t, 1)
      if (k === 'PageDown') return strongFrom(t, -1)
      if (k === 'Home') return nearest(t, 0)
      if (k === 'End') return nearest(t, n - 1)
      if (k.length === 1 && /\S/.test(k)) {
        const now = performance.now()
        state.typed = { text: (now - state.typed.at < 800 ? state.typed.text : '') + k.toLowerCase(), at: now }
        const q = state.typed.text
        // A padded number answers to its plain digits, so typing 5 finds the padded five before fifty.
        const said = (o: string) => (/^\d+$/.test(o) ? String(Number(o)) : o.toLowerCase())
        const exact = options.findIndex((o) => o.toLowerCase() === q || said(o) === q)
        const hit = exact >= 0 ? exact : options.findIndex((o) => o.toLowerCase().startsWith(q))
        return hit >= 0 ? nearest(t, hit) : null
      }
      return null
    },
    tap: (e, at) => {
      const el = e.currentTarget as HTMLElement
      const r = el.getBoundingClientRect()
      const tilt = (tokenNumber(el, '--gooee-wheel-tilt') * Math.PI) / 180
      const radius = state.row / 2 / Math.tan(tilt / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      if (!tilt || !radius) return null
      return fit(Math.round(at + Math.asin(clamp(dy / radius, -1, 1)) / tilt))
    },
    // Only a focused column takes the wheel, and at an end it lets the page scroll on.
    wheel: (e, t, focused) => {
      if (!focused || !e.deltaY) return null
      const dir = Math.sign(e.deltaY)
      if (!loop && ((dir > 0 && t >= n - 1) || (dir < 0 && t <= 0))) return null
      return fit(t + wheel(e.deltaY * (e.deltaMode === 1 ? 40 : 1)))
    },
  }
}

/** The rows drawn round the drum at position `at`: each one's key, distance from the band and row. */
export function drumRows(at: number, n: number, loop: boolean) {
  const rows: { k: number; d: number; i: number }[] = []
  for (let k = Math.floor(at) - SPAN; k <= Math.ceil(at) + SPAN; k++) {
    if (!loop && (k < 0 || k > n - 1)) continue
    rows.push({ k, d: k - at, i: wrap(k, n) })
  }
  return rows
}

const pad = (v: number) => String(v).padStart(2, '0')

/** A time wheel: hour, minute and, on a 12 hour clock, AM or PM, and the turns between rows and "HH:mm". */
export function timeWheel(hourCycle: 12 | 24, minuteStep: number, strong: number[]) {
  const twelve = hourCycle === 12
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep)
  const columns: WheelColumn[] = [
    { label: 'Hour', options: twelve ? Array.from({ length: 12 }, (_, i) => String(i + 1)) : Array.from({ length: 24 }, (_, i) => pad(i)), loop: true },
    { label: 'Minute', options: minutes.map(pad), loop: true, strong: strong.map((m) => minutes.indexOf(m)).filter((i) => i >= 0) },
    ...(twelve ? [{ label: 'AM or PM', options: ['AM', 'PM'] }] : []),
  ]
  return {
    columns,
    toRows(hhmm: string) {
      const [h = 0, m = 0] = hhmm.split(':').map(Number)
      const mi = clamp(Math.round(m / minuteStep), 0, minutes.length - 1)
      return twelve ? [(h % 12 || 12) - 1, mi, h >= 12 ? 1 : 0] : [h, mi]
    },
    toTime(rows: number[]) {
      const h = twelve ? ((rows[0] + 1) % 12) + (rows[2] ? 12 : 0) : rows[0]
      return `${pad(h)}:${pad(minutes[rows[1]])}`
    },
    show: (rows: number[]) => (twelve ? `${rows[0] + 1}:${pad(minutes[rows[1]])} ${rows[2] ? 'PM' : 'AM'}` : `${pad(rows[0])}:${pad(minutes[rows[1]])}`),
  }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const daysIn = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m: m - 1, d }
}
/** Today as "YYYY-MM-DD". */
export const today = () => {
  const t = new Date()
  return iso(t.getFullYear(), t.getMonth(), t.getDate())
}

/** A date wheel for `value`: day, month and year with each month's real length, and the turns between rows and "YYYY-MM-DD". */
export function dateWheel(value: string, now: string, fromYear?: number, toYear?: number, strong?: string[]) {
  const first = fromYear ?? parse(now).y - 100
  const last = toYear ?? parse(now).y + 10
  const years = Array.from({ length: Math.max(1, last - first + 1) }, (_, i) => first + i)
  const at = parse(value)
  const y = clamp(at.y, first, last)
  const count = daysIn(at.m, y)
  const marks = (strong ?? [now]).map(parse)
  const columns: WheelColumn[] = [
    { label: 'Day', options: Array.from({ length: count }, (_, i) => String(i + 1)), loop: true, strong: marks.filter((s) => s.y === y && s.m === at.m).map((s) => s.d - 1) },
    { label: 'Month', options: MONTHS, loop: true, wide: true, strong: marks.filter((s) => s.y === y).map((s) => s.m) },
    { label: 'Year', options: years.map(String), strong: marks.map((s) => years.indexOf(s.y)).filter((i) => i >= 0) },
  ]
  const toDate = (rows: number[]) => {
    const yy = years[rows[2]]
    return iso(yy, rows[1], Math.min(rows[0] + 1, daysIn(rows[1], yy)))
  }
  return {
    columns,
    rows: [Math.min(at.d, count) - 1, at.m, years.indexOf(y)],
    toDate,
    show(rows: number[]) {
      const p = parse(toDate(rows))
      return new Date(p.y, p.m, p.d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    },
  }
}
