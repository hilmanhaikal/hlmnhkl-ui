// Gooee UI, MIT licence. https://gooee.dev
import { inject, type InjectionKey, type Ref } from 'vue'

// What the Vue RadioGroup shares with its Radio parts.
export type RadioContext = { name: Ref<string>; value: Ref<string | null>; set: (v: string) => void; disabled: Ref<boolean | undefined>; invalid: Ref<boolean> }

export const radioKey: InjectionKey<RadioContext> = Symbol('gooee-radio')

export function useRadioGroup() {
  const c = inject(radioKey, null)
  if (!c) throw new Error('Radio must be inside RadioGroup')
  return c
}
