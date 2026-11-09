# Changelog

What changed in hlmnhkl/ui for people who use it: components, blocks, templates, themes, tokens and the `npm run add` command. Newest first.

## 0.37.1 · 10 Nov 2026

The switch moves as one soft pill, and folding panels leave nothing behind.

### Changed

- Switch: the thumb now stretches across as one pill (its front edge leads, the back catches up, at most 1.4 times its size), and the on colour's edge rides on it. Before, a drop split off and the colour was left behind as a dot, so it looked like three blobs.

### Fixed

- Popover, Dialog, Tooltip and other parts that fold back into their trigger: the panel fades as it folds, so no strip of it is left by the trigger at the end of the close.

## 0.37.0 · 9 Nov 2026

Parts move like soft liquid. A button gives under your finger, a switch sends a drop ahead, menus follow you with a bead, and a toast rises out of the screen.

### Changed

- Pagination: page buttons and the moving highlight are rounded rectangles (12px), like the rest of the navigation, instead of pills.
- Dial (printed): a tick for every step with a longer one every ten, a thin ink arc on the ring that shows how much, labels at min, the middle and max, and a grip line on the knob's cap. Keys, touch and glide are unchanged.
- Button: the edge is soft. It dents 2px where you press and follows the finger (from the middle for Enter or Space), a wet spot spreads under the press, a mouse near the edge pulls it out 1px, and a let-go sends one small wave round the edge before it rests exact. The label never moves and the button no longer shrinks. New tokens `--hl-press-depth`, `--hl-press-wet-dark` and `--hl-press-wet-light`.
- Switch: the thumb pinches off a drop that runs to the far end, then flows after it and swallows it. It no longer widens while pressed.
- SegmentedControl: the pill flows to the new segment on a neck that breaks on a long move, and what is left drains after it and joins by 60% of the move. Labels stay put and take the chosen colour exactly under the liquid. A change caught half way flows on from the shape on screen.
- Tabs: the underline runs to the new tab, splits on a long move, and what is left drains after it.
- Toast: a drop rises out of the screen edge under the stack, hangs on a neck that breaks, and grows into the toast; a dismiss flows back into the edge. New optional `origin` (an element or a point): within 240px of the toast, the drop buds out of it instead.
- Checkbox: ink pours in from the side you tap (Space fills it evenly from below), rises with a soft meniscus and levels, then the tick draws. Clearing drains it. The box no longer shrinks when pressed.
- Input, Textarea and Select: on focus (for Select, also on opening) a dark edge flows both ways round the field from where you clicked, or from the start edge for a key, and meets on the far side in 300ms. The settled 2px edge is the field's focus indicator, in place of the halo and, on Select, the focus ring. A blur fades it.
- CopyButton: a drop falls from where you press into the copy icon and fills it, the back square slides under, and the filled square turns into the check in one shape, then plays back. With a label, the icon sits on the middle of the capitals. The button no longer shrinks when pressed.
- MorphButton: the panel opens toward the side that fits inside the box it sits in, so a demo or a card never cuts it off.
- DropdownMenu, ContextMenu and Menubar: the hover fill is a bead that follows the pointer and the arrow keys. The next item settles in about 100ms; a jump of two or more stretches a short neck. Keyboard and screen reader use are unchanged.

## 0.36.0 · 9 Nov 2026

Every part now moves on one morph curve. Things grow from where you tapped, and closing is as quick as opening.

### Added

- Tokens: `--hl-ease-morph` (`cubic-bezier(0.32, 0.72, 0, 1)`, fast away with a long soft landing), `--hl-motion-morph` (600ms, to open) and `--hl-motion-morph-out` (480ms, to close). Both follow `--hl-motion-scale`, and reduced motion makes them instant.
- Dialog on a phone: a handle on top, as on Sheet. Pull the sheet down by its handle or header to close it. Not on AlertDialog, and not when `dismissOnOverlay` is false.

### Changed

- One curve everywhere. `--hl-ease-out`, `--hl-ease-in`, `--hl-ease-spring`, `--hl-ease-bounce` and `--hl-ease-liquid` now point at `--hl-ease-morph`, and `--hl-motion-liquid`, `--hl-motion-pour` and `--hl-motion-fling` at the morph timings. The names still work in your own CSS. `--hl-ease-in-out` stays for loops only, like a shimmer.
- Closing plays the curve forward, not backwards, so a close moves from its first frame instead of starting slow. A move caught half way starts from the shape on screen.
- Dialog and AlertDialog: the panel grows out of the button that opened it and folds back into it. Opened from code with no button, it grows from the middle of the screen. On a phone it is a bottom sheet: it grows out of a button it covers, as one in the thumb zone is, and otherwise rises from the bottom edge. Focus moves and returns as before.
- Dialog, AlertDialog, Sheet, Drawer, Lightbox and MorphButton open in 600ms and close in 480ms. Big moves have no slower timing of their own.
- Tooltip: grows out of the edge of its target, a sliver as wide as the target, and folds back into it.
- Toast: grows up out of the bottom edge instead of fading in, and a toast that leaves downward folds back into that edge. A toast thrown sideways still flies off.
- Switch: the on colour grows out of the thumb and folds back into it, instead of fading.
- Checkbox: the fill grows from where you pressed the box, or from its middle for a key or a tap on the label. The box no longer pops.
- Accordion and Collapsible: only the panel's edge moves. The content no longer fades or slides in.
- Select, DropdownMenu, ContextMenu and Popover grow with the morph curve too. The highlight in Tabs, SegmentedControl and ToggleGroup stretches with the same curve.
- A let-go glides on the morph curve instead of a spring: Sheet, Drawer, Toast, Lightbox, SwipeActions, SwipeDeck, PullToRefresh, Dial, RulerScrubber and PickerWheel. It starts at the speed of your hand.
- Drags follow the hand one to one. Slider, RangeSlider, ResizablePanels, SwipeDeck, Dial, RulerScrubber and PickerWheel no longer pull toward a mark while you drag. Slider, RangeSlider and ResizablePanels still land on a mark when you let go near one, and the others land on the nearest step. Strong marks are still drawn and still work with Page Up and Page Down.
- HoldToConfirm, SplitFlap and the Navbar dock move on the morph curve. The dock no longer squashes as it lands.
- Small screens (320px): MorphButton's panel fits the box it opens in, not only the screen; ButtonGroup wraps onto a second row, each row with its own round ends; Calendar's columns narrow to fit while each day keeps a 44px tap area.
- Inner corners now follow the outer corner minus the gap, so nested shapes stay parallel. Fixed in Toolbar, Menubar, CommandPalette and the Navbar menu. Menus, lists and the editor toolbar now write it as a formula.

