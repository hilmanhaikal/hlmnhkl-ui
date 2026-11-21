<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import FieldMessage from '../../internal/FieldMessage.vue'
import { motionMs } from '../../internal/motion'
import { createMorph } from '../../internal/motion/liquid'
import Roll from '../../internal/Roll.vue'
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons/vue'
import { defaultPaginationLabels, readPage, splitPageOf, type PaginationLabels } from './labels'
import { pageRange } from './range'
import styles from './Pagination.module.css'

// The Vue Pagination: the same look (Pagination.module.css) and motion as the React one.

const {
  pageCount,
  defaultPage = 1,
  variant = 'row',
  siblings = 1,
  label = 'Pagination',
  labels,
} = defineProps<{
  /** Total number of pages. Pages count from 1. */
  pageCount: number
  /** Starting page when there is no v-model:page. */
  defaultPage?: number
  /** "row" shows the page numbers. "compact" shows Page 5 of 12 over a line that fills, and the number opens a Go to page field. */
  variant?: 'row' | 'compact'
  /** Pages shown on each side of the current one, in the row. */
  siblings?: number
  /** Screen reader name for the nav landmark. */
  label?: string
  /** The words it shows and says. Pass only the ones you change. */
  labels?: Partial<PaginationLabels>
}>()

/** Current page, counting from 1. Use v-model:page, or leave it out and the part keeps its own state. */
const model = defineModel<number | undefined>('page', { default: undefined })
const t = computed<PaginationLabels>(() => ({ ...defaultPaginationLabels, ...labels }))
const local = ref(defaultPage)
const count = computed(() => Math.max(pageCount, 1))
// A stored page can sit past the end after pageCount drops.
const page = computed(() => Math.min(Math.max(model.value ?? local.value, 1), count.value))
const pages = computed(() => pageRange(page.value, pageCount, siblings))

const list = ref<HTMLUListElement | null>(null)
const pill = ref<{ x: number; w: number } | null>(null)
const ready = ref(false)

const measure = () => {
  const el = list.value?.querySelector<HTMLElement>('[aria-current="page"]')
  pill.value = el ? { x: el.offsetLeft, w: el.offsetWidth } : null
}
// Keeps the current page in view when the list scrolls on a narrow screen.
const center = () => {
  const el = list.value?.querySelector<HTMLElement>('[aria-current="page"]')
  if (!list.value || !el || list.value.scrollWidth <= list.value.clientWidth) return
  list.value.scrollLeft = el.offsetLeft - (list.value.clientWidth - el.offsetWidth) / 2
}
let ro: ResizeObserver | null = null
onMounted(() => {
  measure()
  center()
  requestAnimationFrame(() => (ready.value = true))
  ro = new ResizeObserver(measure)
  if (list.value) ro.observe(list.value)
})
watch(list, (el, was) => {
  if (was) ro?.unobserve(was)
  if (el) ro?.observe(el)
})
watch([page, () => pageCount, () => siblings, () => variant], () => (measure(), center()), { flush: 'post' })

const go = (p: number) => {
  const next = Math.min(Math.max(p, 1), count.value)
  if (next === page.value) return
  local.value = next
  model.value = next
}

// The compact view.
const id = useId()
const editing = ref(false)
// The field stays shown while it folds back into the number.
const shown = ref(false)
const text = ref('')
const error = ref('')
const said = ref('')
const num = ref<HTMLButtonElement | null>(null)
const field = ref<HTMLDivElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const liquid = createMorph(() => field.value, { origin: () => num.value })
let refocus = false
let folding = 0

// Presses faster than the roll swap the number in place, so a held key never stacks rolls.
let lastAt = 0
const still = ref(false)
watch(
  page,
  (now) => {
    const at = performance.now()
    still.value = at - lastAt < motionMs('fast')
    lastAt = at
    // Read out after a change only, not when the page first shows.
    said.value = t.value.pageOf(now, count.value)
  },
  { flush: 'sync' },
)

const words = computed(() => t.value.pageOf(page.value, count.value))
const parts = computed(() => splitPageOf(words.value, page.value))

// The field grows out of the number and folds back into it. Only its clip moves.
watch(
  editing,
  (now) => {
    clearTimeout(folding)
    if (now) {
      input.value?.focus({ preventScroll: true })
      liquid.play('open')
      return
    }
    liquid.play('closed')
    if (refocus) num.value?.focus({ preventScroll: true })
    refocus = false
    folding = window.setTimeout(() => (shown.value = false), motionMs('morph-out'))
  },
  { flush: 'post' },
)
onBeforeUnmount(() => {
  ro?.disconnect()
  clearTimeout(folding)
  liquid.destroy()
})

