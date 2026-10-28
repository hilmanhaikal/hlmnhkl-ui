# hlmnhkl/ui

React components, measured down to the part you never see: the 44px tap area, the 2px focus ring, the timing of every move. Black, white and grey, and copied into your app so the code is yours.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/hilmanhaikal/hlmnhkl-ui/main/.github/assets/home-dark.png">
  <img alt="The hlmnhkl/ui homepage: a real Switch drawn large, with thin lines reading its live tap area, focus ring and timing, under the line 'Measured down to the part you never see.'" src="https://raw.githubusercontent.com/hilmanhaikal/hlmnhkl-ui/main/.github/assets/home-light.png">
</picture>

**[Docs](https://ui.hlmnhkl.my)** · [Installation](https://ui.hlmnhkl.my/installation) · [Components](https://ui.hlmnhkl.my/button) · [What's new](https://ui.hlmnhkl.my/changelog)

## Install

From your app's folder, set it up once, then copy the components you need:

```sh
npx hlmnhkl-ui@latest init
npx hlmnhkl-ui@latest add button dialog
```

Also `pnpm dlx`, `yarn dlx` (Yarn 2 and up) or `bunx`. `init` adds `tokens.css` and `base.css` to `src/ui` (or `--to <folder>`) and remembers the folder in `hlmnhkl-ui.json`. `add` also copies the components they use (Button needs Spinner) and the shared files.

Then import the styles once at your app root, and use a component:

```tsx
import './ui/tokens.css'
import './ui/base.css'
import { Button } from './ui/components/Button'

<Button onClick={save}>Save</Button>
```

Using Next.js or React Router? The [installation guide](https://ui.hlmnhkl.my/installation) has the steps for each.

| Command | What it does |
| --- | --- |
| `init` | Set a project up: `tokens.css`, `base.css` and `hlmnhkl-ui.json` |
| `add <name>...` | Copy components, with what they import |
| `list` | Show everything there is, free and Pro. `--kind blocks` filters |
| `diff <name>...` | Show what changed between your copy and the latest version |
| `update <name>...` | Show the changes, then replace your copy after you say yes |

| Option | What it does |
| --- | --- |
| `--to <folder>` | Where the files go. Default: the folder in `hlmnhkl-ui.json`, else `src/ui` |
| `--dry-run` | Print what would happen, write nothing |
| `--overwrite` | `add`: replace files that are already there. Without it, they are skipped and listed |
| `--with-base` | `add`: also copy `base.css` (`init` always does) |
| `--yes` | `update`: replace without asking |

Every copied file starts with one line naming hlmnhkl/ui and the MIT licence, so the licence notice travels with the code. `diff` and `update` ignore that line.

`add`, `diff` and `update` never change your `tokens.css`. If the latest one has tokens yours lacks, they list them after the result, with the lines to copy.

**With an AI assistant:** point it at [llms.txt](https://ui.hlmnhkl.my/llms.txt) (every component and the rules) or [llms-full.txt](https://ui.hlmnhkl.my/llms-full.txt) (props, keyboard notes and an example for each free component). There is also a [registry.json](https://ui.hlmnhkl.my/registry.json).

## What you get

- **The source, not a package.** The command copies plain files into your app. Change anything; there is no update to wait for.
- **50 free components**, from Button, Dialog, Select and Table to Toast and Retime, one speed setting for every animation. See [COMPONENTS.md](COMPONENTS.md).
- **One look, set by tokens.** Every colour, size and timing comes from one file, `tokens.css`. Colour appears only to mean something: good, caution or bad.
- **Light and dark.** Dark follows the system, or set `data-theme="dark"` on `<html>`.
- **Accessible.** Keyboard support per the WAI-ARIA patterns, visible focus, screen reader labels, and reduced motion. On touch screens every control gives at least a 44px target, even the small sizes; only the six PIN boxes and the seven calendar days get narrower when the row has no room, about 36px wide on a 320px phone.
- **Small.** React 19 and CSS Modules. No other runtime packages: no animation library, no icon package.
- **Works in** Vite, Next.js (App Router) and React Router.

## Pro

54 more components (such as Calendar, Chart, KanbanBoard, Combobox and Route), page blocks, full templates and brand themes are coming as hlmnhkl/ui Pro. You can see them on the [docs site](https://ui.hlmnhkl.my).

## Licence

The free components, tokens and scripts in this repo are [MIT](LICENSE): use them in any project, free or paid. Pro is not MIT. The MIT licence covers the code, not the hlmnhkl/ui name or logo.

## Working on it

See [CONTRIBUTING.md](CONTRIBUTING.md) for the rules every component follows.
