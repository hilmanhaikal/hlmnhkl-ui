'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { clamp, magnetTo, pull, wheelSteps, wrap } from '../../internal/feel'
import { useControllable } from '../../internal/useControllable'
import { ink, tokenNumber, useOnChange, useScrub } from '../../internal/useScrub'
import styles from './PickerWheel.module.css'

export type PickerWheelColumn = {
  /** Name screen readers hear for this column, such as "Hour". */
  label: string
  /** The rows, top to bottom. */
  options: string[]
  /** The last row runs on into the first, as hours do. */
  loop?: boolean
  /** Rows, by index, that pull harder, such as :00 and :30, or today. */
  strong?: number[]
  /** Twice as wide, for words such as month names. */
  wide?: boolean
}

export type PickerWheelProps = Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange' | 'children'> & {
  /** Visible name of the whole wheel, read by screen readers as the group's name. */
  label: string
  /** The columns, left to right. */
  columns: PickerWheelColumn[]
  /** The chosen row of each column, by index, when you control it. */
  value?: number[]
  /** Starting rows when you do not control them. Undefined starts on the first row of each. */
  defaultValue?: number[]
  /** Called once a column comes to rest on a new row, with every column's row. */
  onValueChange?: (value: number[]) => void
  /** Called with the rows in the band while the wheel still turns. */
  onScrub?: (value: number[]) => void
  /** Turns the rows into a large readout above the wheel. No readout when left out. */
  formatValue?: (value: number[]) => string
  /** A line under the label and readout, such as what the choice means. */
  detail?: ReactNode
  /** A short buzz on each row while it turns, on phones that can (Android). */
  haptics?: boolean
}

// Rows drawn either side of the band. At the tilt token's 18 degrees a row this far round is nearly edge on.
const SPAN = 4

type ColumnProps = {
  column: PickerWheelColumn
  index: number
  onChange: (index: number) => void
  onShown: (index: number) => void
  haptics: boolean
}

/** One column: its rows are the marks. Free between rows, drawn in near one, harder near a strong row. */
function Column({ column, index, onChange, onShown, haptics }: ColumnProps) {
  const { options, loop = false } = column
  const n = options.length
  const strong = new Set(column.strong ?? [])
  const typed = useRef({ text: '', at: 0 })
  const row = useRef(0)
  const wheel = useRef(wheelSteps())
  // In a loop the position runs on past the last row; the row shown is the position folded into the list.
  const nearest = (t: number, i: number) => (loop ? Math.round(t) + ((((i - wrap(Math.round(t), n)) % n) + n + Math.floor(n / 2)) % n) - Math.floor(n / 2) : i)
  const fit = (v: number) => (loop ? v : clamp(v, 0, n - 1))
  const rested = useRef(index)
  const strongFrom = (t: number, dir: 1 | -1) => {
    const i = wrap(Math.round(t), n)
    for (let d = 1; d < n; d++) if (strong.has(wrap(i + dir * d, n)) && (loop || (i + dir * d >= 0 && i + dir * d < n))) return fit(Math.round(t) + dir * d)
    return fit(Math.round(t) + dir * 5)
  }

  const sc = useScrub({
    value: nearest(rested.current, clamp(index, 0, n - 1)),
    min: loop ? undefined : 0,
    max: loop ? undefined : n - 1,
    edge: 0.6,
    attract: (r) => {
      const k = Math.round(r)
      const { reach = 0.35, strong: far = 1.5 } = sc.reach()
      // Rows are the marks, so a strong row reaches at most half a row: the rows beside it stay easy to stop on.
      return magnetTo(r, [k], strong.has(wrap(k, n)) ? Math.min(far, 0.5) : reach)
    },
    land: (p) => fit(Math.round(p)),
    maxSpeed: 40,
    rest: 0.01,
    move: (e, last) => -(e.clientY - last.y) / (row.current || 1),
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
        typed.current = { text: (now - typed.current.at < 800 ? typed.current.text : '') + k.toLowerCase(), at: now }
        const q = typed.current.text
        // A padded number answers to its plain digits, so "5" finds "05" before "50".
        const said = (o: string) => (/^\d+$/.test(o) ? String(Number(o)) : o.toLowerCase())
        const exact = options.findIndex((o) => o.toLowerCase() === q || said(o) === q)
        const hit = exact >= 0 ? exact : options.findIndex((o) => o.toLowerCase().startsWith(q))
        return hit >= 0 ? nearest(t, hit) : null
      }
      return null
    },
    tap: (e, at) => {
      const r = e.currentTarget.getBoundingClientRect()
      const tilt = (tokenNumber(e.currentTarget, '--hl-wheel-tilt') * Math.PI) / 180
      const radius = row.current / 2 / Math.tan(tilt / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      if (!tilt || !radius) return null
      return fit(Math.round(at + Math.asin(clamp(dy / radius, -1, 1)) / tilt))
    },
    // Only a focused column takes the wheel, and at an end it lets the page scroll on.
    wheel: (e, t, focused) => {
      if (!focused || !e.deltaY) return null
      const dir = Math.sign(e.deltaY)
      if (!loop && ((dir > 0 && t >= n - 1) || (dir < 0 && t <= 0))) return null
      return fit(t + wheel.current(e.deltaY * (e.deltaMode === 1 ? 40 : 1)))
    },
    onSettle: (to) => {
      rested.current = to
      onChange(wrap(to, n))
    },
    haptics,
  })

  useLayoutEffect(() => {
    row.current = tokenNumber(sc.ref.current, '--hl-hit-min')
  }, [sc.ref])

  // The list got shorter (31 days to 30): stay on the last row instead of jumping.
  const lastN = useRef(n)
  useEffect(() => {
    if (lastN.current === n) return
    const i = Math.min(wrap(Math.round(sc.target()), lastN.current), n - 1)
    lastN.current = n
    rested.current = i
    sc.place(i)
  }, [n, sc])

  const settled = wrap(Math.round(rested.current), n)
  const shown = wrap(Math.round(sc.at), n)
  const told = useRef(onShown)
  told.current = onShown
  useEffect(() => told.current(shown), [shown])

  const grip = pull(sc.at - Math.round(sc.at), 0.5)
  const rows: { k: number; d: number; i: number }[] = []
  for (let k = Math.floor(sc.at) - SPAN; k <= Math.ceil(sc.at) + SPAN; k++) {
    if (!loop && (k < 0 || k > n - 1)) continue
    rows.push({ k, d: k - sc.at, i: wrap(k, n) })
  }

  return (
    <div
      ref={sc.ref}
      className={styles.column}
      role="spinbutton"
      tabIndex={0}
      aria-label={column.label}
      aria-valuenow={settled}
      aria-valuetext={options[settled]}
      aria-valuemin={0}
      aria-valuemax={n - 1}
      data-wide={column.wide || undefined}
      data-moving={sc.moving || undefined}
      {...sc.handlers}
    >
      <span className={styles.band} style={{ ['--grip' as string]: grip.toFixed(3) }} aria-hidden />
      <div className={styles.drum} aria-hidden>
        {rows.map(({ k, d, i }) => (
          <span key={k} className={styles.row} data-strong={strong.has(i) || undefined} style={{ ['--d' as string]: d.toFixed(3), color: ink(pull(d, 1)) }}>
            {options[i]}
          </span>
        ))}
      </div>
    </div>
  )
}

