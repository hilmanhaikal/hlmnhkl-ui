# Components

Status: **done** means built, typed, in the docs site with demos, keyboard and screen reader support checked.

| # | Component | Category | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | Button | Actions | done | primary, secondary, ghost, danger; loading morph |
| 2 | IconButton | Actions | done | label required |
| 3 | Link | Actions | done | sweeping underline, external |
| 4 | CopyButton | Actions | done | icon morphs to a drawn check |
| 5 | Input | Text fields | done | top or floating label, help and error |
| 6 | Textarea | Text fields | done | auto-grow, live count |
| 7 | Select | Choices and pickers | done | custom listbox, select-only combobox pattern |
| 8 | Checkbox | Choices and pickers | done | drawn tick, mixed state |
| 9 | Radio (RadioGroup) | Choices and pickers | done | native radios in a fieldset |
| 10 | Switch | Choices and pickers | done | the thumb glides on the morph curve |
| 11 | SegmentedControl | Choices and pickers | done | sliding pill, radiogroup pattern |
| 12 | Slider | Choices and pickers | done | native range, value bubble |
| 13 | Tabs | Navigation | done | sliding underline |
| 14 | Accordion | Navigation | done | grid-rows height animation |
| 15 | Breadcrumb | Navigation | done | collapses long paths |
| 16 | Pagination | Navigation | done | gliding pill |
| 17 | Tooltip | Overlays | done | hover and focus, Esc |
| 18 | Popover | Overlays | done | non-modal dialog |
| 19 | DropdownMenu | Overlays | done | menu button pattern, staggered items |
| 20 | Dialog | Overlays | done | focus trap, docks to bottom on phones |
| 21 | Sheet | Overlays | done | bottom sheet, drag to close; detents (low, half, full) with a grabber that is a slider, modal only at full, a flick moves one height |
| 22 | Toast | Overlays | done | stack, swipe, auto dismiss with pause |
| 23 | Alert (and banner) | Feedback | done | dismiss folds height |
| 24 | EmptyState | Feedback | done | staggered entrance |
| 25 | ProgressBar | Feedback | done | determinate and indeterminate |
| 26 | Skeleton | Feedback | done | shimmer |
| 27 | Spinner | Feedback | done | breathing arc |
| 28 | Badge | Data display | done | pop on change, pulse dot |
| 29 | Tag (chip) | Data display | done | removable with exit, selectable |
| 30 | Avatar | Data display | done | fade-in photo; the group is AvatarGroup (129) |
| 31 | Card | Data display | done | hover lift |
| 32 | Kbd | Data display | done | presses with the real key |
| 33 | Divider | Data display | done | draws in once |
| 34 | AnimatedNumber | Data display | done | rolling digits, Intl formats |
| 35 | NumberInput | Text fields | done | press-and-hold repeat, rolling digits, Intl formats |
| 36 | PasswordInput | Text fields | done | show and hide, slash draws across the eye |
| 37 | SearchInput | Text fields | done | clear pops in, key shortcut with live Kbd |
| 38 | FormField | Text fields | done | label, slot, help, animated error; ids through context |
| 39 | ScrollArea | Layout | done | native scroll, drawn thumb fades in, drag and track click |
| 40 | Collapsible | Layout | done | grid-rows height animation, own or built-in trigger |
| 41 | Table | Data display | done | aria-sort, FLIP row reorder, sticky header, selection, scrolls sideways on narrow screens with the first column pinned, or cards with layout="stack" |
| 42 | Stack | Layout | done | column with even gaps, align, `as` for lists and sections |
| 43 | Cluster | Layout | done | wrapping row for buttons and tags, row gap, justify, no-wrap option |
| 44 | Grid | Layout | done | fixed columns or auto-fit by min width, optional column cap, one column on a phone, no media queries |
| 45 | Container | Layout | done | centred max width from tokens, side padding clears the safe area |
| 46 | Split | Layout | done | sidebar at start or end, stacks under 640px of its own width (container query) |
| 47 | Center | Layout | done | centres both ways or across only, min height tokens, text centring optional |
| 48 | AspectRatio | Layout | done | holds a ratio, child fills it, img and video crop with cover |
| 49 | VisuallyHidden | Layout | done | clip pattern, focusable variant shows on focus for skip links |
| 50 | Retime | Motion | done | one speed for every animation: Off, Slower, Normal, Faster; sets `--hl-motion-scale`; remembers the choice; reduced motion still wins |
| 51 | Toggle | Actions | done | one button with aria-pressed, controlled or not, Button sizes, round icon-only form with aria-label, the fill pops in |
| 52 | AlertDialog | Overlays | done | role alertdialog on Dialog's parts, focus starts on Cancel, Esc cancels, an outside tap does nothing, danger tone, docks to the bottom on phones |
| 53 | Fieldset | Text fields | done | native fieldset and legend, description and error linked to the group, native disabled reaches every field |
| 54 | CheckboxGroup | Choices and pickers | done | Checkboxes sharing one value list in option order, legend, description, one error that marks every box, vertical or in a row |
| 55 | Meter | Feedback | done | role meter, low, high and optimum like the HTML meter, tone by word, icon and colour, notches where the ranges start |
| 56 | ButtonGroup | Actions | done | joined buttons with shared borders and rounded ends, role group with a label, row or column, the focused button rises above its neighbours |
| 57 | InputGroup | Text fields | done | a field with text, an icon or a button joined to either side, one border and focus ring, side text read with the field |
| 58 | AvatarGroup | Data display | done | stacked Avatars, max then "+N" named "N more", the group names everyone, fans out on hover; own folder, Avatar still re-exports it |
| 59 | CodeBlock | Data display | done | TSX, HTML, CSS and shell colouring from --hl-code-* tokens, title row, copy button, optional line numbers, keyboard-scrollable pre; the docs site uses it |
| 60 | Fab | Actions | done | one main action in the thumb zone above the home indicator; extended label pours into the icon on scroll down; actions pour up out of it, focus moves in, Esc returns it |
| 61 | ThemeToggle | Actions | done | sun turns into moon; sets data-theme and remembers it, or controlled; themeScript in head stops a dark flash; follows the system with no saved choice |
| 62 | Prose | Layout | done | styles plain HTML from Markdown or a CMS for reading on a 68ch line; quotes on a soft panel; zero-weight rules so your classes win |
| 63 | TableOfContents | Navigation | done | a page's sections as a strip of frames, read, here and ahead; smooth scroll that respects reduced motion, focus moves to the heading, shareable #ids, optional back to top |
| 64 | HoldToConfirm | Actions | done | hold to run a risky action; a line burns along the edge out both ways from the finger; early release runs it back; one tap or key press opens Cancel and Confirm in place |
| 65 | MorphButton | Actions | done | the button's surface grows into its own panel from where it sits; the label stays and names the dialog; focus in, Esc and outside tap close, focus returns |
| 66 | Dial | Choices and pickers | done | turn to set a value; follows the hand, a let-go glides onto a step, strong marks stand out; three looks in one API: a printed knob (default), mercury levels and a sideways speed arc; slider keys, no mouse wheel by default |
| 67 | RulerScrubber | Choices and pickers | done | drag a ruler under a fixed needle, or flick it and it coasts; ticks lean toward the needle only while it moves, flat at rest; strong marks with a tag; pan-y, sideways wheel only |
| 68 | PickerWheel | Choices and pickers | done | a true 3D cylinder for any list, one or many columns; follows the hand, a let-go glides onto a row, strong rows stand out; one spin button per column in a labelled group (APG keys, type to jump); TimeWheel and DateWheel presets with real month lengths |
| 69 | LivePill | Feedback | done | a status pill whose surface grows into a card from its own spot (liquid clip, 520ms open, 140ms close); its words keep their pixels as the card's last row; bottom by default, top too; the pill can be its own progress bar; Esc and tap outside close and return focus; one polite status, alerts shrink back after 5s unless held |
| 70 | SwipeDeck | Actions | done | throw the top card to either side; a ruler with two throw marks; past 35% of its width or a 600 px/s flick over 40px; the next card rises, the side's button fills toward it; undo plays the throw in reverse; arrows and Backspace; one polite status; cards behind inert; RTL start and end |
| 71 | SplitFlap | Data display | done | cells flip forward through a drum, fast then slow, 8 steps at most, cascade within 350ms, no bounce; the board grows or shrinks with the morph; text once in a hidden node, said when it lands; a change mid-run lands on the newest text |
