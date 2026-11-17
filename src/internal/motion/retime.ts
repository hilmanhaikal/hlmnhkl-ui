// Retime's speed, shared by the React and Vue parts: one CSS scale for every duration token, saved on the
// device and told to every other Retime control on the page.

export type RetimeSpeed = 'off' | 'slower' | 'normal' | 'faster'

export type RetimeLabels = Record<RetimeSpeed, string>

export const defaultRetimeLabels: RetimeLabels = { off: 'Off', slower: 'Slower', normal: 'Normal', faster: 'Faster' }

export const retimeSpeeds = ['off', 'slower', 'normal', 'faster'] as const

// How long motion takes compared with normal. Off is 0, so nothing moves at all.
const SCALE: Record<RetimeSpeed, number> = { off: 0, slower: 1.5, normal: 1, faster: 0.6 }

const STORAGE_KEY = 'gooee-motion-speed'
export const RETIME_EVENT = 'gooee-retime'

/** Retimes every animation in the library at once. Reduced motion in the system still wins. */
export function applyRetime(speed: RetimeSpeed) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--gooee-motion-scale', String(SCALE[speed]))
  // Other Retime controls on the page (a header and a menu, say) follow the same choice.
  window.dispatchEvent(new CustomEvent<RetimeSpeed>(RETIME_EVENT, { detail: speed }))
}

export function savedSpeed(): RetimeSpeed | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v && v in SCALE ? (v as RetimeSpeed) : null
  } catch {
    return null
  }
}

/** Applies the speed unless the page already has it, and saves it when asked. */
export function commitSpeed(speed: RetimeSpeed, remember: boolean) {
  if (document.documentElement.style.getPropertyValue('--gooee-motion-scale') === String(SCALE[speed])) return
  applyRetime(speed)
  if (!remember) return
  try {
    localStorage.setItem(STORAGE_KEY, speed)
  } catch {
    // Not saved; the speed still holds for this visit.
  }
}
