<script setup lang="ts">
import { Fragment, computed, isVNode, type VNode } from 'vue'
import styles from './AvatarGroup.module.css'

// The Vue AvatarGroup: the same look (AvatarGroup.module.css) as the React one. The default slot holds the Avatars.
const { max = 4, size = 'md' } = defineProps<{
  /** Avatars shown before the "+N" counter. */
  max?: number
  /** Size of the "+N" counter. Set it to match the avatars inside. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** What the people are, such as "Project members". Screen readers hear it with every name. */
  label?: string
}>()
const slots = defineSlots<{ default?: () => VNode[] }>()

const list = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`)
// Only components count, like React's valid elements; v-for and v-if leave fragments and comments around them.
const flat = (nodes: unknown[]): VNode[] => nodes.flatMap((n) => (!isVNode(n) ? [] : n.type === Fragment ? flat(n.children as unknown[]) : typeof n.type === 'object' || typeof n.type === 'function' ? [n] : []))

const all = computed(() => flat(slots.default?.() ?? []))
const shown = computed(() => all.value.slice(0, max))
const extra = computed(() => all.value.length - shown.value.length)
const nameOf = (n: VNode) => String((n.props as { name?: string } | null)?.name ?? '')
// The names of the hidden people too, so a screen reader hears everyone the "+N" stands for.
const everyone = computed(() => list(all.value.map(nameOf)))
</script>

<template>
  <div data-slot="avatar-group" :class="styles.root" role="group" :aria-label="label ? `${label}: ${everyone}` : everyone">
    <span v-for="(child, i) in shown" :key="child.key ?? i" data-slot="avatar-group-item" :class="styles.slot" :style="{ '--i': i }">
      <span :class="styles.face"><component :is="child" /></span>
    </span>
    <span v-if="extra > 0" data-slot="avatar-group-item" :class="styles.slot" :style="{ '--i': shown.length }">
      <span data-slot="avatar-group-more" :class="[styles.face, styles.more, styles[size]]" role="img" :aria-label="`${extra} more`" :title="list(all.slice(max).map(nameOf))">
        <span aria-hidden="true">+{{ extra }}</span>
      </span>
    </span>
  </div>
</template>
