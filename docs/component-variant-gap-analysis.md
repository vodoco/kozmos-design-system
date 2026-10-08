# Component And Variant Gap Analysis

The data blocks between `<!-- generated:… -->` markers are written by
`pnpm components:variant:write` (`scripts/skills/check-variant-parity.mjs`);
`pnpm components:variant:check` fails when they are stale. Everything outside
the markers is commentary and is edited by hand — including the build order and
the reading of the numbers, which are judgements the script does not make.

## Why This Exists

`docs/status.md` reports which components are present on Web, iOS and Android, but it only proves
that a file exists. It says so itself: it does not grade API parity, behavioural
completeness, or variant coverage. This document is the missing half — it looks
_inside_ the files and compares the variant surface each platform can express.

React is the reference because it is the only platform carrying every
component with stories and tests. A gap means "React can express this and the other platform
cannot".

Platform policy exception: **LanguageSwitcher is web-only**. iOS and Android follow
device/app language and deliberately have no dedicated language button. The generated
absence lists count files, so they include this component; its native absence is not
an implementation backlog item.

Platform difference, by decision: **iOS SplitButton's menu half keeps SwiftUI's system
press** (decision 64, 2026-10-08). It is a `Menu`, which does not run a custom button
style's pressed state, so it draws the system's press instead of the `#0D44C2` pressed
token that the action half, React and Compose draw. Replacing the `Menu` to draw the
token was declined, so this is not a gap to close.

## Headline Numbers

<!-- generated:headline -->

| Measure                                   | Result |
| ----------------------------------------- | ------ |
| Components scanned                        | 120    |
| Declaring at least one React variant axis | 57     |
| Variations that are compositional only    | 63     |
| Components with variant gaps — iOS        | 14/57  |
| Components with variant gaps — Android    | 14/57  |
| Components with variant gaps — Figma      | 23/57  |
| Components with variant gaps — Vue        | 12/57  |
| Components absent entirely — iOS          | 9/120  |
| Components absent entirely — Android      | 8/120  |
| Components absent entirely — Figma        | 21/120 |
| Components absent entirely — Vue          | 23/120 |

<!-- /generated:headline -->

The important correction to the previous mental model: **most components carry
no variant axis in code at all** — the table's "compositional only" row counts them. They vary
compositionally, and those variations exist _only_ as Figma axes (`Dialog Content`, `Drawer Side`,
`Tabs Count/Active/State`). Code has no name for them, so no amount of native
work will "complete" them — they are a Code Connect mapping question, not a
missing-variant question.

## 1. Real Variant Gaps

Read this against the table above rather than from memory: it moves whenever a
component gains an axis on one platform before another.

<!-- generated:gaps -->

