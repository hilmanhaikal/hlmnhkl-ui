# Changelog

What changed in hlmnhkl/ui for people who use it: components, blocks, templates, themes, tokens and the `npm run add` command. Newest first. Changes to the docs site itself are not listed.

## 0.23.1 · 30 Oct 2026

### Fixed

- PinInput: with an empty box before it, Tab could never leave the group, because focus on a later box is sent back to the first empty one. The group is now one Tab stop, at the box that takes the next character. Left, Right, Home and End still move between boxes.

## 0.23.0 · 30 Oct 2026

### Changed

- Dark theme: a near-black page instead of dark grey, with each raised layer a step lighter. `--hl-color-bg` is `#0a0a0a`, `--hl-color-surface` `#111111`, `--hl-color-surface-raised` `#1c1c1c`, `--hl-color-surface-sunken` `#070707`, `--hl-color-surface-hover` `#1a1a1a`, `--hl-color-surface-active` `#222222`, `--hl-color-border` `#262626` and `--hl-color-inverse-fg` `#0a0a0a`. Text colours are the same, so their contrast only goes up. To get the new look, copy these values into the two dark blocks of your `tokens.css`.

## 0.22.1 · 30 Oct 2026

### Fixed

- Dialog, Sheet, Drawer and every layer that holds focus: in Safari, plain Tab skips buttons, so it could jump out of the layer to the page behind or off the page. Focus now wraps back to the other end. Native radio groups still move with the arrow keys as before.

## 0.22.0 · 30 Oct 2026

Five new Pro components, a test suite that checks every component on every pull request, and the fixes it found.

### Added

- DataGrid: a grid for thousands of rows that draws only the rows on screen. Sort (Shift for more columns), resize and pin columns, select rows with a count bar and actions, search, and filter by text, number or a set of values. The WAI-ARIA grid keyboard pattern throughout, and it renders on the server.
- SmoothScroll: weighted scrolling for the mouse wheel and trackpad. Keys, the scrollbar, links, find in page, phones and reduced motion stay native, and it never moves a page that a dialog has locked.
- ScrollDraft: sets `--draft` from 0 to 1 as a box scrolls into view, and draws any SVG line inside it with `pathLength="1"`.
- TextRise: words that rise one after another behind a baseline, on load or with the scroll. Screen readers hear one plain sentence.
- ScrollRuler: a ruler down the edge of the page that reads where you are and how fast you move.
- Retime `fullWidth`: fills the row, with the speeds sharing it evenly.
- Tokens `--hl-scroll-ease`, `--hl-draft-start`, `--hl-draft-end`, `--hl-rise-span`, `--hl-rise-room`, `--hl-ruler-w`, `--hl-ruler-step`, and `--hl-datagrid-h`, `--hl-datagrid-col-w`, `--hl-datagrid-col-min`, `--hl-datagrid-col-max`, `--hl-datagrid-resize-step`, `--hl-datagrid-resize-hit`, `--hl-datagrid-options-h`, `--hl-datagrid-order`.

### Fixed

- Dialog, Sheet and Drawer: in Safari on iPhone and Mac, closing gave focus back to the page instead of the button that opened them, because Safari does not focus a button when it is pressed. It now goes back to that button.
- Badge, Button, Calendar, CopyButton, Countdown, Kbd, OnionSkin, QrCode, SegmentedControl, Tag, ToggleGroup and AnimatedNumber stretched to the full width of a column layout. They keep their own width now; `fullWidth` still fills the row.
- SegmentedControl: when something does stretch it, the options share the room instead of leaving an empty end.
- Every disabled control uses `--hl-disabled-opacity`. Sixteen components still had their own value.
- Touch targets of at least 44px for the Combobox toggle, the Breadcrumb "Show full path" button and the NotificationInbox tabs.
- ColorPicker: focus on the picked swatch is now visible.
- Blocks and templates: the NotificationsCenter bar no longer covers a focused row, and its phone layout, the Checkout "Place order" button and the SaaS starter's "Sign in" link keep their full size.

## 0.21.2 · 30 Oct 2026

Docs site only. No changes to the library.

## 0.21.1 · 30 Oct 2026

### Fixed

- VideoPlayer: captions sat under the controls, at the very edge of the video. The player now draws them itself, just above the controls while they show and lower when they hide, and larger in full screen.
- VideoPlayer and AudioPlayer: the buttons' hover and on fills were as big as the whole 44px touch area and touched each other. The fill is now a small circle inside the touch area, with a gap between buttons.