// The value is bound as an attribute, as React writes it, so the field itself is set and read here.
const typed = (e: Event) => {
  text.value = (e.target as HTMLInputElement).value
  error.value = ''
}

const open = () => {
  text.value = ''
  if (input.value) input.value.value = ''
  error.value = ''
  shown.value = true
  editing.value = true
}

const fold = (focus: boolean) => {
  refocus = focus
  editing.value = false
  error.value = ''
}

const submit = () => {
  const n = readPage(text.value, count.value)
  if (n === null) {
    error.value = t.value.outOfRange(count.value)
    const el = field.value
    if (el) {
      // Replays the shake on every wrong try.
      delete el.dataset.shake
      void el.offsetWidth
      el.dataset.shake = ''
    }
    return
  }
  go(n)
  fold(true)
}

const keys = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    submit()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    fold(true)
  }
}

// A press on the label or the border would take focus off the input and fold the field.
const hold = (e: MouseEvent) => {
  if (e.target !== input.value) e.preventDefault()
}

const blur = (e: FocusEvent) => {
  if (editing.value && !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) fold(false)
}
</script>

<template>
  <nav :aria-label="label" :class="styles.root" data-slot="pagination" :data-variant="variant">
    <button type="button" :class="[styles.btn, styles.edge]" data-slot="pagination-previous" :aria-label="t.previous" :disabled="page <= 1" @click="go(page - 1)">
      <ChevronLeftIcon />
    </button>
    <div v-if="variant === 'compact'" :class="styles.middle">
      <button ref="num" type="button" :class="[styles.btn, styles.current]" data-slot="pagination-current" :aria-label="`${words}, ${t.goTo}`" :inert="editing" @click="open">
        <span :class="styles.words"
          ><template v-if="parts"
            >{{ parts[0]
            }}<span :class="styles.num"
              ><span :class="styles.ghost">{{ count }}</span
              ><Roll :text="String(page)" :still="still" /></span
            >{{ parts[1] }}</template
          ><template v-else>{{ words }}</template></span
        >
        <span :class="styles.line" aria-hidden="true">
          <span :class="styles.fill" :style="{ transform: `scaleX(${page / count})` }" />
        </span>
      </button>
      <div ref="field" :class="styles.jump" data-slot="pagination-jump" :data-state="shown ? 'open' : 'closed'" :data-invalid="error ? '' : undefined" :inert="!editing" @mousedown="hold" @focusout="blur">
        <label :for="`${id}-to`" :class="styles.jumpLabel" data-slot="field-label">{{ t.goTo }}</label>
        <input
          :id="`${id}-to`"
          ref="input"
          :value.attr="text"
          :class="styles.input"
          data-slot="pagination-jump-input"
          type="text"
          inputmode="numeric"
          enterkeyhint="go"
          autocomplete="off"
          :size="String(count).length + 1"
          :placeholder="String(page)"
          :aria-invalid="error ? true : undefined"
          :aria-describedby="error ? `${id}-error` : undefined"
          @input="typed"
          @keydown="keys"
        />
      </div>
      <div :class="styles.message">
        <FieldMessage :help-id="`${id}-help`" :error-id="`${id}-error`" :error="error || undefined" />
      </div>
      <span :class="styles.srOnly" aria-live="polite">{{ said }}</span>
    </div>
    <ul v-else ref="list" :class="styles.list" data-slot="pagination-list">
      <li v-if="pill" aria-hidden="true" :class="styles.pill" data-slot="pagination-indicator" :data-ready="ready || undefined" :style="{ transform: `translateX(${pill.x}px)`, width: `${pill.w}px` }" />
      <template v-for="(p, i) in pages" :key="p === 'gap' ? `gap-${i}` : p">
        <li v-if="p === 'gap'" :class="styles.gap" data-slot="pagination-ellipsis" aria-hidden="true">…</li>
        <li v-else>
          <button type="button" :class="styles.btn" data-slot="pagination-item" :aria-label="t.page(p)" :aria-current="p === page ? 'page' : undefined" @click="go(p)">{{ p }}</button>
        </li>
      </template>
    </ul>
    <button type="button" :class="[styles.btn, styles.edge]" data-slot="pagination-next" :aria-label="t.next" :disabled="page >= pageCount" @click="go(page + 1)">
      <ChevronRightIcon />
    </button>
  </nav>
</template>
