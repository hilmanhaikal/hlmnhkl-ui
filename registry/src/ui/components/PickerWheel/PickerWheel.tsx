// Gooee UI, MIT licence. https://gooee.dev
'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { clamp, pull, wheelSteps, wrap } from '../../internal/feel'
import { columnScrub, columnState, dateWheel, drumRows, localeHourCycle, timeWheel, today, type ColumnState, type WheelColumn } from '../../internal/motion/pickerWheel'
import { useControllable } from '../../internal/useControllable'
import { ink, tokenNumber, useScrub } from '../../internal/useScrub'
import styles from './PickerWheel.module.css'

export type PickerWheelColumn = WheelColumn

export type PickerWheelProps = Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange' | 'children'> & {
  /** Visible name of the whole wheel, read by screen readers as the group's name. */
  label: string
  /** The columns, left to right. */
  columns: PickerWheelColumn[]
  /** The chosen row of each column, by index, when you control it. */
  value?: number[]
  /** Starting rows when you do not control them. Undefined starts on the first row of each. */
  defaultValue?: number[]
  /** Called with every column's row each time a new row comes into the band, while the wheel still turns. */
  onValueChange?: (value: number[]) => void
  /** Called once a column comes to rest on a new row, with every column's row. */
  onValueCommit?: (value: number[]) => void
  /** Turns the rows into a large readout above the wheel. No readout when left out. */
  formatValue?: (value: number[]) => string
  /** A line under the label and readout, such as what the choice means. */
  detail?: ReactNode
  /** A short buzz on each row while it turns, on phones that can (Android). */
  haptics?: boolean
}

type ColumnProps = {
  column: PickerWheelColumn
  index: number
  onCommit: (index: number) => void
  onShown: (index: number) => void
  haptics: boolean
}

/** One column: its rows are the marks. A drag follows the hand; a let-go lands on a row. */
function Column({ column, index, onCommit, onShown, haptics }: ColumnProps) {
  const { options, loop = false } = column
  const n = options.length
  const strong = new Set(column.strong ?? [])
  const state = useRef<ColumnState>(null)
  state.current ??= columnState(index)
  const st = state.current
  const wheel = useRef(wheelSteps())

  // The keys, tap and wheel of one column (motion/pickerWheel.ts) on the shared scrubber.
  const sc = useScrub({
    ...columnScrub(column, index, st, wheel.current),
    onSettle: (to, from) => {
      st.rested = to
      // A loop turned all the way round rests on the row it left: no news.
      if (wrap(to, n) !== wrap(Math.round(from), n)) onCommit(wrap(to, n))
    },
    haptics,
  })

  useLayoutEffect(() => {
    st.row = tokenNumber(sc.ref.current, '--gooee-hit-min')
  }, [sc.ref])

  // The list got shorter (31 days to 30): stay on the last row instead of jumping.
  const lastN = useRef(n)
  useEffect(() => {
    if (lastN.current === n) return
    const i = Math.min(wrap(Math.round(sc.target()), lastN.current), n - 1)
    lastN.current = n
    st.rested = i
    sc.place(i)
  }, [n, sc])

  const settled = wrap(Math.round(st.rested), n)
  const shown = wrap(Math.round(sc.at), n)
  const told = useRef(onShown)
  told.current = onShown
  useEffect(() => told.current(shown), [shown])

  const grip = pull(sc.at - Math.round(sc.at), 0.5)
  const rows = drumRows(sc.at, n, loop)

  return (
    <div
      ref={sc.ref}
      className={styles.column}
      data-slot="picker-wheel-column"
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
      <span className={styles.band} data-slot="picker-wheel-band" style={{ ['--grip' as string]: grip.toFixed(3) }} aria-hidden />
      <div className={styles.drum} aria-hidden>
        {rows.map(({ k, d, i }) => (
          <span key={k} className={styles.row} data-slot="picker-wheel-row" data-strong={strong.has(i) || undefined} style={{ ['--d' as string]: d.toFixed(3), color: ink(pull(d, 1)) }}>
            {options[i]}
          </span>
        ))}
      </div>
    </div>
  )
}

