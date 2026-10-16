# Changelog

What changed in hlmnhkl/ui for people who use it: components, blocks, templates, themes, tokens and the `npm run add` command. Newest first. Changes to the docs site itself are not listed.

## 0.15.0 · 17 Oct 2026

### Added

- **Retime**, a new Motion component. One control sets the speed of every animation in the library: Off, Slower, Normal or Faster. It remembers the choice. Reduced motion in the system still wins.
- **OnionSkin**, a new Motion component. When a value changes, the old one stays for a moment as a faint grey ghost and lifts away while the new one settles. Screen readers hear "Changed from X to Y".
- **Register** and `morph()`, a new Motion component. Give the same `mark` to an element before and after a change, run the change in `morph()`, and the element glides from where it was to where it lands. Without browser support, or with reduced motion, the change happens at once.
- Input and SearchInput `size="sm"`: a 32px field for toolbars and dense side panels. On a touch screen its text stays 16px, so phones do not zoom.
- Token `--hl-motion-scale` (default `1`). Every duration token is now its base times this number, so `1.5` is slower and `0` is no motion. JS timers read it too.
- Token `--hl-press-scale-strong` (`0.9`): small controls such as icon buttons, checkboxes and steppers press deeper, so the tap is felt.
- Token `--hl-blur-sm` (`6px`) for small things settling in, such as an avatar loading.

### Changed

- **The npm package and the public repo now hold only the 50 free components.** The other 53 are in Pro. `npx hlmnhkl-ui add combobox` (or any Pro name) now says it is in Pro instead of "not found". The public repo is the library only; the docs are at ui.hlmnhkl.my.
- Calmer springs. `--hl-ease-spring` now goes about 1% past its target instead of 10%, and `--hl-ease-bounce` about 3% instead of 18%. Motion still settles softly, but no longer wobbles when it is on every control.
- Dark theme is softer: the page is `#161616`, not near black, raised surfaces are a step lighter, and text is `#ececec`, so it does not glare.
- Theme tokens now also apply under `[data-theme="light"]` and `[data-theme="dark"]` on any element, not only on `:root`. A part of the page can have its own theme.
- Marquee: `pauseButton` is now `false` by default. The row still stops while it is hovered, has keyboard focus, or is pressed and held on a touch screen, and it stops with reduced motion.
- AudioPlayer has a new layout: play, title and controls on top, and the timeline across the full width below, with the elapsed time on the left and the length on the right. A long title ends in an ellipsis.
- Press scales and small sizes in many components now use tokens instead of fixed numbers, so reduced motion turns them off.

### Fixed

