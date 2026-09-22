# Design-system fixes the website needs — a handoff

**For:** the agent that changes Kozmos itself (`packages/`).
**From:** the Kozmos website, `apps/site` on the local branch `claude/kozmos-site`
(worktree `/Volumes/4TB Depo/development/K/kozmos-design-system-site`).
**Written:** 2026-09-22, after a design critique of the site; revised the same
day after an audit of the site, its copy and its tests, and again when the
home page's first screen became the Figma file's cover (GAP-54). Every number
below was measured on the site's production build.

The site is built from Kozmos components and tokens only. Where Kozmos fell
short, the site did not work around it: the gap is recorded in
[`GAPS.md`](./GAPS.md) (GAP-01 to GAP-59, with the evidence), and the site
either composed an honest stand-in from Kozmos parts or left the defect
visible. This document turns those gaps into work for `packages/`, in
priority order, with the file and line, the change, and the site check that
proves it.

**The roadmap:** the site's `/roadmap` page reads each gap's priority from
this file: the `## Pn — …` sections, the `### GAP-nn` headings in them and
the first cell of their tables' rows. Keep those shapes, and a gap in one
priority only.

**Paths:** a bare path such as `Card/Card.tsx:38` is under
`packages/react/src/components/`; `styles/…` is under `packages/react/src/`.
Anything else is given from the repository root. Line numbers are those of
`f30c0f9`.

## Ground rules

- **Change `packages/`, not the site.** The site's own fixes are done.
- **Where:** the packages the site uses are those of the component branch
  `claude/pointr-browse-repairs` (the site is based on it at `f30c0f9`; the
  packages are unchanged since). Work in your own worktree of that branch, or
  wherever its owner says; the site rebases afterwards (its README,
  "Keeping up with the component branch").
- **Parity:** a part that exists in SwiftUI, Compose or Figma changes there
  too, as `docs/ds-handoff.md` and `pnpm components:contract:check` require.
- **CI:** everything the workflow runs must stay green — the main checks are
  on the site at `/get-started#checks` (`pnpm lint && pnpm build && pnpm
test`, the contract, token, class, install, Figma, browser, Storybook, iOS
  and Android checks).
- **Proof on the site:** each fix below names the site check it flips. The
  site pins today's defects on purpose (`tests/site.spec.ts`: the
  "design-system gaps, measured" tests, the `knownViolations` table, one
  `test.fail`), so a fix makes that check fail. Then flip it — change the
  expectation to the fixed one, or delete the entry — and set the gap to
  _fixed_ in `GAPS.md`.

