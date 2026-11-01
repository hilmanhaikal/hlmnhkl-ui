import { useId } from 'react'
import { cx } from '../../internal/cx'
import { CheckCircleIcon, ErrorIcon, WarningIcon } from '../../internal/icons'
import styles from './Meter.module.css'

export type MeterTone = 'good' | 'fair' | 'poor'

export type MeterLabels = Record<MeterTone, string>

export type MeterProps = {
  /** Says what is measured. Shown above the bar and read by screen readers. */
  label: string
  /** The measurement, from min to max. */
  value: number
  /** Lowest possible value. */
  min?: number
  /** Highest possible value. */
  max?: number
  /** Top of the low range, as in the HTML meter. Set low or high to turn the tones on. */
  low?: number
  /** Bottom of the high range, as in the HTML meter. */
  high?: number
  /** The best value. The range it falls in is good, the next is fair, the far one poor. Undefined is the middle. */
  optimum?: number
  /** Shown and spoken instead of the percentage, such as "72 GB of 100 GB". */
  valueText?: string
  /** Shows the value next to the label. */
  showValue?: boolean
  /** Hides the label visually but keeps it for screen readers. */
  hideLabel?: boolean
  /** Thickness of the bar. */
  size?: 'sm' | 'md'
  /** Words for each tone, shown with its icon and spoken with the value. Missing keys use the English defaults. */
  labels?: Partial<MeterLabels>
  /** Extra class for the root element. */
  className?: string
}

const defaultLabels: MeterLabels = { good: 'Good', fair: 'Fair', poor: 'Poor' }

const icons = { good: CheckCircleIcon, fair: WarningIcon, poor: ErrorIcon }

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi)

// The HTML meter's rule: how many ranges lie between the value and the optimum.
function toneOf(value: number, min: number, max: number, low?: number, high?: number, optimum?: number): MeterTone | undefined {
  if (low === undefined && high === undefined) return undefined
  const lo = clamp(low ?? min, min, max)
  const hi = clamp(high ?? max, lo, max)
  const range = (n: number) => (n < lo ? 0 : n > hi ? 2 : 1)
  const steps = Math.abs(range(value) - range(clamp(optimum ?? (min + max) / 2, min, max)))
  return steps === 0 ? 'good' : steps === 1 ? 'fair' : 'poor'
}

export function Meter({
  label,
  value,
  min = 0,
  max = 100,
  low,
  high,
  optimum,
  valueText,
  showValue = true,
  hideLabel,
  size = 'md',
  labels: labelsProp,
  className,
}: MeterProps) {
  const id = useId()
  const labels = { ...defaultLabels, ...labelsProp }
  const now = clamp(value, min, max)
  const span = max - min || 1
  const at = (n: number) => (clamp(n, min, max) - min) / span
  const tone = toneOf(now, min, max, low, high, optimum)
  const text = valueText ?? `${Math.round(at(now) * 100)}%`
  const Icon = tone && icons[tone]
  const marks = [low, high].filter((n): n is number => n !== undefined && n > min && n < max)
  return (
    <div className={cx(styles.root, className)} data-tone={tone}>
      <div className={styles.head}>
        <span id={id} className={cx(styles.label, hideLabel && styles.srOnly)}>{label}</span>
        <span className={styles.reading} aria-hidden="true">
          {showValue && <span className={styles.value}>{text}</span>}
          {Icon && (
            <span className={styles.tone}>
              <Icon className={styles.icon} />
              {labels[tone]}
            </span>
          )}
        </span>
      </div>
      <div
        role="meter"
        aria-labelledby={id}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={now}
        aria-valuetext={tone ? `${text}, ${labels[tone]}` : text}
        className={cx(styles.track, styles[size])}
      >
        <span className={styles.fill} style={{ transform: `scaleX(${at(now)})` }} />
        {marks.map((n) => (
          <span key={n} className={styles.mark} style={{ left: `${at(n) * 100}%` }} />
        ))}
      </div>
    </div>
  )
}