- The sliding pill or underline in SegmentedControl, Tabs, Pagination, Navbar and ToggleGroup no longer bounces past its place or swells past its size. It glides and settles with no overshoot, which felt wobbly on controls pressed often. Carousel dots, ResizablePanels and Sheet also change size with no overshoot.
- Calendar: a range can no longer span a disabled day. The selected circle stays on its day while a popover scales in. The month view keeps focus on the year buttons when they are clicked. Selected months stay readable on hover. Moving to a shorter month keeps the last day instead of day 28.
- Calendar typed dates: th-TH no longer adds 543 years, and ar-EG and fa-IR dates parse back.
- DatePicker and DateRangePicker no longer show an error when the field loses focus without a change.
- Combobox, MultiSelect, TagInput, MentionInput, InlineEdit and SearchInput ignore Enter while an input method (Chinese, Japanese, Korean) is picking a word.
- NumberInput reads a minus sign written as U+2212 (sv, nb, fi).
- Alert: closing it moves focus to the next control, not to the page body.
- Breadcrumb: after the "…" button expands the trail, focus moves to the first link it showed.
- Accordion: arrow keys in a nested accordion no longer move the outer one.
- Tabs and ToggleGroup always keep one tab stop, even when the value matches no enabled item.
- SegmentedControl: arrow keys move from the focused option, not from the chosen one.
- TreeView: disabled branches no longer open or close.
- DropdownMenu and ContextMenu: Tab closes the menu and returns focus to the trigger. Long menus scroll instead of running off the screen.
- Tooltip and HoverCard: Esc closes only them, not a dialog behind them. A click inside a HoverCard no longer closes a dialog behind it.
- Toast: error toasts are announced right away (`role="alert"`). Tapping a toast no longer closes an open dialog. Hidden toasts in the stack cannot be focused.
- Dialogs and sheets no longer make the page jump sideways when they hide the scrollbar.
- Sheet springs back if it is dragged down but the app keeps it open.
- Pagination scrolls inside itself on a narrow phone and keeps the current page in view.
- Table and Chart data tables can be scrolled with the keyboard when they are wider than their box.
- DonutChart: a tap on a slice now shows its value on touch screens.
- Carousel: an index past the last slide no longer makes every slide inert.
- Image: with `width` and `height` but no `ratio`, the space is reserved; with neither, the image sets its own height. A missing `src` shows the fallback.
- Rating: on touch screens each tap picks a whole star.
- Radio: `role="radiogroup"`, and each radio is marked invalid when the group has an error.
- Switch keeps your own `aria-describedby` next to its description.
- Divider with a label: the label is read by screen readers.
- KanbanBoard: column counts read once, moves are announced politely, and a drag is cleaned up if the board unmounts.
- Stat: a change too small to show reads as flat, not as "up 0%".
- ChatThread, CommentThread and NotificationInbox skip the time for an invalid date instead of crashing.
- RichTextEditor: shortcut labels no longer differ between server and client render.
- Timeline shows its events without JS, and reveals them a little earlier when scrolling.
- ScrollArea and Tabs scroll at once with reduced motion.
- VideoPlayer: a tap on the centre wakes the controls, and the time updates when playback starts.
- Buttons inside Calendar, Collapsible, Navbar, Menubar, Sidebar, Stepper, Tabs, TimePicker, Toolbar and BottomTabBar use the page font and colour.
- Carousel dots are at least 44px to tap.

## 0.14.7 · 16 Oct 2026

### Fixed

- Table lost its column headers when it was narrower than 560px, even in the default `layout="scroll"`. The rule that hides an empty head was meant only for `layout="stack"` but reached every table. Headers show again.

## 0.14.6 · 16 Oct 2026

### Added

- Table `layout` prop: `'scroll'` (default) or `'stack'`. Use `'stack'` for tables that read better as cards on a phone, such as a list of orders.
- Token `--hl-table-cell-max`, a cell's widest, so long text wraps inside its column.

### Changed

- Table on a narrow screen now keeps its columns and scrolls sideways, with the first column in place and a fade on the edge that has more. Before, it always turned rows into cards; that is now `layout="stack"`.

### Fixed

- Table cards (`layout="stack"`) no longer show an empty band above them when the table has no sort buttons or select-all box.

## 0.14.5 · 16 Oct 2026

### Added

- Token `--hl-text-input` for text typed into a field. It matches `--hl-text-md`, and on a touch screen it is at least 16px.

### Fixed

- iPhone Safari no longer zooms in when a field is tapped. Input, Textarea, Combobox, MultiSelect, TagInput, NumberInput, MentionInput, InlineEdit, RichTextEditor, ChatThread and CommentThread use `--hl-text-input`, so their text is at least 16px on touch screens.
- Accordion questions were blue on iPhone Safari. They now use the text colour.

- DescriptionList no longer squeezes to almost nothing inside a centred or shrink-to-fit box, where values broke after every letter. It now fills its parent.
- Tooltip now works on touch screens: a tap shows the tip, and it fades about 1.5 seconds after the finger lifts.
- HoverCard now works on touch screens: the first tap on the link opens the card, a second tap follows the link, and a tap anywhere else closes it.

## 0.14.4 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.14.3 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.14.2 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.14.1 · 14 Oct 2026

Docs only. No changes to the library.

## 0.14.0 · 14 Oct 2026

Works in Next.js, and no uppercase labels.

### Fixed

- Components work in the Next.js App Router. Every component with its own state or click handling starts with `'use client'`, so a server page can render it. Simple ones such as Badge, Card, Stack and Grid stay server-safe.

