<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useSlots, watch } from 'vue'
import { clamp, pull, roundTo, wheelSteps } from '../../internal/feel'
import { arcTouch, CX, CY, DOT, dialScale, dialScrub, H, KNOB, polar, SWEEP, W, type Rim } from '../../internal/motion/dial'
import { ink, tokenNumber } from '../../internal/motion/scrubLook'
import Roll from '../../internal/Roll.vue'
import { useScrub } from '../../internal/vue/useScrub'
import styles from './Dial.module.css'

// The Vue Dial: the same look (Dial.module.css), turn and landing as the React one.

const { defaultValue, min = 0, max = 100, step = 1, marks, strong = [], variant = 'printed', formatValue = String, formatMark, detail, resetValue, haptics = false } = defineProps<{
  /** Visible name of the dial, also read by screen readers. */
  label: string
  /** Starting value when there is no v-model. Undefined starts at min. */
  defaultValue?: number
  /** Lowest value. */
  min?: number
  /** Highest value. */
  max?: number
  /** Size of one step. Every step is a mark the dial is drawn onto. */
  step?: number
  /** Values with a printed label. Page Up and Page Down jump between them. Defaults to min and max. */
  marks?: number[]
  /** Values drawn stronger, such as the usual setting. */
  strong?: number[]
  /** "printed": the scale is printed on the knob and turns under a fixed index. "mercury": a solid knob with a few named levels. "arc": the rim of a large dial, swiped sideways. */
  variant?: 'printed' | 'mercury' | 'arc'
  /** Turns the value into the readout and what screen readers hear. */
  formatValue?: (value: number) => string
  /** Turns a mark into its printed label. Defaults to formatValue. */
  formatMark?: (value: number) => string
  /** A line under the readout, such as what the value means. The detail slot replaces it. */
  detail?: string
  /** A double click goes back to this value. */
  resetValue?: number
  /** A short buzz on each step while it turns, on phones that can (Android). */
  haptics?: boolean
}>()
const emit = defineEmits<{ /** The value the dial came to rest on, once it rests. */ valueCommit: [value: number] }>()
const slots = useSlots()

/** The value under the index, set on each new one while the dial turns. Use v-model, or leave it out and the dial keeps its own value. */
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
const goo = useId().replace(/:/g, '')
const scale = computed(() => ({ min, max, step, marks, variant }))
const dial = computed(() => dialScale(scale.value))
const value = computed(() => clamp(raw.value, min, dial.value.top))
const strongSet = computed(() => new Set(strong.map((v) => roundTo(v, step, min))))
const markText = (v: number) => (formatMark ?? formatValue)(v)
// The arc's rim: its radius and the length of one step along it, both tokens.
const rim = ref<Rim | null>(null)
const wheel = wheelSteps()

// The drag, keys, tap and wheel (motion/dial.ts) on the shared scrubber.
const sc = useScrub(() => ({ value: value.value, ...dialScrub(scale.value, rim.value, wheel), onMark: (v: number) => (raw.value = v), onSettle: (v: number) => emit('valueCommit', v), haptics }))
const scrubEl = sc.el

// The arc takes only sideways touches, so the page still scrolls under a finger on it (motion/dial.ts).
let stopTouch = () => {}
const measureRim = () => {
  stopTouch()
  stopTouch = () => {}
  if (variant !== 'arc' || !scrubEl.value) return
  rim.value = { r: tokenNumber(scrubEl.value, '--gooee-dial-arc-radius'), gap: tokenNumber(scrubEl.value, '--gooee-dial-arc-gap') }
  stopTouch = arcTouch(scrubEl.value)
}
onMounted(measureRim)
watch(() => variant, measureRim, { flush: 'post' })
onBeforeUnmount(() => stopTouch())

const shown = computed(() => dial.value.land(sc.at.value))

