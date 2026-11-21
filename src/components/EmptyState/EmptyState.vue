<script setup lang="ts">
import { InboxIcon } from '../../icons/vue'
import styles from './EmptyState.module.css'

// The Vue EmptyState: the same look (EmptyState.module.css) as the React one.
const { headingLevel = 3 } = defineProps<{
  /** Short heading that says what is empty. The title slot replaces it. */
  title?: string
  /** Text under the title, such as what to do next. The description slot replaces it. */
  description?: string
  /** Heading level for the title, to fit the page outline. Use 1 when the empty state is the whole page. */
  headingLevel?: 1 | 2 | 3 | 4
}>()
/** icon: the picture above the title, hidden from screen readers. action: one primary action. secondaryAction: a less important one, shown before it. */
const slots = defineSlots<{ title?: () => unknown; description?: () => unknown; icon?: () => unknown; action?: () => unknown; secondaryAction?: () => unknown }>()
</script>

<template>
  <div data-slot="empty-state" :class="styles.root">
    <div data-slot="empty-state-icon" :class="styles.icon" :style="{ '--i': 0 }" aria-hidden="true">
      <slot name="icon"><InboxIcon /></slot>
    </div>
    <component :is="`h${headingLevel}`" data-slot="empty-state-title" :class="styles.title" :style="{ '--i': 1 }"><slot name="title">{{ title }}</slot></component>
    <p v-if="description || slots.description" data-slot="empty-state-description" :class="styles.description" :style="{ '--i': 2 }"><slot name="description">{{ description }}</slot></p>
    <div v-if="slots.action || slots.secondaryAction" data-slot="empty-state-actions" :class="styles.actions" :style="{ '--i': 3 }">
      <slot name="secondaryAction" />
      <slot name="action" />
    </div>
  </div>
</template>
