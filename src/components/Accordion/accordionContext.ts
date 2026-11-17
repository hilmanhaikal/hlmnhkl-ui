import type { ComputedRef, InjectionKey } from 'vue'

// What the Vue Accordion shares with each AccordionItem.
export type AccordionContext = { open: ComputedRef<string[]>; toggle: (v: string) => void; level: ComputedRef<number> }

export const accordionKey: InjectionKey<AccordionContext> = Symbol('gooee-accordion')
