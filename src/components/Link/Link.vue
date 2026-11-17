<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRightIcon } from '../../internal/vueIcons'
import styles from './Link.module.css'

export type LinkLabels = {
  /** Screen reader text after an external link's name. */
  newTab: string
}

const defaultLabels: LinkLabels = {
  newTab: '(opens in a new tab)',
}

// The Vue Link: the same look (Link.module.css) as the React one. Other attributes, such as href, go to the link.
const props = withDefaults(
  defineProps<{
    /** Opens in a new tab, adds a safe rel and an arrow, and tells screen readers. */
    external?: boolean
    /** Inline sits in running text. Standalone gets a full-size touch target. */
    variant?: 'inline' | 'standalone'
    /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
    labels?: Partial<LinkLabels>
  }>(),
  { variant: 'inline' },
)
const labels = computed(() => ({ ...defaultLabels, ...props.labels }))
</script>

<template>
  <a :class="[styles.root, styles[variant]]" v-bind="external ? { target: '_blank', rel: 'noopener noreferrer' } : {}">
    <span :class="styles.text"><slot /></span>
    <template v-if="external">
      <ArrowUpRightIcon :class="styles.arrow" />
      <span :class="styles.srOnly"> {{ labels.newTab }}</span>
    </template>
  </a>
</template>
