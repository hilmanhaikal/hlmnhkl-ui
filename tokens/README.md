# gooee-tokens

The [Gooee UI](https://gooee.dev) look as plain CSS: every colour, size, space, corner and timing token, on the golden grid. It works with any framework, or none: Vue, Svelte, Angular, plain HTML or React.

```sh
npm i gooee-tokens
```

```css
@import "gooee-tokens";
```

That brings in the tokens and a small page reset. For the tokens alone, import `gooee-tokens/tokens.css`.

Then use the tokens in your own CSS:

```css
.card {
  padding: var(--gooee-space-6);
  border-radius: var(--gooee-radius-panel);
  background: var(--gooee-color-surface);
  color: var(--gooee-color-fg);
}
```

Light and dark follow the system. Set `data-theme="light"` or `data-theme="dark"` on any element to choose. Reduced motion sets every one-shot timing to 0ms.

Every token, with its value: https://gooee.dev/tokens

MIT licence.
