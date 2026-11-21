<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { SearchIcon, XIcon } from '../../icons/vue'
import { shortcutFocus } from '../../internal/motion/keys'
import Input, { type InputLabels } from '../Input/Input.vue'
import Kbd from '../Kbd/Kbd.vue'
import styles from './SearchInput.module.css'

// The Vue SearchInput: Input with a search icon, a clear button and an optional key shortcut, like the React one.
// Other attributes, such as label, size or placeholder, go to the Input.

export type SearchInputLabels = InputLabels & {
  /** Screen reader name for the clear button. */
  clear: string
}

const props = defineProps<{
  /** Always required. A placeholder is only an example, never the label. */
  label: string
  /** A single key, such as "/". Pressing it anywhere on the page focuses the field. */
  shortcut?: string
  /** Text for the label and the clear button, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<SearchInputLabels>
}>()
/** The search text. Use v-model, or leave it out and the field keeps its own text. Also changes on clear. */
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ search: [value: string] }>()

const root = ref<InstanceType<typeof Input> | null>(null)
const field = () => root.value?.el ?? null

let stop = () => {}
onMounted(() =>
  watch(
    () => props.shortcut,
    (key) => {
      stop()
      stop = key ? shortcutFocus(key, field) : () => {}
    },
    { immediate: true },
  ),
)
onBeforeUnmount(() => stop())

const onKeydown = (e: KeyboardEvent) => {
  // Enter during IME composition picks a word, not a search
  if (e.isComposing || e.keyCode === 229) return
  if (e.key === 'Enter') emit('search', model.value)
  else if (e.key === 'Escape' && model.value) {
    e.preventDefault()
    e.stopPropagation()
    model.value = ''
  }
}
const clear = () => {
  model.value = ''
  field()?.focus()
}
</script>

<template>
  <Input ref="root" v-model="model" :label="label" :labels="labels" :class="styles.root" type="search" enterkeyhint="search" :aria-keyshortcuts="shortcut" @keydown="onKeydown">
    <template #leading><SearchIcon /></template>
    <template v-if="model" #trailing>
      <button type="button" :class="styles.clear" data-slot="search-input-clear" :aria-label="labels?.clear ?? 'Clear search'" @click="clear"><XIcon /></button>
    </template>
    <template v-else-if="shortcut" #trailing>
      <span :class="styles.hint" data-slot="search-input-shortcut" aria-hidden="true">
        <Kbd :listen="shortcut">{{ shortcut }}</Kbd>
      </span>
    </template>
  </Input>
</template>
