// Gooee UI, MIT licence. https://gooee.dev
import { inject, type ComputedRef, type InjectionKey } from 'vue'

// What the Vue Tabs shares with its TabList, Tab and TabPanel.
export type TabsContext = { value: ComputedRef<string>; set: (v: string) => void; baseId: string }

export const tabsKey: InjectionKey<TabsContext> = Symbol('gooee-tabs')

export function useTabs() {
  const c = inject(tabsKey, null)
  if (!c) throw new Error('Tabs parts must be inside <Tabs>')
  return c
}

// Odd characters become codes like "_20_", so values never share an id.
export const safe = (v: string) => v.replace(/[^a-zA-Z0-9-]/g, (c) => `_${c.charCodeAt(0).toString(16)}_`)