### Removed

- Tokens `--hl-magnet-reach` and `--hl-magnet-strong`, since nothing pulls any more.

## 0.35.3 · 9 Nov 2026

Docs site only. No changes to the library.

### Changed

- Installation: a short section on adding parts to an app that already has a design system, and the three tokens that make them match it.

## 0.35.2 · 9 Nov 2026

A smoother throw in SwipeDeck.

### Fixed

- SwipeDeck: a thrown card no longer shows in the middle for a frame before the next card appears, and the Pass or Save button's fill now fades out after a throw instead of switching off at once. While you drag it still follows your finger, and with reduced motion it switches off at once.

## 0.35.1 · 9 Nov 2026

A clearer first step, and a safe way to take outside pull requests.

### Fixed

- `init` now says where to paste the two CSS imports and gives the path from there: `import './ui/tokens.css'` in `src/main.tsx`, not `./src/ui/tokens.css`.

### Changed

- The public repo takes pull requests for free components. A check runs on each one, and the package refuses to publish with dependencies, install scripts or files it does not list. See CONTRIBUTING.md.

## 0.35.0 · 7 Nov 2026

Three live parts: a pill that grows into a card, a deck you throw, and a board that flips.

### Added

- LivePill: a small status pill for something live, such as a download or a delivery. Tap it and its surface grows into a card from its own spot, and its words stay on the same pixels as the card's last row. It sits at the bottom in thumb reach (`placement="bottom"`), or at the top. `progress` makes the pill its own progress bar. `alert` opens it by itself and it shrinks back after 5 seconds, unless a hand or focus is on it. `news` and `alert` are said once; a ticking number never is.
- SwipeDeck: a stack of cards you throw to either side to decide. A small ruler under the card has two throw marks that pull it in. A card goes past 35% of its width, or with a flick over 600 px a second that moved at least 40px; a slow, short drag comes back. The next card rises as you pull, and the button for that side fills toward it. Undo plays the throw in reverse. Arrow Left, Arrow Right and Backspace work too, and `onDecide` runs once per card.
- SplitFlap: letters and numbers that flip into place like a station board. Each cell runs forward through its drum, fast and then slower, and lands with no bounce; a whole change ends inside a second. The board grows or shrinks with the liquid morph when the text gets longer or shorter. The text is said once, when it has landed.
- Tokens `--hl-deck-w`, `--hl-deck-card-h`, `--hl-deck-throw`, `--hl-flap-w`, `--hl-flap-h`, `--hl-flap-top` and `--hl-flap-bottom`.

### Fixed

- SegmentedControl: on touch screens every segment is now 44px tall at `sm` and `md`, so the box itself is the target. On a desktop it looks the same as before.

## 0.34.1 · 7 Nov 2026

Tests only. No changes to the library.

## 0.34.0 · 7 Nov 2026

Three ways to set a value by hand. Each one is drawn onto its marks, coasts after a flick and settles without a bounce.

### Added

- Dial: turn a round dial to set a value. Every step pulls the dial in, and `strong` marks pull from further away. Three looks share one API: `variant="printed"` (the scale is printed on the knob and turns under a fixed index), `"mercury"` (a solid knob that reaches for a few named levels) and `"arc"` (the rim of a large dial, swiped sideways). A double click can go back to `resetValue`.
- RulerScrubber: drag a ruler under a fixed needle to set a number, or flick it and it coasts. While it moves, the ticks near the needle lean toward it; at rest the ruler lies flat. `strongLabel` puts a tag under the strong marks.
- PickerWheel: a 3D wheel for any list, in one column or several. Rows are free between, drawn in near one, and strong rows pull harder. Each column is a spin button; Up goes to the next value, as the WAI-ARIA pattern says. Type to jump to a row.
- TimeWheel and DateWheel: PickerWheel set up for a time, in 12 or 24 hours, and for a date with each month's real length.
- All three: `onScrub` gives the value while it still moves, and `haptics` buzzes on each step on Android phones. Off unless you ask.
- All three: a plain mouse wheel scrolls the page. Only a wheel column with focus, or a sideways swipe on the ruler and the arc, moves them.
- Tokens `--hl-magnet-reach`, `--hl-magnet-strong`, `--hl-dial-size`, `--hl-dial-ring`, `--hl-dial-arc-radius`, `--hl-dial-arc-gap`, `--hl-ruler-tick-gap` and `--hl-ruler-h`.
- WeekSchedule: `kind` (`'soft'`, `'solid'` or `'hatched'`) and `done` on each event, named with `labels.kinds` and shown in a key under the week.
- Tokens `--hl-schedule-lane-min`, `--hl-schedule-day-min`, `--hl-schedule-hatch` and `--hl-schedule-lift`.

### Changed

- WeekSchedule: events at the same time sit side by side, never on top, and a busy day gets wider so every title has room. No title is ever cut or ends in "…".
- WeekSchedule: a week with no overlaps or short events keeps all seven days from `--hl-schedule-min-w` up. When the days do not fit, fewer show with a day strip; on a phone, one day.
- WeekSchedule: titles break only between words, times are short ("9–10 am"), and an event under 40 minutes takes one line.
- WeekSchedule: on hover an event keeps its fill, lifts and gets a clear edge. The now line and today are in the accent colour.
- WeekSchedule: focus stays in the schedule when its day stops showing, and with a few days shown the panel is named for the date range. `--hl-schedule-indent` is no longer used.

