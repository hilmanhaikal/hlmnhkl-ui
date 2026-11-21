# gooee-motion

The motion of [Gooee UI](https://gooee.dev), with no framework. Panels grow out of the button that opened them and fold back into it, highlights flow to a new choice, buttons dent under the finger, sheets fling away. It works in Vue, Svelte, Angular, plain HTML or React. No dependencies.

```sh
npm i gooee-motion gooee-tokens
```

The timing comes from the Gooee tokens, so load them once:

```css
@import "gooee-tokens";
```

Then give a panel the morph:

```js
import { createMorph } from 'gooee-motion'

const morph = createMorph(panel, { origin: button })
button.addEventListener('click', () => {
  panel.hidden = false
  morph.play('open')
})
```

Each create function takes the element (or a function that returns it) and one options object. It gives back plain methods, and `destroy()` cleans up when the element goes. Reduced motion sets the timings to 0ms, so every move jumps to its end.

What is inside, with a live example: https://gooee.dev/motion

MIT licence.
