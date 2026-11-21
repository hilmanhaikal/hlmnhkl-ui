<script setup lang="ts">
import { computed, provide, ref, useId } from 'vue'
import { tabsKey } from './tabsContext'
import styles from './Tabs.module.css'

// The Vue Tabs: the same look (Tabs.module.css), keys and rise as the React one. Put a TabList and its
// TabPanel parts inside.

const props = defineProps<{
  /** Starting tab value when there is no v-model. */
  defaultValue: string
}>()

/** The selected tab value. Use v-model, or leave it out and the tabs keep their own state. */
const model = defineModel<string>()
const local = ref(props.defaultValue)
const value = computed(() => model.value ?? local.value)

provide(tabsKey, {
  value,
  set: (v) => {
    local.value = v
    model.value = v
  },
  baseId: useId(),
})
</script>

<template>
  <div :class="styles.root" data-slot="tabs" data-gooee-tabs="">
    <slot />
  </div>
</template>