## 0.33.1 · 7 Nov 2026

Docs site only. No changes to the library.

## 0.33.0 · 6 Nov 2026

Three new ways to act, and more ways to lay out the tab bar.

### Added

- HoldToConfirm: press and hold a risky action. A line burns along the button's edge, out both ways from your finger, and the action runs when the ends meet. Let go early and it runs back. One tap, Enter or Space opens a Cancel and Confirm step in place instead.
- MorphButton: a button that grows into its own panel from where it sits. Its label stays put and becomes the panel's title, and the page never moves.
- Sheet `detents`: the sheet rests at low, half or full height. A flick moves it one height and never skips one. Below full, the page behind stays usable.
- Sheet: with detents, the grabber is a real control. Its width shows the height, and arrow keys, Home, End or a tap change it.
- BottomTabBar `variant="dock"`: a floating, rounded bar above the bottom edge.
- BottomTabBar `labels="active"`: only the chosen tab shows its label, beside its icon.
- BottomTabBar `action`: one main action, as a round button beside the tabs or raised in the centre (`actionPlacement="centre"`).
- BottomTabBar `shrinkOnScroll`: the dock shrinks to the chosen tab as you scroll down, and opens again as you scroll up or tap it.
- Tokens `--hl-handle-w-short`, `--hl-hold-time` (1500ms), `--hl-hold-stroke`, `--hl-tabbar-active-grow` and `--hl-tabbar-label-max`.

### Changed

- BottomTabBar: the chosen tab is marked by full ink and its icon hops once, with no pill behind it. The bar is 56px tall (`--hl-tabbar-h`), down from 64px.

## 0.32.3 · 6 Nov 2026

Docs site only. No changes to the library.

## 0.32.2 · 5 Nov 2026

### Changed

- Sheet: pulled up past the top, it stretches like a sheet on a phone. Lifting it never opens a gap at the bottom.

## 0.32.1 · 5 Nov 2026

### Added

- `npx hlmnhkl-ui add scroll-frame`: the frame loop that every scroll part uses, to build your own scroll effect. `list` shows it under Helpers.

## 0.32.0 · 5 Nov 2026

Fluid: things follow the hand. Let go of a sheet, row, toast or photo and it carries on at your speed, then settles.

### Added

- Drawer: on touch, swipe it toward its edge to close it.
- Token `--hl-motion-fling`: the length of the let-go spring. It is 0 with reduced motion.

### Changed

- Sheet, Drawer, SwipeActions, Toast, PullToRefresh and Lightbox: a quick flick now throws them as far as a long drag.
- Dragging past an edge stretches, less the further you go. PullToRefresh no longer stops dead.
- Sheet, Drawer, SwipeActions, Toast and Lightbox: caught mid-spring, they carry on from where they are instead of jumping.
- Toast: a thrown toast flies off the way it was thrown and fades.
- Lightbox: a quick flick changes the photo or closes it, however short.
- Reduced motion keeps every gesture and its result, and drops the glide.

## 0.31.0 · 5 Nov 2026

Magnetic: the right place pulls. Slider marks, list gaps and panel snap places draw what you drag onto them.

### Added

- Slider and RangeSlider `marks`: values that a dragged thumb is drawn onto. Dots show on the track. Page Up and Page Down jump between marks.
- ResizablePanels `snap`: places, in percent of the group, that a dragged handle lands on.

### Changed

- SortableList and KanbanBoard: the dragged item is drawn into the gap or slot it will land in.
- Slider: a click glides the thumb to the spot. Your `onValueChange` gets only the final value.
- Slider and RangeSlider: the value bubble stays a moment after a click or let-go.
- ResizablePanels: a plain click on a handle no longer moves it, and a folded panel stays folded when you let go.
- Reduced motion keeps the pull and the landing, and drops the glide.

## 0.30.0 · 5 Nov 2026

Liquid: menus grow out of what opened them, and highlights stretch toward the new choice.

### Added

- Tokens `--hl-ease-liquid` and `--hl-motion-liquid`: a spring easing and its length, for your own liquid moves. The length is 0ms with reduced motion.

### Changed

- DropdownMenu, Popover and Select: they grow out of their trigger and fold back into it on close.
- ContextMenu: it grows out of the spot you pressed. A submenu grows out of the item that opened it.
- SegmentedControl, ToggleGroup (single) and Tabs: the pill or underline stretches toward the new choice.
- With reduced motion, or in browsers without clip-path or `linear()` easing, each part keeps its old fade or slide.

## 0.29.0 · 2 Nov 2026

Glass: a second Pro theme that turns floating parts into frosted glass, and a lens for the Navbar pill.

### Added

- Glass theme (`themes/glass.css`, Pro). Set `data-theme-style="glass"` on `<html>`. Navbar pill, Dialog, Sheet, Popover, DropdownMenu, ContextMenu, Toast and the Fab's actions show the page through, blurred.
- Glass turns solid with `prefers-reduced-transparency`, `prefers-contrast: more`, without `backdrop-filter`, or with `data-glass="off"` on `<html>`. Safari cannot report reduced transparency, so give people that switch.
- GlassLens (Pro): render it once and, in Chromium browsers, the Navbar pill gets a clear rim that bends the page under it.

### Changed

- Navbar, Dialog, Sheet, Popover, DropdownMenu, ContextMenu, Toast and Fab read `--hl-glass-bg`, `--hl-glass-filter` and `--hl-glass-edge`. Without the theme nothing changes.

## 0.28.0 · 2 Nov 2026

Colour comes to hlmnhkl/ui: one blue accent, new chart colours, and four new chart types.

### Added

