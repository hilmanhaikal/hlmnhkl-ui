import { useEffect, useState } from 'react'
import { motionMs, type MotionToken } from './motion'

export function usePresence(open: boolean, exit: MotionToken = 'base') {
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    const t = window.setTimeout(() => setMounted(false), motionMs(exit))
    return () => window.clearTimeout(t)
  }, [open, exit])
  return { mounted: open || mounted, state: open ? ('open' as const) : ('closed' as const) }
}