export function PickerWheel({ label, columns, value: valueProp, defaultValue, onValueChange, onValueCommit, formatValue, detail, haptics = false, className, ...rest }: PickerWheelProps) {
  const labelId = useId()
  const detailId = useId()
  const [raw, setValue] = useControllable(valueProp, defaultValue ?? columns.map(() => 0), onValueChange)
  const value = columns.map((c, i) => clamp(raw[i] ?? 0, 0, c.options.length - 1))
  const [live, setLive] = useState(value)
  const liveRef = useRef(value)
  // The rows last told, so a row comes once whether it came while moving or at rest.
  const told = useRef(value.join(','))
  const tell = (rows: number[]) => {
    if (rows.join(',') === told.current) return
    told.current = rows.join(',')
    setValue(rows)
  }
  const tellRef = useRef(tell)
  tellRef.current = tell
  useEffect(() => tellRef.current(live), [live])

  return (
    <div className={cx(styles.root, className)} data-slot="picker-wheel" {...rest}>
      <div className={styles.head}>
        <span id={labelId} className={styles.label} data-slot="field-label">
          {label}
        </span>
        {formatValue && <span className={styles.readout} data-slot="picker-wheel-value">{formatValue(live)}</span>}
        {detail && (
          <span id={detailId} className={styles.detail} data-slot="picker-wheel-detail">
            {detail}
          </span>
        )}
      </div>
      <div className={styles.wheel} data-slot="picker-wheel-columns" role="group" aria-labelledby={labelId} aria-describedby={detail ? detailId : undefined}>
        {columns.map((c, i) => (
          <Column
            key={i}
            column={c}
            index={value[i]}
            haptics={haptics}
            onCommit={(row) => {
              const next = liveRef.current.map((v, j) => (j === i ? row : v))
              liveRef.current = next
              tell(next)
              onValueCommit?.(next)
            }}
            onShown={(row) => {
              if (liveRef.current[i] === row) return
              liveRef.current = liveRef.current.map((v, j) => (j === i ? row : v))
              setLive(liveRef.current)
            }}
          />
        ))}
      </div>
    </div>
  )
}

export type TimeWheelProps = Omit<PickerWheelProps, 'columns' | 'value' | 'defaultValue' | 'onValueChange' | 'onValueCommit' | 'formatValue'> & {
  /** The time as "HH:mm" in 24 hours, when you control it. */
  value?: string
  /** Starting time when you do not control it. */
  defaultValue?: string
  /** Called with the time in the band, as "HH:mm", each time it changes while the wheel still turns. */
  onValueChange?: (value: string) => void
  /** Called once the wheel comes to rest on a new time, as "HH:mm". */
  onValueCommit?: (value: string) => void
  /** 12 shows AM and PM; 24 shows hours 00 to 23. Defaults to what the browser's locale uses. */
  hourCycle?: 12 | 24
  /** Minutes between two rows, such as 5 or 15. */
  step?: number
  /** Minutes drawn stronger. Page Up and Page Down jump between them. */
  strong?: number[]
}

/** PickerWheel set up for a time: hour, minute and, on a 12 hour clock, AM or PM. */
export function TimeWheel({ value: valueProp, defaultValue = '09:00', onValueChange, onValueCommit, hourCycle, step = 1, strong = [0, 30], ...rest }: TimeWheelProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue, onValueChange)
  const { columns, toRows, toTime, show } = timeWheel(hourCycle ?? localeHourCycle(), step, strong)
  return <PickerWheel {...rest} columns={columns} value={toRows(value)} onValueChange={(rows) => setValue(toTime(rows))} onValueCommit={onValueCommit && ((rows) => onValueCommit(toTime(rows)))} formatValue={show} />
}

export type DateWheelProps = Omit<PickerWheelProps, 'columns' | 'value' | 'defaultValue' | 'onValueChange' | 'onValueCommit' | 'formatValue'> & {
  /** The date as "YYYY-MM-DD", when you control it. */
  value?: string
  /** Starting date when you do not control it. Undefined starts today. */
  defaultValue?: string
  /** Called with the date in the band, as "YYYY-MM-DD", each time it changes while the wheel still turns. */
  onValueChange?: (value: string) => void
  /** Called once the wheel comes to rest on a new date, as "YYYY-MM-DD". */
  onValueCommit?: (value: string) => void
  /** The first year on the wheel. Undefined is 100 years ago. */
  fromYear?: number
  /** The last year on the wheel. Undefined is 10 years from now. */
  toYear?: number
  /** Dates, as "YYYY-MM-DD", drawn stronger. Undefined is today. */
  strong?: string[]
}

/** PickerWheel set up for a date: day, month and year, with each month's real length. */
export function DateWheel({ value: valueProp, defaultValue, onValueChange, onValueCommit, fromYear, toYear, strong, ...rest }: DateWheelProps) {
  const now = today()
  const [value, setValue] = useControllable(valueProp, defaultValue ?? now, onValueChange)
  // The days follow the month the wheel rests on, not each month that turns past (31 stays 31 on the way
  // through February). A date from outside, not one this wheel told, is a new rest.
  const told = useRef(value)
  const [rested, setRested] = useState(value)
  if (value !== told.current && value !== rested) setRested(value)
  const { columns, rows, toDate, show } = dateWheel(rested, now, fromYear, toYear, strong)
  return (
    <PickerWheel
      {...rest}
      columns={columns}
      value={rows}
      onValueChange={(rows) => {
        told.current = toDate(rows)
        setValue(told.current)
      }}
      onValueCommit={(rows) => {
        told.current = toDate(rows)
        setRested(told.current)
        onValueCommit?.(told.current)
      }}
      formatValue={show}
    />
  )
}