- Token `--hl-color-accent-hover`: the hover of anything filled with the accent.
- BarChart `stacked`: series stacked in one bar per category, with a total in the tooltip.
- BarChart `orientation="horizontal"`: a row per category, for rankings and long names.
- ScatterChart: two numbers per point, with a colour and marker shape per group.
- FunnelChart: steps from first to last, with each step's number and shares.
- BulletChart: a measure against its target, with bands for the ranges.
- HeatmapChart: two categories on a grid, with the number shown as depth of one colour.

### Changed

- The accent is now blue instead of black: primary buttons, switches, checked and selected states, the current tab, progress and the selected day. Set `--hl-color-accent` to your own colour, or back to black.
- Chart series use a new set of colours in a fixed order, with a lighter step of each in dark mode.
- Brand themes (Slate, Forest, Clay, Plum) set `--hl-color-accent-hover`. They no longer take over the first chart colour.

## 0.27.1 · 2 Nov 2026

### Fixed

- ScrollStory on a narrow screen: a step's title no longer hides under the pinned picture, text no longer shows again above it, and the last step leaves no empty space.
- ScrollStory `snap` on a narrow screen: steps now scroll freely, so a flick no longer skips steps.
- Navbar `dockAfter`: after a fast scroll to the top, the bar no longer hangs low on the screen.

## 0.27.0 · 2 Nov 2026

Four new free components: a floating action button, a theme toggle, styles for long text, and a table of contents.

### Added

- Fab: one main action floating at the bottom of the screen, in reach of the thumb. Props: `extended`, `actions`, `position` and `contained`. Tokens `--hl-fab-size` and `--hl-fab-gap`.
- ThemeToggle: one button between light and dark. It sets `data-theme` and remembers the choice. Use `theme` and `onThemeChange` to keep the state in your app. Put `themeScript()` in the head to avoid a flash.
- Prose: styles plain HTML from Markdown or a CMS for reading. Token `--hl-prose-w`.
- TableOfContents: the sections of a page as links to their headings. `backToTop` adds a way up.

## 0.26.0 · 1 Nov 2026

Navbar float becomes a liquid pill. On a phone it can move down to the bottom of the screen.

### Added

- Navbar `centerBrand`: under 640px wide, the brand sits in the middle.
- Navbar `dockAfter`: the id of an element, such as the hero. Once it has scrolled past, on a phone, the pill moves to the bottom of the screen and its menu opens upward.
- Token `--hl-motion-pour`: the length of that move. It is 0 with reduced motion.

### Changed

- Navbar `float`: instead of a card, the bar closes in to a pill in the middle of the screen. Its height never changes.
- Navbar menu: once the bar is a pill, the menu opens as its own card under it.

### Fixed

- Navbar `float` never lifted inside a wrapper with no box of its own, such as an Astro island.

## 0.25.1 · 1 Nov 2026

### Fixed

- Avatar: a picture that loaded before the page became interactive no longer stays hidden behind the initials. This happened with server-rendered pages.
- PinInput: a focused box that holds a character no longer shows the browser's blue selection.

## 0.25.0 · 1 Nov 2026

Nine new free components, six new scroll parts in Pro, and charts that show their table in place.

### Added

- ScrollStory (Pro): steps scroll past a stage that stays in view. `snap` settles the page on the nearest step.
- StackScroll (Pro): cards stick and pile up as you scroll.
- ScrollTrack (Pro): a row of panels that moves sideways as you scroll down. On narrow screens it is a sideways swipe.
- Parallax (Pro): pictures move at different speeds. Set your own depths with `depths`.
- ScrollTone (Pro): the paper behind a run of sections changes tone as you scroll.
- ScrollExpand (Pro): a picture or video opens from a thin strip to the full frame as you scroll. `through` goes on to fill the screen.
- TextRise `effect="ink"`: a paragraph turns from grey to full ink word by word as you read. For text 24px and up.
- Navbar `float`: with `sticky`, the bar lifts into a floating card as the page scrolls.
- Tokens for the new scroll parts: `--hl-story-*`, `--hl-stack-*`, `--hl-track-*`, `--hl-parallax-*`, `--hl-tone-*`, `--hl-expand-*`, `--hl-ink-from`, `--hl-ink-span` and `--hl-navbar-float-run`.
- Toggle: one button that stays pressed or not.
- AlertDialog: asks one question before an action that cannot be undone. On phones it docks to the bottom.
- Fieldset: a fieldset and legend for related fields, with a description and one error.
- CheckboxGroup: checkboxes with one shared value, label, description and error.
- Meter: a value in a known range, like storage used.
- ButtonGroup: buttons joined into one bar, across or down.
- InputGroup: an input with text, an icon or a button attached inside one border.
- CodeBlock: code with syntax colours, a file name, line numbers and a copy button. Tokens `--hl-code-bg`, `--hl-code-fg`, `--hl-code-keyword`, `--hl-code-tag`, `--hl-code-attr`, `--hl-code-string`, `--hl-code-number`, `--hl-code-comment` and `--hl-code-gutter`.
- AvatarGroup has its own folder. `import { AvatarGroup } from './ui/components/Avatar'` still works.

### Changed

- Chart and CalendarHeatmap: a Chart and Table switch beside the title replaces the "Show data table" button. Breaking: the `labels` keys `showTable` and `hideTable` are now `view`, `chart` and `table` on Chart, and `view`, `calendar` and `table` on CalendarHeatmap.
- Navbar: links in the bar look 32px tall with less side padding. Each still has a 44px hit area.
- Dark theme: `--hl-color-surface-sunken` is `#141414`, up from `#070707`, so wells, empty tiles and Kanban columns now show.
- TextRise and ScrollDraft ease with the scroll, like the new parts. `--hl-scroll-ease` sets the weight for all of them.

### Fixed

- Hover no longer wobbles at an edge in Card (`interactive`), AvatarGroup and Dialog's close button.
- IconButton, CopyButton, Pagination, NumberInput, Calendar, ChatThread, FileUpload, Lightbox, Marquee, AudioPlayer and VideoPlayer: a mouse click near the edge is no longer lost while pressed.
- Input looks disabled when a disabled fieldset turns it off.
- ScrollArea: the scrollbar no longer stays shown after a tap on phones.
- Card: a card with `media` no longer clips its content.