const hasDetail = computed(() => !!(detail || slots.detail))
const index = computed(() => dial.value.all.indexOf(value.value))
const sliderAttrs = computed(() => ({
  role: 'slider',
  tabindex: 0,
  'aria-labelledby': labelId,
  'aria-describedby': hasDetail.value ? detailId : undefined,
  'aria-valuemin': min,
  'aria-valuemax': dial.value.top,
  'aria-valuenow': value.value,
  'aria-valuetext': variant === 'mercury' && index.value >= 0 ? `${formatValue(value.value)}, ${index.value + 1} of ${dial.value.all.length}` : formatValue(value.value),
  'data-slot': 'dial-control',
  'data-moving': sc.moving.value || undefined,
}))
const onDblclick = () => resetValue !== undefined && sc.go(dial.value.land(resetValue))

// Mercury: the bump on the knob and each level's dot and drop.
const mercury = computed(() => {
  const { all, stepDeg } = dial.value
  const at = sc.at.value
  const [bx, by] = polar(-135 + ((at - min) / step) * stepDeg, KNOB)
  const levels = all.map((v, i) => {
    const a = -135 + i * stepDeg
    const [x, y] = polar(a, DOT)
    const [lx, ly] = polar(a, DOT + 22)
    const p = pull(at - v, step)
    const [dx, dy] = polar(a, DOT - 12 * p)
    return { v, x, y, lx, ly, anchor: Math.abs(a) < 1 ? 'middle' : a < 0 ? 'end' : 'start', on: v === shown.value, dx, dy, dr: p * 9 }
  })
  return { bx, by, levels }
})

// Arc: the marks near the index, each leaning in by its pull.
const arcMarks = computed(() => {
  const r = rim.value
  const degPerStep = r && r.r ? (r.gap / r.r) * (180 / Math.PI) : 0
  if (degPerStep <= 0) return []
  const at = sc.at.value
  return dial.value.all.flatMap((v, i) => {
    const a = ((v - at) / step) * degPerStep
    if (Math.abs(a) > 22) return []
    const p = pull(at - v, step * 1.2)
    const tier = dial.value.labelled.includes(v) ? 'major' : i % 2 === 0 ? 'mid' : 'minor'
    return [{ v, a, p, tier }]
  })
})

// Printed: the face turns under the index.
const printed = computed(() => {
  const { all, labelled, top } = dial.value
  const turned = ((sc.at.value - min) / (max - min || 1)) * SWEEP
  // The face prints min, the middle and max unless marks say otherwise; the keys still jump by marks.
  const nums = marks ? labelled : [...new Set([min, roundTo((min + max) / 2, step, min), top])]
  // A longer tick every ten steps on a long scale, so the amount can be counted at a glance.
  const tenth = all.length > 20 ? step * 10 : 0
  const isMajor = (v: number) => nums.includes(v) || (tenth > 0 && Math.abs((v - min) / tenth - Math.round((v - min) / tenth)) < 1e-6)
  // Every step gets a tick while they fit round the knob (thinner past 49); past that only the long ones.
  const dense = all.length > 49
  const ticks = (all.length <= 121 ? all : all.filter((v) => isMajor(v) || strongSet.value.has(v))).map((v) => {
    const at = (-(v - min) / (max - min || 1)) * SWEEP
    const major = isMajor(v)
    return { v, at, p: pull(sc.at.value - v, step), major, fine: dense && !major, num: nums.includes(v) }
  })
  return { turned, ticks }
})
</script>