export function PickerWheel({ label, columns, value: valueProp, defaultValue, onValueChange, onScrub, formatValue, detail, haptics = false, className, ...rest }: PickerWheelProps) {
  const labelId = useId()
  const detailId = useId()
  const [raw, setValue] = useControllable(valueProp, defaultValue ?? columns.map(() => 0), onValueChange)
  const value = columns.map((c, i) => clamp(raw[i] ?? 0, 0, c.options.length - 1))
  const latest = useRef(value)
  latest.current = value
  const [live, setLive] = useState(value)
  useOnChange(live, onScrub, live.join(','))

  return (
    <div className={cx(styles.root, className)} {...rest}>
      <div className={styles.head}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        {formatValue && <span className={styles.readout}>{formatValue(live)}</span>}
        {detail && (
          <span id={detailId} className={styles.detail}>
            {detail}
          </span>
        )}
      </div>
      <div className={styles.wheel} role="group" aria-labelledby={labelId} aria-describedby={detail ? detailId : undefined}>
        {columns.map((c, i) => (
          <Column
            key={i}
            column={c}
            index={value[i]}
            haptics={haptics}
            onChange={(row) => {
              if (latest.current[i] === row) return
              const next = latest.current.map((v, j) => (j === i ? row : v))
              latest.current = next
              setValue(next)
            }}
            onShown={(row) => setLive((l) => (l[i] === row ? l : l.map((v, j) => (j === i ? row : v))))}
          />
        ))}
      </div>
    </div>
  )
}

const pad = (v: number) => String(v).padStart(2, '0')

export type TimeWheelProps = Omit<PickerWheelProps, 'columns' | 'value' | 'defaultValue' | 'onValueChange' | 'onScrub' | 'formatValue'> & {
  /** The time as "HH:mm" in 24 hours, when you control it. */
  value?: string
  /** Starting time when you do not control it. */
  defaultValue?: string
  /** Called once the wheel comes to rest on a new time, as "HH:mm". */
  onValueChange?: (value: string) => void
  /** Called with the time in the band while the wheel still turns. */
  onScrub?: (value: string) => void
  /** 12 shows AM and PM; 24 shows hours 00 to 23. */
  hourCycle?: 12 | 24
  /** Minutes between two rows. */
  minuteStep?: number
  /** Minutes that pull harder. */
  strong?: number[]
}

