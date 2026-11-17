// Gooee UI, MIT licence. https://gooee.dev
import { flushSync } from 'react-dom'
import { themeReveal as reveal } from './motion/themeReveal'

/** React's hold on themeReveal (motion/themeReveal.ts): the new theme is put in the page at once with flushSync. */
export const themeReveal = (origin: Element | null, apply: () => void) => reveal(origin, () => flushSync(apply))
