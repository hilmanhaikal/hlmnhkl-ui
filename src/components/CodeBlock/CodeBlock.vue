<script setup lang="ts">
import { computed } from 'vue'
import CopyButton from '../CopyButton/CopyButton.vue'
import { guessLanguage, tokenize, type CodeLanguage } from './highlight'
import styles from './CodeBlock.module.css'

export type CodeBlockLabels = {
  /** Name of the copy button. */
  copy: string
}

// The Vue CodeBlock: the same look (CodeBlock.module.css) and colouring (highlight.ts) as the React one.
const { code, language, lineNumbers = false, copyable = true, labels } = defineProps<{
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
  /** Screen reader name for the scrollable code. Undefined uses the title. */
  label?: string
  /** Screen reader text, so you can translate it. Missing keys use the English defaults. */
  labels?: Partial<CodeBlockLabels>
}>()
const text = computed(() => ({ copy: 'Copy code', ...labels }))
/** header: replaces the title in the header row, for example with tabs that switch the code. */
defineSlots<{ header?: () => unknown }>()

const NAMES: Record<CodeLanguage, string> = { tsx: 'TSX', html: 'HTML', css: 'CSS', shell: 'Terminal' }
const lang = computed(() => language ?? guessLanguage(code))
const numbers = computed(() => Array.from({ length: code.replace(/\n$/, '').split('\n').length }, (_, i) => i + 1).join('\n'))
const tokens = computed(() => tokenize(code, lang.value))
</script>

<template>
  <div data-slot="code-block" :class="styles.root">
    <div data-slot="code-block-header" :class="styles.head">
      <slot name="header"><span data-slot="code-block-title" :class="styles.title">{{ title ?? NAMES[lang] }}</span></slot>
      <CopyButton v-if="copyable" :value="code" :label="text.copy" size="sm" :class="styles.copy" />
    </div>
    <!-- Kept on one line: a pre keeps every space and line break in the template. -->
    <pre data-slot="code-block-pre" :class="styles.pre" tabindex="0" :aria-label="label ?? (title ? `${title} code` : 'Code example')" :data-lines="lineNumbers || undefined"><span v-if="lineNumbers" data-slot="code-block-gutter" :class="styles.gutter" aria-hidden="true">{{ numbers }}</span><code data-slot="code-block-code" :class="styles.code"><template v-for="(t, i) in tokens" :key="i"><span v-if="t.kind" :class="styles[t.kind]">{{ t.text }}</span><template v-else>{{ t.text }}</template></template></code></pre>
  </div>
</template>