### Changed

- Chart: the data table now grows open and shut smoothly. While closed, screen readers can still read it.
- No uppercase labels: Sidebar, DropdownMenu, ContextMenu, Menubar and CommandPalette group labels, Table headers, Divider text and Countdown units use sentence case. The blocks and templates follow.
- The backup code field in the Two-step verification block no longer forces capitals.

## 0.13.0 · 14 Oct 2026

One command to install, and no sticky hover on phones.

### Added

- Install with one command from your app's folder: `npx hlmnhkl-ui@latest add button` (or `pnpm dlx`, `yarn dlx`, `bunx`). Files go to `src/ui` unless you pass `--to`.
- Names work in kebab case too, such as `date-picker`.

### Fixed

- Hover styles no longer stay on after a tap on touch screens. They now apply only on devices that can hover. Press and focus styles are unchanged.
- The VideoPlayer seek thumb now shows on touch screens. Before, it appeared only on hover.

## 0.12.0 · 14 Oct 2026

A licence.

### Added

- MIT licence for the components, tokens and the add command: use them in any project, free or paid.
- Blocks, templates and themes have their own Pro licence (LICENSE-PRO.md). Until Pro is on sale, they may not be copied or used.

## 0.11.7 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.11.6 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.11.5 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.11.4 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.11.3 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.11.2 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.11.1 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.11.0 · 14 Oct 2026

Templates and themes.

### Added

- 4 templates, each a full app with working navigation between its pages: SaaS starter (sign in, sign up, onboarding, dashboard, settings, billing), Workspace (projects, board, schedule, inbox, files, search), Admin console (members, invites, projects, analytics, audit log, purchases) and Marketing site (landing, pricing, changelog, help, contact, book a demo).
- 5 brand themes (Slate, Forest, Ink, Clay, Plum), each in light and dark, plus Compact and Comfortable density. Apply them with `data-theme-brand` and `data-density`.
- `npm run add` copies blocks, templates and themes too, with the components they need.
- Select `hideLabel` keeps the label for screen readers only, for lists with one column heading.
- Sidebar `headerCollapsed` shows something small, such as a logo, while collapsed.
- The Tessera sample app has its own logo in the AppShell block and all four templates.

### Fixed

- A collapsed Sidebar no longer clips the header text.
- Team members shows one "Role" heading instead of a label on every row, and Remove lines up with the role.

## 0.10.0 · 14 Oct 2026

22 more blocks.

### Added

- 22 blocks: Forgot password, Two-step verification, Onboarding, Profile, Team members, Billing, Notifications center, Inbox, Project board, Schedule, Data table, Analytics report, File manager, Search results, Orders, Booking, Checkout, Invoice, Help centre, Contact form, Pricing table and Event page. 30 blocks in total.
- KanbanBoard `onCardOpen`: a click or Enter opens a card.
- RadioGroup `error`, shown the same way as field errors.
- CommandPalette items take a `tag`, such as "Pro".

### Changed

- Blocks, templates and themes are part of hlmnhkl/ui Pro, coming soon.
- All blocks use one made-up SaaS app, Tessera, as sample content, so they read like pages of one product.
- Breadcrumb items without `href` are real buttons, so the keyboard can reach them.
- Card `title` accepts any content.

### Fixed

- Dropdowns and pickers opened inside a Dialog, Drawer or Sheet now appear on top instead of behind it.
- InlineEdit no longer wraps early in narrow spaces.
- The unread dot in NotificationInbox lines up with the avatar.

## 0.9.1 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.9.0 · 14 Oct 2026

English only.

### Changed

- All built-in text is in English. Malaysian formats (IC number, +60 phone, RM, states) stay.
- CurrencyInput's default `locale` is now `en-MY`.

### Removed

- `malaysianStateNamesMs` from AddressFields.
- The Language field from the Settings block.

## 0.8.0 · 14 Oct 2026

100 components and a copy command.

### Added