To run the site against your packages:

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-site"
pnpm install
pnpm turbo run build --filter=@kozmos/site^...     # rebuild the Kozmos packages
pnpm --filter @kozmos/site build
pnpm --filter @kozmos/site test:e2e                 # Chromium, Firefox, WebKit
```

## At a glance

| Priority | Gap                            | Part                                                     | One line                                                                                         |
| -------- | ------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| P0       | GAP-38                         | AdaptiveMapShell sheet                                   | The drag handle is 4 px tall and its grip 0 px wide: three rules use unitless tokens as lengths. |
| P0       | GAP-40                         | MapView, MapOverlay, Navbar                              | Map overlays draw over the sticky header: equal z-index, and MapView does not isolate.           |
| P1       | GAP-52                         | The provider's preflight                                 | A caller's `border` inside the provider never draws: one selector test in the CSS plugin.        |
| P1       | GAP-56                         | Button                                                   | No gap between an icon and its label: every header's "Theme ⌄" touches.                          |
| P1       | GAP-57                         | Button                                                   | Its label cannot wrap: the longest icon name scrolls the icons page sideways at 320px.           |
| P1       | GAP-58                         | Toast                                                    | It draws no fill: over anything but a white page the words read through the toast.               |
| P2       | GAP-59                         | DynamicIsland                                            | Pinned to its own dark theme: on the dark page the capsule is black on black, 1:1.               |
| P1       | GAP-55                         | Listbox                                                  | Its column grows to the widest option: the site search scrolls sideways, and nothing truncates.  |
| P1       | GAP-45                         | Tokens (brand variant 1)                                 | Variant 1's dark 600 is 4.20:1 on the dark page, as text and as a fill.                          |
| P1       | GAP-31                         | Tokens (alert, success)                                  | Emotion text passes on white only: 4.29:1 on background-25, 3.59:1 on muted.                     |
| P1       | GAP-09                         | Button (as a link)                                       | `buttonVariants` on an anchor keeps its underline.                                               |
| P1       | GAP-03                         | ThemeProvider                                            | A dark-mode visitor sees a white page until the scripts run (1.9 s on fast 3G, 4× CPU).          |
| P1       | GAP-41                         | Navbar                                                   | No narrow-screen pattern; two rows at 320px whatever the content.                                |
| P1       | GAP-37, GAP-20                 | SearchBar                                                | Two clear buttons; unstyled in WebKit.                                                           |
| P1       | GAP-42                         | CardTitle                                                | Line height 1.0: wrapped titles touch.                                                           |
| P1       | GAP-43                         | Slider, Tabs, Rating, SearchBar, Chip, ToggleButton      | Targets under 44 px; the slider thumb is 20 × 20.                                                |
| P1       | GAP-39                         | RouteSummary                                             | Its title is always an `h2`.                                                                     |
| P1       | —                              | The React package                                        | Not tree-shaken: about 155 kB gzipped in the site's bundle, whatever it imports.                 |
| P2       | GAP-24, 29, 34, 36             | DynamicIsland, BottomNavigation, Backdrop, ToastViewport | Always fixed to the viewport.                                                                    |
| P2       | GAP-17, 28, 30, 32             | AdaptiveMapShell, SearchBar, Sidebar, ChipGroup          | Landmarks and groups that cannot be named or placed.                                             |
| P2       | GAP-53                         | AdaptiveMapShell, MapView                                | No edge-to-edge form: on a phone's rounded screen the sheet's bordered corners are cut.          |
| P2       | GAP-46, 47, 48                 | Stepper, Sidebar, Tree                                   | No narrow form: they overflow or lose content on a phone.                                        |
| P2       | GAP-50, 51                     | Spinner, Skeleton, Button; announcements                 | Motion that ignores the preference; no polite live region.                                       |
| P2       | GAP-49                         | SearchBar                                                | A caller's `onKeyDown` silently drops the component's analytics.                                 |
| P2       | GAP-44 and the rest            | see the table below                                      | API and structure.                                                                               |
| P3       | GAP-05, 06, 07, 08, 10, 15, 33 | new parts, icons, tokens                                 | Additions.                                                                                       |
| P3       | GAP-54                         | Tokens (effects, motion)                                 | No glow, gradient, blur scale or ambient duration: the cover's light is the site's own.          |

## P0 — broken for people using it

### GAP-38 · The map sheet's handle is 4 px tall and its grip invisible

- **Where:** `packages/react/src/styles/owned-components.css`, lines 156, 157
  and 166:
  `height: var(--primitives-layout-spacing-200)`,
  `padding-top: var(--primitives-layout-spacing-75)`,
  `width: var(--primitives-layout-sizing-500)`.
- **Why it breaks:** layout tokens are unitless (`16`, `6`, `40`); a unitless
  number is not a length, so the browser drops all three declarations. The
  handle (`role="slider"`, "Panel height") measures 388 × 4 px and its grip
  0 × 4 px, in every engine. These are the only three such declarations in
  the owned stylesheets (checked with a grep over `src/styles/*.css`).
- **Change:** `calc(var(--primitives-layout-spacing-200) * 1px)` and so on —
  the conversion the owned blur and slide rules already use. Give the handle
  a 44 px hit area while you are there (GAP-43).
- **Proof:** the site's test "GAP-38: the map sheet's handle is 4px tall and
  its grip has no width" fails; change it to expect a height of 16 (the
  padding is inside the border box; 44 with the hit area) and a grip width
  of 40.
- **Guard:** add a check to the package that no owned rule uses a
  `--primitives-layout-*` token without `calc(… * 1px)`.

### GAP-40 · Map overlays draw over the sticky header

- **Where:** `MapOverlay/MapOverlay.tsx:66` (`z-50`),
  `styles/owned-navbar.css:5` (`sticky top-0 z-50`), and
  `MapView/MapView.tsx:19`, whose root creates no stacking context.
- **Why it breaks:** equal z-index, and the map comes later in the document,
  so its overlays paint over the header as the page scrolls. Seen on the
  MapOverlay reference page and the kiosk example (and on the home page's
  map scene, before the cover replaced it); `AdaptiveMapShell` is safe
  because its root is `isolate`.
- **Change:** `isolate` on `MapView`'s root. Then give the layers an order
  in the tokens (`--primitives-layer-*`) in which a page's sticky
  navigation sits above a map's own overlays.
- **Proof:** "GAP-40: MapView does not isolate its overlays" (it reads a map
  on the MapOverlay page) fails; flip it to expect `isolate`. The site's own `isolation: isolate` on its frames can
  then go (`src/styles/site.css`, the comments name GAP-40).

## P1 — visible on the site's first screens, or failing WCAG AA

### GAP-52 · The provider's preflight zeroes a caller's border

- **Where:** `packages/react/postcss/scoped-css.cjs:56`. `compilerDefaults` is
  true for any rule whose selector is `*, ::before, ::after`, meant for
  Tailwind's `--tw-*` initialiser. The preflight's
  `border: 0 solid; box-sizing: border-box` rule has the same selector, so it
  skips the `:where()` of lines 65–74 and keeps `:scope`'s (0,1,0) (line 76).
  Scoped, it then beats any caller class of equal specificity.
- **Change:** decide by the declarations, not the selector: a rule is the
  initialiser only if all it declares is `--tw-*` custom properties. The
  border reset then weighs nothing, as the plugin's own comment intends.
- **Proof:** "GAP-52: the provider's preflight zeroes a caller's border on
  its own box" measures the same rule inside and outside the provider
  (0px and 1px today); flip it to expect 1px in both. The site's
  `Separator` hairlines and `Surface` specimens can stay: they are the
  intended parts, not workarounds.

### GAP-56 · `Button` puts no space between an icon and its label

- **Where:** `styles/owned-components.css:263` (`.kozmos-button`:
  `inline-flex`, no gap) and `:361` (`.kozmos-button-loader`, `mr-2`, the
  only spaced child).
- **Why it breaks:** a caller's `Icon` beside the label — as Code Connect maps
  Figma's Button (`Icon`, `Label Text`) and as Get started shows — touches
  the word. Figma keeps 8px between its loading indicator and its label
  (node `77:857`); the code keeps it for the spinner alone.
- **Change:** `gap` of the spacing scale's 100 on `.kozmos-button`; take the
  loader's `mr-2` off.
- **Proof:** "GAP-56: a Button's icon touches its label" fails; flip it to
  expect 8. The site's `site-button-icon` class and the dashboard's and
  inbox's `ex-dash-add`, `ex-inbox-prefs` can then go.

### GAP-57 · A `Button`'s label cannot wrap

- **Where:** `styles/owned-components.css:263` (`.kozmos-button`:
  `white-space: nowrap`), which everything inside the button inherits.
- **Why it breaks:** a label wider than the button cannot break, so it
  overflows and takes the page with it: the icons page's longest name,
  `taxonomy-transportation-space-boarding-gate`, asks for 372px inside a
  288px button and scrolls a 320px phone sideways — WCAG 1.4.10. There is no
  prop for it, and a class on the Button would overturn a property the
  component sets.
- **Change:** `white-space: normal` with `overflow-wrap: anywhere` on
  `.kozmos-button` (the short labels Kozmos draws today are unaffected: they
  fit on their line), or a `wrap` prop for the callers that need it.
- **Proof:** "GAP-57: a Button's label cannot wrap" fails (the page no longer
  scrolls sideways without the site's class); remove that expectation and the
  site's `site-icon-name` class.

### GAP-58 · `Toast` draws no background of its own

- **Where:** `Toast/Toast.tsx:38` — the root has `border`, `rounded-control`,
  `p-6` and `shadow-floating`, and no `bg-*`; its computed background is
  `rgba(0, 0, 0, 0)`.
- **Why it breaks:** a toast over anything but a white page is read through:
  the app's own list, a map or a photograph shows between its words. It looked
  solid only because the site's toast used to float over an empty page.
- **Change:** `bg-background` on the root, beside the border and the shadow,
  as `Card`, `Dialog` and `Menu` carry. `ToastAction`'s `bg-transparent` is
  deliberate and stays.
- **Proof:** "GAP-58: a Toast draws no background" measures the alpha of the
  toast's background on the Toast page; flip it to expect the background
  token, and take the sentence about it out of the demo's note.

### GAP-55 · A `Listbox`'s column is as wide as its widest option

- **Where:** `styles/owned-selection.css:3` (`.kozmos-listbox`: `grid`, no
  column template).
- **Why it breaks:** the implicit column sizes to the widest option's
  content; `truncate` on the label and description never engages, and the
  list scrolls sideways (676px options in the site search's 462px list).
- **Change:** `grid-template-columns: minmax(0, 1fr)`.
- **Proof:** "GAP-55: a Listbox's column is as wide as its widest option"
  fails (the list no longer overflows without the site's class); remove
  that test's expectation and the site's `site-search-list` class.

### GAP-45 · Brand variant 1's dark 600 fails contrast

- **Where:** `packages/tokens/src/tokens-dark.json:519`, the theme variant 1
  ramp's `600`: `#6258F3` (Figma variable `VariableID:1440:2442`).
- **Why it breaks:** 4.20:1 on the dark page's `background-0`, both as text
  (`text-primary`) and as a fill under black ink (a selected Chip, a default
  Button), once a product re-points the theme to variant 1 — which is what
  the variants are for. The default ramp's dark 600 is 6.17:1, variant 2's
  4.99:1; the light theme passes everywhere.
- **Change:** a lighter dark 600 for variant 1 (the variant's own dark 700,
  `#867EF6`, reads 6.33:1), in the tokens and in Figma. Then add each
  variant's "primary action" and "brand tint surface / primary text" pairs
  to `packages/tokens/src/contrast-contract.json`, so every ramp a product
  may choose is measured.
- **Proof:** "GAP-45: the first brand variant's 600 reads 4.20:1 on the dark
  page" fails; flip it to the new ratio. The `knownViolations` entry for
  `/components/theme-provider` (`theme: "dark"`) reports "no longer occurs";
  delete it.

### GAP-31 · Emotion text passes on white only

- **Where:** two paths carry the same two values. The semantic text roles,
  `--semantics-emotion-alert-text` (`#a06b04`) and
  `--semantics-emotion-success-text` (`#197f4c`), which the outlined `Tag`
  reads (`utils/emotion.ts:38–42`). And Tailwind's `warning` and `success`
  colours, which are the primitives `emotional-alert-800` and
  `emotional-success-800` (`packages/react/tailwind.config.js:75–82`), read by
  `Alert`'s variants (`Alert/Alert.tsx:15–16`) and the field messages
  (`styles/owned-components.css:92–96`).
- **Why it breaks:** measured as text: alert 4.56:1 on white, 4.29 on
  `background-25`, 4.07 on `background-50`, 3.59 on `background-100`
  (Kozmos's `muted`); success 5.02, 4.72, 4.48 and 3.95. A Kozmos `Card` is
  white, so a warning inside one passes; on any muted surface it fails.
- **Change:** darker text steps for both emotions, tuned against the muted
  surfaces, reached by both paths (the semantic roles and Tailwind's
  `warning` and `success`). Add the text pairs on `background-25`, `-50` and
  `-100` to the contract (its existing "card / foreground" pair is white,
  `background-0`).
- **Proof:** the `knownViolations` entries for `/components/alert`, `input`,
  `date-picker` and `tag` (all `theme: "light"`) report "no longer occurs";
  delete them. The dashboard's solid content surface (`Dashboard.css`, which
  names GAP-31) can then go.

### GAP-09 · A link drawn as a button keeps its underline

- **Where:** `styles/owned-components.css:261`, `.kozmos-button`; the React
  README tells consumers to put `buttonVariants` on their router's link.
- **Change:** `text-decoration: none` on `.kozmos-button` (and its hover and
  focus states).
- **Proof:** "GAP-09: a link drawn as a button keeps its underline" fails;
  flip it to expect `none`.

### GAP-03 · A dark-mode visitor sees a white page first

- **Where:** `ThemeProvider/ThemeProvider.tsx` — the stored choice is read at
  line 69 and `data-theme` is set on the provider's root at line 115, both
  in React, so a pre-rendered or server-rendered page paints light first.
  Measured: 63 ms of white on a fast line, 1.9 s on fast 3G with a 4×
  slower CPU.
- **Change:** the components must be dark before hydration, not only the
  document. Kozmos declares its dark tokens on
  `[data-kozmos-root][data-theme=dark]`, and the provider root is rendered
  `data-theme="light"`, so a script that sets `<html data-theme>` alone
  changes nothing a visitor sees. Either export a pre-paint script (a string
  or a `<ThemeScript>` for the document's head) that resolves the theme as
  the provider does (its `storageKey`, `defaultTheme`, the system
  preference) and make the provider honour it on an ancestor, or give
  `system` a `prefers-color-scheme` fallback in the CSS. Document it in the
  React package's README, beside the provider.
- **Proof:** "GAP-03: a dark-mode visitor's page is drawn light until the
  scripts run" blocks the scripts and reads the header's painted background:
  white today. With a CSS fallback it fails at once; with a script it fails
  once the site adds it to `src/root.tsx`. Flip it to expect
  `rgb(0, 0, 0)`.

### GAP-41 · `Navbar` has no narrow-screen pattern

- **Where:** `styles/owned-navbar.css:13–15` (`.kozmos-navbar-leading`,
  `flex: 1 1 32rem`) and `:29–32` (`.kozmos-navbar-navigation`,
  `flex: 1 1 16rem`, which wraps).
- **Why:** the leading group's 32rem basis pushes `actions`, `utilities` and
  `account` onto a second row on any screen narrower than about 32rem plus
  their width, and nothing collapses the links. The navigation slot's own
  16rem basis leaves a phone header little room beside it: at 320px nothing
  fits on one row, and the site shows its logo's K alone below 48rem.
- **Change:** a narrow-screen mode — a `collapseBelow` breakpoint that moves
  `navigation` into a `Drawer` behind a menu button — and a trailing group
  that stays on the first row; a navigation slot sized by its content.
- **Proof:** "GAP-41: at 320px the Navbar drops the header's tools to a
  second row" fails; flip it to expect one row. The site can then go back to
  passing links as `navigation` and tools as `utilities`
  (`src/site/SiteHeader.tsx` explains the current arrangement).

### GAP-37 and GAP-20 · SearchBar

- **Where:** `SearchBar/SearchBar.tsx:43`, `type = "search"` by default,
  passed to the input at `:68`.
- **GAP-37:** the browser's own cancel button shows beside Kozmos's 44 px
  clear. Hide `::-webkit-search-cancel-button` (and
  `::-webkit-search-decoration`) in the field's owned CSS, with
  `appearance: none` or `display: none`. **Proof:** "GAP-37: SearchBar keeps
  the browser's own clear button" fails (Chromium; it reads both
  properties); flip it to expect the button hidden.
- **GAP-20:** WebKit (Safari, iOS) does not apply the `@scope`d utilities to
  the input, so the field is drawn unstyled. Move its styling to owned CSS,
  as `Input` did. **Proof:** the `test.fail` in "the search field is drawn
  as Kozmos draws it" reports an unexpected pass in WebKit; remove the
  `test.fail`.

### GAP-42 · `CardTitle`'s line height is 1.0

- **Where:** `Card/Card.tsx:38`, `text-2xl font-semibold leading-none`.
- **Change:** the line height `Heading` uses at that size — Tailwind's
  `text-2xl`, 2rem (no token pairs a line height with 24px).
- **Proof:** "GAP-42: a CardTitle's line height equals its font size" fails;
  flip it to expect about 1.33.

### GAP-43 · Touch targets under 44 px

- **Where and what:** `Slider/Slider.tsx:174`, thumb `h-5 w-5` (20 × 20);
  `Tabs/Tabs.tsx:45`, trigger `py-1.5` (32 px tall); `Rating/Rating.tsx:64`,
  star `w-6 h-6` (24 × 24); `SearchBar`'s input is 23 px tall inside its
  44 px bar; `Chip` 28–36 px (`Chip/Chip.tsx:18–20`); `ToggleButton` 32–40 px
  (`ToggleButton/ToggleButton.tsx:35–37`); the sheet handle of GAP-38. The
  tokens' own `--primitives-touch-min` is 44px.
- **Change:** a 44 px hit area around each (padding or a pseudo-element),
  keeping the drawn size; the search input filling its bar.
- **Proof:** "GAP-43: the Slider's thumb takes a touch only on its own 20px"
  reads what a touch 20 px from the thumb's centre lands on — the track,
  today. A hit area of either kind makes it the thumb; flip the test to
  expect that.

### GAP-39 · `RouteSummary`'s title is always an `h2`

- **Where:** `RouteSummary/RouteSummary.tsx:70`.
- **Change:** a `titleLevel` prop like `POIDetailPanel`'s (`2 | 3`), with a
  way to render no heading at all (for a scene or a preview, where the
  summary is not a section of the page).
- **Proof:** none automatic. The home page's map scene, where the `h2` came
  first in the outline, has given way to the cover; the wayfinding example
  would pass the level its walking view needs.

### The React package is not tree-shaken

- **Where:** `packages/react` — `sideEffects` is already `["**/*.css"]`,
  yet everything ships. The likely cause, not yet verified: the 184
  top-level `Component.displayName = …` writes (185 with the one inside
  `ThemePortal`) and the unannotated `React.forwardRef(…)` calls, which a
  bundler must treat as side effects.
