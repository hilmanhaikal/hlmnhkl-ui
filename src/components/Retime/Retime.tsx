'use client'

import { useEffect, useRef } from 'react'
import { useControllable } from '../../internal/useControllable'
import { SegmentedControl } from '../SegmentedControl'

export type RetimeSpeed = 'off' | 'slower' | 'normal' | 'faster'

export type RetimeLabels = Record<RetimeSpeed, string>

const defaultLabels: RetimeLabels = { off: 'Off', slower: 'Slower', normal: 'Normal', faster: 'Faster' }

// How long motion takes compared with normal. Off is 0, so nothing moves at all.
const SCALE: Record<RetimeSpeed, number> = { off: 0, slower: 1.5, normal: 1, faster: 0.6 }

const STORAGE_KEY = 'hl-motion-speed'
const CHANGE_EVENT = 'hl-retime'

/** Retimes every animation in the library at once. Reduced motion in the system still wins. */
export function applyRetime(speed: RetimeSpeed) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--hl-motion-scale', String(SCALE[speed]))
  // Other Retime controls on the page (a header and a menu, say) follow the same choice.
  window.dispatchEvent(new CustomEvent<RetimeSpeed>(CHANGE_EVENT, { detail: speed }))
}

function savedSpeed(): RetimeSpeed | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v && v in SCALE ? (v as RetimeSpeed) : null
  } catch {
    return null
  }
}

export type RetimeProps = {
  /** Visible label. */
  label?: string
  /** The chosen speed, when you control it. */
  value?: RetimeSpeed
  /** Starting speed when you do not control it. A speed saved on this device wins over it. */
  defaultValue?: RetimeSpeed
  /** Called with the new speed. */
  onValueChange?: (speed: RetimeSpeed) => void
  /** Saves the choice on this device, so it lasts across visits. */
  remember?: boolean
  /** Height of the control. */
  size?: 'sm' | 'md'
  /** Text for each speed, so you can translate it. */
  labels?: Partial<RetimeLabels>
  /** Fills the row, with the speeds sharing it evenly, as in a settings panel. */
  fullWidth?: boolean
  /** Extra class for the root element. */
  className?: string
}

export function Retime({
  label = 'Motion',
  value,
  defaultValue = 'normal',
  onValueChange,
  remember = true,
  size = 'md',
  labels: labelsProp,
  fullWidth,
  className,
}: RetimeProps) {
  const labels = { ...defaultLabels, ...labelsProp }
  const [speed, setSpeed] = useControllable(value, defaultValue, onValueChange)

  // A speed saved on an earlier visit comes back after the first render, so server and client agree.
  // Until it lands, the default must not be applied or saved over it.
  const pending = useRef<RetimeSpeed | null>(null)
  useEffect(() => {
    if (!remember || value !== undefined) return
    const saved = savedSpeed()
    if (saved && saved !== speed) {
      pending.current = saved
      setSpeed(saved)
    }
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (value !== undefined) return
    const follow = (e: Event) => setSpeed((e as CustomEvent<RetimeSpeed>).detail)
    window.addEventListener(CHANGE_EVENT, follow)
    return () => window.removeEventListener(CHANGE_EVENT, follow)
  }, [value, setSpeed])

  useEffect(() => {
    if (pending.current && pending.current !== speed) return
    pending.current = null
    if (document.documentElement.style.getPropertyValue('--hl-motion-scale') === String(SCALE[speed])) return
    applyRetime(speed)
    if (!remember) return
    try {
      localStorage.setItem(STORAGE_KEY, speed)
    } catch {
      // Not saved; the speed still holds for this visit.
    }
  }, [speed, remember])

  return (
    <SegmentedControl
      label={label}
      size={size}
      value={speed}
      onValueChange={(v) => setSpeed(v as RetimeSpeed)}
      options={(['off', 'slower', 'normal', 'faster'] as const).map((s) => ({ value: s, label: labels[s] }))}
      fullWidth={fullWidth}
      className={className}
    />
  )
}