```
AIInputBar
  - ios: component/set absent
  - android: component/set absent
  - figma: component/set absent
  - vue: component absent
AIMessage
  - ios: component/set absent
  - android: component/set absent
  - figma: component/set absent
  - vue: component absent
AdaptiveMapShell
  - ios missing axes -> panelSizing (fraction, content)
  - android missing axes -> panelSizing (fraction, content)
  - figma missing axes -> panelSizing (fraction, content)
Alert
  - ios missing axes -> live (off, polite, assertive)
  - android missing axes -> live (off, polite, assertive)
ArrivalPanel
  - figma: component/set absent
  - vue: component absent
BottomNavigation
  - ios missing axes -> density (default, compact)
  - android missing axes -> density (default, compact)
  - figma missing axes -> density (default, compact)
Combobox
  - ios missing axes -> popupLayout (overlay, inline)
  - android missing axes -> popupLayout (overlay, inline)
  - figma missing axes -> popupLayout (overlay, inline)
DynamicIsland
  - android missing axes -> islandState (compact, expanded, minimal)
  - figma missing axes -> islandState (compact, expanded, minimal)
FieldWrapper
  - figma: component/set absent
FloorSelector
  - figma missing values -> variant: collapsible
Icon
  - figma: component/set absent
LanguageSwitcher
  - ios: component/set absent
  - android: component/set absent
  - figma: component/set absent
  - vue: component absent
Link
  - ios missing axes -> variant (default, subtle)
  - android missing axes -> variant (default, subtle)
List
  - ios missing axes -> density (default, compact)
  - android missing axes -> density (default, compact)
ManoeuvreCard
  - vue: component absent
MapAttribution
  - figma: component/set absent
  - vue: component absent
MapControlButton
  - figma missing axes -> emphasis (tinted, filled); labelPlacement (inline, stacked)
MapControlsGroup
  - figma missing axes -> locationLabelPlacement (inline, stacked)
MapStatusPill
  - figma: component/set absent
  - vue: component absent
MapView
  - ios missing axes -> variant (framed, fill)
  - android missing axes -> variant (framed, fill)
  - figma missing axes -> variant (framed, fill)
Notice
  - ios: component/set absent
  - android: component/set absent
  - figma: component/set absent
  - vue: component absent
POIResultCard
  - figma missing axes -> presentationStyle (legacy, sdk)
RouteLocationField
  - figma: component/set absent
  - vue: component absent
RouteProgressRail
  - figma missing axes -> appearance (theme, gradient); positionMode (static, live); motion (none, directional)
  - vue: component absent
RouteSetupPanel
  - figma: component/set absent
  - vue: component absent
Surface
  - ios: component/set absent
  - figma: component/set absent
  - vue: component absent
ThemeProvider
  - ios missing axes -> dir (ltr, rtl)
  - android missing axes -> dir (ltr, rtl)
  - figma: component/set absent
Tree
  - ios missing axes -> activationMode (select, toggle, select-toggle)
  - android missing axes -> activationMode (select, toggle, select-toggle)
```

<!-- /generated:gaps -->

Two kinds of thing appear here. "component/set absent" means the platform has
no such component at all — for Figma that is usually a painter nobody has
written yet. "missing axes" means the component exists and cannot express an
axis React has, which is the more interesting gap: `Link` is the standing
example, its `variant` on iOS and Android.

### Corrections made while validating

Three parser defects produced phantom gaps in the first pass. All are fixed; the
findings they generated were **not real**:

| Defect                                       | Phantom result                                                               |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| Key matching at every character offset       | `default` yielded `efault, fault, ault, …`                                   |
| Kotlin enum regex required a `Kozmos` prefix | Alert, Badge, Chip, Counter, SegmentedControl reported as missing whole axes |
| Kotlin/Swift case regex was line-anchored    | `Default, Info, Success` on one line yielded only `Default`                  |

The headline correction: **the recommended "Android variant catch-up" was a
phantom.** `BadgeVariant`, `BadgeSize`, `ChipVariant`, `ChipSize`, `CounterTone`,
`CounterSize`, `SegmentedControlSize`, and `AlertStatus` all already exist and
are complete. Android needed no enum work at all.

The naming inconsistency behind it is real but cosmetic: those enums are not
`Kozmos`-prefixed, and `AlertStatus` uses `Error` where React says
`destructive`.

## 2. Intentional, Not Backlog

Recorded in the analyzer's `INTENTIONAL` registry so they stop appearing as
gaps.

### Stack and Grid on native — decided

Native does **not** mirror the CSS axes (`align`, `justify`, `wrap`, `flow`,
`cols`, `rows`, `gap`, `xGap`, `yGap`, and the reverse `direction` values).
Product code uses `VStack`/`HStack`, `Row`/`Column`, and `LazyVerticalGrid`
directly, with spacing from `KozmosDimensions`.

Rationale:

- `wrap` needs Compose's experimental `FlowRow`; `baseline` is an
  `alignByBaseline()` child modifier, not a container parameter; `row-reverse`
  is content ordering. A faithful mirror is not possible, and a partial one
  means enum cases that silently no-op.
- `gap: 0,1,2,3,4,6,8` is Tailwind's numeric scale. Porting it would put
  Tailwind numbering into Swift and Kotlin instead of Kozmos spacing tokens.
- `cols: 1–6, 12` is a web 12-column grid concept; mobile uses adaptive sizing.
- It matches the call already made for Figma, and matches how SwiftUI and
  Compose model layout.

