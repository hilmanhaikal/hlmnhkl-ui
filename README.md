# hlmnhkl/ui

React components that move with meaning. Black, white and grey, accessible, and copied into your app so the code is yours.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/hilmanhaikal/hlmnhkl-ui/main/.github/assets/home-dark.png">
  <img alt="The hlmnhkl/ui homepage: the logo and name, the install command, and live components below." src="https://raw.githubusercontent.com/hilmanhaikal/hlmnhkl-ui/main/.github/assets/home-light.png">
</picture>

**[Docs](https://ui.hlmnhkl.my)** · [Installation](https://ui.hlmnhkl.my/installation) · [Components](https://ui.hlmnhkl.my/button) · [What's new](https://ui.hlmnhkl.my/changelog)

## Install

From your app's folder, copy the components you need:

```sh
npx hlmnhkl-ui@latest add button dialog
```

Also `pnpm dlx`, `yarn dlx` (Yarn 2 and up) or `bunx`. Files go to `src/ui`, or pass `--to <folder>`. The command also copies the components they use (Button needs Spinner), the shared files and `tokens.css`.

Then import the tokens once at your app root, and use a component:

```tsx
import './ui/tokens.css'
import { Button } from './ui/components/Button'

<Button onClick={save}>Save</Button>
```

Using Next.js or React Router? The [installation guide](https://ui.hlmnhkl.my/installation) has the steps for each.

| Option | What it does |
| --- | --- |
| `--to <folder>` | Where the files go. Default: `src/ui` |
| `--dry-run` | Print what would be copied, write nothing |
| `--overwrite` | Replace files that are already there. Without it, they are skipped and listed |
| `--with-base` | Also copy `base.css`, the small reset |

## What you get

- **The source, not a package.** The command copies plain files into your app. Change anything; there is no update to wait for.
- **50 free components**, from Button, Dialog, Select and Table to Toast and Retime, one speed setting for every animation. See [COMPONENTS.md](COMPONENTS.md).
- **One look, set by tokens.** Every colour, size and timing comes from one file, `tokens.css`. Colour appears only to mean something: good, caution or bad.
- **Light and dark.** Dark follows the system, or set `data-theme="dark"` on `<html>`.
- **Accessible.** Keyboard support per the WAI-ARIA patterns, visible focus, 44px touch targets, screen reader labels, and reduced motion.
- **Small.** React 19 and CSS Modules. No other runtime packages: no animation library, no icon package.
- **Works in** Vite, Next.js (App Router) and React Router.

## Pro

53 more components (such as Calendar, Chart, KanbanBoard and Combobox), page blocks, full templates and brand themes are coming as hlmnhkl/ui Pro. You can see them on the [docs site](https://ui.hlmnhkl.my).

## Licence

The free components, tokens and scripts in this repo are [MIT](LICENSE): use them in any project, free or paid. Pro is not MIT. The MIT licence covers the code, not the hlmnhkl/ui name or logo.

## Working on it

See [CONTRIBUTING.md](CONTRIBUTING.md) for the rules every component follows.
