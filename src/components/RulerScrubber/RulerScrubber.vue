<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue'
import { clamp, follow, pull, roundTo, wheelSteps } from '../../internal/feel'
import { morphCurve, motionMs } from '../../internal/motion'
import { measureRuler, rulerScale, rulerScrub, type RulerFit } from '../../internal/motion/ruler'
import { ink } from '../../internal/motion/scrubLook'
import Roll from '../../internal/Roll.vue'
import { useScrub } from '../../internal/vue/useScrub'
import styles from './RulerScrubber.module.css'

// The Vue RulerScrubber: the same look (RulerScrubber.module.css), drag, lean and landing as the React one.

const { defaultValue, min = 0, max = 100, step = 1, marks: marksProp, strong = [], strongLabel, formatValue = String, formatMark, detail, haptics = false } = defineProps<{
  /** Visible name of the ruler, also read by screen readers. */
  label: string
  /** Starting value when there is no v-model. Undefined starts at min. */
  defaultValue?: number
  /** Lowest value. */
  min?: number
  /** Highest value. */
  max?: number
  /** Size of one step: one tick on the ruler, and a mark it is drawn onto. */
  step?: number
  /** Values with a long, numbered tick. Page Up and Page Down jump between them. Defaults to every 10 steps. */
  marks?: number[]
  /** Values drawn stronger, such as a limit or the usual choice. */
  strong?: number[]
  /** A tag under each strong mark, such as "Allowance". */
  strongLabel?: string
  /** Turns the value into the readout and what screen readers hear. */
  formatValue?: (value: number) => string
  /** Turns a mark into the number under its tick. Defaults to formatValue. */
  formatMark?: (value: number) => string
  /** A line under the readout, such as what the value means. The detail slot replaces it. */
  detail?: string
  /** A short buzz on each tick while it moves, on phones that can (Android). */
  haptics?: boolean
}>()
const emit = defineEmits<{ /** The value the ruler came to rest on, once it rests. */ valueCommit: [value: number] }>()
const slots = useSlots()

/** The value under the needle, set on each new one while the ruler moves. Use v-model, or leave it out and the ruler keeps its own value. */
const model = defineModel<number>()
const local = ref(defaultValue ?? min)
const raw = computed({
  get: () => model.value ?? local.value,
  set: (next: number) => {
    local.value = next
    model.value = next
  },
})

const labelId = useId()
const detailId = useId()
const scale = computed(() => ({ min, max, step, marks: marksProp }))
const ruler = computed(() => rulerScale(scale.value))
const value = computed(() => clamp(raw.value, min, ruler.value.top))
const strongSet = computed(() => new Set(strong.map((v) => roundTo(v, step, min))))
const markText = (v: number) => (formatMark ?? formatValue)(v)
// The px between two ticks (a token) and how many ticks fit either side of the needle.
const fit = ref<RulerFit>({ gap: 0, span: 24, width: 0, tag: 0 })
const tagEl = ref<HTMLElement | null>(null)
const wheel = wheelSteps()

// The drag, keys, tap and wheel (motion/ruler.ts) on the shared scrubber.
const sc = useScrub(() => ({ value: value.value, ...rulerScrub(scale.value, fit.value, wheel), onMark: (v: number) => (raw.value = v), onSettle: (v: number) => emit('valueCommit', v), haptics }))
const scrubEl = sc.el

const measure = () => scrubEl.value && (fit.value = measureRuler(scrubEl.value, tagEl.value))
let ro: ResizeObserver | null = null
onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  if (scrubEl.value) ro.observe(scrubEl.value)
})
watch(() => strongLabel, measure, { flush: 'post' })

// The ticks lean and grow only while the ruler moves. The lean eases in as it starts and settles flat as it stops.
const lean = ref(0)
const leaning = follow({ time: () => motionMs('morph-out'), curve: morphCurve(), onFrame: (v) => (lean.value = v) })
watch(sc.moving, (m) => leaning.set(m && motionMs('morph-out') > 0 ? 1 : 0))
onBeforeUnmount(() => {
  ro?.disconnect()
  leaning.stop()
})

