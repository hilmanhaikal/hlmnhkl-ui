<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { prefersReducedMotion } from '../../internal/motion'
import { ArrowUpIcon } from '../../internal/vueIcons'
import styles from './TableOfContents.module.css'

// The Vue TableOfContents: the same look (TableOfContents.module.css) and reading strip as the React one.

export type TocItem = {
  /** The id of the heading on the page. */
  id: string
  label: string
}

const props = withDefaults(
  defineProps<{
    /** The sections, in page order: each heading's id and the text to show for it. */
    items: TocItem[]
    /** Heading above the list, also the nav's name. */
    title?: string
    /** Adds a way back to the top once the reader has passed the first section. */
    backToTop?: boolean
  }>(),
  { title: 'On this page', backToTop: false },
)

const active = ref(props.items[0]?.id)
const at = computed(() => Math.max(0, props.items.findIndex((t) => t.id === active.value)))

// The section being read is the last heading past the top third of the screen.
let headings: HTMLElement[] = []
const update = () => {
  const line = window.innerHeight / 3
  let current = headings[0]?.id
  for (const h of headings) if (h.getBoundingClientRect().top <= line) current = h.id
  // A short last section never reaches the line, so the bottom of the page selects it.
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
  active.value = atBottom ? headings[headings.length - 1]?.id : current
}
const find = () => {
  headings = props.items.map((t) => document.getElementById(t.id)).filter((h): h is HTMLElement => !!h)
  update()
}
onMounted(() => {
  find()
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
})
watch(() => props.items, find)
onBeforeUnmount(() => {
  window.removeEventListener('scroll', update)
  window.removeEventListener('resize', update)
})

const plain = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

// A plain click scrolls there and keeps one history entry; Cmd-click still opens a new tab.
const go = (e: MouseEvent, id: string) => {
  const heading = document.getElementById(id)
  if (!plain(e) || !heading) return
  e.preventDefault()
  heading.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
  heading.focus({ preventScroll: true })
  window.history.replaceState(window.history.state, '', `#${id}`)
}

const toTop = (e: MouseEvent) => {
  if (!plain(e)) return
  e.preventDefault()
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
}
</script>

<template>
  <nav :class="styles.root" :aria-label="title">
    <p :class="styles.title">{{ title }}</p>
    <ol :class="styles.list">
      <li v-for="(t, n) in items" :key="t.id" :data-state="n < at ? 'read' : n === at ? 'here' : 'ahead'">
        <a :href="`#${t.id}`" :class="styles.link" :aria-current="active === t.id ? 'location' : undefined" @click="go($event, t.id)">
          <span :class="styles.node" aria-hidden="true" />{{ t.label }}</a
        >
      </li>
    </ol>
    <a v-if="backToTop && at > 0" href="#" :class="styles.toTop" @click="toTop">
      <ArrowUpIcon aria-hidden="true" />Back to top</a
    >
  </nav>
</template>
