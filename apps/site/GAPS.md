# What the site found Kozmos cannot do yet

The site is built from `@kozmos/react` and its tokens only (see README.md,
"The one rule"). Where that was not enough, the gap is written here instead of
being worked around, following the method in `docs/ds-handoff.md` §11: the
component and the part, what was tried, the lane, and the evidence. Entries
up to GAP-36 were measured on `claude/pointr-browse-repairs` at `ef1b68b`
(2026-09-21), the branch the site is built on; the rest, and every revision
since, on the same packages at `f30c0f9`, the site's current base, on
2026-09-22. GAP-54 to GAP-56, and the revisions the home page's new cover made to
GAP-07, 10, 24, 25, 39, 40 and 44, on the packages merged in at `7622daf`,
the same day.

**Lanes** are the handoff's: Core (domain-neutral components), Product / SDK,
Platform / form factor, or Site (a need of this website, not of a product).

**Status** is one of: _open_ (nothing done), _composed_ (the site builds it
from Kozmos parts and says so), _left visible_ (the defect shows on the page on
purpose, because hiding it would hide the evidence), _fixed_ (Kozmos changed,
and the site check that pinned the defect was flipped).

`DS-HANDOFF.md` turns these into work for `packages/`, in priority order.
The site's roadmap page (`/roadmap`) is this table under the handoff's
priorities, read at build time, so a row changed here changes the page;
keep the table's four columns and its statuses as they are.

| ID     | What                                                           | Lane                   | Status       |
| ------ | -------------------------------------------------------------- | ---------------------- | ------------ |
| GAP-01 | `NavigationItem` `asChild` throws                              | Core                   | open         |
| GAP-02 | `reset.css` ships raw Tailwind `theme()` calls                 | Core                   | open         |
| GAP-03 | A pre-rendered page starts in the light theme                  | Core                   | left visible |
| GAP-04 | `Grid` cannot reflow, and a caller cannot make it              | Core                   | composed     |
| GAP-05 | No code block; `Text` has no monospace option                  | Core                   | composed     |
| GAP-06 | No skip link or visually-hidden text                           | Core                   | composed     |
| GAP-07 | Icons a website needs: theme, copy, external link              | Core                   | open         |
| GAP-08 | No footer                                                      | Core                   | composed     |
| GAP-09 | `buttonVariants` on a link keeps the link's underline          | Core                   | left visible |
| GAP-10 | No image or brand-mark primitive                               | Core                   | composed     |
| GAP-11 | `EmptyState`'s title is not a heading                          | Core                   | open         |
| GAP-12 | `Alert` is always `role="alert"`, `AlertTitle` always an `h5`  | Core                   | composed     |
| GAP-13 | `SelectTrigger` has no label; `Textarea` no helper text        | Core                   | composed     |
| GAP-14 | `CardTitle` is always an `h3`                                  | Core                   | composed     |
| GAP-15 | No icons for a venue's everyday categories                     | Product / SDK          | open         |
| GAP-16 | `TabsList` neither wraps nor scrolls                           | Core                   | composed     |
| GAP-17 | `AdaptiveMapShell`'s panel is an `<aside>`                     | Product / SDK          | open         |
| GAP-18 | `POIDetailPanel` has no presentation for the shell's panel     | Product / SDK          | left visible |
| GAP-19 | `Navbar` is always sticky                                      | Core                   | composed     |
| GAP-20 | `SearchBar`'s field is unstyled in WebKit (Safari, iOS)        | Product / SDK          | left visible |
| GAP-21 | `Heading` cannot reach the tokens' heading scale               | Core                   | composed     |
| GAP-22 | Font-weight tokens carry names, not weights                    | Core                   | open         |
| GAP-23 | Component-layer colours are baked values, not ramp aliases     | Core                   | composed     |
| GAP-24 | `DynamicIsland` pins itself to the viewport                    | Platform / form factor | open         |
| GAP-25 | `MapView` insists on 400px of height                           | Product / SDK          | composed     |
| GAP-26 | `Text` cannot inherit its colour                               | Core                   | composed     |
| GAP-27 | `useTheme` does not report the direction                       | Core                   | composed     |
| GAP-28 | `SearchBar`'s search landmark cannot be named                  | Product / SDK          | left visible |
| GAP-29 | `BottomNavigation` is always fixed to the viewport             | Core                   | composed     |
| GAP-30 | `Sidebar`'s navigation landmark cannot be named                | Core                   | left visible |
| GAP-31 | Emotion text is under 4.5:1 on every surface but white         | Core                   | left visible |
| GAP-32 | `ChipGroup` carries no role                                    | Core                   | composed     |
| GAP-33 | No token for the route line on the map                         | Product / SDK          | composed     |
| GAP-34 | `Backdrop` pins itself to the viewport                         | Core                   | composed     |
| GAP-35 | `BrowseCategoriesPanel` is four columns at any width           | Product / SDK          | composed     |
| GAP-36 | `ToastViewport` pins itself to the viewport                    | Core                   | composed     |
| GAP-37 | `SearchBar` shows the browser's clear button beside its own    | Product / SDK          | left visible |
| GAP-38 | The map sheet's handle is 4px tall and its grip invisible      | Product / SDK          | left visible |
| GAP-39 | `RouteSummary`'s title is always an `h2`                       | Product / SDK          | left visible |
| GAP-40 | Map overlays draw over the sticky `Navbar`                     | Product / SDK          | composed     |
| GAP-41 | `Navbar` has no narrow-screen pattern                          | Core                   | composed     |
| GAP-42 | `CardTitle`'s line height is 1.0                               | Core                   | left visible |
| GAP-43 | Controls with touch targets under 44px                         | Core                   | left visible |
| GAP-44 | `Switch` is always as wide as its container                    | Core                   | left visible |
| GAP-45 | The first brand variant's 600 fails in the dark theme          | Core                   | left visible |
| GAP-46 | `Stepper` has no narrow form                                   | Core                   | composed     |
| GAP-47 | `Sidebar` has no narrow-screen form                            | Core                   | composed     |
| GAP-48 | A `Tree` row's meta never shrinks                              | Core                   | composed     |
| GAP-49 | `SearchBar` drops its analytics when a caller handles keys     | Product / SDK          | open         |
| GAP-50 | Spinner, Skeleton and the loading Button ignore reduced motion | Core                   | left visible |
| GAP-51 | No polite announcer                                            | Core                   | composed     |
| GAP-52 | The provider's preflight zeroes a caller's border              | Core                   | composed     |
| GAP-53 | A map shell cannot fill a rounded screen                       | Product / SDK          | left visible |
| GAP-54 | No light: glow, gradient, blur or ambient motion               | Core                   | composed     |
| GAP-55 | A `Listbox`'s column is as wide as its widest option           | Core                   | composed     |
| GAP-56 | `Button` puts no space between an icon and its label           | Core                   | composed     |