### Removed

- SmoothScroll and ScrollRuler, and the tokens `--hl-ruler-w` and `--hl-ruler-step`. Every scroll part now eases on its own. Copies you made earlier keep working.

## 0.24.0 · 30 Oct 2026

### Added

- `hlmnhkl-ui-mcp`: a read-only MCP server, so AI tools can look up components, props and install steps. Run `npx -y hlmnhkl-ui-mcp@latest`. It needs Node 20 or later. Setup: https://ui.hlmnhkl.my/mcp

## 0.23.1 · 30 Oct 2026

### Fixed

- PinInput: Tab could not leave the group when an earlier box was empty. The group is now one Tab stop.

## 0.23.0 · 30 Oct 2026

### Changed

- Dark theme: a near-black page, with each raised layer a step lighter. To get it, copy the new values into the two dark blocks of your `tokens.css`. Changed tokens: `--hl-color-bg`, `--hl-color-surface`, `--hl-color-surface-raised`, `--hl-color-surface-sunken`, `--hl-color-surface-hover`, `--hl-color-surface-active`, `--hl-color-border` and `--hl-color-inverse-fg`.

## 0.22.1 · 30 Oct 2026

### Fixed

- Dialog, Sheet, Drawer and other layers that hold focus: in Safari, Tab could jump out of the layer. Focus now wraps back.

## 0.22.0 · 30 Oct 2026

Five new Pro components, and many fixes.

### Added

- DataGrid (Pro): a grid for thousands of rows. Sort, resize and pin columns, select rows, search and filter. It renders on the server.
- SmoothScroll (Pro): weighted scrolling for the mouse wheel and trackpad.
- ScrollDraft (Pro): sets `--draft` from 0 to 1 as a box scrolls into view, to draw an SVG line.
- TextRise (Pro): words that rise one after another, on load or with the scroll.
- ScrollRuler (Pro): a ruler down the edge of the page that shows where you are.
- Retime `fullWidth`: fills the row.
- Tokens `--hl-scroll-ease`, `--hl-draft-start`, `--hl-draft-end`, `--hl-rise-span`, `--hl-rise-room`, `--hl-ruler-w`, `--hl-ruler-step`, and `--hl-datagrid-h`, `--hl-datagrid-col-w`, `--hl-datagrid-col-min`, `--hl-datagrid-col-max`, `--hl-datagrid-resize-step`, `--hl-datagrid-resize-hit`, `--hl-datagrid-options-h`, `--hl-datagrid-order`.

### Fixed

- Dialog, Sheet and Drawer: in Safari, closing now returns focus to the button that opened them.
- Badge, Button, Calendar, CopyButton, Countdown, Kbd, OnionSkin, QrCode, SegmentedControl, Tag, ToggleGroup and AnimatedNumber no longer stretch to the full width of a column. `fullWidth` still fills the row.
- SegmentedControl: when stretched, the options share the room.
- Every disabled control uses `--hl-disabled-opacity`.
- Combobox toggle, Breadcrumb "Show full path" button and NotificationInbox tabs: touch targets are at least 44px.
- ColorPicker: focus on the picked swatch is visible.
- Blocks and templates: the NotificationsCenter bar no longer covers a focused row. Its phone layout, the Checkout "Place order" button and the SaaS starter's "Sign in" link keep their full size.

## 0.21.2 · 30 Oct 2026

Docs site only. No changes to the library.

## 0.21.1 · 30 Oct 2026

### Changed

- VideoPlayer: a toggle that is on, such as captions, is a solid light circle with a dark icon.

### Fixed

- VideoPlayer: captions no longer sit under the controls.
- VideoPlayer and AudioPlayer: hover and on fills are a small circle with a gap between buttons.

## 0.21.0 · 29 Oct 2026

Twelve new components, all in Pro.

### Added

- SwipeActions: swipe a row sideways to show its actions. `fullSwipe` runs the outer action.
- PullToRefresh: pull a list down from the top to load what is new.
- SortableList: put a list in order by dragging its handles, or with the keyboard.
- ImageCropper: crop and zoom a photo in a fixed frame, round for avatars. `onCropAreaChange` and `getCropArea` give the area in the photo's pixels.
- CompareSlider: a before and after with a divider you drag.
- MasonryGrid: items of mixed heights packed into columns.
- ColorPicker: saturation and brightness area, hue bar, hex field and preset swatches.
- SignaturePad: sign with a finger, pen or mouse. `typeInstead` adds a typed name.
- EmojiPicker: about 400 emoji in groups, with search and recently used ones.
- CalendarHeatmap: activity per day as a grid of shades.
- WeekSchedule: a week of events by the hour. On a phone it shows one day at a time.
- VirtualList: draws only the rows on screen. `scrollToIndex` jumps to one.
- Tokens `--hl-swipe-action-w`, `--hl-pull-distance`, `--hl-picker-area-h`, `--hl-picker-hue-h`, `--hl-swatch`, `--hl-picker-white`, `--hl-picker-black`, `--hl-signature-h`, `--hl-ink-w`, `--hl-heatmap-cell`, `--hl-heatmap-gap`, `--hl-heatmap-label`, `--hl-heatmap-1` to `--hl-heatmap-4`, `--hl-schedule-hour`, `--hl-schedule-gutter`, `--hl-schedule-min-w` and `--hl-schedule-indent`. `add`, `diff` and `update` list any your `tokens.css` is missing.

## 0.20.3 · 29 Oct 2026

Docs site only. No changes to the library.

## 0.20.2 · 29 Oct 2026

### Changed

- Blocks and templates name people by role ("Design lead", "You") and businesses by what they are, instead of made-up names. Emails are role addresses at example.com.

## 0.20.1 · 28 Oct 2026

### Changed

- `add`, `diff` and `update` check your `tokens.css` against the latest one. If tokens are missing, they list the names and lines to copy. Your file is never changed.

