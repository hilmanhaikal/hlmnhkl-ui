'use client'

import { useEffect, useRef } from 'react'
import { useControllable } from '../../internal/useControllable'
import { SegmentedControl } from '../SegmentedControl'
import { applyRetime, commitSpeed, defaultRetimeLabels, RETIME_EVENT, retimeSpeeds, savedSpeed, type RetimeLabels, type RetimeSpeed } from '../../internal/motion/retime'

export { applyRetime, type RetimeLabels, type RetimeSpeed }

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
  const labels = { ...defaultRetimeLabels, ...labelsProp }
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
    window.addEventListener(RETIME_EVENT, follow)
    return () => window.removeEventListener(RETIME_EVENT, follow)
  }, [value, setSpeed])

  useEffect(() => {
    if (pending.current && pending.current !== speed) return
    pending.current = null
    commitSpeed(speed, remember)
  }, [speed, remember])

  return (
    <SegmentedControl
      label={label}
      size={size}
      value={speed}
      onValueChange={(v) => setSpeed(v as RetimeSpeed)}
      options={retimeSpeeds.map((s) => ({ value: s, label: labels[s] }))}
      fullWidth={fullWidth}
      className={className}
    />
  )
}
