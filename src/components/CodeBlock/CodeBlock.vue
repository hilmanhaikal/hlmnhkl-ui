<script setup lang="ts">
import { computed } from 'vue'
import CopyButton from '../CopyButton/CopyButton.vue'
import { guessLanguage, tokenize, type CodeLanguage } from './highlight'
import styles from './CodeBlock.module.css'

// The Vue CodeBlock: the same look (CodeBlock.module.css) and colouring (highlight.ts) as the React one.
const props = withDefaults(
  defineProps<{
    /** The code to show and copy. */
    code: string
    /** Sets the colouring. Undefined guesses from the first line. */
    language?: CodeLanguage
    /** File name or short title in the header row. Undefined shows the language. */
    title?: string
    /** Shows a line number before each line. They are never copied or read out. */
    lineNumbers?: boolean
    /** Shows the copy button in the header row. */
    copyable?: boolean
    /** Screen reader name for the copy button. */
    copyLabel?: string
    /** Screen reader name for the scrollable code. Undefined uses the title. */
    label?: string
  }>(),
  { lineNumbers: false, copyable: true, copyLabel: 'Copy code' },
)
/** header: replaces the title in the header row, for example with tabs that switch the code. */
defineSlots<{ header?: () => unknown }>()

const NAMES: Record<CodeLanguage, string> = { tsx: 'TSX', html: 'HTML', css: 'CSS', shell: 'Terminal' }
const lang = computed(() => props.language ?? guessLanguage(props.code))
const numbers = computed(() => Array.from({ length: props.code.replace(/\n$/, '').split('\n').length }, (_, i) => i + 1).join('\n'))
const tokens = computed(() => tokenize(props.code, lang.value))
</script>

<template>
  <div :class="styles.root">
    <div :class="styles.head">
      <slot name="header"><span :class="styles.title">{{ title ?? NAMES[lang] }}</span></slot>
      <CopyButton v-if="copyable" :value="code" :label="copyLabel" size="sm" :class="styles.copy" />
    </div>
    <!-- Kept on one line: a pre keeps every space and line break in the template. -->
    <pre :class="styles.pre" tabindex="0" :aria-label="label ?? (title ? `${title} code` : 'Code example')" :data-lines="lineNumbers || undefined"><span v-if="lineNumbers" :class="styles.gutter" aria-hidden="true">{{ numbers }}</span><code :class="styles.code"><template v-for="(t, i) in tokens" :key="i"><span v-if="t.kind" :class="styles[t.kind]">{{ t.text }}</span><template v-else>{{ t.text }}</template></template></code></pre>
  </div>
</template>