## 0.20.0 · 28 Oct 2026

A full bug audit of every component, block and template.

### Added

- Calendar, DatePicker and DateRangePicker `today`: the date to treat as today.
- CopyButton `failedLabel` (default "Could not copy"): shown when copying fails.
- Tokens `--hl-disabled-opacity` (`0.5`), `--hl-check-scale` and `--hl-check-peak-scale`.

### Changed

- Disabled controls use one opacity, `--hl-disabled-opacity`. Before, it was 0.3 to 0.6.
- On touch screens, small Buttons and IconButtons, Inputs, SegmentedControl items, Calendar month buttons and DateRangePicker icons give at least a 44px target.
- Button, Badge, Tag, BottomTabBar and SegmentedControl: long labels end in "…". Accordion, Collapsible, Timeline, EmptyState and Stepper wrap long words.
- Navbar: links that do not fit move into the menu.
- Pagination always shows 7 slots, and "…" stands for at least 2 pages.
- Two-digit years read from 80 years back to 20 years ahead: `85` is 1985, `30` is 2030.
- ContextMenu and Menubar: on a phone, a submenu that fits on neither side opens under its item.
- Lightbox arrows use `aria-disabled`, so focus stays on them at the first and last picture.
- VideoPlayer: at 320px wide the time moves under the seek bar.

### Fixed

- TimePicker: typing "1" in 12-hour mode picks 1, not 12.
- RichTextEditor: adding a link in a form no longer reloads the page. Pasting from Google Docs no longer makes everything bold.
- KanbanBoard: a dragged card follows the pointer. On a phone the board no longer widens the page.
- Dialog, Drawer, Sheet: a double click on a footer button no longer fires twice.
- MentionInput no longer reports people who were not mentioned.
- Combobox: the Escape that clears the text no longer closes a Dialog around it.
- SearchInput: its shortcut no longer pulls focus out of an open Dialog.
- Select no longer opens on Ctrl, Cmd or Alt keys.
- Toast announces the same message again when it repeats.
- Alert banner: links and buttons inside it are readable.
- Button and Spinner announce the loading state.
- NumberInput steps from the number being typed, and a disabled stepper no longer counts.
- PinInput: Delete and Cut clear a box, and six boxes fit on one line at 320px.
- TagInput: commas make tags on Android keyboards, and a pasted list makes one tag per line.
- Switch with a `name` submits its value in a form.
- CurrencyInput: Backspace right after a comma deletes the digit before it.
- RangeSlider: thumbs on the same value can be dragged apart either way.
- Textarea and Input reset their height, count and floating label with the form.
- FileUpload shows 999,999 bytes as "1 MB".
- TreeView: the first click after a drop works, and focus stays on an item moved by keyboard.
- Carousel: Play works while focus is inside.
- Calendar fits at 320px, and today moves on at midnight.
- RelativeTime counts days by calendar day, so two days ago never reads "yesterday".
- DatePicker and DateRangePicker clear bad typed text when you pick a date. A typed range can no longer span disabled days.
- ScrollArea: dragging the thumb to the end reaches the end.
- ResizablePanels: a collapsed panel stays collapsed on ArrowLeft and Home.
- VideoPlayer plays new `sources` when they change.
- Chart: the tooltip reads values aloud only while using the keyboard.
- Tag, Navbar, Breadcrumb, Sidebar, Stat, Link, ProgressBar, Collapsible and Pagination: fixes for focus, wrapping, ARIA values and overflow.
- Blocks: Checkout locks the cart while placing the order. Inbox and Schedule use one date for today. AppShell's Profile item opens a page. EventPage's calendar file downloads in Safari. Booking, TwoStepVerification, Onboarding, ProjectBoard and Schedule fit at 320px.

## 0.19.0 · 19 Oct 2026

### Added

- `npx hlmnhkl-ui init`: sets a project up in one step. It adds `tokens.css` and `base.css`, writes `hlmnhkl-ui.json` with your folder, and shows the import lines.
- `npx hlmnhkl-ui list`: shows every component, block, template and theme. `--kind blocks` shows one kind.
- `npx hlmnhkl-ui diff <name>`: shows what changed between your copy and the latest version.
- `npx hlmnhkl-ui update <name>`: shows the changes, asks, then replaces your copy. `--yes` skips the question. `tokens.css` and `base.css` are never replaced.
- Every copied file starts with one line naming hlmnhkl/ui and its licence.
- `llms.txt`, `llms-full.txt` and `registry.json` on the docs site, so AI coding assistants can find and install components.

### Changed

- `add` uses the folder in `hlmnhkl-ui.json` when there is no `--to`. A bare name still works: `npx hlmnhkl-ui button` is the same as `add button`.

### Fixed

- Toast: its hidden announcers no longer add 1px of scroll under the page.

## 0.18.0 · 18 Oct 2026

### Added

- TreeView `onMove`: drag items into folders, by pointer, touch or keyboard.
- `moveNode(nodes, id, folderId)`: applies a move to your tree data in one line.
- Token `--hl-tree-open-delay` (`800ms`): how long a closed folder waits under a dragged item before it opens.

### Changed

- TreeView: a node with `children: []` is a folder you can drop into. With `onMove`, Space picks up and Enter selects. Without it, Space still selects.

### Fixed

- The page did not scroll with the mouse wheel while the pointer was over a Table or a ScrollArea.

## 0.17.0 · 18 Oct 2026

### Added

- Skeleton `variant="sketch"`: dashed pencil outlines with no fill, for a quieter wait.
- Token `--hl-color-surface-raised`: the surface for something on a track, such as a sliding pill or slider thumb.

### Changed

- Dark mode: SegmentedControl and ToggleGroup pills and Slider and RangeSlider thumbs use the raised surface. `--hl-shadow-1` and `--hl-shadow-2` are fainter.

## 0.16.0 · 18 Oct 2026

### Added

