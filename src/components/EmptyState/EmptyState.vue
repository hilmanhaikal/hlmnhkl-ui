<script setup lang="ts">
import { InboxIcon } from '../../internal/vueIcons'
import styles from './EmptyState.module.css'

// The Vue EmptyState: the same look (EmptyState.module.css) as the React one.
withDefaults(
  defineProps<{
    /** Short heading that says what is empty. The title slot replaces it. */
    title?: string
    /** Text under the title, such as what to do next. The description slot replaces it. */
    description?: string
    /** Heading level for the title, to fit the page outline. Use 1 when the empty state is the whole page. */
    headingLevel?: 1 | 2 | 3 | 4
  }>(),
  { headingLevel: 3 },
)
/** icon: the picture above the title, hidden from screen readers. action: one primary action. secondaryAction: a less important one, shown before it. */
const slots = defineSlots<{ title?: () => unknown; description?: () => unknown; icon?: () => unknown; action?: () => unknown; secondaryAction?: () => unknown }>()
</script>

<template>
  <div :class="styles.root">
    <div :class="styles.icon" :style="{ '--i': 0 }" aria-hidden="true">
      <slot name="icon"><InboxIcon /></slot>
    </div>
    <component :is="`h${headingLevel}`" :class="styles.title" :style="{ '--i': 1 }"><slot name="title">{{ title }}</slot></component>
    <p v-if="description || slots.description" :class="styles.description" :style="{ '--i': 2 }"><slot name="description">{{ description }}</slot></p>
    <div v-if="slots.action || slots.secondaryAction" :class="styles.actions" :style="{ '--i': 3 }">
      <slot name="secondaryAction" />
      <slot name="action" />
    </div>
  </div>
</template>