### Changed

- VideoPlayer: a toggle that is on, such as captions, is now a solid light circle with a dark icon, instead of a fill with a dot under it.

## 0.21.0 · 29 Oct 2026

Twelve new components, in four sets. All twelve are in Pro.

### Added

Touch lists:

- SwipeActions: swipe a row sideways to show its actions, as in a mail app. Past half way it stays open, and `fullSwipe` runs the outer action. Tab reaches the actions, so no swipe is needed.
- PullToRefresh: pull a list down from the top to load what is new. A ring draws in as you pull, then turns into a spinner. A Refresh button appears on keyboard focus.
- SortableList: put a list in order by dragging its handles. Space, the arrow keys and Escape do the same from the keyboard, and each step is announced.

Photos:

- ImageCropper: crop and zoom a photo in a fixed frame, round for avatars. Drag, pinch, the wheel or the keys move it, and the photo always covers the frame. `onCropAreaChange` and `getCropArea` give the area in the photo's own pixels.
- CompareSlider: a before and after with a divider you drag. The divider is a slider, so the arrow keys, Home and End move it too.
- MasonryGrid: items of mixed heights packed into columns. Reading order and Tab order go row by row, as the eye does.

Inputs:

- ColorPicker: an area for saturation and brightness, a hue bar, a hex field and preset swatches. The area works with the arrow keys and says where it is.
- SignaturePad: sign with a finger, pen or mouse, with Undo and Clear. `typeInstead` adds a typed name for people who cannot draw. The PNG is dark ink in both themes.
- EmojiPicker: about 400 emoji in groups, with search, arrow keys across the grid and recently used ones.

Data and time:

- CalendarHeatmap: activity per day as a grid of shades, like a contribution graph. Each day can be reached with the arrow keys, and a month table gives the same numbers.
- WeekSchedule: a week of events by the hour, with a line for now. Events that overlap share the width or step in on top. On a phone it shows one day at a time.
- VirtualList: draws only the rows on screen, so 10,000 rows scroll smoothly. The keys still reach every row, and `scrollToIndex` jumps to one.

Tokens:

- `--hl-swipe-action-w`, `--hl-pull-distance`.
- `--hl-picker-area-h`, `--hl-picker-hue-h`, `--hl-swatch`, `--hl-picker-white`, `--hl-picker-black`, `--hl-signature-h`, `--hl-ink-w`.
- `--hl-heatmap-cell`, `--hl-heatmap-gap`, `--hl-heatmap-label`, `--hl-heatmap-1` to `--hl-heatmap-4`.
- `--hl-schedule-hour`, `--hl-schedule-gutter`, `--hl-schedule-min-w`, `--hl-schedule-indent`.

`add`, `diff` and `update` list any of these your `tokens.css` is missing.

## 0.20.3 · 29 Oct 2026

Docs site only. No changes to the library.

## 0.20.2 · 29 Oct 2026

### Changed

- Blocks and templates name people by their role ("Design lead", "Web engineer", "You") and businesses by what they are ("Your app", "A logistics team"), instead of made-up names. Avatars show the role's initials and emails are role addresses at example.com. Real places stay.
- MentionInput and NotificationInbox: the examples in their prop notes use roles too.

## 0.20.1 · 28 Oct 2026

### Changed

- `add`, `diff` and `update` now check your `tokens.css` against the latest one. If yours lacks tokens the components use (for example `--hl-disabled-opacity`, `--hl-check-scale` and `--hl-check-peak-scale` from 0.20.0), they list the names and the lines to copy. Your file is never changed, and nothing is printed when no token is missing.

## 0.20.0 · 28 Oct 2026

A full bug audit of every component, block and template, at 320, 390, 768 and 1280 wide, in light and dark. Every fix below was checked in the browser before and after.

### Added

- Calendar, DatePicker and DateRangePicker `today`: the date to treat as today. Without it, today follows the clock and moves on at midnight.
- CopyButton `failedLabel` (default "Could not copy"): shown and announced when copying fails.
- Tokens `--hl-disabled-opacity` (`0.5`), `--hl-check-scale` and `--hl-check-peak-scale`. The two scales become `1` under reduced motion.

### Changed

