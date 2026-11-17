import { computed, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { motionMs, type MotionToken } from '../motion'

/** Vue's usePresence: stays mounted through the exit motion after `open` turns false. */
export function usePresence(open: MaybeRefOrGetter<boolean>, exit: MotionToken = 'base') {
  const kept = ref(toValue(open))
  let timer = 0
  watch(
    () => toValue(open),
    (now) => {
      clearTimeout(timer)
      if (now) kept.value = true
      else timer = window.setTimeout(() => (kept.value = false), motionMs(exit))
    },
  )
  onBeforeUnmount(() => clearTimeout(timer))
  return {
    mounted: computed(() => toValue(open) || kept.value),
    state: computed(() => (toValue(open) ? ('open' as const) : ('closed' as const))),
  }
}