- Menubar, Toolbar and ResizablePanels.
- DescriptionList, RelativeTime and Countdown.
- InlineEdit and MentionInput.
- ChatThread, CommentThread, and NotificationInbox with a bell.
- VideoPlayer and AudioPlayer with their own controls and keyboard shortcuts.
- QrCode with its own encoder: versions 1 to 40, all four error correction levels, and download as SVG.
- Tour: a guided spotlight walkthrough of a page.
- `npm run add -- Button --to ../my-app/src/ui` copies components and everything they need into your project. It never overwrites your files unless you ask.

### Changed

- Destructive items in DropdownMenu and ContextMenu are red and bold.

## 0.7.1 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.7.0 · 14 Oct 2026

Malaysian inputs and nine component gaps closed.

### Added

- IcInput: MyKad number with dashes added as you type, a birth date and place code check, and helpers to read the birth date.
- PhoneInput: a fixed +60 prefix, mobile and landline formats, and an E.164 value such as `+60123456789`.
- CurrencyInput: RM amounts with separators as you type and exact values in sen.
- AddressFields: address lines, postcode, city and the 13 states and 3 federal territories.
- Grid `steps="halves"` steps 4 columns to 2 to 1.
- Button `href` renders a link with the same look.
- Sidebar `collapsible` and `fill`, Card `fill`, Checkbox `error` and Split `stacked`.
- EmptyState `headingLevel` now takes 1, so it can be the page title.

### Changed

- Button with `aria-disabled` looks disabled but keeps focus, and ignores clicks.
- Split leaves no gap when there is no sidebar.
- SearchInput hides its "/" hint on touch screens.
- The blocks use these new props instead of their own workarounds.

## 0.6.0 · 14 Oct 2026

Colour where it means something.

### Added

- Status colour tokens: `--hl-color-success`, `--hl-color-warning`, `--hl-color-danger` and soft versions. Used only where colour means good, caution or bad, always with an icon or word.
- Badge `tone`: `neutral`, `success`, `warning`, `danger`.

### Changed

- Stat shows good changes in green and worse changes in red, and keeps its arrows.
- Alert success, warning and error get a soft tinted background and a coloured icon.
- Toast success and error icons are green and red.
- Field errors show a red border and red message in every form field.
- Button `danger` is now solid red.

## 0.5.0 · 14 Oct 2026

Layout primitives and the first eight blocks.

### Added

- Layout primitives: Stack, Cluster, Grid, Container, Split, Center, AspectRatio, VisuallyHidden.
- Blocks, whole pages to copy: app shell, phone shell, sign in, sign up, dashboard, settings, list and detail, status pages.

### Fixed

- Container no longer makes the page scroll sideways when stretched.

## 0.4.0 · 14 Oct 2026

18 bug fixes, and every built-in word can be changed.

### Added

- A `labels` prop on 16 components, so all visible and spoken text can be set. Old single-text props still work.

### Changed

- Table: a third click on a sorted column turns sorting off.

### Fixed

- FileUpload keeps the chosen file when a new pick is rejected, and quick removes no longer bring files back.
- Input and Textarea keep their help and error links when you pass your own `aria-describedby`.
- Combobox and MultiSelect skip disabled options while you type.
- Select puts its `id` on the button, so `<label htmlFor>` works.
- RangeSlider no longer shows values like 0.30000000000000004.
- Also fixed: Checkbox, Chart, DropdownMenu, KanbanBoard, the field error message, SegmentedControl, TagInput, Marquee, Pagination, Tabs and TreeView.

## 0.3.0 · 14 Oct 2026

Documented props.

### Added

- Every prop has a one-line description, shown when you hover it in your editor.

## 0.2.0 · 13 Oct 2026

The library gets its name.

### Changed

- Renamed from Monochrome UI to hlmnhkl/ui. The package is `@hlmnhkl/ui`, and tokens now start with `--hl-`.
- Active items in CommandPalette, Sidebar, Navbar and TreeView use a filled background instead of a line on the left edge.

## 0.1.0 · 13 Oct 2026

First release.

### Added

- 73 animated components across actions, forms, dates and time, navigation, layout, overlays, feedback, data display, charts and media.
- Light and dark themes, reduced motion, and keyboard and screen reader support on every component.
