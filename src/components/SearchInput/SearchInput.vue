<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { SearchIcon, XIcon } from '../../internal/vueIcons'
import { shortcutFocus } from '../../internal/motion/keys'
import Input from '../Input/Input.vue'
import Kbd from '../Kbd/Kbd.vue'
import styles from './SearchInput.module.css'

// The Vue SearchInput: Input with a search icon, a clear button and an optional key shortcut, like the React one.
// Other attributes, such as label, size or placeholder, go to the Input.
const props = withDefaults(
  defineProps<{
    /** Always required. A placeholder is only an example, never the label. */
    label: string
    /** A single key, such as "/". Pressing it anywhere on the page focuses the field. */
    shortcut?: string
    /** Screen reader name for the clear button. */
    clearLabel?: string
  }>(),
  { clearLabel: 'Clear search' },
)
/** The search text. Use v-model, or leave it out and the field keeps its own text. Also changes on clear. */
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ search: [value: string] }>()

const root = ref<InstanceType<typeof Input> | null>(null)
const field = () => root.value?.input ?? null

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
  <Input ref="root" v-model="model" :label="label" :class="styles.root" type="search" enterkeyhint="search" :aria-keyshortcuts="shortcut" @keydown="onKeydown">
    <template #leading><SearchIcon /></template>
    <template v-if="model" #trailing>
      <button type="button" :class="styles.clear" :aria-label="clearLabel" @click="clear"><XIcon /></button>
    </template>
    <template v-else-if="shortcut" #trailing>
      <span :class="styles.hint" aria-hidden="true">
        <Kbd :listen="shortcut">{{ shortcut }}</Kbd>
      </span>
    </template>
  </Input>
</template>