<template>
  <div data-slot="dial" :class="[styles.root, styles[variant]]">
    <div :class="styles.head">
      <span :id="labelId" data-slot="dial-label" :class="styles.label">{{ label }}</span>
      <Roll :text="formatValue(shown)" :class="styles.readout" :still="sc.moving.value" />
      <span v-if="hasDetail" :id="detailId" data-slot="dial-detail" :class="styles.detail"><slot name="detail">{{ detail }}</slot></span>
    </div>
    <div v-if="variant === 'mercury'" ref="scrubEl" :class="styles.mercuryHit" v-bind="sliderAttrs" v-on="sc.handlers" @dblclick="onDblclick">
      <svg :viewBox="`0 0 ${W} ${H}`" :class="styles.mercurySvg" aria-hidden="true">
        <defs>
          <filter :id="goo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
        <g v-for="l in mercury.levels" :key="l.v">
          <circle :cx="l.x" :cy="l.y" :r="3.5" data-slot="dial-tick" :class="styles.dot" :data-selected="l.on || undefined" />
          <text :x="l.lx" :y="l.ly" :text-anchor="l.anchor" dominant-baseline="middle" data-slot="dial-mark" :class="styles.level" :data-selected="l.on || undefined">{{ markText(l.v) }}</text>
        </g>
        <g :filter="`url(#${goo})`" :class="styles.metal">
          <circle :cx="CX" :cy="CY" :r="KNOB" />
          <circle :cx="mercury.bx" :cy="mercury.by" :r="10" />
          <circle v-for="l in mercury.levels" :key="l.v" :cx="l.dx" :cy="l.dy" :r="l.dr" />
        </g>
        <circle :cx="CX" :cy="CY" :r="KNOB - 14" :class="styles.groove" />
      </svg>
    </div>
    <div v-else-if="variant === 'arc'" ref="scrubEl" :class="styles.arcStage" v-bind="sliderAttrs" v-on="sc.handlers" @dblclick="onDblclick">
      <span :class="styles.arcIndex" aria-hidden="true" />
      <div :class="styles.arcClip" aria-hidden="true">
        <div :class="styles.hub">
          <span :class="styles.disc" />
          <span v-for="m in arcMarks" :key="m.v" :class="styles.arcMark" :style="{ transform: `rotate(${m.a}deg) translateY(calc(var(--gooee-dial-arc-radius) * -1))` }">
            <i data-slot="dial-tick" :class="styles.arcTick" :data-tier="m.tier" :style="{ background: ink(m.p, 'var(--gooee-color-border-strong)', 'var(--gooee-color-accent)'), transform: `scaleY(${1 + m.p * 0.7})` }" />
            <span v-if="m.tier === 'major'" data-slot="dial-mark" :class="styles.arcNum" :style="{ color: ink(m.p), transform: `translateX(-50%) scale(${1 + m.p * 0.3})` }">{{ markText(m.v) }}</span>
            <span v-if="strongSet.has(m.v)" :class="styles.arcStrong" />
          </span>
        </div>
      </div>
    </div>
    <div v-else :class="styles.bezel">
      <span :class="styles.index" aria-hidden="true" />
      <!-- How much: the ring fills from min (where the face has turned it) up to the index. -->
      <svg :class="styles.fill" aria-hidden="true">
        <!-- A negative dash length is invalid and draws the whole ring, so the arc is clamped and left out at min. -->
        <circle v-if="printed.turned > 0.5" :pathLength="360" :stroke-dasharray="`${Math.min(printed.turned, 360)} 360`" />
      </svg>
      <div ref="scrubEl" :class="styles.knob" v-bind="sliderAttrs" v-on="sc.handlers" @dblclick="onDblclick">
        <div :class="styles.face" :style="{ transform: `rotate(${printed.turned}deg)` }" aria-hidden="true">
          <span v-for="t in printed.ticks" :key="t.v" :class="styles.spoke" :style="{ transform: `rotate(${t.at}deg)` }">
            <i
              data-slot="dial-tick"
              :class="styles.tick"
              :data-major="t.major || undefined"
              :data-fine="t.fine || undefined"
              :data-strong="strongSet.has(t.v) || undefined"
              :data-selected="t.v === shown || undefined"
              :style="{ background: ink(t.p, 'var(--gooee-color-border-strong)', 'var(--gooee-color-accent)'), transform: `scaleY(${1 + t.p * 0.5})` }"
            />
            <span v-if="t.num" :class="styles.numAt" :style="{ transform: `translateY(var(--num-r)) rotate(${-(t.at + printed.turned)}deg)` }">
              <span data-slot="dial-mark" :class="styles.num" :style="{ color: ink(t.p), transform: `translate(-50%, -50%) scale(${1 + t.p * 0.45})`, fontWeight: `calc(var(--gooee-weight-medium) + (var(--gooee-weight-semibold) - var(--gooee-weight-medium)) * ${t.p.toFixed(3)})` }">{{
                markText(t.v)
              }}</span>
            </span>
          </span>
          <span :class="styles.cap" />
        </div>
        <!-- The grip: an indent on the cap that points at the value under the index, so it reads as a knob to turn. -->
        <span :class="styles.grip" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>