---

## GAP-01 · `NavigationItem` `asChild` throws

- **What:** `NavigationItem` declares `asChild`, the usual way to render a
  router's link with the item's look. It cannot work: with `asChild` the item
  passes its own spans (icon, label, badge) to Radix `Slot`, which needs exactly
  one child element.
- **Tried:** `<NavigationItem asChild><a href="/docs">Docs</a></NavigationItem>`,
  with and without `icon`. Rendered with `renderToString` against the built
  package: both throw _"React.Children.only expected to receive a single React
  element child."_ `href` alone renders.
- **Lane:** Core. The same defect `Button` had before its `asChild` was removed
  (the React README records that).
- **Now:** the site passes `href` plus React Router's `useLinkClickHandler` as
  `onClick` (`src/site/links.tsx`). That is the router's documented API for
  custom links, so navigation stays client-side without the prop.
- **Fix in Kozmos:** either implement `asChild` with `Slottable` around the
  label, or remove the prop, as was done for `Button`.

## GAP-02 · `reset.css` ships raw Tailwind `theme()` calls

- **What:** `@kozmos/react/reset.css`, the documented opt-in global reset, is
  Tailwind's `preflight.css` copied verbatim by the `kozmos-opt-in-reset` plugin
  in `packages/react/vite.config.mts`. It still holds eight `theme(…)` calls —
  the base font family, font features and variations, the default border
  colour, the monospace family and the placeholder colour. Browsers drop each
  as invalid, so those eight declarations never apply.
- **Tried:** `grep -c "theme(" packages/react/dist/reset.css` → 8. The only test
  (`scripts/check-theme-isolation.mjs`) asserts a heading's margin, which does
  not use `theme()`, so it passes.
- **Lane:** Core (build).
- **Now:** the site does not import `reset.css`; the provider's scoped preflight
  covers everything inside it, and `site.css` sets `body { margin: 0 }`.
- **Fix in Kozmos:** run the reset through PostCSS with the Tailwind config,
  like `style.css`, and assert a `theme()`-dependent value in the test.

## GAP-03 · A pre-rendered page starts in the light theme

- **What:** on a server, or when pre-rendering, `ThemeProvider` renders
  `defaultSystemTheme` (light) and only reads the stored choice and the system
  preference after hydration. A visitor whose system is dark sees the light page
  first, and the components' colour transitions then animate the change. The
  React README says so ("An initial colour change is possible").
- **Tried:** there is no pre-paint hook. The provider's element is Kozmos's own,
  so the site cannot mark it before hydration without editing the component's
  DOM behind React's back, which it will not do.
- **Evidence:** every pre-rendered page's HTML carries `data-theme="light"` on
  the provider root. In the end-to-end tests, axe measured failing contrast in
  the dark theme until the tests waited for running animations to finish —
  the transition caught mid-way. A test blocks the scripts and reads the
  header's painted background for a dark-mode visitor: white.
- **Lane:** Core.
- **Now:** client-side navigation (GAP-01's workaround) keeps it to the first
  page of a visit.
- **Fix in Kozmos:** the components must be dark before hydration, not only
  the document. Kozmos declares its dark tokens on
  `[data-kozmos-root][data-theme=dark]`, and the provider's root is rendered
  `data-theme="light"`, so a script that sets `<html data-theme>` alone
  changes nothing a visitor sees. Either the provider honours a theme already
  on an ancestor (set by a tiny inline script before paint), or `system` gets
  a `prefers-color-scheme` fallback in the CSS.

## GAP-04 · `Grid` cannot reflow, and a caller cannot make it

- **What:** `Grid`'s `cols` is a fixed count (1–6, 12) with no responsive or
  auto-fit value. A caller cannot supply one either: Kozmos's utility classes
  compile as `:scope .grid-cols-none{grid-template-columns:none}` inside
  `@scope ([data-kozmos-root])`, specificity (0,2,0), which beats any single
  class the caller adds — and `grid-cols-none` is `Grid`'s default.
- **Tried:** `<Grid className="site-grid-auto">`. The template never applied.
- **Lane:** Core. This applies to every utility-based component (Stack,
  Container, Card and more): a caller's class cannot change any property the
  component's own utilities set. The README says only the migrated components
  accept overrides.
- **Now:** the site's card grids are a `Box` laid out in `site.css`, with
  auto-fit or auto-fill columns of a minimum width. The same rule met the site
  elsewhere, each time answered with a wrapper `Box`: `Skeleton`'s corners
  (a disc is a round box that clips it), `Sidebar`'s display (the dashboard
  hides a wrapper), `ListItem`'s flex row (the layout page's scales sit in a
  box inside it), `Stack`'s display and a vertical `ScrollArea`'s height
  (its parent bounds it). `DialogContent`'s gap is left as Kozmos sets it.
  Every page's tests now check that each site rule applies
  (`overriddenSiteCss` in `tests/site.spec.ts`): each is added again with an
  ID's more weight, and whatever that changes was losing. A rule Kozmos
  outranks fails instead of doing nothing. The first version read each
  declaration's longhands, which the CSSOM leaves empty for a shorthand
  holding `var()`, and so missed every such rule; GAP-52 is what it missed.
- **Fix in Kozmos:** a `minColumnWidth` (auto-fit) axis on `Grid`, or responsive
  `cols`; and a way for a caller's class to win over the component's own
  utilities (an unscoped layer for them, or `:where()`).

## GAP-05 · No code block; `Text` has no monospace option

- **What:** a documentation page needs code. Kozmos has no code block, `Text`
  has no family option, and `Text asChild` on a `<pre>` adds `kozmos-reset`,
  which sets `font-family: inherit` and so removes the monospace family the
  provider's scoped preflight gives an unclassed `<pre>`.
- **Now:** `src/site/CodeBlock.tsx` composes `Surface`, `ScrollArea`,
  `Separator`, `Text` and `Button` around a bare `<pre><code>`; the family comes
  from the preflight. No syntax colours — there are no token roles for them.
- **Lane:** Core (a documentation component a product may never need; a
  decision for the design system).

## GAP-06 · No skip link or visually-hidden text

