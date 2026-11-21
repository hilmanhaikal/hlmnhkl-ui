import { onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { createScrubber, type ScrubberOptions } from '../motion/scrubber'

// Vue's hold on createScrubber (motion/scrubber.ts) for Dial, RulerScrubber and PickerWheel, like useScrub.ts.

export type UseScrubOptions = Omit<ScrubberOptions<PointerEvent>, 'onFrame' | 'onMoving'>

/** `options` is read again whenever what it reads changes, as React reads them on each render. */
export function useScrub(options: () => UseScrubOptions) {
  const at = ref(options().value)
  const moving = ref(false)
  const el = ref<HTMLElement | null>(null)
  const full = () => ({ ...options(), onFrame: (v: number) => (at.value = v), onMoving: (m: boolean) => (moving.value = m) })
  const s = createScrubber<PointerEvent>(full())
  watchEffect(() => s.update(full()))

  // A value set from outside (a v-model, a reset) glides there. So does one the parent kept or changed
  // when it came to rest.
  watch([() => options().value, moving], () => s.sync(options().value), { flush: 'post' })

  onMounted(() => {
    if (el.value && options().wheel) s.listenWheel(el.value)
  })
  onBeforeUnmount(() => s.destroy())

  return {
    el,
    /** Where it is drawn now. */
    at,
    moving,
    go: s.go,
    place: s.place,
    target: s.target,
    handlers: { pointerdown: s.down, pointermove: s.move, pointerup: s.up, pointercancel: s.up, keydown: (e: KeyboardEvent) => s.keyDown(e) },
  }
}