- Table `groupBy`: gathers rows under a header per group, with a row count.
- Route (Pro): progress as a journey, with stops on a road and a marker. `value` can sit between two stops, such as 1.5.
- Token `--hl-wheel-tilt` (`18deg`): how far each wheel row tilts.

### Changed

- TimePicker: wheels turn like a drum. Hours and minutes go round, so 59 rolls on to 00.

## 0.15.2 · 18 Oct 2026

### Removed

- Pro block List and detail. Team members, Inbox and Orders cover it.
- Pro theme Ink. Slate covers a cool blue-grey.

## 0.15.1 · 18 Oct 2026

### Fixed

- Safari no longer shows a small dot where a hidden line starts in Stepper, Checkbox, CopyButton, ProgressRing, PasswordInput and Table row checkboxes.
- Tabs fit a narrow phone more often. Every tab is at least 44px wide.

## 0.15.0 · 17 Oct 2026

### Added

- Retime (Motion): one control sets the speed of every animation: Off, Slower, Normal or Faster. It remembers the choice.
- OnionSkin (Motion): when a value changes, the old one stays as a faint ghost for a moment.
- Register and `morph()` (Motion): give the same `mark` to an element before and after a change, run the change in `morph()`, and the element glides to its new place.
- Input and SearchInput `size="sm"`: a 32px field for toolbars. On touch its text stays 16px.
- Token `--hl-motion-scale` (default `1`). Every duration is its base times this number. `0` is no motion.
- Token `--hl-press-scale-strong` (`0.9`): small controls press deeper.
- Token `--hl-blur-sm` (`6px`) for small things settling in.

### Changed

- The npm package and the public repo hold only the 50 free components. The other 53 are in Pro. `npx hlmnhkl-ui add combobox` (or any Pro name) says it is in Pro.
- `--hl-ease-spring` and `--hl-ease-bounce` overshoot much less, so motion no longer wobbles.
- Dark theme is softer: the page is `#161616`, and text is `#ececec`.
- Theme tokens also apply under `[data-theme="light"]` and `[data-theme="dark"]` on any element, so a part of the page can have its own theme.
- Marquee: `pauseButton` is now `false` by default.
- AudioPlayer: new layout, with play, title and controls on top and the timeline below.
- Press scales and small sizes use tokens, so reduced motion turns them off.

### Fixed

- The sliding pill or underline in SegmentedControl, Tabs, Pagination, Navbar and ToggleGroup no longer bounces past its place. Carousel dots, ResizablePanels and Sheet also change size with no overshoot.
- Calendar: a range can no longer span a disabled day. Moving to a shorter month keeps the last day. Selected months stay readable on hover.
- Calendar typed dates: th-TH no longer adds 543 years, and ar-EG and fa-IR dates parse back.
- DatePicker and DateRangePicker no longer show an error when the field loses focus without a change.
- Combobox, MultiSelect, TagInput, MentionInput, InlineEdit and SearchInput ignore Enter while an input method (Chinese, Japanese, Korean) is picking a word.
- NumberInput reads a minus sign written as U+2212.
- Alert: closing it moves focus to the next control.
- Breadcrumb: after "…" expands the trail, focus moves to the first link it showed.
- Accordion: arrow keys in a nested accordion no longer move the outer one.
- Tabs and ToggleGroup always keep one tab stop.
- SegmentedControl: arrow keys move from the focused option.
- TreeView: disabled branches no longer open or close.
- DropdownMenu and ContextMenu: Tab closes the menu and returns focus to the trigger. Long menus scroll.
- Tooltip and HoverCard: Esc closes only them, not a dialog behind them.
- Toast: error toasts are announced right away. Tapping a toast no longer closes an open dialog.
- Dialogs and sheets no longer make the page jump sideways.
- Sheet springs back if it is dragged down but the app keeps it open.
- Pagination scrolls inside itself on a narrow phone.
- Table and Chart data tables can be scrolled with the keyboard.
- DonutChart: a tap on a slice shows its value on touch screens.
- Carousel: an index past the last slide no longer makes every slide inert.
- Image: with `width` and `height` but no `ratio`, the space is reserved. A missing `src` shows the fallback.
- Rating: on touch screens each tap picks a whole star.
- Radio: `role="radiogroup"`, and each radio is marked invalid when the group has an error.
- Switch keeps your own `aria-describedby` next to its description.
- Divider with a label: screen readers read the label.
- KanbanBoard: column counts read once, and moves are announced politely.
- Stat: a change too small to show reads as flat, not "up 0%".
- ChatThread, CommentThread and NotificationInbox skip the time for an invalid date instead of crashing.
- RichTextEditor: shortcut labels no longer differ between server and client.
- Timeline shows its events without JS.
- ScrollArea and Tabs scroll at once with reduced motion.
- VideoPlayer: a tap on the centre wakes the controls, and the time updates when playback starts.
- Buttons inside Calendar, Collapsible, Navbar, Menubar, Sidebar, Stepper, Tabs, TimePicker, Toolbar and BottomTabBar use the page font and colour.
- Carousel dots are at least 44px to tap.

## 0.14.7 · 16 Oct 2026

### Fixed

- Table lost its column headers under 560px, even in the default `layout="scroll"`. Headers show again.

## 0.14.6 · 16 Oct 2026

### Added

- Table `layout` prop: `'scroll'` (default) or `'stack'`. Use `'stack'` for tables that read better as cards on a phone.
- Token `--hl-table-cell-max`, a cell's widest, so long text wraps in its column.

### Changed

- Table on a narrow screen keeps its columns and scrolls sideways. Before, it turned rows into cards. That is now `layout="stack"`.

### Fixed

- Table cards (`layout="stack"`) no longer show an empty band when there are no sort buttons or select-all box.

## 0.14.5 · 16 Oct 2026

### Added

- Token `--hl-text-input` for text typed into a field. It is at least 16px on a touch screen.

### Fixed

