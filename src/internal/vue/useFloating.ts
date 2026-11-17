import { computed, onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { floatingStyle, follow, place, type FloatingOptions, type Place } from '../motion/floating'

/** Vue's useFloating: places `floating` by `anchor` while `open` (motion/floating.ts). */
export function useFloating(anchor: Ref<HTMLElement | null>, floating: Ref<HTMLElement | null>, open: MaybeRefOrGetter<boolean>, options: MaybeRefOrGetter<FloatingOptions> = {}) {
  const pos = ref<Place | null>(null)
  // Measured since this open began.
  const fresh = ref(false)
  const update = () => {
    const at = place(anchor.value, floating.value, toValue(options))
    if (!at) return
    pos.value = at
    fresh.value = true
  }
  let stop = () => {}
  watch(
    [() => toValue(open), anchor, floating],
    ([isOpen]) => {
      stop()
      stop = () => {}
      // Closed: the next open is not ready until it is measured again. The place stays, so nothing flashes.
      if (!isOpen) {
        fresh.value = false
        return
      }
      if (typeof window !== 'undefined') stop = follow(anchor.value, floating.value, update)
    },
    { immediate: true, flush: 'post' },
  )
  onBeforeUnmount(() => stop())
  return {
    // Vue adds no unit to a bare number, so the place goes in as px.
    style: computed(() => Object.fromEntries(Object.entries(floatingStyle(pos.value)).map(([k, v]) => [k, typeof v === 'number' && k !== 'opacity' ? `${v}px` : v]))),
    side: computed(() => pos.value?.side ?? toValue(options).side ?? 'bottom'),
    ready: computed(() => pos.value !== null && fresh.value),
    update,
  }
}