The design-system contract here is the **spacing token**, not the container.

### Also intentional

- `Stack.align/justify/wrap`, `Grid.align/justify/flow` on **Figma** — variant
  explosion (plugin README).
- `Text.size/weight/align/color` on **Figma** — Text is a typography
  token/style, not a component set. _Native Text is still open — see §4._
- Boolean props (`error`, `truncate`, `fullWidth`, `asChild`) are not variant
  axes.

## 3. Components Absent Entirely

<!-- generated:absent -->

### iOS — 9 of 120

AICompanionPanel, AIInputBar, AIMessage, AIMessageList, ActionCard, LanguageSwitcher, Notice, Surface, UserMessage.

### Android — 8 of 120

AICompanionPanel, AIInputBar, AIMessage, AIMessageList, ActionCard, LanguageSwitcher, Notice, UserMessage.

### Figma — 21 of 120

AICompanionPanel, AIInputBar, AIMessage, AIMessageList, ActionCard, ArrivalPanel, ClientAppBanner, FieldWrapper, Icon, LanguageSwitcher, MapAttribution, MapInfoPanel, MapStatusPill, NavigationAnnouncer, Notice, POIResultGroup, RouteLocationField, RouteSetupPanel, Surface, ThemeProvider, UserMessage.

### Vue — 23 of 120

AICompanionPanel, AIInputBar, AIMessage, AIMessageList, AISearchButton, ActionCard, ArrivalPanel, CategoryField, ClientAppBanner, Itinerary, LanguageSwitcher, ManoeuvreCard, MapAttribution, MapInfoPanel, MapStatusPill, MetaStrip, Notice, POIResultGroup, RouteLocationField, RouteProgressRail, RouteSetupPanel, Surface, UserMessage.

<!-- /generated:absent -->

## 4. Recommended Build Order

Closed:

- **Vue, as far as it went** — 18 wrappers added. It is not at parity: §3 lists the components
  with no Vue wrapper (Remaining, 4).
- **Stack, Grid, Text on native** — recorded as intentional. Layout and
  typography stay platform primitives with Kozmos tokens.
- **Heading** — `level` added on iOS and Android. Both previously had _no_
  heading semantics at all; iOS now sets `accessibilityHeading`, Compose sets
  `heading()`.
- **LocationPin** — `variant`, `size`, `labelPlacement` implemented on both
  natives, alongside the existing selected/featured/offFloor/disabled flags.
- **FloorSelector** — `variant` (vertical-list, horizontal-list,
  compact-stepper) implemented on both natives.
- **MapControlsGroup** — `locationPresentation` added on both natives, now
  composing the shared MapControlButton so the labelled presentation and its
  accessible name stay consistent.
- **FloatingActionButton, SearchBar, MapOverlay, ScrollArea** — recorded as
  intentional; see §2.
- **Android variant catch-up** — never needed; it was a parser defect.

Remaining:

1. **The Figma sets still absent** — the Figma list in §3, using the plugin lane already built.
   This subsumes the Figma "component/set absent" rows in §1.
2. ~~LocationPin `size` in Figma~~ — done. The set now uses the two-axis matrix
   builder: State x Size, 15 variants.
3. **Naming normalisation** — `Kozmos`-prefix the unprefixed native enums
   (`AlertStatus`, `BadgeVariant`, `ChipSize`, `CounterTone`,
   `SegmentedControlSize`, `StackDirection`) and reconcile `AlertStatus.Error`
   with React's `destructive`. Cosmetic, breaking, so do it with deprecated
   aliases.
4. **Vue** — the components §3 lists as absent from Vue. Vue is a private harness, and its work
   waits (decision 2).

## 5. Known Limits Of This Analysis

- It compares _declared_ variant surfaces, not rendered output. Two platforms
  can agree on axis and values and still look different.
- It does not check that a variant is _correct_, only that it can be expressed.
- Compositional variations (the headline's "compositional only" row) are out of scope by
  construction.
- Figma axes are read from the importer plugin's registry, which is the intended
  design, not from the live Figma file. A designer who adds a variant by hand
  will not appear here until the plugin registry is updated.
