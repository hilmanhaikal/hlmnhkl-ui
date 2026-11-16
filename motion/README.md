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
import { createLiquid } from 'gooee-motion'

const liquid = createLiquid(panel, button)
button.addEventListener('click', () => {
  panel.hidden = false
  liquid.play('open')
})
```

Every function takes the element (or a function that returns it) and gives back plain methods. Reduced motion sets the timings to 0ms, so every move jumps to its end.

What is inside, with a live example: https://gooee.dev/motion

MIT licence.
