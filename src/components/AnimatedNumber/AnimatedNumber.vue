<script setup lang="ts">
import { computed } from 'vue'
import styles from './AnimatedNumber.module.css'

// The Vue AnimatedNumber: the same look and roll (AnimatedNumber.module.css) as the React one.
const props = defineProps<{
  /** Number to show. Digits roll to the new value when it changes. */
  value: number
  /** Passed to Intl.NumberFormat, for currency, percent, decimals and so on. */
  formatOptions?: Intl.NumberFormatOptions
  /** Locale for number formatting. Undefined uses the browser locale. */
  locale?: string
}>()

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const text = computed(() => new Intl.NumberFormat(props.locale, props.formatOptions).format(props.value))
const chars = computed(() => text.value.split(''))
const isDigit = (ch: string) => ch >= '0' && ch <= '9'
</script>

<template>
  <span data-slot="animated-number" :class="styles.root">
    <span :class="styles.srOnly">{{ text }}</span>
    <span :class="styles.visual" aria-hidden="true">
      <!-- Keyed from the right, so the ones column stays the ones column when the number grows. -->
      <template v-for="(ch, i) in chars" :key="isDigit(ch) ? `d${chars.length - i}` : `s${chars.length - i}${ch}`">
        <span v-if="isDigit(ch)" data-slot="animated-number-digit" :class="styles.digit">
          <span :class="styles.strip" :style="{ transform: `translateY(${-Number(ch) * 10}%)` }">
            <span v-for="n in DIGITS" :key="n" :class="styles.cell">{{ n }}</span>
          </span>
        </span>
        <span v-else data-slot="animated-number-symbol" :class="styles.symbol">{{ ch }}</span>
      </template>
    </span>
  </span>
</template>