const shown = computed(() => ruler.value.land(sc.at.value))
const hasDetail = computed(() => !!(detail || slots.detail))

const marks = computed(() => {
  const at = sc.at.value
  return ruler.value.all.flatMap((v, i) => {
    const d = (v - at) / step
    if (Math.abs(d) > fit.value.span) return []
    const on = pull(d, 1)
    const near = pull(d, 5)
    const tilt = -Math.sign(d) * 14 * Math.sin(Math.PI * Math.min(1, Math.abs(d) / 6)) * (1 - on)
    const tier = ruler.value.labelled.has(v) ? 'major' : i % 2 === 0 ? 'mid' : 'minor'
    return [
      {
        v,
        tier,
        place: `translateX(calc(${d.toFixed(3)} * var(--gooee-ruler-scrubber-tick-gap)))`,
        tick: {
          background: ink(on, tier === 'major' ? 'var(--gooee-color-fg-muted)' : 'var(--gooee-color-border-strong)', 'var(--gooee-color-accent)'),
          transform: lean.value > 0 ? `rotate(${(tilt * lean.value).toFixed(2)}deg) scaleY(${(1 + near * 0.9 * lean.value).toFixed(3)})` : undefined,
        },
        num: ink(pull(d, 2)),
      },
    ]
  })
})

const tags = computed(() => {
  const { gap, width, tag } = fit.value
  const room = (width - tag) / 2
  return [...strongSet.value].flatMap((v) => {
    const x = ((v - sc.at.value) / step) * gap
    if (!gap || Math.abs(x) > width / 2) return []
    return [{ v, x: clamp(x, -room, room).toFixed(1) }]
  })
})
</script>

<template>
  <div :class="styles.root" data-slot="ruler-scrubber">
    <div :class="styles.head">
      <span :id="labelId" :class="styles.label" data-slot="field-label">{{ label }}</span>
      <Roll :text="formatValue(shown)" :class="styles.readout" />
      <span v-if="hasDetail" :id="detailId" :class="styles.detail" data-slot="ruler-scrubber-detail"><slot name="detail">{{ detail }}</slot></span>
    </div>
    <div
      ref="scrubEl"
      :class="styles.track"
      data-slot="ruler-scrubber-track"
      role="slider"
      tabindex="0"
      :aria-labelledby="labelId"
      :aria-describedby="hasDetail ? detailId : undefined"
      :aria-valuemin="min"
      :aria-valuemax="ruler.top"
      :aria-valuenow="value"
      :aria-valuetext="formatValue(value)"
      :data-moving="sc.moving.value || undefined"
      :data-leaning="lean > 0 || undefined"
      v-on="sc.handlers"
    >
      <span :class="styles.needle" data-slot="ruler-scrubber-needle" aria-hidden="true" />
      <div :class="styles.clip" aria-hidden="true">
        <span v-for="m in marks" :key="m.v" :class="styles.mark" :style="{ transform: m.place }">
          <i :class="styles.tick" data-slot="ruler-scrubber-tick" :data-tier="m.tier" :style="m.tick" />
          <span v-if="m.tier === 'major'" :class="styles.num" data-slot="ruler-scrubber-number" :style="{ color: m.num }">{{ markText(m.v) }}</span>
        </span>
      </div>
      <div v-if="strongLabel" :class="styles.tags" aria-hidden="true">
        <!-- Measured once, so a tag near an end can stay whole inside the ruler. -->
        <span ref="tagEl" :class="styles.tag" data-slot="ruler-scrubber-tag" data-measure="true">{{ strongLabel }}</span>
        <span v-for="t in tags" :key="t.v" :class="styles.tag" data-slot="ruler-scrubber-tag" :style="{ transform: `translateX(calc(${t.x}px - 50%))` }">{{ strongLabel }}</span>
      </div>
    </div>
  </div>
</template>