/** PickerWheel set up for a time: hour, minute and, on a 12 hour clock, AM or PM. */
export function TimeWheel({ value: valueProp, defaultValue = '09:00', onValueChange, onScrub, hourCycle = 12, minuteStep = 1, strong = [0, 30], ...rest }: TimeWheelProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange)
  const twelve = hourCycle === 12
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep)
  const columns: PickerWheelColumn[] = [
    { label: 'Hour', options: twelve ? Array.from({ length: 12 }, (_, i) => String(i + 1)) : Array.from({ length: 24 }, (_, i) => pad(i)), loop: true },
    { label: 'Minute', options: minutes.map(pad), loop: true, strong: strong.map((m) => minutes.indexOf(m)).filter((i) => i >= 0) },
    ...(twelve ? [{ label: 'AM or PM', options: ['AM', 'PM'] }] : []),
  ]
  const toRows = (hhmm: string) => {
    const [h = 0, m = 0] = hhmm.split(':').map(Number)
    const mi = clamp(Math.round(m / minuteStep), 0, minutes.length - 1)
    return twelve ? [(h % 12 || 12) - 1, mi, h >= 12 ? 1 : 0] : [h, mi]
  }
  const toTime = (rows: number[]) => {
    const h = twelve ? ((rows[0] + 1) % 12) + (rows[2] ? 12 : 0) : rows[0]
    return `${pad(h)}:${pad(minutes[rows[1]])}`
  }
  const show = (rows: number[]) => (twelve ? `${rows[0] + 1}:${pad(minutes[rows[1]])} ${rows[2] ? 'PM' : 'AM'}` : `${pad(rows[0])}:${pad(minutes[rows[1]])}`)
  return <PickerWheel {...rest} columns={columns} value={toRows(value)} onValueChange={(rows) => setValue(toTime(rows))} onScrub={onScrub && ((rows) => onScrub(toTime(rows)))} formatValue={show} />
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const daysIn = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m: m - 1, d }
}
const today = () => {
  const t = new Date()
  return iso(t.getFullYear(), t.getMonth(), t.getDate())
}

export type DateWheelProps = Omit<PickerWheelProps, 'columns' | 'value' | 'defaultValue' | 'onValueChange' | 'onScrub' | 'formatValue'> & {
  /** The date as "YYYY-MM-DD", when you control it. */
  value?: string
  /** Starting date when you do not control it. Undefined starts today. */
  defaultValue?: string
  /** Called once the wheel comes to rest on a new date, as "YYYY-MM-DD". */
  onValueChange?: (value: string) => void
  /** Called with the date in the band while the wheel still turns. */
  onScrub?: (value: string) => void
  /** The first year on the wheel. Undefined is 100 years ago. */
  fromYear?: number
  /** The last year on the wheel. Undefined is 10 years from now. */
  toYear?: number
  /** Dates, as "YYYY-MM-DD", that pull harder. Undefined is today. */
  strong?: string[]
}

/** PickerWheel set up for a date: day, month and year, with each month's real length. */
export function DateWheel({ value: valueProp, defaultValue, onValueChange, onScrub, fromYear, toYear, strong, ...rest }: DateWheelProps) {
  const now = today()
  const [value, setValue] = useControllable(valueProp, defaultValue ?? now, onValueChange)
  const first = fromYear ?? parse(now).y - 100
  const last = toYear ?? parse(now).y + 10
  const years = Array.from({ length: Math.max(1, last - first + 1) }, (_, i) => first + i)
  const at = parse(value)
  const y = clamp(at.y, first, last)
  const count = daysIn(at.m, y)
  const marks = (strong ?? [now]).map(parse)
  const columns: PickerWheelColumn[] = [
    { label: 'Day', options: Array.from({ length: count }, (_, i) => String(i + 1)), loop: true, strong: marks.filter((s) => s.y === y && s.m === at.m).map((s) => s.d - 1) },
    { label: 'Month', options: MONTHS, loop: true, wide: true, strong: marks.filter((s) => s.y === y).map((s) => s.m) },
    { label: 'Year', options: years.map(String), strong: marks.map((s) => years.indexOf(s.y)).filter((i) => i >= 0) },
  ]
  const toDate = (rows: number[]) => {
    const yy = years[rows[2]]
    return iso(yy, rows[1], Math.min(rows[0] + 1, daysIn(rows[1], yy)))
  }
  const show = (rows: number[]) => {
    const p = parse(toDate(rows))
    return new Date(p.y, p.m, p.d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }
  return (
    <PickerWheel
      {...rest}
      columns={columns}
      value={[Math.min(at.d, count) - 1, at.m, years.indexOf(y)]}
      onValueChange={(rows) => setValue(toDate(rows))}
      onScrub={onScrub && ((rows) => onScrub(toDate(rows)))}
      formatValue={show}
    />
  )
}
