<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { pull, wheelSteps, wrap } from '../../internal/feel'
import { columnScrub, columnState, drumRows, type WheelColumn } from '../../internal/motion/pickerWheel'
import { ink, tokenNumber } from '../../internal/motion/scrubLook'
import { useScrub } from '../../internal/vue/useScrub'
import styles from './PickerWheel.module.css'

// One column of the Vue PickerWheel: its rows are the marks. A drag follows the hand; a let-go lands on a row.

const props = defineProps<{ column: WheelColumn; index: number; haptics: boolean }>()
const emit = defineEmits<{ change: [index: number]; shown: [index: number] }>()

const n = computed(() => props.column.options.length)
const strong = computed(() => new Set(props.column.strong ?? []))
const st = reactive(columnState(props.index))
const wheel = wheelSteps()

// The keys, tap and wheel of one column (motion/pickerWheel.ts) on the shared scrubber.
const sc = useScrub(() => ({
  ...columnScrub(props.column, props.index, st, wheel),
  onSettle: (to: number) => {
    st.rested = to
    emit('change', wrap(to, n.value))
  },
  haptics: props.haptics,
}))
const scrubEl = sc.el
onMounted(() => (st.row = tokenNumber(scrubEl.value, '--gooee-hit-min')))

// The list got shorter (31 days to 30): stay on the last row instead of jumping.
watch(
  n,
  (now, was) => {
    const i = Math.min(wrap(Math.round(sc.target()), was), now - 1)
    st.rested = i
    sc.place(i)
  },
  { flush: 'post' },
)

const settled = computed(() => wrap(Math.round(st.rested), n.value))
const shown = computed(() => wrap(Math.round(sc.at.value), n.value))
watch(shown, (i) => emit('shown', i), { immediate: true })

const grip = computed(() => pull(sc.at.value - Math.round(sc.at.value), 0.5))
const rows = computed(() => drumRows(sc.at.value, n.value, !!props.column.loop))
</script>

<template>
  <div
    ref="scrubEl"
    :class="styles.column"
    role="spinbutton"
    tabindex="0"
    :aria-label="column.label"
    :aria-valuenow="settled"
    :aria-valuetext="column.options[settled]"
    :aria-valuemin="0"
    :aria-valuemax="n - 1"
    :data-wide="column.wide || undefined"
    :data-moving="sc.moving.value || undefined"
    v-on="sc.handlers"
  >
    <span :class="styles.band" :style="{ '--grip': grip.toFixed(3) }" aria-hidden="true" />
    <div :class="styles.drum" aria-hidden="true">
      <span v-for="r in rows" :key="r.k" :class="styles.row" :data-strong="strong.has(r.i) || undefined" :style="{ '--d': r.d.toFixed(3), color: ink(pull(r.d, 1)) }">{{ column.options[r.i] }}</span>
    </div>
  </div>
</template>