- Disabled controls use one opacity, `--hl-disabled-opacity`. Before, it was 0.3 to 0.6 depending on the component.
- On touch screens, small Buttons and IconButtons, Inputs, SegmentedControl items, Calendar month buttons and the DateRangePicker icons give at least a 44px target without looking bigger. A tap area never covers the button next to it. On a mouse, IconButton's tap area is now the size of the button.
- Long labels end in "…" instead of spilling out: Button, Badge, Tag, BottomTabBar, SegmentedControl. Long words wrap in Accordion, Collapsible, Timeline, EmptyState and Stepper.
- Navbar: links that do not fit move into the menu, measured live, instead of running under the actions.
- Pagination always shows 7 slots, and a "…" always stands for at least 2 pages.
- Two-digit years read from 80 years back to 20 years ahead: `85` is 1985, `30` is 2030.
- ContextMenu and Menubar: on a phone, a submenu that fits on neither side opens under its item.
- Lightbox arrows use `aria-disabled`, so focus stays on them at the first and last picture.
- VideoPlayer: at 320px wide the time moves under the seek bar, so every control fits.

### Fixed

- TimePicker: the wheels only scroll up and down. Typing "1" in 12-hour mode picks 1, not 12.
- RichTextEditor: adding a link inside a form no longer reloads the page. Pasting from Google Docs keeps the real bold and no longer makes everything bold.
- KanbanBoard: a dragged card follows the pointer and lands in its slot. On a phone the board no longer makes the page wider than the screen.
- Dialog, Drawer, Sheet: a double click on a footer button no longer fires twice.
- MentionInput no longer reports people who were not mentioned.
- Combobox: the Escape that clears the text no longer also closes a Dialog around it. SearchInput's shortcut no longer pulls focus out of an open Dialog. Select no longer opens on Ctrl, Cmd or Alt keys.
- Toast announces the same message again when it repeats.
- Alert banner: links and buttons inside it are readable.
- Button and Spinner announce the loading state.
- NumberInput steps from the number being typed, and a disabled stepper no longer counts.
- PinInput: Delete and Cut clear a box, and six boxes fit on one line at 320px.
- TagInput: commas make tags on Android keyboards, and a pasted list split by new lines makes one tag per line.
- Switch with a `name` submits its value in a form.
- CurrencyInput: Backspace right after a comma deletes the digit before it.
- RangeSlider: thumbs on the same value can be dragged apart either way.
- Textarea and Input reset their height, count and floating label with the form.
- FileUpload shows 999,999 bytes as "1 MB", not "1,000 kB".
- TreeView: the first click after a drop works, and focus stays on an item moved by keyboard.
- Carousel: Play works while focus is inside.
- Calendar fits at 320px, and today moves on at midnight.
- RelativeTime counts days by calendar day, so two days ago never reads "yesterday".
- DatePicker and DateRangePicker clear bad typed text when you pick a date. A typed range can no longer span disabled days.
- ScrollArea: dragging the thumb to the end reaches the end.
- ResizablePanels: a collapsed panel stays collapsed on ArrowLeft and Home.
- VideoPlayer plays new `sources` when they change.
- Chart: the tooltip reads values aloud only while using the keyboard.
- Tag, Navbar, Breadcrumb, Sidebar, Stat, Link, ProgressBar, Collapsible and Pagination fixes for focus, wrapping, ARIA values and overflow.
- Blocks: Checkout locks the cart while placing the order. Inbox and Schedule use one date for today. AppShell's Profile item opens a page. EventPage's calendar file downloads in Safari. Booking, TwoStepVerification, Onboarding, ProjectBoard and Schedule fit at 320px.

## 0.19.0 · 19 Oct 2026

### Added

- `npx hlmnhkl-ui init`: sets a project up in one step. It adds `tokens.css` and `base.css`, writes `hlmnhkl-ui.json` with your folder, and shows the import lines. Later commands use that folder, so `--to` is only needed once.
- `npx hlmnhkl-ui list`: shows every component, block, template and theme, free and Pro. `--kind blocks` shows one kind.
- `npx hlmnhkl-ui diff <name>`: shows what changed between your copy and the latest version, line by line, like `git diff`.
- `npx hlmnhkl-ui update <name>`: shows the changes, asks, then replaces your copy. `--yes` skips the question; without a terminal it stops instead of guessing. `tokens.css` and `base.css` are never replaced.
- Every copied file starts with one line naming hlmnhkl/ui and its licence, so the MIT notice travels with the code. `diff` and `update` ignore that line.
- `llms.txt`, `llms-full.txt` and `registry.json` on the docs site, so AI coding assistants can find, describe and install components. Pro items show a name and one line only.