- iPhone Safari no longer zooms in when a field is tapped. Affects Input, Textarea, Combobox, MultiSelect, TagInput, NumberInput, MentionInput, InlineEdit, RichTextEditor, ChatThread and CommentThread.
- Accordion questions were blue on iPhone Safari. They now use the text colour.
- DescriptionList no longer squeezes to almost nothing in a centred or shrink-to-fit box.
- Tooltip works on touch screens: a tap shows the tip.
- HoverCard works on touch screens: the first tap opens the card, a second follows the link, and a tap elsewhere closes it.

## 0.14.4 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.14.3 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.14.2 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.14.1 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.14.0 · 14 Oct 2026

Works in Next.js, and no uppercase labels.

### Changed

- Chart: the data table opens and shuts smoothly.
- No uppercase labels: Sidebar, DropdownMenu, ContextMenu, Menubar and CommandPalette group labels, Table headers, Divider text and Countdown units use sentence case. The blocks and templates follow.
- The backup code field in the Two-step verification block no longer forces capitals.

### Fixed

- Components work in the Next.js App Router. Components with state or click handling start with `'use client'`.

## 0.13.0 · 14 Oct 2026

One command to install, and no sticky hover on phones.

### Added

- Install with one command: `npx hlmnhkl-ui@latest add button` (or `pnpm dlx`, `yarn dlx`, `bunx`). Files go to `src/ui` unless you pass `--to`.
- Names work in kebab case too, such as `date-picker`.

### Fixed

- Hover styles no longer stay on after a tap on touch screens.
- The VideoPlayer seek thumb shows on touch screens.

## 0.12.0 · 14 Oct 2026

A licence.

### Added

- MIT licence for the components, tokens and the add command.
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

- 4 templates, each a full app with working navigation: SaaS starter, Workspace, Admin console and Marketing site.
- 5 brand themes (Slate, Forest, Ink, Clay, Plum), each in light and dark, plus Compact and Comfortable density. Apply them with `data-theme-brand` and `data-density`.
- `npm run add` copies blocks, templates and themes too, with the components they need.
- Select `hideLabel`: keeps the label for screen readers only.
- Sidebar `headerCollapsed`: shows something small, such as a logo, while collapsed.

### Fixed

- A collapsed Sidebar no longer clips the header text.
- Team members shows one "Role" heading instead of a label on every row.

## 0.10.0 · 14 Oct 2026

22 more blocks.

### Added

- 22 blocks, 30 in total: Forgot password, Two-step verification, Onboarding, Profile, Team members, Billing, Notifications center, Inbox, Project board, Schedule, Data table, Analytics report, File manager, Search results, Orders, Booking, Checkout, Invoice, Help centre, Contact form, Pricing table and Event page.
- KanbanBoard `onCardOpen`: a click or Enter opens a card.
- RadioGroup `error`, shown like field errors.
- CommandPalette items take a `tag`, such as "Pro".

### Changed

- Blocks, templates and themes are part of hlmnhkl/ui Pro, coming soon.
- Breadcrumb items without `href` are real buttons.
- Card `title` accepts any content.

### Fixed

- Dropdowns and pickers opened inside a Dialog, Drawer or Sheet appear on top of it.
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
- VideoPlayer and AudioPlayer.
- QrCode, with download as SVG.
- Tour: a guided walkthrough of a page.
- `npm run add -- Button --to ../my-app/src/ui` copies components and what they need into your project. It never overwrites your files unless you ask.

### Changed

- Destructive items in DropdownMenu and ContextMenu are red and bold.

## 0.7.1 · 14 Oct 2026

Docs site only. No changes to the library.

## 0.7.0 · 14 Oct 2026

Malaysian inputs and nine component gaps closed.

### Added

- IcInput: MyKad number with dashes added as you type, and helpers to read the birth date.
- PhoneInput: a fixed +60 prefix, mobile and landline formats, and an E.164 value such as `+60123456789`.
- CurrencyInput: RM amounts with separators as you type and exact values in sen.
- AddressFields: address lines, postcode, city and the 13 states and 3 federal territories.
- Grid `steps="halves"`: steps 4 columns to 2 to 1.
- Button `href`: renders a link with the same look.
- Sidebar `collapsible` and `fill`, Card `fill`, Checkbox `error` and Split `stacked`.
- EmptyState `headingLevel` now takes 1.

### Changed

- Button with `aria-disabled` looks disabled but keeps focus, and ignores clicks.
- Split leaves no gap when there is no sidebar.
- SearchInput hides its "/" hint on touch screens.

## 0.6.0 · 14 Oct 2026

Colour where it means something.

### Added

- Status colour tokens: `--hl-color-success`, `--hl-color-warning`, `--hl-color-danger` and soft versions.
- Badge `tone`: `neutral`, `success`, `warning`, `danger`.

### Changed

- Stat shows good changes in green and worse changes in red.
- Alert success, warning and error get a soft tinted background and a coloured icon.
- Toast success and error icons are green and red.
- Field errors show a red border and red message in every form field.
- Button `danger` is now solid red.

## 0.5.0 · 14 Oct 2026

Layout primitives and the first eight blocks.

### Added

- Layout primitives: Stack, Cluster, Grid, Container, Split, Center, AspectRatio, VisuallyHidden.
- Blocks: app shell, phone shell, sign in, sign up, dashboard, settings, list and detail, status pages.

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
- Fixes in Checkbox, Chart, DropdownMenu, KanbanBoard, field error messages, SegmentedControl, TagInput, Marquee, Pagination, Tabs and TreeView.

## 0.3.0 · 14 Oct 2026

Documented props.

### Added

- Every prop has a one-line description, shown when you hover it in your editor.

## 0.2.0 · 13 Oct 2026

The library gets its name.

### Changed

- Renamed from Monochrome UI to hlmnhkl/ui. The package is `@hlmnhkl/ui`, and tokens now start with `--hl-`.
- CommandPalette, Sidebar, Navbar and TreeView: the active item uses a filled background instead of a line on the left edge.

## 0.1.0 · 13 Oct 2026

First release.

### Added

- 73 animated components.
- Light and dark themes, reduced motion, and keyboard and screen reader support on every component.
