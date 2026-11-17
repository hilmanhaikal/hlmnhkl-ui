<script setup lang="ts">
import { computed, inject, useId } from 'vue'
import { ChevronDownIcon } from '../../internal/vueIcons'
import { accordionKey } from './accordionContext'
import styles from './Accordion.module.css'

const props = defineProps<{
  /** Unique id for this item, used in the Accordion value list. */
  value: string
  /** Text on the button that opens and closes the item. The title slot replaces it. */
  title?: string
  /** Stops the item from opening or closing. */
  disabled?: boolean
}>()
defineSlots<{ default?: () => unknown; title?: () => unknown }>()

const ctx = inject(accordionKey, null)
if (!ctx) throw new Error('AccordionItem must be inside Accordion')
const id = useId()
const isOpen = computed(() => ctx.open.value.includes(props.value))
</script>

<template>
  <div :class="styles.item" :data-open="isOpen || undefined">
    <component :is="`h${ctx.level.value}`" :class="styles.heading">
      <button
        :id="`${id}-trigger`"
        type="button"
        :class="styles.trigger"
        :aria-expanded="isOpen"
        :aria-controls="`${id}-panel`"
        :disabled="disabled"
        @click="ctx.toggle(value)"
      >
        <span :class="styles.title"><slot name="title">{{ title }}</slot></span>
        <ChevronDownIcon :class="styles.chevron" />
      </button>
    </component>
    <div :id="`${id}-panel`" role="region" :aria-labelledby="`${id}-trigger`" :class="styles.panel" :inert="!isOpen">
      <div :class="styles.panelInner">
        <div :class="styles.content"><slot /></div>
      </div>
    </div>
  </div>
</template>