- **What:** a page with a header needs a "Skip to content" link that appears on
  focus. Kozmos has no skip link and no visually-hidden primitive (components
  use Tailwind's `sr-only` internally; it is not exported).
- **Now:** the skip link is a Kozmos `Link` in the header's first slot;
  `.site-skip-link` keeps it out of sight until it has focus. It lives inside
  the header because the sticky `Navbar` sits at the top layer token (50): a
  link before it, on the same layer, was painted under it while it had focus.
  A test checks it is what the page paints at its own centre.
- **Lane:** Core (accessibility).

## GAP-07 · Icons a website needs: theme, copy, external link

- **What:** the 56 icons have no sun, moon or display (a theme switch), no copy
  (a code block), no external-link glyph, and no pause or play (the control
  that stops a page's motion).
- **Now:** the theme switch, the copy button and the home page's "Pause
  motion" use words.
- **Lane:** Core (icons).

## GAP-08 · No footer

- **What:** no footer component. The product coverage scan already lists
  `Footer` as partial, covered only by `Navbar`.
- **Now:** `src/site/SiteFooter.tsx` composes `Container`, `Stack`, `Separator`,
  `Text` and `Link`.
- **Lane:** Core.

## GAP-09 · `buttonVariants` on a link keeps the link's underline

- **What:** the React README's pattern for navigation that looks like a button
  is `buttonVariants` on your own anchor or router link. On an `<a>`, the label
  stays underlined: `kozmos-reset` and `kozmos-button` never reset
  `text-decoration`, and a `<button>` simply never had one.
- **Evidence:** in Chromium, the same classes compute
  `text-decoration-line: underline` on `a.kozmos-button` and `none` on
  `button.kozmos-button`. Visible on the home page's two hero buttons.
- **Now:** left visible on purpose. Hiding it in site CSS would be exactly the
  workaround the rule forbids.
- **Lane:** Core.
- **Fix in Kozmos:** `text-decoration: none` on `.kozmos-button` (and the link
  variant decides its own underline).

## GAP-10 · No image or brand-mark primitive

- **What:** `Navbar` has a `logo` slot, and nothing in Kozmos can draw a logo
  in it: no `Logo` or `Image` component, and `Icon` takes only its own
  registry's names. The site's rule refuses a raw `<img>` or `<svg>`.
- **Now:** the logo, supplied on 2026-09-22, is `src/brand/kozmos-logo.svg`.
  The header paints a `Box` (`role="img"`, named "Kozmos UI Design Systems")
  through the logo's shape as a CSS mask, in the text colour token, so it
  follows the theme; forced-colours mode gets the system text colour. Below
  48rem it shows the logo's K alone (GAP-41). The favicons and the K are
  generated from the logo and the tokens (`scripts/generate-brand.mjs`).
- **The cover (2026-09-22):** the home page's first screen is the Figma
  file's cover (Core Library, node `143:13175`). There it is one raster
  image with the logo laid over it, and Kozmos cannot show an image, so the
  site draws it again from its parts (`src/home/Cosmos.tsx`): the logo
  painted through its shape as the header's is, and again in lavender,
  blurred, for its glow; the logo's own star, cut out of the logo by the
  brand script (`src/brand/kozmos-star.svg`), scattered as stars; orbits,
  planets, diamonds, the ring and the galaxy as `Box`es painted with the
  colour ramps (GAP-54); the cover's glass cubes as Kozmos's glass
  `Surface`, each holding an `Icon`. Composed: close to the cover, not the
  cover — the picture's texture, its nebula's detail and its cubes' depth
  are not there.
- **Lane:** Core.
- **Fix in Kozmos:** a `Logo` part for the `Navbar` slot that draws a
  product's SVG in a colour role, or let `Icon` take a product's own glyphs.

## GAP-11 · `EmptyState`'s title is not a heading

- **What:** `EmptyState` renders its `title` as a paragraph with no heading
  level, so a full-page empty state (not found, an error) has no `h1`.
- **Now:** `src/site/StatusPage.tsx` uses `Heading` and `Text` instead.
- **Lane:** Core.

## GAP-12 · `Alert` is always `role="alert"`; `AlertTitle` always an `h5`

- **What:** `Alert` hard-codes `role="alert"`, an assertive live region, which
  is wrong for a note that is on the page from the start and too loud for a
  "saved" confirmation. `AlertTitle` is always an `h5`, which breaks the heading
  outline anywhere below an `h2`.
- **Now:** the site passes `role="note"` for static notes. A confirmation sits
  in a status region that is always on the page, with `role="none"` on the
  `Alert` inside it (GAP-51); props reach the element after the default. The
  examples use bold `Text` for a title; only the Alert reference's demo uses
  `AlertTitle`, where its `h5` is the finding (`knownViolations`,
  `heading-order`).
- **Lane:** Core.
- **Fix in Kozmos:** a `live` or `tone` prop that picks the role, and a title
  level (or no heading).

## GAP-13 · `SelectTrigger` has no label; `Textarea` has no helper text

- **What:** `Input`, `Textarea`, `Switch`, `Checkbox` and `RadioGroup` take
  `label`; `SelectTrigger` does not. `Input` and `PasswordInput` take
  `helperText`; `Textarea` does not.
- **Now (account settings example):** each select sits in a `FieldWrapper` whose
  `label` points at the trigger's `id`; the bio's character count is a `Text`
  joined to the field with `aria-describedby`.
- **Lane:** Core.

## GAP-14 · `CardTitle` is always an `h3`

- **What:** a page that lists cards straight under its `h1` skips a level.
  axe reports `heading-order` on the examples index.
- **Now:** the index puts its cards under an `h2` ("Pages and apps").
- **Lane:** Core. (Same shape as GAP-12's `AlertTitle`.)

## GAP-15 · No icons for a venue's everyday categories

- **What:** the icon set's 56 glyphs have nothing for food and drink, toilets,
  accessible facilities, parking or first aid — the categories an indoor map
  shows first. The accessibility glyph is already on record as missing
  (`docs/ds-handoff.md` §6.5: drawn 1,213 times across 7 surfaces).
- **Now (venue explorer, phone search, kiosk directory):** those categories
  are left out rather than drawn with a stand-in icon. The six they have
  (shops, information, transport, events, offices, Wi-Fi) use Kozmos icons.
- **Lane:** Product / SDK (icons; the Pointr taxonomy's own sprites may be the
  source).

## GAP-16 · `TabsList` neither wraps nor scrolls

- **What:** `TabsList` is a fixed `inline-flex` row. Three file names overflow a
  320-pixel phone and push the whole page sideways.
- **Now:** `src/site/ExamplePage.tsx` puts the list in a horizontal
  `ScrollArea`.
- **Lane:** Core.

## GAP-17 · `AdaptiveMapShell`'s panel is an `<aside>`

- **What:** the shell renders its panel as `<aside aria-label>`, a
  complementary landmark. A shell placed in a page's `<main>` — a module in a
  larger app, or this site — nests it there, and axe reports
  `landmark-complementary-is-top-level` (best practice, moderate).
- **Evidence:** axe on the venue explorer, wayfinding and phone search
  examples, the home page's adaptive tile and the AdaptiveMapShell reference
  page, in both themes and all three engines. The tests' `SHELL_PANEL` entry
  expects exactly these panels, by their element, so they fail — and point
  here — once Kozmos changes it. (The dashboard's and the Sidebar page's
  entries are not this gap: a `Sidebar` is an aside by nature.)
- **Lane:** Product / SDK.
- **Fix in Kozmos:** a `section` with the same label (a region landmark), or an
  option for hosts that embed the shell.

## GAP-18 · `POIDetailPanel` has no presentation for the shell's panel

- **What:** `presentation="panel"` draws its own card, which sits inside
  `AdaptiveMapShell`'s panel as a second surface. `presentation="sheet"` paints
  none, as documented, but is designed for a grey sheet: on the shell's
  page-coloured panel, its inset blocks (the action message) lose their
  container — white on white, or black on black.
- **Now (venue explorer):** `sheet`, the documented pairing. The message text
  stays readable and is announced; only its block is invisible.
- **Lane:** Product / SDK.

## GAP-19 · `Navbar` is always sticky

- **What:** `.kozmos-navbar` is `position: sticky; top: 0`, with no option. A
  second Navbar in a page — an embedded module's, or the account settings
  example's inside this site — sticks over the first while the page scrolls.
- **Now:** every example sits in a frame of definite height that scrolls
  inside (`.site-example-canvas`), so an example's Navbar sticks within its
  frame.
- **Lane:** Core.

## GAP-20 · `SearchBar`'s field is unstyled in WebKit (Safari, iOS)

- **What:** in WebKit, `SearchBar`'s `<input>` gets none of its classes: native
  search-field appearance, 11px text, a 2px border and a filled background,
  148px wide inside the bar. Chromium and Firefox draw it as designed (15px,
  no border, transparent, filling the bar).
- **Evidence:** measured in Playwright's WebKit 26.0 against Chromium and
  Firefox. The same classes on a `<div>` in the same place compute correctly in
  WebKit; on an `<input>` (search or text) they do not. So WebKit is not
  applying the `@scope`-d utilities to form controls — the regression CI already
  names ("Keep the original WebKit form regression"), and why `Input`,
  `Textarea`, `PasswordInput` and `NumberInput` were moved to component-owned
  CSS (the React README lists them). `SearchBar` was not moved. The account
  settings fields, which are migrated, render correctly in WebKit.
- **Why it matters:** Safari and iOS web views are WebKit, and the Pointr SDK's
  iOS hosts are among them. Visible on the home page's demo and in the venue
  explorer.
- **Now:** left visible. `tests/site.spec.ts` expects the field's style to fail
  in WebKit only, so the test tells us when it is fixed.
- **Lane:** Product / SDK (`SearchBar`).
- **Fix in Kozmos:** move `SearchBar`'s field to component-owned CSS like
  `Input`, and add it to the WebKit form-compatibility checks. Confirm in a real
  Safari too.

## GAP-21 · `Heading` cannot reach the tokens' heading scale

- **What:** the tokens carry a heading scale — h1 60px, h2 48, h3 38, h4 30,
  h5 24, h6 20 (`--primitives-typography-font-size-headings-*`) — as Figma
  draws it. The React `Heading` maps levels 1–6 onto `Text`'s `4xl`…`base`,
  which are Tailwind's rem sizes: 36, 30, 24, 20, 18, 16px. The two scales
  disagree at every level, and nothing in the React package can render the
  token's 60px. `Text` has no family option either, so the mono family token
  is unreachable through a component too.
- **Evidence:** `.kozmos-text-4xl{font-size:2.25rem}` in the built stylesheet
  against `--primitives-typography-font-size-headings-h1: 60` in the token
  CSS; the typography page measures the component scale live and lists the
  tokens beside it.
- **Now:** the site's display, page and section titles are `Heading`s with a
  class that sets the token size and line height from the tokens (`site.css`,
  `.site-display`, `.site-title`, `.site-headline`); the rule allows
  token-driven typography in site CSS for this reason. The tokens pair h1 and
  h2 with line heights in the component layer (60/66 and 48/54,
  `--components-html-elements-headings-*`), which the site uses; the h3
  pairing (38/42) is the site's own.
- **Lane:** Core.
- **Fix in Kozmos:** either drive `Text`'s sizes from the tokens, or add a
  `display` size and a `family` prop, and say which scale is the product's.

## GAP-22 · Font-weight tokens carry names, not weights

- **What:** `--primitives-typography-font-weight-main-regular: Regular`,
  `-bold: SemiBold`, `-light: Light` — Figma's style names. CSS `font-weight`
  does not accept them, so the declaration is dropped; Swift and Kotlin would
  need a lookup too. `Text`'s weights are Tailwind's numbers (400–700),
  unconnected to the tokens.
- **Evidence:** the token CSS; the typography page's weight table.
- **Lane:** Core (tokens).
- **Fix in Kozmos:** emit numeric weights (400, 600, 300), or map the names in
  the token build.

## GAP-23 · Component-layer colours are baked values, not ramp aliases

- **What:** the 283 `--components-*` variables are generated with the theme's
  hex values written in (`--components-primary-buttons-themed-button-background-idle: #0d44c2`)
  rather than as aliases of the ramp (`var(--primitives-colors-theme-700)`).
  A product that re-points the theme ramp through `ThemeProvider`'s `tokens`
  — the documented way to brand a module — changes the utilities and leaves
  every migrated component (Button, Input, the fields) in the old blue.
- **Evidence:** the home page's "Make it yours" section re-points the ramp
  and, for the component layer, matches each themed token to the ramp step
  whose values it carries in both themes. On `f30c0f9` there are 45 themed
  component tokens: 32 re-point, every blue among them. The other 13 are the
  ink on filled buttons (white, or black in the dark theme) and the disabled
  greys, which are not on the theme ramp and rightly keep their values. The
  page prints the counts; the `brandOverrides` unit test covers the matching.
- **Now:** composed: matching by value reaches every brand colour today. It
  is fragile — a ramp step retuned without regenerating the component layer
  would stop matching, silently — which is the gap.
- **Lane:** Core (tokens build).
- **Fix in Kozmos:** generate the component layer as aliases of the semantic
  or primitive tokens it was derived from, so one override reaches everything.

## GAP-24 · `DynamicIsland` pins itself to the viewport

- **What:** `DynamicIsland` renders `position: fixed; top: 1rem; left: 50%`,
  so it can only ever sit at the top of the browser window. It cannot be
  placed in a map scene, a card or an example's frame.
- **Now:** the DynamicIsland page shows the island on request, fixed to the
  top of the window, behind a button; the wayfinding example shows its
  manoeuvres in `ManoeuvreCard`. (Until the cover took the home page's
  first screen on 2026-09-22, the hero's map scene showed a manoeuvre in a
  glass `Surface` around `DirectionStep` instead.)
- **Lane:** Platform / form factor.
- **Fix in Kozmos:** let the host decide: a `placement` prop in
  `FloatingActionButton`'s words (`"fixed" | "inline"`), fixed by default
  here. GAP-29, GAP-34 and GAP-36 are the same family.

## GAP-25 · `MapView` insists on 400px of height

- **What:** `MapView` carries `min-h-[400px]` in its own classes, and a
  caller's class cannot lower it (GAP-04). A small map — a tile, a thumbnail,
  a phone in landscape — is not possible.
- **Now:** the adaptive tile and the examples' canvases give their maps
  400px or more.
- **Lane:** Product / SDK.

## GAP-26 · `Text` cannot inherit its colour

- **What:** every `Text` sets a colour class (`kozmos-text-default` by
  default), so it cannot take the colour of an inverted host. `DynamicIsland`
  paints the foreground colour as its background and expects its content to
  be the background colour; a `Text` inside it disappears in the light theme.
  The same holds for anything on a filled button or a tinted category fill.
- **Now:** the `DynamicIsland` demo puts plain strings and a `Box` in the
  island's slots, without `Text`'s sizes and weights.
- **Lane:** Core.
- **Fix in Kozmos:** a `color="inherit"` value (or no colour class when
  `color` is not given), so `Text` can sit on any surface a component paints.

## GAP-27 · `useTheme` does not report the direction

- **What:** `ThemeProvider` takes `dir`, and `useTheme()` returns `theme`,
  `resolvedTheme` and `setTheme` only. A component that must know whether it
  sits in a right-to-left subtree — to mirror an icon, order a pair of
  buttons — cannot ask the provider and has to read the DOM.
- **Now:** the `ThemeProvider` demo passes the direction it set to the sample
  beside the provider.
- **Lane:** Core.
- **Fix in Kozmos:** return `dir` from `useTheme()`, resolved from the
  nearest provider.

## GAP-28 · `SearchBar`'s search landmark cannot be named

- **What:** `SearchBar` wraps its field in `role="search"`, a landmark, and
  gives the landmark no name: `aria-label` goes to the input. Two search bars
  on one page — a venue search in the top bar and a search inside a browse
  sheet, or the reference's inline and floating examples — are two search
  landmarks a screen reader lists as the same thing (axe `landmark-unique`).
- **Now:** the SearchBar and AdaptiveMapShell pages carry the violation, named
  in `knownViolations` in `tests/site.spec.ts`.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** a `landmarkLabel` prop on the wrapper, or name the
  landmark from the field's label.

## GAP-29 · `BottomNavigation` is always fixed to the viewport

- **What:** `BottomNavigation` renders `fixed bottom-0 left-0 right-0`, as
  `DynamicIsland` does at the top (GAP-24). It cannot sit in a phone frame,
  a card or an example, and two of them overlap.
- **Now:** its demo mounts one bar on request, over the site's footer, and
  says so.
- **Lane:** Core.
- **Fix in Kozmos:** a `placement` prop in `FloatingActionButton`'s words
  (`"fixed" | "inline"`; `FloatingActionButton` itself defaults to inline),
  fixed by default here.

## GAP-30 · `Sidebar`'s navigation landmark cannot be named

- **What:** `Sidebar` puts its `navigation` slot in a `<nav>` with no way to
  name it; only the `<aside>` takes `aria-label`. A page with the site's own
  sidebar and a demoed one has two unnamed navigation landmarks (axe
  `landmark-unique`); `Navbar` has `navigationLabel` for exactly this.
- **Now:** the Sidebar page carries the violation, named in
  `knownViolations`.
- **Lane:** Core.
- **Fix in Kozmos:** a `navigationLabel` prop, as `Navbar` has.

## GAP-31 · Emotion text is under 4.5:1 on every surface but white

- **What:** the alert and success colours reach WCAG's 4.5:1 as text on the
  page's white and nowhere else. Alert 800 (`#a06b04`) measures 4.56:1 on
  white, 4.29:1 on `background-25` (`#f7f8fa`), 4.07:1 on `background-50`
  (`#f1f2f4`) and 3.59:1 on `background-100` (`#e3e4e8`, Kozmos's own
  `muted`). Success 800 (`#197f4c`) measures 5.02, 4.72, 4.48 and 3.95:1 on
  the same four. The contrast contract's 22 pairs measure the emotions as
  fills under white or black ink, never as text on a tinted surface.
- **Where it shows:** two paths carry the same values. `Alert`'s warning and
  success variants and the field messages (`status="warning"` on `Input`,
  `DatePicker`, `TimePicker`) read Tailwind's `warning` and `success`
  colours, which are the primitives `emotional-alert-800` and
  `emotional-success-800` (`tailwind.config.js`). An outlined `Tag` reads the
  semantic text roles (`--semantics-emotion-alert-text`, `-success-text`).
  On the site, the Alert, Input, DatePicker and Tag pages show them on the
  demo stage (`background-25`), and the dashboard's success colours sit on a
  solid surface because its canvas is `background-50`. A Kozmos `Card` is
  white, so a warning inside one passes: the states example's offline notice
  does (a test checks it).
- **Now:** left visible, in the light theme only (dark passes); the
  `knownViolations` entries are marked `theme: "light"`, and their failures
  print the colours and the ratio.
- **Lane:** Core (tokens).
- **Fix in Kozmos:** darker text steps for alert and success — tuned against
  the muted surfaces, not only white — reached by both paths: the semantic
  text roles and Tailwind's `warning` and `success`. Add the text pairs on
  `background-25`, `-50` and `-100` to
  `packages/tokens/src/contrast-contract.json`.

## GAP-32 · `ChipGroup` carries no role

- **What:** `ChipGroup` is a plain `div`; an `aria-label` on it names
  nothing, so a group of filter chips has no name a screen reader can read.
- **Now:** every labelled `ChipGroup` on the site passes `role="group"`: the
  components index, the dashboard, onboarding, the home page's "Make it
  yours", the foundations' direction sample, the icons page and the Chip
  demos. axe only flags an unnamed group as "needs review", so it never
  failed a test; a code review found three without it.
- **Lane:** Core.
- **Fix in Kozmos:** `role="group"` on the wrapper.

## GAP-33 · No token for the route line on the map

- **What:** a wayfinding product draws the route on the map — a line the map
  engine renders in a colour the design system should own, as it owns the
  category tints and the emotion colours. The tokens carry no route, path or
  wayfinding role (`variables-light.css` has none), so every product picks
  its own.
- **Now:** the wayfinding and kiosk examples draw their stand-in routes in
  dots coloured with the theme's 600, and say so.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** a `semantics-map-route` role (line, casing, and the
  walked part), in both themes, with its contrast on the map's own surface
  in the contract.

## GAP-34 · `Backdrop` pins itself to the viewport

- **What:** `Backdrop` renders `fixed inset-0`, so it can only ever cover the
  browser window. A scrim over one module — a kiosk's attract screen, a map
  panel while it loads, a card while a dialog inside it is open — cannot use
  it; like `DynamicIsland` (GAP-24) and `BottomNavigation` (GAP-29), the host
  cannot decide where it goes.
- **Now:** the kiosk directory's attract screen is a glass `Surface` laid over
  the directory by the example's own CSS.
- **Lane:** Core.
- **Fix in Kozmos:** a `placement` prop (`"fixed" | "inline"`, as for
  GAP-24), fixed by default, with the scrim colour and blur unchanged.

## GAP-35 · `BrowseCategoriesPanel` is four columns at any width

- **What:** the panel lays its tiles out with `grid-cols-4`, whatever its
  width. In a column narrower than about 22rem — a kiosk's directory rail, a
  tablet's side panel — each tile is under 5rem and a one-word name such as
  "Information" is cut ("Informatio"): `CategoryTile` clamps its label to two
  lines, and a single word cannot wrap.
- **Now:** the kiosk directory keeps its directory column at 22–24rem, so
  the names fit.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** `repeat(auto-fill, minmax(5.5rem, 1fr))`, or a
  `columns` prop, so a narrow host gets three columns.

## GAP-36 · `ToastViewport` pins itself to the viewport

- **What:** `ToastViewport` renders `fixed` at the browser window's corner.
  A page shown in a frame — an example on this site, a module in a larger
  product, a preview — cannot keep its toasts inside itself: they appear
  outside it, over whatever the host is showing.
- **Now:** the dashboard, the inbox and saved places confirm with an inline
  `Alert` in a status region, with the undo beside it (GAP-51).
- **Lane:** Core.
- **Fix in Kozmos:** a `placement` prop (`"fixed" | "inline"`), as for
  `Backdrop` (GAP-34), `BottomNavigation` (GAP-29) and `DynamicIsland`
  (GAP-24) — the same family.

## GAP-37 · `SearchBar` shows the browser's clear button beside its own

- **What:** `SearchBar`'s field is `type="search"`, and it leaves the
  browser's own cancel button in place: in Chromium the
  `::-webkit-search-cancel-button` pseudo-element computes to
  `display: block`, so once there is text the field shows two ways to clear
  it — the browser's small cross inside the field, in the accent colour, and
  Kozmos's own 44px clear button after it. Measured on the site's search
  and the components index on 2026-09-22.
- **Now:** left as Kozmos draws it, on every search field on the site.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** hide `::-webkit-search-cancel-button` in the field's own
  CSS — `appearance: none` or `display: none` — as an owned rule, not a
  scoped utility, so it reaches WebKit too (GAP-20). The site's test reads
  both properties, so either fix flips it.

## GAP-38 · The map sheet's handle is 4px tall and its grip invisible

- **What:** `AdaptiveMapShell`'s bottom sheet has a drag handle
  (`role="slider"`, "Panel height") styled by `.kozmos-map-sheet-handle`
  and `.kozmos-map-sheet-grip` in `packages/react/src/styles/owned-components.css`.
  Three of their declarations use a layout token directly as a length —
  `height: var(--primitives-layout-spacing-200)`,
  `padding-top: var(--primitives-layout-spacing-75)` and
  `width: var(--primitives-layout-sizing-500)` — and those tokens are
  unitless (`16`, `6`, `40`), so the browser drops all three. Measured on
  2026-09-22: the handle is 388 × 4 px, the grip 0 px wide. The sheet has no
  visible grip and a 4px target to drag.
- **Now:** left as Kozmos draws it, on the phone search example and the
  adaptive tile; measured by a test in `tests/site.spec.ts`.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** `calc(var(…) * 1px)`, the conversion the owned blur and
  slide rules already use; the three are the only such declarations in the
  owned stylesheets. With it the handle is 16px tall (the padding is inside
  its border box) and the grip 40px wide — still a small target (GAP-43).

## GAP-39 · `RouteSummary`'s title is always an `h2`

- **What:** `RouteSummary` renders its destination in an `h2`, whatever the
  page around it. On the home page the hero's map scene made its summary
  ("Gate B12") the first section of the page's outline, before any real
  section. `POIDetailPanel` has `titleLevel` for exactly this.
- **Now:** left visible where it still shows. The home page's scene has
  given way to the cover (2026-09-22); in the wayfinding example, walking a
  route, the summary's `h2` ("Bookshop") is the only heading of that view
  and happens to fit.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** a `titleLevel` prop like `POIDetailPanel`'s (`2 | 3`),
  and a way to render no heading at all, for a scene or a preview.

## GAP-40 · Map overlays draw over the sticky `Navbar`

- **What:** `MapOverlay` is `z-index: 50`, and so is the sticky `Navbar`;
  `MapView` does not create a stacking context. Any map drawn from
  `MapView` and `MapOverlay` outside `AdaptiveMapShell` (which isolates
  itself) paints its overlays over the header as the page scrolls, because
  it comes later in the document. Measured on the MapOverlay reference
  page and the kiosk example (and on the home page's map scene, until the
  cover replaced it on 2026-09-22).
- **Now:** the site isolates every frame that hosts a map
  (`isolation: isolate` on demo stages, index previews and example
  canvases), and a test scrolls each stacked element under the header and
  checks nothing draws over it. The test that pins the gap reads a map on
  the MapOverlay page.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** `isolate` on `MapView`'s root, as `AdaptiveMapShell`'s
  has; and a layer scale in which the page's navigation sits above a map's
  own overlays.

## GAP-41 · `Navbar` has no narrow-screen pattern

- **What:** the Navbar's leading group has a 32rem flex basis, so anything
  in its trailing slot (`actions`, `utilities`, `account`) wraps onto a
  second row below 32rem plus the trailing width; the navigation slot wraps
  its links into further rows. On a 390px phone the site's header was
  227px tall — 27 % of the screen, and sticky. There is no way to collapse
  the navigation into a menu.
- **Now:** the site puts everything in the navigation slot: the links,
  shown from 48rem, and three small tools — a theme menu, search, and a
  button that opens the links in a `Drawer` below 48rem. That slot keeps a
  16rem basis of its own, which leaves the logo little room beside it: the
  header shows the full logo from 48rem and its K below. One 64px row from
  360px up; at 320px the tools still drop to a second row (a test measures
  it), and the page's scroll padding covers only the first.
- **Lane:** Core.
- **Fix in Kozmos:** a narrow-screen mode — a `collapseBelow` breakpoint
  that moves `navigation` into a drawer behind a menu button — and a
  trailing slot that stays on the first row.

## GAP-42 · `CardTitle`'s line height is 1.0

- **What:** `CardTitle` is `text-2xl … leading-none`: 24px text on 24px
  lines. A title that wraps — on a phone, "A map layout that fits its
  container" — sets its lines touching.
- **Now:** left visible.
- **Lane:** Core.
- **Fix in Kozmos:** the line height `Heading` uses at that size — Tailwind's
  `text-2xl`, 2rem, a ratio of 1.33. No token pairs a line height with 24px.

## GAP-43 · Controls with touch targets under 44px

- **What:** measured on the site: the `Slider` thumb is 20 × 20 px
  (`h-5 w-5`), a `TabsTrigger` 32px tall, a `Rating` star 24 × 24 px,
  `SearchBar`'s input 23px tall inside its 44px bar, a `Chip` 28 to 36px and
  a `ToggleButton` 32 to 40px. They meet WCAG 2.2's 24px minimum by size or
  spacing, except the thumb, which passes only on spacing; Kozmos's own rule
  for its buttons, and the layout page's touch-target tokens, say 44px.
- **Now:** left visible. The test reads what a touch 20px from the thumb's
  centre lands on (the track, today), so a hit area made of padding or of a
  pseudo-element flips it alike.
- **Lane:** Core.
- **Fix in Kozmos:** a 44px hit area around each (padding or a
  pseudo-element), keeping the drawn size; the input filling its bar.

## GAP-44 · `Switch` is always as wide as its container

- **What:** `Switch` wraps itself in `flex flex-col gap-1.5 w-full`, so two
  switches in a row each take the whole row; a caller's class cannot narrow
  it (GAP-04). `Checkbox` has the same wrapper.
- **Now:** left visible. "Make it yours" puts its two switches in a row
  that wraps, and each takes the whole row, so they stack. (The hero's "Try
  the scene" strip gave each of its switches a box of its own size, and the
  two shared a row, until the cover replaced the scene on 2026-09-22.)
- **Lane:** Core.
- **Fix in Kozmos:** size the wrapper to its content (`inline-flex`), and
  let a form stretch it where it wants a full-width row.

## GAP-45 · The first brand variant's 600 fails in the dark theme

- **What:** the tokens carry two variant brand ramps for a product to
  re-point the theme to. In the dark theme, variant 1's 600 (`#6258F3`,
  `packages/tokens/src/tokens-dark.json`, Figma variable 1440:2442) measures
  4.20:1 on the dark page (`background-0`): under 4.5:1 as primary text, and
  as the fill under black ink (a selected `Chip`, a default `Button`). The
  default ramp's dark 600 reads 6.17:1 and variant 2's 4.99:1; all three
  pass in the light theme. The contrast contract measures the default ramp
  only.
- **Evidence:** axe on the ThemeProvider page in the dark theme (its token
  override re-points the theme's 600 to variant 1), and on the home page's
  "Make it yours" with variant 1 and the module dark (the selected chip).
  Found once the tests walked every component page in the dark theme too.
- **Now:** left visible; the ThemeProvider entry in `knownViolations` is
  marked `theme: "dark"`, and a test measures the ratio.
- **Lane:** Core (tokens).
- **Fix in Kozmos:** lighten variant 1's dark 600 until it passes, and add
  both variants' primary-action and primary-text pairs to the contract, so
  every ramp a product may choose is measured.

## GAP-46 · `Stepper` has no narrow form

- **What:** `Stepper` always shows every step's label, with fixed 32px
  margins between them, and no orientation or compact option. Five labelled
  steps need about 24rem; on a phone the card holding them overflows its
  frame and cuts its own text.
- **Now:** the onboarding example hides the `Stepper` below 30rem, in a
  wrapper `Box`; the `Progress` bar under it, labelled "Step n of 5", carries
  the step on its own.
- **Lane:** Core.
- **Fix in Kozmos:** a vertical orientation, or labels that give way to the
  current step's alone when the row is too narrow.

## GAP-47 · `Sidebar` has no narrow-screen form

- **What:** `Sidebar` has a `rail` variant, but only as a prop: nothing
  switches it by the space it has, and it has no drawer form. A console that
  puts its sections in a sidebar has no navigation left on a phone once the
  sidebar goes.
- **Now:** below 64rem the dashboard hides its sidebar (a wrapper `Box`,
  GAP-04) and opens the same sections in a `Drawer` from a menu button in
  its `Navbar`, as the site's own header does.
- **Lane:** Core.
- **Fix in Kozmos:** a sidebar that turns into a rail or a drawer by the
  width of its container, as `AdaptiveMapShell` measures its own.

## GAP-48 · A `Tree` row's meta never shrinks

- **What:** a `Tree` row lays out its icon, its name (which truncates) and
  its meta (which does not shrink) in one line, with the actions after them.
  On a narrow tree a long meta squeezes the name to nothing and pushes the
  actions out of the row: on a 375px phone, saved places showed the first
  place with no name at all. The meta slot is also a `<span>`, so a `Tag` or
  a `Stack` inside it puts a `<div>` inside a `<span>`.
- **Now:** saved places drops each place's note from the meta below 30rem
  (a class on its `Text`) and keeps the floor.
- **Lane:** Core.
- **Fix in Kozmos:** let the meta shrink and truncate before the name does,
  or wrap it under the name when the row is narrow; a `<div>` for the slot.

## GAP-49 · `SearchBar` drops its analytics when a caller handles keys

- **What:** `SearchBar` wraps `onKeyDown` to send its `search_initiated`
  event on Enter, then spreads the caller's props after it
  (`SearchBar.tsx`), so a caller's own `onKeyDown` replaces the wrapper and
  the event is never sent. The caller's handler still runs, so nothing looks
  wrong.
- **Now:** open. The site's search handles Enter and the arrow keys itself,
  so its searches are not reported; the site has no analytics provider
  anyway.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** spread the props first and compose the handlers, as the
  `onChange` beside it already is.

## GAP-50 · Spinner, Skeleton and the loading Button ignore reduced motion

- **What:** under the system's reduced-motion preference, Kozmos stops the
  location marker's pulse and turns its pops, reveals, cross-fades and the
  map sheet's movement into cuts. `Spinner` (`animate-spin`), `Skeleton`
  (`animate-pulse`) and the `Button`'s loader keep moving, and the design
  config's `motion: reduced` only scales the Tailwind durations, which these
  animations do not read.
- **Now:** left visible; the motion page, the Spinner demo and the Button
  demo say so.
- **Lane:** Core (accessibility).
- **Fix in Kozmos:** `motion-reduce:` variants on the three (a slower spin
  or a still state), and let `motion: reduced` reach them.

## GAP-51 · No polite announcer

- **What:** a live region only speaks reliably when it is on the page before
  its message arrives; one that appears together with its message is often
  missed (NVDA in particular). Kozmos has one persistent announcer,
  `NavigationAnnouncer`, and it is assertive (`role="alert"`), for turn-by-turn
  instructions; a "saved" or "removed" confirmation should be polite.
- **Now:** the examples keep a status region on the page at all times — a
  `Box` with `role="status"`, or a `Text` — and put each confirmation in it;
  the `Alert` inside takes `role="none"` (GAP-12). Empty, the region leaves
  the flow (`position: absolute` on `:empty`), so no gap opens for it.
- **Lane:** Core (accessibility).
- **Fix in Kozmos:** a polite announcer (or an `Alert` with a `live` prop that
  keeps its region mounted), and a visually-hidden primitive (GAP-06).

## GAP-52 · The provider's preflight zeroes a caller's border

- **What:** inside a `ThemeProvider`, every element without `kozmos-reset`
  matches `:scope :not(:where(.kozmos-reset))` in
  `@scope ([data-kozmos-root])`, which sets `border: 0 solid #e5e7eb`. Its
  specificity is (0,1,0), a caller's class has the same, and the scope's
  proximity settles the tie for the preflight: a caller's `border` on its
  own box never draws. The plugin that scopes Kozmos's CSS means the
  preflight to weigh nothing — `:where(:scope …)`,
  `packages/react/postcss/scoped-css.cjs:65–74` — but it takes every
  `*, ::before, ::after` rule for Tailwind's variable initialiser
  (`compilerDefaults`, line 56). The preflight's border reset has that
  selector too, so it keeps `:scope`'s weight (line 76).
- **Found:** nine of the site's borders had never drawn — the colour
  swatches, the contrast samples, the radius and touch shapes, the hairlines
  of the muted bands and of the example canvas, the demo stage's rule, the
  adaptive tile's host and the phone frame — and the skip link's radius lost
  to the Link's own. The check meant to catch this missed them (GAP-04).
- **Now:** where an edge matters it comes from Kozmos. Swatches, samples and
  shapes are `Surface`s, whose solid surface has the subtle border, with the
  colour filled from inside; the bands, the example canvas and the demo stage
  are edged with `Separator`s. In the dark theme those tints are 1.04:1 and
  1.1:1 against the page, so the hairlines are what set them apart. The
  adaptive host and the phone frame draw nothing of their own (the map's edge
  shows their extent), and the skip link keeps the Link's radius.
- **Lane:** Core.
- **Fix in Kozmos:** tell the initialiser from the preflight by what it
  declares (only `--tw-*` custom properties), not by its selector, so the
  border reset takes `:where()` like the rest of the preflight.

## GAP-53 · A map shell cannot fill a rounded screen

- **What:** `AdaptiveMapShell` always draws its map as a card — `MapView` is
  `rounded-container border` (`MapView/MapView.tsx:19`) — and its bottom sheet
  with rounded top corners, square bottom corners and the solid surface's
  border on all four sides (`AdaptiveMapShell/AdaptiveMapShell.tsx:632–636`).
  On a phone, the shell fills a screen whose corners are round: the screen
  cuts the sheet's bottom corners, and the sheet's side and bottom borders
  stop short of the curve. There is no edge-to-edge form.
- **Now (left visible):** the phone search example's screen takes the map's
  own corner radius, so the map's edge is the screen's outline; the sheet's
  cut corners show, and the example lists this gap. The home page's adaptive
  tile does not round its host, so its sheet keeps square corners there.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** an edge-to-edge form of the shell: the map without a
  border or radius, and a sheet with only its top edge, its sides and bottom
  at the screen's edges as a native sheet's are — or a sheet that takes its
  container's bottom radius.

## GAP-54 · No light: glow, gradient, blur or ambient motion

- **What:** the Figma file's cover — the design system's own picture of
  itself — is made of light: a glowing ring, a lavender glow round the
  logo, gradients of violet into amber, a galaxy's blur, bodies drifting on
  their orbits. The tokens have none of it. Their effects are three
  elevation shadows, all dark (`--semantics-elevation-*`, black at 30–50%),
  and the glass surface; there is no glow or light token, no gradient, no
  blur scale but glass's one number (20), and no duration longer than 460ms
  (`--semantics-motion-duration-deliberate`) for motion that loops.
- **Now:** composed on the home page's cover (`src/home/Cosmos.tsx`,
  `site.css` "Home: the cover"). Every colour is a token: the violet is the
  second brand ramp (`--primitives-colors-theme-variant-2-*`), the glow the
  first ramp's 700 (`#867ef6`, the cover's is `#8d84f7`), the amber and
  rose the alert and danger ramps, and the stars the inverted transparent
  ramp. The light itself is the site's: radial and conic gradients of those
  colours, blurred by a spacing token (a glow's reach is a distance), thin
  lines painted through an SVG circle's stroke as a mask (WebKit draws a
  gradient's thin edge in steps), and
  loops timed in multiples of the deliberate duration, times the design
  config's duration scale. The loops pause from a button (WCAG 2.2.2), when
  the cover is off screen, and never run under reduced motion.
- **Lane:** Core (tokens).
- **Fix in Kozmos:** a glow role, in the colour ramps and a spread, as
  elevation has for shadow; gradient tokens where the brand has them; a
  blur scale; and an ambient duration with guidance for the pause that
  motion longer than five seconds needs.

## GAP-55 · A `Listbox`'s column is as wide as its widest option

- **What:** `Listbox` is a grid with no column template
  (`packages/react/src/styles/owned-selection.css:3`, `@apply grid …`), so
  its one implicit column is as wide as its widest option's content. An
  option's label and description are single lines that cut off with an
  ellipsis (`truncate`), but only when their box is narrower than they are:
  a long description widens its option, the column follows, and every
  option runs past the list, which then scrolls sideways with the text cut
  at its edge and no ellipsis.
- **Evidence:** the site's search dialog, on the packages at `7622daf`: 676px
  options in a 462px list. "GAP-55: a Listbox's column is as wide as its
  widest option" measures it with the site's fix taken off.
- **Now:** composed. The search's `Listbox` takes a site class that sets
  `grid-template-columns: minmax(0, 1fr)` — a property the Listbox does not
  set — so its options take the list's width and their text ends in an
  ellipsis. Other Listboxes on the site hold short options.
- **Lane:** Core.
- **Fix in Kozmos:** `grid-template-columns: minmax(0, 1fr)` in
  `.kozmos-listbox`, as the site's own single-column grids have.

## GAP-56 · `Button` puts no space between an icon and its label

- **What:** `Button` lays out its children in a row (`inline-flex`,
  `packages/react/src/styles/owned-components.css:263`) with no gap. Only
  its own loading spinner is spaced from the label (`.kozmos-button-loader`,
  `mr-2`: 8px, as Figma's Button keeps 8px between its loading indicator and
  its label, node `77:857`). An `Icon` a caller puts beside the label — the
  way Code Connect maps Figma's Button (`figma.children(["Icon", "Label
Text"])`) and the Get started page shows — touches it.
- **Evidence:** "GAP-56: a Button's icon touches its label" measures 0px on
  the Button page's "Directions" demo.
- **Now:** composed where a Button is part of something else: the header's
  "Theme" menu, the reference's drawer button, "Make it yours", the
  direction sample, the icons page's copy buttons, the Navbar and Menu
  demos, and two examples (listed there) add the 8px through a class — a
  property the Button does not set. Left visible on the Button page, whose
  demos show the component as it draws, and in the Get started code, which
  is Kozmos's own usage.
- **Lane:** Core.
- **Fix in Kozmos:** a gap of the spacing scale's 100 on `.kozmos-button`,
  and the loader's `mr-2` taken off.
