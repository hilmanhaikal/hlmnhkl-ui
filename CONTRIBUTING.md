# Working on hlmnhkl/ui

This repo is the free part of hlmnhkl/ui. It is copied from a private repo on each release, so a pull request here is read but not merged directly. Issues are welcome. The docs live at https://ui.hlmnhkl.my.

To check a change: `npm install`, then `npm run typecheck`. To try a component in your own app: `node scripts/add.js <name> --to ../your-app/src/ui`.

## Rules for new components

- **Tokens only.** Colours, sizes, radii, durations and easings come from `src/tokens.css` (`--hl-*`). A raw value in a component is a bug. Exceptions: `0`, `1px` for screen-reader-only text, and media query breakpoints (CSS cannot read variables there).
- **No packages.** Allowed: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`. No animation library, UI kit, CSS framework or icon package. Icons are small inline SVGs in `src/internal/icons.tsx`.
- **One folder per component:** `src/components/<Name>/<Name>.tsx`, `<Name>.module.css`, `index.ts`, and an export line in `src/index.ts`.
- **`'use client'` on line 1** when the component has its own state, effects or event handlers, so it works in the Next.js App Router. Leave it off simple ones that only render markup.
- **Typed props.** Controlled and uncontrolled where it makes sense (`value` + `defaultValue` + `onValueChange`).
- **Every prop has a one-line `/** ... */` comment.** Each docs page's API table is read from the `<Name>Props` type, its comments and the defaults in the function signature (`scripts/api.js`). `npm run build` fails when a prop has no comment, or when a props type uses a form the reader does not know. Write props as `type <Name>Props = { ... }`, joined with `&` to `ComponentPropsWithRef<'tag'>`, `Omit<...>` or another props type when needed.
- **Accessible:** real buttons, inputs and labels; keyboard support per the WAI-ARIA pattern; visible `:focus-visible` ring; touch targets at least 44px (a control can look smaller with an invisible hit area); text contrast 4.5:1 and control edges 3:1; never colour alone.
- **Hover only where it can hover.** Wrap `:hover` styles in `@media (hover: hover)`, so a tap on a phone does not leave them stuck on.
- **Motion with a purpose:** state morphs, sliding indicators, spring easings, staggered entrances, press feedback. No decoration for its own sake. `prefers-reduced-motion: reduce` sets every one-shot duration token to `0ms`. JS timers read the same tokens through `motionMs()`, so they follow too.
- **Writing:** simple English, sentence case (no uppercase labels), no em dashes. Few comments: only for what the code cannot say.