- **Measured:** the site's `kozmos-react-*.js` chunk is 523 kB, about 155 kB
  gzipped, whatever the page imports; the home page preloads 22 modules,
  about 300 kB gzipped, and its first paint was 7.1 s on fast 3G with a 4×
  slower CPU.
- **Change:** annotate the component factories `/* @__PURE__ */` (or build
  with a pure-annotation step) and move `displayName` into a pure form.
- **Proof:** a one-component consumer (`import { Button }`) bundles far less
  than 155 kB gzipped; the site's chunk shrinks on the next build.

## P2 — API and structure

| Gap                                         | Where                                                                                      | Change                                                                                                                              | Site check                                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| GAP-24 DynamicIsland fixed                  | `DynamicIsland/DynamicIsland.tsx:38`                                                       | One `placement` for the four viewport-fixed parts, in `FloatingActionButton`'s words: `"fixed" \| "inline"`, fixed by default here. | Demos hold them in a paint-contained screen; "GAP-24, 29, 34, 36: the parts that pin themselves" flips when placement lands. |
| GAP-29 BottomNavigation fixed               | `BottomNavigation/BottomNavigation.tsx:40`                                                 | As above.                                                                                                                           | As above.                                                                                                                    |
| GAP-34 Backdrop fixed                       | `Backdrop/Backdrop.tsx:12`                                                                 | As above.                                                                                                                           | The kiosk example's attract screen can use Backdrop.                                                                         |
| GAP-36 ToastViewport fixed                  | `Toast/Toast.tsx:16`                                                                       | As above.                                                                                                                           | The dashboard, the inbox and saved places can use toasts.                                                                    |
| GAP-17 shell panel is an `aside`            | `AdaptiveMapShell/AdaptiveMapShell.tsx:627`                                                | Let the host choose the panel's element or role.                                                                                    | The `SHELL_PANEL` entries in `knownViolations`. The `SIDEBAR` entries are not this gap and stay.                             |
| GAP-53 shell cannot fill a rounded screen   | `MapView/MapView.tsx:19`, `AdaptiveMapShell/AdaptiveMapShell.tsx:632–636`                  | An edge-to-edge form: the map without border or radius, the sheet with its top edge only (or its container's bottom radius).        | "GAP-53: on a phone's rounded screen…" fails; drop the phone search entry in `knownClippedEdges`.                            |
| GAP-28 search landmark unnamed              | `SearchBar/SearchBar.tsx:54`                                                               | Name the `role="search"` wrapper (`landmarkLabel`, or from the field's label).                                                      | `knownViolations` for `/components/search-bar` and `/components/adaptive-map-shell`.                                         |
| GAP-30 Sidebar navigation unnamed           | `Sidebar/Sidebar.tsx:57`                                                                   | `navigationLabel`, as `Navbar` has.                                                                                                 | `knownViolations` for `/components/sidebar`.                                                                                 |
| GAP-32 ChipGroup has no role                | `Chip/Chip.tsx:177`                                                                        | `role="group"` on the wrapper.                                                                                                      | The site's seven `role="group"` props can go.                                                                                |
| GAP-35 categories grid fixed at 4           | `BrowseCategoriesPanel/BrowseCategoriesPanel.tsx:63`                                       | `repeat(auto-fill, minmax(5.5rem, 1fr))` or a `columns` prop.                                                                       | The kiosk's directory column can narrow.                                                                                     |
| GAP-44 Switch and Checkbox full width       | `Switch/Switch.tsx:27`, `Checkbox/Checkbox.tsx:28`                                         | Size the wrapper to its content.                                                                                                    | "Make it yours"'s two switches then share their row.                                                                         |
| GAP-46 Stepper has no narrow form           | `Stepper/Stepper.tsx`                                                                      | A vertical orientation, or labels that give way to the current step's.                                                              | The onboarding example's `.ex-onboarding-steps` wrapper can go.                                                              |
| GAP-47 Sidebar has no narrow-screen form    | `Sidebar/Sidebar.tsx:44–46`                                                                | Turn into a rail or a drawer by its container's width.                                                                              | The dashboard's drawer and `.ex-dash-aside` wrapper can go.                                                                  |
| GAP-48 Tree row meta never shrinks          | `Tree/Tree.tsx:532–541`                                                                    | Let the meta shrink and truncate before the name; a `<div>` for the slot.                                                           | Saved places' `.ex-saved-note` rule can go.                                                                                  |
| GAP-49 SearchBar analytics lost             | `SearchBar/SearchBar.tsx:70–77`                                                            | Spread the props first and compose `onKeyDown`, as `onChange` is.                                                                   | — (the site has no analytics provider).                                                                                      |
| GAP-50 motion ignores reduced motion        | `Spinner/Spinner.tsx:25`, `Skeleton/Skeleton.tsx:10`, the Button's `.kozmos-button-loader` | `motion-reduce:` variants; let `motion: reduced` reach them.                                                                        | The motion page, the Spinner demo and the Button demo say so; change their words.                                            |
| GAP-51 no polite announcer                  | `NavigationAnnouncer/NavigationAnnouncer.tsx:39–46` (assertive only)                       | A polite announcer, or an `Alert` whose `live` prop keeps its region mounted.                                                       | The examples' persistent status regions (`.ex-*-live`) can go.                                                               |
| GAP-26 Text cannot inherit colour           | `Text/Text.tsx:46`                                                                         | `color="inherit"`, or no colour class unless asked.                                                                                 | The DynamicIsland demo can use `Text`.                                                                                       |
| GAP-27 useTheme has no direction            | `ThemeProvider/ThemeProvider.tsx:140`                                                      | Return `dir`.                                                                                                                       | —                                                                                                                            |
| GAP-11 EmptyState title not a heading       | `EmptyState/EmptyState.tsx:27`                                                             | A `titleLevel`.                                                                                                                     | —                                                                                                                            |
| GAP-12 Alert role and AlertTitle            | `Alert/Alert.tsx:32`, `:43`                                                                | Default role for a static note; a `live` choice; an `AlertTitle` level.                                                             | Pages pass `role="note"`, or `role="none"` inside a status region; the `/components/alert` `heading-order` entry.            |
| GAP-13 SelectTrigger label, Textarea helper | `Select/Select.tsx:34`, `Textarea/Textarea.tsx:8`                                          | A `label` on the trigger; `helperText` on Textarea.                                                                                 | Pages wrap them in `FieldWrapper` and add a `Text`.                                                                          |
| GAP-14 CardTitle always `h3`                | `Card/Card.tsx:31`                                                                         | A level.                                                                                                                            | Examples use `Heading` in cards; the examples index puts cards under an `h2`.                                                |
| GAP-16 TabsList neither wraps nor scrolls   | `Tabs/Tabs.tsx:30`                                                                         | Scroll or wrap on overflow.                                                                                                         | The site wraps TabsList in ScrollArea.                                                                                       |
| GAP-19 Navbar always sticky                 | `styles/owned-navbar.css:5`                                                                | A `sticky` prop.                                                                                                                    | Examples frame their Navbar in a canvas.                                                                                     |
| GAP-21 Heading scale tops out at 36 px      | `Heading/Heading.tsx:11`                                                                   | Reach the tokens' 60 px heading.                                                                                                    | The site sets display sizes from tokens.                                                                                     |
| GAP-25 MapView insists on 400 px            | `MapView/MapView.tsx:19`                                                                   | A smaller minimum, or none.                                                                                                         | Map demos get 400 px frames.                                                                                                 |
| GAP-01 NavigationItem `asChild` throws      | `NavigationItem/NavigationItem.tsx:149`                                                    | Make `asChild` work.                                                                                                                | `src/site/links.tsx` uses a click handler instead.                                                                           |
| GAP-02 reset.css ships raw `theme()`        | `packages/react/vite.config.mts:47–56` (the plugin that copies it into `dist/reset.css`)   | Process the preflight the build copies (8 `theme()` calls today).                                                                   | —                                                                                                                            |
| GAP-04 caller classes lose to utilities     | `Grid/Grid.tsx:8` (the `cols` variants), `:73` (default `none`); every scoped utility      | Responsive columns; a way for a caller's class to win (an unscoped layer, or `:where()`).                                           | The site's `overriddenSiteCss` check stays; the wrapper `Box`es it forced can go.                                            |
| GAP-18 POIDetailPanel on the shell's panel  | `POIDetailPanel`                                                                           | A presentation for AdaptiveMapShell's panel.                                                                                        | —                                                                                                                            |
| GAP-22 font-weight tokens are names         | tokens                                                                                     | Numeric weights.                                                                                                                    | —                                                                                                                            |
| GAP-23 component colours are baked          | tokens build                                                                               | Aliases to the ramps, so an override needs no matching by value.                                                                    | "Make it yours" matches 32 of 45 by value today (the other 13 are button ink and greys, rightly kept).                       |

### GAP-59 · `DynamicIsland` is its own dark theme, so a dark page hides it

- **Where:** `DynamicIsland/DynamicIsland.tsx` — the island renders inside a
  provider pinned to dark and paints `bg-background text-foreground` in that
  scope.
- **Why it breaks:** on the dark theme the capsule is `#000000` on a
  `#000000` page, 1:1, and `shadow-overlay` does not show on black: the
  letters float with no island around them.
- **Change:** give the capsule a shape of its own inside its dark scope — a
  hairline in `--semantics-border-subtle`, or a fill a step off the
  background (`background-25`). Keep the inverted colours: they are the look.
- **Proof:** "GAP-59: the island's capsule disappears into a dark page"
  measures the capsule against the screen behind it in the dark theme; flip
  it to expect a shape once there is one.

## P3 — additions

| Gap    | What Kozmos lacks                                                                                                                                                                                                | Suggested                                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| GAP-05 | A code block; `Text` has no monospace                                                                                                                                                                            | `CodeBlock` with copy, and `Text font="mono"`.                                                                   |
| GAP-06 | A skip link and visually hidden text                                                                                                                                                                             | `SkipLink` (drawn above the sticky header) and `VisuallyHidden`.                                                 |
| GAP-07 | Icons: sun, moon, display, copy, external link, pause, play                                                                                                                                                      | Add them; the site's theme menu and the cover's "Pause motion" then get an icon.                                 |
| GAP-08 | A footer                                                                                                                                                                                                         | `Footer`.                                                                                                        |
| GAP-10 | A way to draw a product's logo in the `Navbar`'s `logo` slot                                                                                                                                                     | A `Logo` part that draws a product's SVG in a colour role, or product glyphs in `Icon`.                          |
| GAP-15 | Venue icons: food and drink, toilets, accessible facilities, parking, first aid                                                                                                                                  | Add them; three examples leave those categories out today.                                                       |
| GAP-33 | A token for the route line on a map                                                                                                                                                                              | `semantics-map-route` (line, casing, walked part), both themes, in the contrast contract.                        |
| GAP-54 | Light: a glow, gradients, a blur scale, and a duration for motion that loops (the effects are three dark shadows and glass; the longest duration is 460 ms)                                                      | A glow role from the ramps with a spread, gradient tokens, a blur scale, an ambient duration and pause guidance. |
| —      | Docs: 37 component `.mdx` files open with the placeholder "Displays the X interface topology natively" (and DatePicker and TimePicker repeat it as a second paragraph); 11 components' docs carry no code at all | Write one real sentence and the missing code; the site picks them up on `pnpm generate`. The README lists them.  |

## Also found, outside the components

- **`@kozmos/react` develops against React 19 with `@types/react` 18**, so a
  React 19 app's `ReactNode` does not fit its props inside the workspace; the
  site maps the types to its own (its `tsconfig.json`). Move the package's
  dev types to 19.
- **`scripts/skills/check-completion.ts` predates the newest components:**
  `STATUS.md` lists 98 components against 104 folders, and the lanes it
  gives (which the site's reference uses) differ from Storybook's grouping
  for AISearchButton and CategoryField (Product SDK there) and for
  Itinerary, ManoeuvreCard and RouteProgressRail (Map there).
- **`scripts/check-token-contrast.mjs` pushes the category pairs inside its
  per-theme loop,** so the dark theme measures them twice; the "218 pairs"
  it prints counts the duplicates.
- **The contrast contract describes itself as "pairs for public semantic
  tokens",** but none of its 22 pairs is a `--semantics-*` role: they are
  primitives and component aliases. The site's colour page no longer
  repeats the description.
- **Native distribution:** the Swift package sits in `packages/ios`, not at
  the repository root, so it cannot be added by URL, and its library target
  depends on Figma's `code-connect` (`packages/ios/Package.swift:13`, `:20`);
  the Compose module has no Maven publishing configured.
- **CI runs Node 20,** which reached end of life on 2026-04-30; React Router 8
  (the site's next major) needs Node 22.