### Changed

- `add` now uses the folder in `hlmnhkl-ui.json` when there is no `--to`. A bare name still works: `npx hlmnhkl-ui button` is the same as `add button`.

### Fixed

- Toast: its hidden screen reader announcers no longer add 1px of scroll under the page.

## 0.18.0 · 18 Oct 2026

### Added

- TreeView `onMove`: drag items into folders. A small card with the name follows the pointer, the folder it would land in is ringed, and a closed folder held under it opens after a moment. On touch, hold an item first, so a quick swipe still scrolls. With the keyboard, Space picks an item up, Up and Down choose a folder or the top level, and Space drops; Escape cancels. Every step is announced. A folder never goes into itself or a folder inside it. The moved row glides to its new place.
- `moveNode(nodes, id, folderId)`, to apply a move to your tree data in one line.
- Token `--hl-tree-open-delay` (`800ms`): how long a closed folder waits under a dragged item before it opens. Reduced motion keeps it, since it is about intent, not motion.

### Changed

- TreeView: a node with `children: []` is a folder you can drop into, even while empty. With `onMove`, Space picks up and Enter selects; without it, Space still selects.

### Fixed

- The page did not scroll with the mouse wheel while the pointer was over a Table or a ScrollArea. They now only stop sideways scroll from spilling over, so a swipe at the edge does not go back a page, and the wheel scrolls the page as normal.

## 0.17.0 · 18 Oct 2026

### Added

- Skeleton `variant="sketch"`: the same shapes as dashed pencil outlines with no fill, for a quieter wait. Text becomes dashed baselines. The lines fade gently instead of shimmering, and hold still with reduced motion.
- Token `--hl-color-surface-raised`: the surface for something that sits on a track, such as a sliding pill or a slider thumb. In light it is the surface; in dark it is a step lighter.

### Changed

- Dark mode depth: SegmentedControl and ToggleGroup pills and Slider and RangeSlider thumbs use the raised surface, so they stand out by fill. `--hl-shadow-1` and `--hl-shadow-2` are faint in dark (20% and 15%), so buttons and pills no longer look embossed. Larger shadows for menus and dialogs stay.

## 0.16.0 · 18 Oct 2026

### Added

- Table `groupBy`: gathers rows under a header per group, such as each invoice's status, with a row count. Turning groups on or off makes the table split apart and close up again, and a row that changes group glides into it. Groups keep their order; the sort applies inside each group. Each group is its own row group with a row header, so screen readers announce it.
- **Route** (Pro): progress as a journey. Stops sit on a road, drawn in ink behind the marker and dashed ahead, and the marker glides between them. `value` can sit between two stops, such as 1.5. Along a line or down the page. Screen readers hear where it is, such as "On the way from Packed to Shipped".
- Token `--hl-wheel-tilt` (`18deg`): how far each wheel row tilts per row away from the middle.

### Changed

- TimePicker wheels turn like a drum: rows tilt back and fade as they leave the middle. Hours and minutes go round, so 59 rolls on to 00 by scroll or keyboard, taking the short way. Screen readers still hear each option once.

## 0.15.2 · 18 Oct 2026

### Removed

- Pro block List and detail. Team members covers the same people, and Inbox and Orders show the same list and detail pattern.
- Pro theme Ink. It was close to the default look; Slate covers a cool blue-grey.

### Changed

- Pro previews are twice as sharp, saved as AVIF at about the same weight as before. Locked block pages now have the same Preview and Code switch as components: Preview is the screenshot, Code is the Pro lock.

## 0.15.1 · 18 Oct 2026

### Fixed

- Safari no longer shows a small dot where a hidden line starts: beside the Stepper number, and in Checkbox, CopyButton, ProgressRing, PasswordInput (the eye's slash) and Table row checkboxes. A hidden line used to be a zero-length dash, and Safari still drew its round ends.
- Tabs fit a narrow phone more often: under 480px each tab has a little less room on its sides, so a short row no longer scrolls sideways by a few pixels. Every tab is now at least 44px wide, so none is too small to tap.

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
