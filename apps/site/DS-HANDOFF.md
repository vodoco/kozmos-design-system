# Design-system fixes the website needs — a handoff

**For:** the agent that changes Kozmos itself (`packages/`).
**From:** the Kozmos website, `apps/site`, on `main` since #55 (2026-09-28). It
was built on the branch `claude/kozmos-site`, in the worktree
`/Volumes/4TB Depo/development/K/kozmos-design-system-site`.
**Written:** 2026-09-22, after a design critique of the site; revised the same
day after an audit of the site, its copy and its tests, again when the home
page's first screen became the Figma file's cover (GAP-54), and again when the
parts that pin themselves to the window were put in a screen that holds them
(GAP-58, 59, 60). Every number below was measured on the site's production
build.

**Newest, and none of it touched `packages/`** — the site's branch changes
`apps/site` only. GAP-54 to GAP-61 came out of the home page's cover, the
screen that holds the parts pinned to the window, and the right-to-left
sample. GAP-62 to GAP-81 came out of a page-by-page review on 2026-09-22:
every number in them was measured in the browser, and each names the file and
line that causes it. They are measured but not yet pinned by tests, unlike
GAP-01 to GAP-61: Olcay parked that work on 2026-09-22. The short ones
first:

| Gap    | Part                               | Size of the change                                                        |
| ------ | ---------------------------------- | ------------------------------------------------------------------------- |
| GAP-55 | `Listbox`                          | One declaration: a column template.                                       |
| GAP-56 | `Button`                           | One declaration: a gap, and the loader's margin off.                      |
| GAP-57 | `Button`                           | Two declarations: let a label that cannot fit wrap.                       |
| GAP-58 | `Toast`                            | One class: the root has no fill.                                          |
| GAP-73 | `SplitButton`                      | One utility: `border-r-…/20`, so the outline survives.                    |
| GAP-75 | `ToggleButton`                     | One declaration: a gap, with GAP-56.                                      |
| GAP-67 | `Menu`                             | One prop default: `align="start"`.                                        |
| GAP-66 | `EmptyState`                       | Two props: `align="center"` on its title and description.                 |
| GAP-64 | `ChipGroup`                        | A `wrap` prop and `items-center`.                                         |
| GAP-71 | `AISearchButton`                   | A hover state.                                                            |
| GAP-62 | `Combobox`, `MultiSelect`          | Portal the open list, as six other components already do.                 |
| GAP-59 | `DynamicIsland`                    | Give the capsule an edge, so a dark page does not eat it.                 |
| GAP-60 | `DynamicIsland`                    | Lay the three presentations out around the camera, at Apple's sizes.      |
| GAP-61 | Breadcrumb, Menu, Tree, Pagination | Mirror the reading-direction glyphs, as the gallery's arrows already are. |

**Since 2026-09-28** (decision 44), Storybook is the component reference and
the site's component pages carry no demos. A site check below that read a
demo went with it, and says so; `GAPS.md` gives each gap's state now, and
the component's own stories in Storybook are where to see it.

The site is built from Kozmos components and tokens only. Where Kozmos fell
short, the site did not work around it: the gap is recorded in
[`GAPS.md`](./GAPS.md) (GAP-01 to GAP-95, with the evidence), and the site
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
- **Where:** the site and the packages are both on `main` now, and the site
  builds from the workspace's packages. When this was written, the site was
  based on the component branch `claude/pointr-browse-repairs` at `f30c0f9`.
  Work in your own worktree of a branch off `main`; the site follows as its
  README says ("Keeping up with `main`").
- **Parity:** a part that exists in SwiftUI, Compose or Figma changes there
  too, as `pnpm components:contract:check` requires.
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

To run the site against your packages, from the root of your worktree:

```sh
pnpm install
pnpm turbo run build --filter=@kozmos-ds/site^...     # rebuild the Kozmos packages
pnpm --filter @kozmos-ds/site build
pnpm --filter @kozmos-ds/site test:e2e                 # Chromium, Firefox, WebKit
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
| P1       | GAP-55                         | Listbox                                                  | Its column grows to the widest option: the site search scrolls sideways, and nothing truncates.  |
| P1       | GAP-45                         | Tokens (brand variant 1)                                 | Variant 1's dark 600 is 4.20:1 on the dark page, as text and as a fill.                          |
| P1       | GAP-82                         | Tokens (category fills)                                  | A category pill's fill is 2.52:1 on its own field: the count's shape is below WCAG 1.4.11's 3:1. |
| P1       | GAP-31                         | Tokens (alert, success)                                  | Emotion text passes on white only: 4.29:1 on background-25, 3.59:1 on muted.                     |
| P1       | GAP-09                         | Button (as a link)                                       | `buttonVariants` on an anchor keeps its underline.                                               |
| P1       | GAP-03                         | ThemeProvider                                            | A dark-mode visitor sees a white page until the scripts run (1.9 s on fast 3G, 4× CPU).          |
| P1       | GAP-41                         | Navbar                                                   | No narrow-screen pattern; two rows at 320px whatever the content.                                |
| P1       | GAP-20, GAP-37 (fixed)         | SearchBar                                                | Owned field styling fixes WebKit (#193, unreleased); the browser's second clear is hidden.       |
| P1       | GAP-42                         | CardTitle                                                | Line height 1.0: wrapped titles touch.                                                           |
| P1       | GAP-43                         | Slider, Tabs, Rating, SearchBar, Chip, ToggleButton      | Targets under 44 px; the slider thumb is 20 × 20.                                                |
| P1       | GAP-39                         | RouteSummary                                             | Its title is always an `h2`.                                                                     |
| P1       | — (fixed)                      | The React package                                        | Tree-shaken since #57: `import { Button }` costs an app 9.3 kB gzipped, not the whole 175 kB.    |
| P2       | GAP-59                         | DynamicIsland                                            | Pinned to its own dark theme: on the dark page the capsule is black on black, 1:1.               |
| P2       | GAP-60                         | DynamicIsland                                            | No room kept for the camera: Apple leaves 54% of the island's width, the component 12%.          |
| P2       | GAP-61                         | Breadcrumb, Menu, Tree, Pagination                       | No glyph mirrors in right to left; one rule in the package does it, for the gallery's arrows.    |
| P2       | GAP-24, 29, 34, 36             | DynamicIsland, BottomNavigation, Backdrop, ToastViewport | Always fixed to the viewport.                                                                    |
| P2       | GAP-17, 28, 30, 32             | AdaptiveMapShell, SearchBar, Sidebar, ChipGroup          | Landmarks and groups that cannot be named or placed.                                             |
| P2       | GAP-53                         | AdaptiveMapShell, MapView                                | No edge-to-edge form: on a phone's rounded screen the sheet's bordered corners are cut.          |
| P2       | GAP-46, 47, 48                 | Stepper, Sidebar, Tree                                   | No narrow form: they overflow or lose content on a phone.                                        |
| P2       | GAP-50 (fixed), 51             | Spinner, Skeleton, Button; announcements                 | Motion rests under the preference now; no polite live region.                                    |
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
- **Proof:** "GAP-40: MapView does not isolate its overlays" (it reads the
  kiosk directory's map) fails; flip it to expect `isolate`. The site's own `isolation: isolate` on its frames can
  then go (`src/styles/site.css`, the comments name GAP-40).

## P1 — visible on the site's first screens, or failing WCAG AA

### GAP-62 · `Combobox` and `MultiSelect` draw their list in the page

- **Where:** `Combobox/Combobox.tsx:326` and `MultiSelect/MultiSelect.tsx:406`
  — `absolute z-50` inside the field's own box, with no portal.
- **Why it breaks:** any ancestor that scrolls or clips cuts the list off. On
  the site's Combobox page, 174px of a 256px list is lost and only the first
  option shows. `Dialog`, `Drawer`, `Menu`, `Popover`, `Select` and `Tooltip`
  all portal through `createThemePortal`; these two are the exception.
- **Change:** portal the list the same way, positioned against the field, and
  offer a `portalContainer` as the others do.
- **Proof:** measured, not pinned by a test yet — open the Cities list on
  `/components/combobox` and compare the list's rect with the card's.

### GAP-73 · `SplitButton`'s outline variant loses its border

- **Where:** `SplitButton/SplitButton.tsx:44` — `border-r
border-primary-foreground/20`.
- **Why it breaks:** `border-r` sets one side's width, but the colour utility
  sets `border-color` on all four sides and outranks
  `.kozmos-button-outline`'s own. On the outline variant that paints white at
  20% over a white fill: the control's boundary measures **1.00:1**, so the
  button has no visible edge at all — WCAG 1.4.11 wants 3:1.
- **Change:** tint the seam with a side-specific colour
  (`border-r-primary-foreground/20`).
- **Proof:** measured on `/components/split-button`; not pinned by a test yet.

### GAP-75 · `ToggleButton` puts no space between icon and label

- **Where:** `ToggleButton/ToggleButton.tsx:32` — the base class string has no
  `gap`.
- **Why it breaks:** an icon beside a label touches it. GAP-56 covers the same
  defect in `Button`, but `ToggleButton` is a Radix Toggle with none of
  `.kozmos-button`'s CSS, so that fix will not reach it. Measured: 0.000px
  between the check icon's box and the label's text box.
- **Change:** the spacing scale's 100, with GAP-56; then check `Chip`, `Tag`
  and `SegmentedControl` for the same.
- **Proof:** the site's `site-button-icon` class is on its own toggles; a test
  pins `Button`'s 0px, not this one.

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
- **Proof:** fixed on 2026-09-22 (`7775c73`). "A button that holds an icon
  and words keeps them 8px apart" holds it on the site's own buttons; the
  check that read the Button page's demo went with the demos (2026-09-28).

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
- **Proof:** "GAP-58: a Toast draws no background" measured it on the Toast
  page's demo, which moved to Storybook with the check on 2026-09-28; the
  site shows no toast now. See it in the Toast stories.

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

### GAP-82 · A category pill's fill is 2.52:1 on its own field

- **Where:** the category tokens — `--semantics-category-fill-*` against the
  wash the same category paints behind a field.
- **Why it breaks:** the pill's ink passes (4.57 / 4.82 / 5.88 : 1), but its
  silhouette against its own field measures 2.52:1 (turquoise), 3.02 (green),
  3.74 (blue). WCAG 1.4.11 wants 3:1 for a graphic that carries meaning, and
  a count's pill is one.
- **Change:** hold a fill to 3:1 against the wash it sits on in
  `pnpm tokens:contrast:check`, as its ink is already held to 4.5:1 — or give
  the pill an edge.
- **Proof:** measured on `/components/category-field` in the light theme; not
  pinned by a test yet.

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

### GAP-20 and GAP-37 · SearchBar

- **Where:** `SearchBar/SearchBar.tsx:43`, `type = "search"` by default,
  passed to the input at `:68`.
- **GAP-37 is fixed** (2026-09-27, `d89e405`): one owned rule gives
  `::-webkit-search-cancel-button` and `::-webkit-search-decoration`
  `appearance: none` on `.kozmos-input` and `.kozmos-search-input`. The
  site's test now reads that rule out of the stylesheet, because reading the
  pseudo-element answers with the host's values and so could never fail.
- **GAP-20 is fixed on main (#193), not yet released:** the field
  uses an owned `.kozmos-searchbar-input` recipe (`2e602272`, isolated from
  Core `Search` in `99a55303`). The old WebKit `test.fail` reported an
  unexpected pass locally and in CI. "The search field is drawn as Kozmos
  draws it" now requires 15px text and no border in every engine; the SDK
  browser checks cover 200% text and Core `Search` recipe isolation. Physical
  Safari/iOS web-view acceptance remains separate. This fixes rendering, not
  composition: the reusable decorated Core field is still an open contract
  in `docs/sdk-core-composition.md` at the repository root.

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

### The React package is tree-shaken now (fixed)

- **Was:** the ES build was one file, and a bundler cannot drop the unused
  components inside one module. Measured on 2026-09-22: the site's
  `kozmos-react-*.js` chunk was 523 kB, about 155 kB gzipped, whatever the
  page imported; the home page preloaded 22 modules, about 300 kB gzipped,
  and its first paint was 7.1 s on fast 3G with a 4× slower CPU.
- **Fixed** on 2026-09-23, before the first publish (#57): one ES file per
  module, which `sideEffects: ["**/*.css"]` lets a bundler drop.
- **Measured on 2026-09-29,** against `main` and the published 0.5.0 alike,
  built with the site's Vite and every dependency but React bundled:
  `import { Button }` costs an app 9.3 kB gzipped, and the whole library
  175 kB (172 kB in 0.5.0). CI's `analyze-bundle`
  (`scripts/performance/bundle-analyzer.ts`) holds Kozmos's own share,
  dependencies aside: Button alone 1.29 kB, every export under 8 kB,
  everything 64 of its 68 kB.
- **On the site:** there is no Kozmos chunk any more. Each component is its
  own module, and what the site draws nowhere, directly or inside another
  component, stays out of its build: none of the code of ColorPicker,
  Combobox, MultiSelect, Toast, Tooltip and 13 more is in it. What no bundler
  trims is the stylesheet: all 28 kB of Kozmos's CSS, gzipped, ships with the
  site's.

## P2 — API and structure

| Gap                                                  | Where                                                                                      | Change                                                                                                                                                                       | Site check                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| GAP-24 DynamicIsland fixed                           | `DynamicIsland/DynamicIsland.tsx:38`                                                       | One `placement` for the four viewport-fixed parts, in `FloatingActionButton`'s words: `"fixed" \| "inline"`, fixed by default here.                                          | None since 2026-09-28: the demos that held them in a paint-contained screen, and their check, moved to Storybook.                                |
| GAP-29 BottomNavigation fixed                        | `BottomNavigation/BottomNavigation.tsx:40`                                                 | As above.                                                                                                                                                                    | As above.                                                                                                                                        |
| GAP-34 Backdrop fixed                                | `Backdrop/Backdrop.tsx:12`                                                                 | As above.                                                                                                                                                                    | The kiosk example's attract screen can use Backdrop.                                                                                             |
| GAP-36 ToastViewport fixed                           | `Toast/Toast.tsx:16`                                                                       | As above.                                                                                                                                                                    | The dashboard, the inbox and saved places can use toasts.                                                                                        |
| GAP-17 shell panel is an `aside`                     | `AdaptiveMapShell/AdaptiveMapShell.tsx:627`                                                | Let the host choose the panel's element or role.                                                                                                                             | The `SHELL_PANEL` entries in `knownViolations`. The `SIDEBAR` entries are not this gap and stay.                                                 |
| GAP-53 shell cannot fill a rounded screen            | `MapView/MapView.tsx:19`, `AdaptiveMapShell/AdaptiveMapShell.tsx:632–636`                  | An edge-to-edge form: the map without border or radius, the sheet with its top edge only (or its container's bottom radius).                                                 | "GAP-53: on a phone's rounded screen…" fails; drop the phone search entry in `knownClippedEdges`.                                                |
| GAP-28 search landmark unnamed                       | `SearchBar/SearchBar.tsx:54`                                                               | Name the `role="search"` wrapper (`landmarkLabel`, or from the field's label).                                                                                               | `knownViolations` for `/components/search-bar` and `/components/adaptive-map-shell`.                                                             |
| GAP-30 Sidebar navigation unnamed                    | `Sidebar/Sidebar.tsx:57`                                                                   | `navigationLabel`, as `Navbar` has.                                                                                                                                          | `knownViolations` for `/components/sidebar`.                                                                                                     |
| GAP-32 ChipGroup has no role                         | `Chip/Chip.tsx:177`                                                                        | `role="group"` on the wrapper.                                                                                                                                               | The site's seven `role="group"` props can go.                                                                                                    |
| GAP-35 categories grid fixed at 4                    | `BrowseCategoriesPanel/BrowseCategoriesPanel.tsx:63`                                       | `repeat(auto-fill, minmax(5.5rem, 1fr))` or a `columns` prop.                                                                                                                | The kiosk's directory column can narrow.                                                                                                         |
| GAP-44 Switch and Checkbox full width                | `Switch/Switch.tsx:27`, `Checkbox/Checkbox.tsx:28`                                         | Size the wrapper to its content.                                                                                                                                             | "Make it yours"'s two switches then share their row.                                                                                             |
| GAP-46 Stepper has no narrow form                    | `Stepper/Stepper.tsx`                                                                      | A vertical orientation, or labels that give way to the current step's.                                                                                                       | The onboarding example's `.ex-onboarding-steps` wrapper can go.                                                                                  |
| GAP-47 Sidebar has no narrow-screen form             | `Sidebar/Sidebar.tsx:44–46`                                                                | Turn into a rail or a drawer by its container's width.                                                                                                                       | The dashboard's drawer and `.ex-dash-aside` wrapper can go.                                                                                      |
| GAP-48 Tree row meta never shrinks                   | `Tree/Tree.tsx:532–541`                                                                    | Let the meta shrink and truncate before the name; a `<div>` for the slot.                                                                                                    | Saved places' `.ex-saved-note` rule can go.                                                                                                      |
| GAP-49 SearchBar analytics lost                      | `SearchBar/SearchBar.tsx:70–77`                                                            | Spread the props first and compose `onKeyDown`, as `onChange` is.                                                                                                            | — (the site has no analytics provider).                                                                                                          |
| GAP-50 motion ignores reduced motion                 | `Spinner/Spinner.tsx:25`, `Skeleton/Skeleton.tsx:10`, the Button's `.kozmos-button-loader` | Done: one owned rule rests the spinner, the skeleton and the assistant's ring under the preference and under `motion: reduced`.                                              | The motion page, the Spinner demo and the Button demo say so; change their words.                                                                |
| GAP-51 no polite announcer                           | `NavigationAnnouncer/NavigationAnnouncer.tsx:39–46` (assertive only)                       | A polite announcer, or an `Alert` whose `live` prop keeps its region mounted.                                                                                                | The examples' persistent status regions (`.ex-*-live`) can go.                                                                                   |
| GAP-26 Text cannot inherit colour                    | `Text/Text.tsx:46`                                                                         | `color="inherit"`, or no colour class unless asked.                                                                                                                          | The DynamicIsland demo can use `Text`.                                                                                                           |
| GAP-27 useTheme has no direction                     | `ThemeProvider/ThemeProvider.tsx:140`                                                      | Return `dir`.                                                                                                                                                                | —                                                                                                                                                |
| GAP-11 EmptyState title not a heading                | `EmptyState/EmptyState.tsx:27`                                                             | A `titleLevel`.                                                                                                                                                              | —                                                                                                                                                |
| GAP-12 Alert role and AlertTitle                     | `Alert/Alert.tsx:32`, `:43`                                                                | Default role for a static note; a `live` choice; an `AlertTitle` level.                                                                                                      | Pages pass `role="note"`, or `role="none"` inside a status region; the `/components/alert` `heading-order` entry.                                |
| GAP-13 SelectTrigger label, Textarea helper          | `Select/Select.tsx:34`, `Textarea/Textarea.tsx:8`                                          | A `label` on the trigger; `helperText` on Textarea.                                                                                                                          | Pages wrap them in `FieldWrapper` and add a `Text`.                                                                                              |
| GAP-14 CardTitle always `h3`                         | `Card/Card.tsx:31`                                                                         | A level.                                                                                                                                                                     | Examples use `Heading` in cards; the examples index puts cards under an `h2`.                                                                    |
| GAP-16 TabsList neither wraps nor scrolls            | `Tabs/Tabs.tsx:30`                                                                         | Scroll or wrap on overflow.                                                                                                                                                  | The site wraps TabsList in ScrollArea.                                                                                                           |
| GAP-19 Navbar always sticky                          | `styles/owned-navbar.css:5`                                                                | A `sticky` prop.                                                                                                                                                             | Examples frame their Navbar in a canvas.                                                                                                         |
| GAP-21 Heading scale tops out at 36 px               | `Heading/Heading.tsx:11`                                                                   | Reach the tokens' 60 px heading.                                                                                                                                             | The site sets display sizes from tokens.                                                                                                         |
| GAP-25 MapView insists on 400 px                     | `MapView/MapView.tsx:19`                                                                   | A smaller minimum, or none.                                                                                                                                                  | Map demos get 400 px frames.                                                                                                                     |
| GAP-01 NavigationItem `asChild` throws               | `NavigationItem/NavigationItem.tsx:149`                                                    | Make `asChild` work.                                                                                                                                                         | `src/site/links.tsx` uses a click handler instead.                                                                                               |
| GAP-02 reset.css ships raw `theme()`                 | `packages/react/vite.config.mts:47–56` (the plugin that copies it into `dist/reset.css`)   | Process the preflight the build copies (8 `theme()` calls today).                                                                                                            | —                                                                                                                                                |
| GAP-04 caller classes lose to utilities              | `Grid/Grid.tsx:8` (the `cols` variants), `:73` (default `none`); every scoped utility      | Responsive columns; a way for a caller's class to win (an unscoped layer, or `:where()`).                                                                                    | The site's `overriddenSiteCss` check stays; the wrapper `Box`es it forced can go.                                                                |
| GAP-18 POIDetailPanel on the shell's panel           | `POIDetailPanel`                                                                           | A presentation for AdaptiveMapShell's panel.                                                                                                                                 | —                                                                                                                                                |
| GAP-22 font-weight tokens are names                  | tokens                                                                                     | Numeric weights.                                                                                                                                                             | —                                                                                                                                                |
| GAP-23 component colours are baked                   | tokens build                                                                               | Aliases to the ramps, so an override needs no matching by value.                                                                                                             | "Make it yours" matches 32 of 45 by value today (the other 13 are button ink and greys, rightly kept).                                           |
| GAP-63 ColorPicker swatch                            | `ColorPicker/ColorPicker.tsx:362`                                                          | A 32px box with the 16px control radius is a circle, and the native fill inside is a 24×20 rectangle. Decide the shape and draw all of it.                                   | Measured on `/components/color-picker`.                                                                                                          |
| GAP-64 ChipGroup wraps and never centres             | `Chip/Chip.tsx:179`                                                                        | `flex flex-wrap` with no `wrap` prop and no `items-center`: a ChipGroup cannot scroll sideways, and a shorter chip sits 2px high. Add both, in `Stack`'s words.              | Measured on the ScrollArea and MultiSelect pages' demos (scrollWidth = clientWidth), before they moved to Storybook.                             |
| GAP-65 Textarea grip outside the corner              | `styles/owned-components.css:53`                                                           | `rounded-control` with `resize: vertical`: 58% of the grip lands on or outside the rounded edge. Reserve the corner, draw a grip, or square it while resizing.               | Measured on the Textarea page's demo at dpr 8; the examples' text areas show it.                                                                 |
| GAP-66 EmptyState's words align left (fixed)         | `EmptyState/EmptyState.tsx:27,31`, `Text/Text.tsx:45`                                      | `text-center` on the root loses to `Text`'s default `align="left"` on the paragraph. Pass `align="center"`, or let Text inherit.                                             | Fixed (`b9467b1f`): "GAP-66 is fixed: an empty state's wrapped description is centred".                                                          |
| GAP-67 Menu opens centred                            | `Menu/Menu.tsx:58`                                                                         | No `align` default, so Radix centres the menu on its trigger — 31px off for a wide menu. Default `align="start"`.                                                            | Measured on the Menu page's demo; the site's header menu shows it.                                                                               |
| GAP-68 BottomNavigation's density overflows          | `BottomNavigation/BottomNavigation.tsx:40,49`, `NavigationItem/NavigationItem.tsx:57`      | The bar is `h-16` while a `default` item is `min-h-[72px]`: 8px of spill. `w-auto` also cancels the density's widths. Let the bar take its height from its items.            | Measured on the BottomNavigation page's demo in both switch states, before it moved to Storybook.                                                |
| GAP-69 one arrow for lift, escalator, stairs (fixed) | `DirectionStep/DirectionStep.tsx:61`                                                       | Fourteen manoeuvres share eight glyphs; the step-free distinction is invisible. A glyph per manoeuvre, in the set's weight.                                                  | Shown on the DirectionStep page's demo until it moved to Storybook; the wayfinding example's escalator and lift share the arrow.                 |
| GAP-70 SelectTrigger's hidden FieldWrapper           | `Select/Select.tsx:53`                                                                     | The trigger wraps itself and forwards `error`, so a caller who needs the outer wrapper for a label prints the message twice. Give it a `label`, or inherit the wrapper.      | None since 2026-09-28: the Select demo that passed the error to the trigger alone moved to Storybook.                                            |
| GAP-71 AISearchButton has no hover                   | `AISearchButton/AISearchButton.tsx:24`                                                     | A focus ring and a disabled state, nothing for hover, and no `:hover` rule in the stylesheet. Add one in the system's idiom.                                                 | Read from the source and the built CSS.                                                                                                          |
| GAP-72 MapOverlay clips what floats on it (fixed)    | `MapOverlay/MapOverlay.tsx:74`                                                             | `overflow-auto` on a box the size of its child cuts the whole of a floating SearchBar's shadow. Scroll only past a max height, or pad by the elevation spread.               | Fixed (`ded56bc5`, GAP-082): "GAP-72 is fixed: MapOverlay keeps what floats in it whole". The shell's boxes are GAP-91.                          |
| GAP-74 Tooltip's tail has a line across it           | `Tooltip/Tooltip.tsx:71,77`                                                                | A bordered content and an unstroked arrow flush against it: a 1px line across the join, and no outline on the tail. Outline the arrow and pull it 1px in.                    | Measured on the Tooltip page's demo, before it moved to Storybook.                                                                               |
| GAP-81 placeholder documentation                     | the components' own docs                                                                   | Fixed in source: the generic introductions are replaced with purpose and usage guidance. `skills:check` rejects the old topology sentence.                                   | Site and search consume the descriptions; the site test verifies Backdrop's real description. Other documentation gaps remain separately scoped. |
| GAP-83 AI thread cannot take focus                   | `AIMessageList/AIMessageList.tsx:61`                                                       | The scroller carries no `tabIndex`, so a keyboard cannot scroll a thread of answers; `ScrollArea.tsx:42` already does it.                                                    | The phone search's assistant passes `tabIndex={0}` itself; axe runs on it open.                                                                  |
| GAP-84 a group in a list loses its props             | `PoiResultList/POIResultList.tsx:131`                                                      | Forward `showMoreLabel`, `hideLabel`, `expanded` and `onExpandedChange` — the docs tell products to hand groups to the list.                                                 | Shown on the POIResultGroup page's demos, standalone and in a list, before they moved to Storybook.                                              |
| GAP-85 every group is a landmark                     | `PoiResultGroup/POIResultGroup.tsx:97`                                                     | A labelled group is a named section, so two fail `landmark-unique`. A heading, not a region.                                                                                 | None since 2026-09-28: the demos named their groups apart.                                                                                       |
| GAP-87 `disabled` misses the trailing slot           | `AiInputBar/AIInputBar.tsx:61`                                                             | A disabled bar still takes a press on whatever sits in `trailing`. Pass the state down, or document it.                                                                      | Stated on the AIInputBar page's demo, before it moved to Storybook.                                                                              |
| GAP-88 ActionCard's title is a paragraph             | `ActionCard/ActionCard.tsx:20`                                                             | Give it a heading level, as `AlertTitle` now takes (GAP-12).                                                                                                                 | Left visible in the phone search: an answer's places sit under a paragraph.                                                                      |
| GAP-89 category tiles overlap below 360px            | `BrowseCategoriesPanel/BrowseCategoriesPanel.tsx` (the `grid-cols-4` list)                 | Size the track from the tile — `repeat(auto-fit, minmax(4rem, 1fr))` — so the row rewraps instead of overrunning.                                                            | Left visible on `/components/browse-categories-panel`; GAP-89 in GAPS.md has the measurements.                                                   |
| GAP-90 a brand family with no font                   | `packages/tokens/src/tokens-*.json` (`typography.family.brand`)                            | Ship Readex Pro and measure its metrics, or give the family a metric-compatible fallback stack.                                                                              | Every layout the site measures is measured twice, in the host's sans and a wide one.                                                             |
| GAP-91 the shell cuts its boxes' shadows             | `AdaptiveMapShell/AdaptiveMapShell.tsx:827,842`                                            | The top bar's and controls' boxes scroll and are the size of what they hold, so every shadow in them is cut. Pad them by the shadows' reach, as `MapOverlay`'s stack is now. | "GAP-91: the map shell's boxes cut the shadows of what they hold" fails once there is room.                                                      |
| GAP-92 the shell hides its controls' edge            | `AdaptiveMapShell/AdaptiveMapShell.tsx:485`                                                | It anchors the controls at the inline start or end and says neither. Publish the edge on the controls' box, or line what it holds up on it.                                  | The venue explorer and the wayfinding can drop `controls-edge.ts`.                                                                               |
| GAP-93 AI panel covered controls in reach (fixed)    | `AICompanionPanel/AICompanionPanel.tsx:176`                                                | Covering the frame, it leaves the frame's controls in the tab order (WCAG 2.4.11). Make what it covers inert while open, as `Select` does (`utils/modal-inert`).             | Fixed (2026-09-29): the panel makes the box it fills inert; the phone search dropped its own `inert`.                                            |
| GAP-94 Text's muted ignores glass                    | `styles/owned-typography.css:64`                                                           | `.kozmos-text-muted` keeps the muted grey on glass, where decision 48 asks the foreground. Read `--kozmos-surface-muted-foreground`, as `.kozmos-muted-text` does.           | "GAP-94: Text's muted colour stays grey on a glass Surface", on the elevation page's glass card.                                                 |
| GAP-95 the switcher's column leaves its map          | `FloorSelector/FloorSelector.tsx` (the collapsible's `PopoverContent`)                     | Placed against the window alone, so a map smaller than the window cannot keep the column in. Take a `collisionBoundary` the shell can fill with its map.                     | "GAP-95: the level switcher's column grows out of the phone's frame" fails once it stays in.                                                     |

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
  measured the capsule against the screen behind it in the dark theme, on the
  DynamicIsland page's demo, which moved to Storybook with the check on
  2026-09-28. See it in the DynamicIsland stories, dark.

### GAP-60 · `DynamicIsland` keeps no room for the camera it wraps

- **Where:** `DynamicIsland/DynamicIsland.tsx` — the animated sizes (240×44
  compact, 56×56 minimal, `calc(100vw - 32px)`×160 expanded, radius 100/32)
  and the three layouts: compact is `justify-between px-4`, expanded is
  `absolute inset-0 p-4`, minimal is centred.
- **Why it breaks:** on the device the island is the TrueDepth camera's
  housing and every presentation is laid out around the camera. Apple's
  specification for a 393×852 screen: island 230×36.67, corner radius 44;
  compact two elements of 52.33×36.67 either side of the camera, leaving
  125.3pt — 54% of the width — for it; minimal 36.67–45×36.67; expanded
  371×84–160, height following content, content wrapped tightly around the
  camera. Measured here: 30px clear in the middle of a 240px capsule (12%),
  the trailing slot running across the camera's place, expanded content from
  16 to 344 of 360 starting at the top edge, and a height fixed at 160.
  A layout that fits here and not on the phone teaches the wrong thing, and
  the component's own MDX says it is meant to map onto ActivityKit.
- **Change:** lay the presentations out around a sensor region — compact as
  leading and trailing slots with the camera's share between them, expanded
  with leading, trailing, centre and bottom regions as
  `DynamicIslandExpandedRegion` has, minimal at the camera's height — and
  take the sizes from
  [Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities)
  (Specifications) rather than round numbers. Height should follow content
  between 84 and 160.
- **Proof:** "GAP-60: the island keeps no room for the camera" measured the
  clear middle of the compact capsule (under 40% of its width) and the
  expanded content's share of the capsule (over 90%) on the DynamicIsland
  page's demo, which moved to Storybook with the check on 2026-09-28.

### GAP-61 · No glyph mirrors for right to left

- **Where:** `Breadcrumb/Breadcrumb.tsx:84` (the separator's `ChevronRight`),
  `Menu/Menu.tsx:31` (the submenu chevron, with `ml-auto`), `Tree/Tree.tsx`
  (a closed row's `ChevronRight`), `Pagination/Pagination.tsx:83` and `:100`
  (previous and next), `RoutePreviewPanel/RoutePreviewPanel.tsx:136` (back).
- **Why it breaks:** `dir` flips the layout and the keyboard order, but each
  of those glyphs keeps pointing the way it was drawn. Measured in the site's
  direction sample: the trail runs right to left correctly and both
  separators still point right, back up the trail. The package already has
  the technique —
  `.kozmos-poi-gallery:dir(rtl) .kozmos-poi-gallery-arrow { transform: rotate(180deg) }`
  — used once.
- **Change:** mirror those glyphs with `:dir(rtl)` (or an `rtl:` variant), and
  leave `DirectionStep` and `DirectionIcon` alone: a manoeuvre is a real
  direction, not a reading one. While you are there, 40 of the 106 component
  files use physical `ml-`/`pl-`/`left-`/`text-left` utilities instead of
  logical ones; each wants a look under `dir="rtl"`. Returning `dir` from
  `useTheme()` (GAP-27) would also let a component pick a different glyph
  rather than rotate one.
- **Proof:** "GAP-61: the breadcrumb's separator does not mirror in right to
  left" measures the glyph and its transform in the theming page's sample;
  flip it once the separators turn, and take the sentence about the
  breadcrumb out of that page's lead.

## P3 — additions

| Gap    | What Kozmos lacks                                                                                                                                                                                                         | Suggested                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| GAP-05 | A code block; `Text` has no monospace                                                                                                                                                                                     | `CodeBlock` with copy, and `Text font="mono"`.                                                                   |
| GAP-06 | A skip link and visually hidden text                                                                                                                                                                                      | `SkipLink` (drawn above the sticky header) and `VisuallyHidden`.                                                 |
| GAP-07 | Icons by name: sun, moon, display, copy, external link, pause and play. `@kozmos-ds/icons` exports each (`Sun`, `Moon01`, `Monitor01`, `Copy01`, `LinkExternal01`, `PauseCircle`, `Play`); the registry has none          | Name them in the registry (GAP-79); the site's theme menu and the cover's "Pause motion" then get an icon.       |
| GAP-08 | A footer                                                                                                                                                                                                                  | `Footer`.                                                                                                        |
| GAP-10 | A way to draw a product's logo in the `Navbar`'s `logo` slot                                                                                                                                                              | A `Logo` part that draws a product's SVG in a colour role, or product glyphs in `Icon`.                          |
| GAP-15 | Venue icons: food and drink (`Utensils`), accessible facilities (`Accessibility`) and first aid (`MedicalCross`) are exported but not named in the registry; toilets and parking have no glyph                            | Name the three (GAP-79) and draw the other two; three examples leave those categories out today.                 |
| GAP-33 | A token for the route line on a map                                                                                                                                                                                       | `semantics-map-route` (line, casing, walked part), both themes, in the contrast contract.                        |
| GAP-54 | Light: a glow, gradients, a blur scale, and a duration for motion that loops (the effects are three dark shadows and glass; the longest duration is 460 ms)                                                               | A glow role from the ramps with a spread, gradient tokens, a blur scale, an ambient duration and pause guidance. |
| —      | Docs: the placeholder introductions are fixed (GAP-81); remaining missing examples and deeper usage guidance are separate work                                                                                            | Keep the source descriptions and generated reference in sync; add examples against the actual exported API.      |
| GAP-76 | A calendar and a clock of its own: the date and time fields are the browser's, so they ignore the tokens, differ per platform, and cannot carry a range in one field, two months, or a product's available days and hours | A Kozmos calendar and time picker, with range, two-month and single forms                                        |
| GAP-77 | Drag and drop: no handle, no grabbed state, no drop target, no reorderable list                                                                                                                                           | A handle, the states, a reorderable list, and keyboard reordering                                                |
| GAP-78 | A `Switch` that leads with its label, for a settings row                                                                                                                                                                  | `labelPlacement="start"`, keeping the label bound to the control                                                 |
| GAP-79 | Icons by name: the registry `Icon` reads holds 57 names (56 in 0.4.0), against 1,179 icon components exported in 0.4.0                                                                                                    | Put the Pointr set in the registry with names, categories and aliases (see GAP-07, GAP-15, GAP-69)               |
| GAP-86 | A speaker for a read-aloud control, by name: the voice control has its marks since #140 (fixed), but `Icon name` cannot reach `VolumeMax`                                                                                 | Put the Pointr set in the registry (GAP-79)                                                                      |
| GAP-80 | Row actions: `Tree` fades its own in on hover, nothing else can                                                                                                                                                           | An actions slot any row can take, with an overflow button, on hover, focus and selection                         |

## Also found, outside the components

- **`@kozmos-ds/react` develops against React 19 with `@types/react` 18**, so a
  React 19 app's `ReactNode` does not fit its props inside the workspace; the
  site maps the types to its own (its `tsconfig.json`). Move the package's
  dev types to 19.
- **`scripts/skills/check-completion.ts`'s lanes predate the newest
  components.** `docs/status.md` now lists every component folder (113 on
  2026-09-29), but the lanes it gives, which the site's reference uses, still
  differ from Storybook's grouping: the AI parts, AISearchButton and
  CategoryField are Core there and Product SDK in Storybook, and Itinerary,
  ManoeuvreCard and RouteProgressRail are Core there and Map in Storybook.
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
