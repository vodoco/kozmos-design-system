# What the site found Kozmos cannot do yet

The site is built from `@kozmos-ds/react` and its tokens only (see README.md,
"The one rule"). Where that was not enough, the gap is written here instead of
being worked around, the way Kozmos records what its examples cannot express:
the component and the part, what was tried, the lane, and the evidence. Entries
up to GAP-36 were measured on `claude/pointr-browse-repairs` at `ef1b68b`
(2026-09-21), the branch the site was then built on; GAP-37 to GAP-53, and
that day's revisions, on the same packages at `f30c0f9`, the site's base then,
on 2026-09-22. GAP-54 to GAP-82, and the revisions the home page's new cover made to
GAP-07, 10, 24, 25, 39, 40 and 44, on the packages merged in at `7622daf`,
the same day. Later entries and revisions were measured on the packages of
their day; since #55 (2026-09-28) the site is on `main` and builds from its
packages.

**Numbers** are the site's own register, two digits, separate from the
design system's change list and its three-digit GAP-0nn: the site's GAP-91 is
not the change list's GAP-091 (row 90). Where an entry names one of the
change list's, it says so, as GAP-72's "its GAP-082" does.

**Lanes** are the design system's: Core (domain-neutral components), Product / SDK,
Platform / form factor, or Site (a need of this website, not of a product).

**Status** is one of: _open_ (nothing done), _composed_ (the site builds it
from Kozmos parts and says so), _left visible_ (the defect shows on the page on
purpose, because hiding it would hide the evidence), _fixed_ (Kozmos changed,
and the site check that pinned the defect was flipped).

**Since 2026-09-28** (decision 44), Storybook is the component reference, and
the site's component pages are short pages with no live examples. A gap the
site found through a component page's demo is no longer shown on the site: its
entry keeps what was measured, and where, its status is _open_ unless an
example, a tile or the site's own frame still shows it, and its **Now** says
which.

`DS-HANDOFF.md` turns these into work for `packages/`, in priority order.
The site's roadmap page (`/roadmap`) is this table under the handoff's
priorities, read at build time, so a row changed here changes the page;
keep the table's four columns and its statuses as they are.

| ID     | What                                                             | Lane                   | Status       |
| ------ | ---------------------------------------------------------------- | ---------------------- | ------------ |
| GAP-01 | `NavigationItem` `asChild` throws                                | Core                   | open         |
| GAP-02 | `reset.css` ships raw Tailwind `theme()` calls                   | Core                   | open         |
| GAP-03 | A pre-rendered page starts in the light theme                    | Core                   | left visible |
| GAP-04 | `Grid` cannot reflow, and a caller cannot make it                | Core                   | composed     |
| GAP-05 | No code block; `Text` has no monospace option                    | Core                   | composed     |
| GAP-06 | No skip link or visually-hidden text                             | Core                   | composed     |
| GAP-07 | Icons a website needs ship, but `Icon` cannot name them          | Core                   | open         |
| GAP-08 | No footer                                                        | Core                   | composed     |
| GAP-09 | `buttonVariants` on a link keeps the link's underline            | Core                   | left visible |
| GAP-10 | No image or brand-mark primitive                                 | Core                   | composed     |
| GAP-11 | `EmptyState`'s title is not a heading                            | Core                   | open         |
| GAP-12 | `Alert` is always `role="alert"`, `AlertTitle` always an `h5`    | Core                   | fixed        |
| GAP-13 | `SelectTrigger` has no label; `Textarea` no helper text          | Core                   | composed     |
| GAP-14 | `CardTitle` is always an `h3`                                    | Core                   | composed     |
| GAP-15 | No icon by name for a venue's everyday categories                | Product / SDK          | open         |
| GAP-16 | `TabsList` neither wraps nor scrolls                             | Core                   | composed     |
| GAP-17 | `AdaptiveMapShell`'s panel is an `<aside>`                       | Product / SDK          | open         |
| GAP-18 | `POIDetailPanel` has no presentation for the shell's panel       | Product / SDK          | left visible |
| GAP-19 | `Navbar` is always sticky                                        | Core                   | composed     |
| GAP-20 | `SearchBar`'s field is unstyled in WebKit (Safari, iOS)          | Product / SDK          | fixed        |
| GAP-21 | `Heading` cannot reach the tokens' heading scale                 | Core                   | composed     |
| GAP-22 | Font-weight tokens carry names, not weights                      | Core                   | open         |
| GAP-23 | Component-layer colours are baked values, not ramp aliases       | Core                   | fixed        |
| GAP-24 | `DynamicIsland` pins itself to the viewport                      | Platform / form factor | open         |
| GAP-25 | `MapView` insists on 400px of height                             | Product / SDK          | composed     |
| GAP-26 | `Text` cannot inherit its colour                                 | Core                   | open         |
| GAP-27 | `useTheme` does not report the direction                         | Core                   | composed     |
| GAP-28 | `SearchBar`'s search landmark cannot be named                    | Product / SDK          | open         |
| GAP-29 | `BottomNavigation` is always fixed to the viewport               | Core                   | open         |
| GAP-30 | `Sidebar`'s navigation landmark cannot be named                  | Core                   | open         |
| GAP-31 | Emotion text is under 4.5:1 on every surface but white           | Core                   | fixed        |
| GAP-32 | `ChipGroup` carries no role                                      | Core                   | composed     |
| GAP-33 | No token for the route line on the map                           | Product / SDK          | composed     |
| GAP-34 | `Backdrop` pins itself to the viewport                           | Core                   | composed     |
| GAP-35 | `BrowseCategoriesPanel` is four columns at any width             | Product / SDK          | composed     |
| GAP-36 | `ToastViewport` pins itself to the viewport                      | Core                   | composed     |
| GAP-37 | `SearchBar` shows the browser's clear button beside its own      | Product / SDK          | fixed        |
| GAP-38 | The map sheet's handle is 4px tall and its grip invisible        | Product / SDK          | fixed        |
| GAP-39 | `RouteSummary`'s title is always an `h2`                         | Product / SDK          | left visible |
| GAP-40 | Map overlays draw over the sticky `Navbar`                       | Product / SDK          | composed     |
| GAP-41 | `Navbar` has no narrow-screen pattern                            | Core                   | composed     |
| GAP-42 | `CardTitle`'s line height is 1.0                                 | Core                   | left visible |
| GAP-43 | Controls with touch targets under 44px                           | Core                   | left visible |
| GAP-44 | `Switch` is always as wide as its container                      | Core                   | left visible |
| GAP-45 | The first brand variant's 600 fails in the dark theme            | Core                   | fixed        |
| GAP-46 | `Stepper` has no narrow form                                     | Core                   | composed     |
| GAP-47 | `Sidebar` has no narrow-screen form                              | Core                   | composed     |
| GAP-48 | A `Tree` row's meta never shrinks                                | Core                   | composed     |
| GAP-49 | `SearchBar` drops its analytics when a caller handles keys       | Product / SDK          | open         |
| GAP-50 | Spinner, Skeleton and the loading Button ignore reduced motion   | Core                   | fixed        |
| GAP-51 | No polite announcer                                              | Core                   | composed     |
| GAP-52 | The provider's preflight zeroes a caller's border                | Core                   | composed     |
| GAP-53 | A map shell cannot fill a rounded screen                         | Product / SDK          | left visible |
| GAP-54 | No light: glow, gradient, blur or ambient motion                 | Core                   | composed     |
| GAP-55 | A `Listbox`'s column is as wide as its widest option             | Core                   | composed     |
| GAP-56 | `Button` puts no space between an icon and its label             | Core                   | fixed        |
| GAP-57 | A `Button`'s label cannot wrap                                   | Core                   | composed     |
| GAP-58 | `Toast` draws no background of its own                           | Core                   | open         |
| GAP-59 | `DynamicIsland` is its own dark theme, so a dark page hides it   | Platform / form factor | open         |
| GAP-60 | `DynamicIsland` keeps no room for the camera it wraps            | Platform / form factor | open         |
| GAP-61 | No glyph mirrors for right to left                               | Core                   | fixed        |
| GAP-62 | `Combobox` and `MultiSelect` draw their list in the page         | Core                   | open         |
| GAP-63 | `ColorPicker`'s swatch is a circle around a rectangle            | Core                   | open         |
| GAP-64 | `ChipGroup` always wraps, and never centres its chips            | Core                   | open         |
| GAP-65 | `Textarea`'s resize grip paints outside its rounded corner       | Core                   | left visible |
| GAP-66 | `EmptyState`'s words are left-aligned in a centred block         | Core                   | fixed        |
| GAP-67 | `Menu` opens centred on its trigger                              | Core                   | left visible |
| GAP-68 | `BottomNavigation`'s taller density overflows its own bar        | Core                   | open         |
| GAP-69 | Lift, escalator and stairs share one arrow                       | Product / SDK          | fixed        |
| GAP-70 | `SelectTrigger` hides a second `FieldWrapper`                    | Core                   | open         |
| GAP-71 | `AISearchButton` has no hover state                              | Core                   | open         |
| GAP-72 | `MapOverlay` clips what floats on it                             | Product / SDK          | fixed        |
| GAP-73 | `SplitButton`'s outline variant loses its border                 | Core                   | open         |
| GAP-74 | `Tooltip` draws a line across its tail                           | Core                   | open         |
| GAP-75 | `ToggleButton` puts no space between icon and label              | Core                   | composed     |
| GAP-76 | Dates and times are the browser's controls                       | Core                   | left visible |
| GAP-77 | No drag and drop: no handle, no dragging state, no target        | Core                   | open         |
| GAP-78 | `Switch` cannot lead with its label                              | Core                   | open         |
| GAP-79 | The Pointr icons ship, but cannot be asked for by name           | Product / SDK          | open         |
| GAP-80 | No row actions: nothing shows on hover outside `Tree`            | Core                   | open         |
| GAP-81 | Components carried placeholder documentation                     | Core                   | fixed        |
| GAP-82 | A category pill's fill is 2.52:1 on its own field                | Product / SDK          | left visible |
| GAP-83 | `AIMessageList`'s scrolling thread cannot take focus             | Core                   | composed     |
| GAP-84 | A `POIResultGroup` inside a list loses its words and its control | Product / SDK          | open         |
| GAP-85 | `POIResultGroup`'s label makes every group a landmark            | Product / SDK          | open         |
| GAP-86 | No microphone or speaker glyph for the assistant's controls      | Core                   | fixed        |
| GAP-87 | `AIInputBar`'s `disabled` does not reach its `trailing` slot     | Core                   | open         |
| GAP-88 | `ActionCard`'s title is a paragraph, not a heading               | Core                   | left visible |
| GAP-89 | `BrowseCategoriesPanel`'s tiles overlap below about 360px        | Product / SDK          | open         |
| GAP-90 | The brand family is named but no font is shipped                 | Core                   | composed     |
| GAP-91 | `AdaptiveMapShell` cuts its top bar's and controls' shadows      | Product / SDK          | left visible |
| GAP-92 | `AdaptiveMapShell` does not say which edge its controls sit on   | Product / SDK          | composed     |
| GAP-93 | `AICompanionPanel` leaves what it covers in the tab order        | Core                   | fixed        |
| GAP-94 | `Text`'s muted colour does not follow a glass surface            | Core                   | open         |
| GAP-95 | `FloorSelector`'s column can grow out of the map it floats on    | Product / SDK          | left visible |

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

- **What:** `@kozmos-ds/react/reset.css`, the documented opt-in global reset, is
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
  elsewhere, each time answered with a wrapper `Box`: `Sidebar`'s display
  (the dashboard hides a wrapper), `ListItem`'s flex row (the layout page's
  scales sit in a box inside it), `Stack`'s display and a vertical
  `ScrollArea`'s height (its parent bounds it). `Skeleton` was one of them
  until it took a `shape` and a size of its own (2026-09-27): the disc that
  was a round `Box` clipping a square is now `shape="circle"`, and the site's
  six sizing rules went with it — which is what the check below is for, since
  a rule the component has taken over fails rather than quietly doing
  nothing. `DialogContent`'s gap is left as Kozmos sets it.
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

## GAP-07 · Icons a website needs ship, but `Icon` cannot name them

- **What:** a theme switch wants a sun, a moon and a display; a code block a
  copy; a link out an external-link glyph; the control that stops a page's
  motion a pause and a play. When this was written the icon set had none of
  them.
- **Since icons 0.2.0** (2026-09-24), `@kozmos-ds/icons` exports all 1,175
  outlines of the Pointr Icon Library as components (1,179 components in all
  in 0.4.0), and these are among them: `Sun`, `Moon01`, `Monitor01`, `Copy01`,
  `LinkExternal01`, `Play` and `PauseCircle`. What is missing is their names:
  `Icon name="…"`, the icons page and its search read the registry, which
  holds none of them (56 names in 0.4.0, 57 on `main`; GAP-79).
- **Now:** the theme switch, the copy button and the home page's "Pause
  motion" still use words.
- **Follow-up:** those controls could draw the components themselves,
  imported from `@kozmos-ds/icons` (the one rule allows the Kozmos packages),
  rather than wait for GAP-79.
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
- **Fixed** in the design system (`AlertTitle` takes a `level`, `none` by
  default, so the title is a paragraph and no heading is skipped). The site's
  `heading-order` allowance for the Alert page is deleted and the page passes
  axe without it. Since 2026-09-25 `Alert` takes `live` too (`Alert.tsx:57`):
  `off` by default, with no role, `polite` a status and `assertive` an alert.
  On 2026-09-28 the examples dropped their roles: an `Alert` inside a status
  region that is always on the page (GAP-51) takes the default, and one that
  says something as it appears — signing in, a booking, the survey's thanks,
  the end of onboarding — says `live="polite"`.
- **Was:** the site passed `role="note"` for static notes, `role="status"` for
  a confirmation, and `role="none"` on the `Alert` inside an always-present
  status region; props reach the element after the default. The examples use
  bold `Text` for a title; only the Alert reference's demo used `AlertTitle`,
  where its `h5` was the finding.
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

## GAP-15 · No icon by name for a venue's everyday categories

- **What:** when this was written the icon set had nothing for food and
  drink, toilets, accessible facilities, parking or first aid — the categories
  an indoor map shows first. The accessibility glyph was already on record as
  missing (the product draws it 1,213 times across 7 surfaces, by the
  2026-09-14 scan).
- **Since icons 0.2.0** (2026-09-24), three of the five have a glyph in
  `@kozmos-ds/icons`: `Utensils` (food and drink) and `Accessibility`
  (accessible facilities), which the package draws itself, and the Pointr
  library's `MedicalCross` (first aid). All three are components only: the
  examples name their categories' icons through `Icon`, whose registry holds
  none of them (GAP-79). Toilets and parking have no glyph at all: neither the
  names nor the tags of the 1,175 Pointr outlines hold one. The icons package
  says a venue's quick-access category artwork is the taxonomy's, carried as
  each category's `iconUrl` (its README), and the site cannot draw an image
  (GAP-10).
- **Now (venue explorer, phone search, kiosk directory):** those categories
  are left out rather than drawn with a stand-in icon. The six they have
  (shops, information, transport, events, offices, Wi-Fi) use Kozmos icons.
- **Follow-up:** food and drink, accessible facilities and first aid could
  come back into the three examples, drawn with those components imported
  from `@kozmos-ds/icons`; toilets and parking wait for a glyph.
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
  examples and the home page's adaptive tile — and on the AdaptiveMapShell
  reference page until the demos moved to Storybook on 2026-09-28 — in both
  themes and all three engines. The tests' `SHELL_PANEL` entry expects exactly
  these panels, by their element, so they fail — and point here — once Kozmos
  changes it. It names them by the panel's `data-slot="map-shell-panel"`,
  which axe keeps whole however long the panel's opening tag grows: the
  class it matched until 2026-09-28 lost its words once the tag passed three
  hundred characters. (The dashboard's entry is not this gap: a `Sidebar` is
  an aside by nature.)
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
- **Why it matters:** Safari and iOS web views are WebKit, and the Pointr
  SDK's iOS hosts are among them. Visible in the examples' search fields and
  in the components page's own.
- **Now:** fixed on main (#193), not yet released. `SearchBar` owns
  its native input recipe (`2e602272`), isolated from Core `Search`'s shared
  clear-button marker (`99a55303`). The former expected-failure test produced
  an unexpected pass in WebKit; `tests/site.spec.ts` now positively requires
  15px text and no border in all three engines. The SDK browser checks also
  cover the computed recipe and 200% text, and protect Core `Search`'s styling.
- **Lane:** Product / SDK (`SearchBar`).
- **Remaining acceptance:** confirm on physical Safari/iOS web views. This
  browser repair is not a Core migration: a reusable decorated Core field is
  still needed; see `docs/sdk-core-composition.md` at the repository root.

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

- **What:** the token build wrote every token with its resolved value: the
  themed Button's fill, an alias of theme 500 in the token sources since
  decision 59, reached the web as
  `--components-primary-buttons-themed-button-background-idle: #135bec`, not
  `var(--primitives-colors-theme-500)`. A product that re-points the theme
  ramp through `ThemeProvider`'s `tokens` — the documented way to brand a
  module — changed the parts that read the ramp (the checked Checkbox, the
  Chip, the Tag) and left the filled Button, and every part drawn as one
  (`IconButton`, `FloatingActionButton`, `SplitButton`, a filled
  `MapControlButton`, `FloorSelector`'s selected level, `CategoryField`'s
  count), in Pointr's blue.
- **Evidence:** the home page's "Make it yours" section re-points the ramp
  and, for the component layer, matched each themed token to the ramp step
  whose values it carries, in the theme shown: 32 of the 45 themed component
  tokens. The other 13 are the ink on filled buttons (white in both themes
  since decision 59) and the disabled greys, which are not on the theme ramp
  and rightly keep their values.
- **Fixed** in the design system on 2026-10-07, in two steps. The token
  build writes every token whose source value is an alias as a reference to
  the token it names, in Style Dictionary's safe mode (a value a transform
  changed stays literal; none did). The four elevation roles keep their
  values: they alias the shadow ramp, whose `--shadow-sm`, `-md` and `-lg`
  `DesignConfigProvider` sets as legacy aliases. And the 28 themed button
  colours the token sources held as hex copied from the theme ramp (the
  secondary and tertiary buttons' themed colours, the primary buttons' dimmed
  content) are aliases of the step whose value they carry, in each theme, so
  all 32 themed component colours on the ramp are references: 94 in the light
  stylesheet and 68 in the dark. Every resolved value is unchanged: the Swift
  and Kotlin outputs are byte-identical, and the Figma payload and manifest
  and Android's resources, which now alias the ramp for those 28, resolve to
  the same value per token and theme. React's stylesheet declares the tokens
  on the provider's root, where an override in `tokens` resolves them.
  `scripts/check-token-references.mjs` (`pnpm test:token-references`, in CI in
  Chromium, Firefox and WebKit) reads every token in a light and a dark
  `ThemeProvider` and `DesignConfigProvider` root of the built package, 2,716
  reads, and finds each equal to the value written before; under one override
  of theme 500 to `#AA1155` the ten fills above compute `#AA1155` in both
  themes (14 of the 20 reads kept `#135BEC` before the fix); overrides of 600
  and 700, or 400 and 300 in the dark, move the filled Button's hover, focus
  and pressed tokens; and with every step of the ramp re-pointed, the 35
  component and semantic colours on it follow their steps in each theme, and
  the outline, ghost and link Buttons draw the override of 700 (64 of those
  reads failed before the second step). "Make it yours" now re-points the
  ramp's 11 steps alone and reports all 32 themed component colours as
  following it; the e2e test reads the module's fill and outline ink as the
  variant's 500 and 700.
- **What remains a value:** the 13 themed colours that are not on the theme
  ramp (white ink on a filled button, the disabled greys), and part of the
  other emotions' button colours: in the light file 30 of them already are
  references (the success and alert fills and their states, informative's
  hover and focus, every emotion's secondary ink), in the dark file only
  neutral's four inks; the rest hold values copied from their own ramps. No
  brand override touches those ramps; writing them as aliases needs each
  one's intended step, as several values sit on two ramps (white is
  background 0 and foreground 1000).
- **Lane:** Core (tokens build).

## GAP-24 · `DynamicIsland` pins itself to the viewport

- **What:** `DynamicIsland` renders `position: fixed; top: 1rem; left: 50%`,
  so it can only ever sit at the top of the browser window. It cannot be
  placed in a map scene, a card or an example's frame.
- **Now:** the site no longer shows a `DynamicIsland`. Its component page held
  the island in a screen — a box with paint containment, the containing block
  for its fixed children (`src/reference/Screen.tsx`) — until the demos moved
  to Storybook on 2026-09-28. The wayfinding example shows its manoeuvres in
  `ManoeuvreCard`.
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
- **Now:** open. The `DynamicIsland` demo that put plain strings and a `Box`
  in the island's slots, without `Text`'s sizes and weights, moved to
  Storybook with the demos on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** a `color="inherit"` value (or no colour class when
  `color` is not given), so `Text` can sit on any surface a component paints.

## GAP-27 · `useTheme` does not report the direction

- **What:** `ThemeProvider` takes `dir`, and `useTheme()` returns `theme`,
  `resolvedTheme` and `setTheme` only. A component that must know whether it
  sits in a right-to-left subtree — to mirror an icon, order a pair of
  buttons — cannot ask the provider and has to read the DOM.
- **Now:** the theming page's direction sample picks its arrows from the
  direction it set the provider to, since the provider cannot say; the
  `ThemeProvider` demo did the same until the demos moved to Storybook on
  2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** return `dir` from `useTheme()`, resolved from the
  nearest provider.

## GAP-28 · `SearchBar`'s search landmark cannot be named

- **What:** `SearchBar` wraps its field in `role="search"`, a landmark, and
  gives the landmark no name: `aria-label` goes to the input. Two search bars
  on one page — a venue search in the top bar and a search inside a browse
  sheet, or the reference's inline and floating examples — are two search
  landmarks a screen reader lists as the same thing (axe `landmark-unique`).
- **Now:** open. The SearchBar and AdaptiveMapShell pages carried the
  violation (`knownViolations`) until the demos moved to Storybook on
  2026-09-28; no page the site shows now has two search landmarks.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** a `landmarkLabel` prop on the wrapper, or name the
  landmark from the field's label.

## GAP-29 · `BottomNavigation` is always fixed to the viewport

- **What:** `BottomNavigation` renders `fixed bottom-0 left-0 right-0`, as
  `DynamicIsland` does at the top (GAP-24). It cannot sit in a phone frame,
  a card or an example, and two of them overlap.
- **Now:** open. Its demo put the bar in a screen that contained it
  (`src/reference/Screen.tsx`, as for GAP-24) until the demos moved to
  Storybook on 2026-09-28; no page the site shows now has one.
- **Lane:** Core.
- **Fix in Kozmos:** a `placement` prop in `FloatingActionButton`'s words
  (`"fixed" | "inline"`; `FloatingActionButton` itself defaults to inline),
  fixed by default here.

## GAP-30 · `Sidebar`'s navigation landmark cannot be named

- **What:** `Sidebar` puts its `navigation` slot in a `<nav>` with no way to
  name it; only the `<aside>` takes `aria-label`. A page with the site's own
  sidebar and a demoed one has two unnamed navigation landmarks (axe
  `landmark-unique`); `Navbar` has `navigationLabel` for exactly this.
- **Now:** open. The Sidebar page carried the violation until the demos moved
  to Storybook on 2026-09-28; on the dashboard, axe finds no second navigation
  to confuse its `Sidebar`'s with.
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
- **Fixed** in the design system on 2026-09-22 (`42fbe70`): the emotion text
  roles went a step darker, so emotion text reads on every neutral surface.
  The site's four known-violation allowances — Alert, Input, Tag, DatePicker
  — are gone, and every page's axe run is clean without them.
- **Was:** left visible, in the light theme only (dark passes); the
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
  components page, the dashboard, onboarding, the home page's "Make it yours",
  the foundations' direction sample and the icons page, as the Chip demos did
  until they moved to Storybook (2026-09-28). axe only flags an unnamed group
  as "needs review", so it never failed a test; a code review found three
  without it.
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
- **Now:** the kiosk directory's attract screen is a `Surface` laid over the
  directory by the example's own CSS, solid since decision 49 as every
  example is. The Backdrop page showed the scrim
  over a screen that contained it (`src/reference/Screen.tsx`, as for GAP-24)
  until the demos moved to Storybook on 2026-09-28.
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
  `Alert` in a status region, with the undo beside it (GAP-51), because an
  example's own frame does not contain a toast viewport yet. The Toast page's
  viewport sat in a screen that contained it (`src/reference/Screen.tsx`, as
  for GAP-24) until the demos moved to Storybook on 2026-09-28.
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
- **Fixed** in the design system on 2026-09-27 (`d89e405`): one owned rule
  gives `::-webkit-search-cancel-button` and `::-webkit-search-decoration`
  `appearance: none` on both `.kozmos-input` and `.kozmos-search-input`, so
  it reaches WebKit too (GAP-20). It was not only cosmetic: the browser's
  cross empties the field through the browser rather than through `onClear`,
  so the DOM emptied and the product's state did not.
- **Was:** left as Kozmos drew it, on every search field on the site.
- **Lane:** Product / SDK.
- **The test that missed it:** the first version read
  `getComputedStyle(field, "::-webkit-search-cancel-button")`, which answers
  with the host element's own values — measured, `display`, `appearance` and
  `width` all came back as the input's 348px box — so it could only ever say
  "drawn", and did until it was read by hand today, ninety minutes after
  the fix landed. It now reads the
  promise where it is made, in the stylesheet, and fails when that rule is
  taken out of the document.

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
- **Fixed** in the design system on 2026-09-22 (`de7a409`): the handle's three
  declarations convert their unitless layout tokens, so the row is 16px and
  the grip 40 × 4 again. "GAP-38 is fixed: the map sheet's handle draws its
  grip" now measures that.
- **Was:** left as Kozmos draws it, on the phone search example and the
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
- **Now:** the site isolates every frame that hosts a map (`isolation:
isolate` on the example canvases, as on the component pages' demo stages and
  the index's previews until the demos moved to Storybook on 2026-09-28), and
  a test scrolls each stacked element under the header and checks nothing
  draws over it. The test that pins the gap reads the kiosk directory's map,
  whose `MapOverlay` holds its floor list. Inside the kiosk's canvas the
  attract screen takes the same top layer token as the overlay
  (`--primitives-layer-50`) and covers it by coming later: solid since
  decision 49, it drew the floor list over itself, and "the attract screen
  covers the whole directory" reads the pixels where the list's tile is.
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
  shown from 64rem, and three small tools — a theme menu, search, and a
  button that opens the links in a `Drawer` below 64rem. That slot keeps a
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
- **Partly done:** on 2026-09-27 the `Chip`'s remove mark and the `Notice`'s
  "More" each got a 44px target from an owned `::after`. Neither is one of
  the controls measured above, so this stays open — but it is the shape of
  the fix the rest want.
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
  4.20:1 on the dark page (`background-0`): under 4.5:1 as primary text. The
  default ramp's dark 600 reads 6.17:1 and variant 2's 4.99:1; all three
  pass in the light theme. A prominent fill (a selected `Chip`, a default
  `Button`) no longer draws the 600 under black ink: since decision 59 it is
  the ramp's 500 under white in both themes, and variant 1's 500 reads
  6.99:1 under it. Variant 1's 500 is `#4135F1` since decision 63 (it was
  `#4134F1`), lightened just enough to read 3:1 as a shape on the dark page.
  The contrast contract measures variant 1's 500 on the page and under the
  theme foreground, and the default ramp's text pairs; not yet the
  variants' 600 as text.
- **Evidence:** axe on the ThemeProvider page in the dark theme (its token
  override re-pointed the theme's 600 to variant 1), until the demos moved to
  Storybook on 2026-09-28, and on the home page's "Make it yours" with variant
  1 and the module dark (the selected chip, until decision 59 drew it as the
  500 under white). Found once the tests walked every component page in the
  dark theme too.
- **Fixed** in the design system on 2026-10-08:
  - **Decision 69:** variant 1's dark 600 is `#716EFF`, with the same hue. It reads 5.38:1 on the
    dark page and 4.51:1 on the dark sheet, where `#6258F3` read 4.20:1 and 3.53:1.
  - **Decision 63:** its 500 is `#4135F1`, 3.00:1 as a shape on the dark page.
  - The contrast contract holds variant 1's 600 as text on the page and the sheet, and its 500 as a
    shape and under white. Variant 2's 600 isn't in the contract yet.
- **Was:** left visible in "Make it yours", with variant 1 and the module dark. The test now
  measures the fixed ratio.
- **Lane:** Core (tokens).

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
- **Now:** since 2026-09-28 the dashboard's sections go down the rail
  (decision 42), from 48rem. Below that the dashboard hides it (a wrapper
  `Box`, GAP-04) and opens the same sections in a `Drawer` from a menu button
  in its `Navbar`, as the site's own header does. The example's media query
  makes the switch; the rail does not.
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
- **Now:** fixed in 0.9.0 (#193). `SearchBar` takes `onKeyDown` as its own
  prop and calls it first, then sends `search_initiated` on Enter unless the
  caller prevented the default or an input method is composing. The site has
  no analytics provider, so it reports nothing either way.
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
- **Fixed** in the design system on 2026-09-23 (`550b561`): one owned rule rests
  `.kozmos-spinner-arc`, `.kozmos-skeleton` and `.kozmos-ai-search-ring`
  under `@media (prefers-reduced-motion: reduce)` and again under
  `[data-kozmos-motion=reduced]`, so the design config's `motion: reduced`
  reaches them too. The `Button`'s loader is a `SpinnerArc` and carries the
  same class, so it rests with them.
- **Was:** left visible; the motion page and the Spinner demo said so, and
  both now say it rests.
- **Lane:** Core (accessibility).
- **Evidence:** "GAP-50 is fixed: the spinner and the skeleton rest under
  reduced motion" reads each animation with the preference and without it, so
  it cannot pass on an animation that was never there. It reads them in the
  states example's loading view since the Skeleton and Spinner pages' demos
  moved to Storybook (2026-09-28). There was no test before, which is why the
  fix went unnoticed for four days.

## GAP-51 · No polite announcer

- **What:** a live region only speaks reliably when it is on the page before
  its message arrives; one that appears together with its message is often
  missed (NVDA in particular). Kozmos has one persistent announcer,
  `NavigationAnnouncer`, and it is assertive (`role="alert"`), for turn-by-turn
  instructions; a "saved" or "removed" confirmation should be polite.
- **Now:** the examples keep a status region on the page at all times — a
  `Box` with `role="status"`, or a `Text` — and put each confirmation in it;
  the `Alert` inside keeps its default, no live role of its own (GAP-12).
  Empty, the region leaves the flow (`position: absolute` on `:empty`), so no
  gap opens for it.
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
  colour filled from inside; the bands and the example canvas are edged with
  `Separator`s, as the demo stage was until the demos moved to Storybook
  (2026-09-28). In the dark theme those tints are 1.04:1 and 1.1:1 against the
  page, so the hairlines are what set them apart. The adaptive host and the
  phone frame draw nothing of their own (the map's edge shows their extent),
  and the skip link keeps the Link's radius.
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
- **What, again:** `BottomNavigation` is the same shape of problem. It pads
  its items by 8px (`px-2`) and the active item's fill runs to that padding,
  so in a screen with the container radius (20px) the corner arc slices the
  first and last items' fills. The demo's screen shows it.
- **Now (left visible):** the phone search example's screen takes the map's
  own corner radius, so the map's edge is the screen's outline; the sheet's
  cut corners show, and the example lists this gap. The home page's adaptive
  tile does not round its host, so its sheet keeps square corners there. The
  BottomNavigation demo's screen showed the second half, the sliced corner,
  until the demos moved to Storybook on 2026-09-28.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** an edge-to-edge form of the shell: the map without a
  border or radius, and a sheet with only its top edge, its sides and bottom
  at the screen's edges as a native sheet's are — or a sheet that takes its
  container's bottom radius. For `BottomNavigation`, side padding that clears
  a screen's corner (or an item fill that takes the container's radius), as
  iOS and Android both keep their tab bars' indicators inside the curve.

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
- **Evidence:** "GAP-56: a Button's icon touches its label" measured 0px on
  the Button page's "Directions" demo. Since the fix, "a button that holds an
  icon and words keeps them 8px apart" measures 8px on the site's own buttons;
  the Button page's demos moved to Storybook on 2026-09-28.
- **Fixed** in the design system on 2026-09-22 (`7775c73`): `.kozmos-button`
  takes the spacing scale's 100 — the 8px Figma and iOS keep — and the
  loader's physical `mr-2` went with it. The site's `site-button-icon` class,
  its nine usages and the dashboard's and inbox's own classes are deleted.
- **Was:** composed where a Button is part of something else: the header's
  "Theme" menu, the reference's drawer button, "Make it yours", the
  direction sample, the icons page's copy buttons, the Navbar and Menu
  demos, and two examples (listed there) add the 8px through a class — a
  property the Button does not set. Left visible on the Button page, whose
  demos show the component as it draws, and in the Get started code, which
  is Kozmos's own usage.
- **Lane:** Core.
- **Fix in Kozmos:** a gap of the spacing scale's 100 on `.kozmos-button`,
  and the loader's `mr-2` taken off.

## GAP-57 · A `Button`'s label cannot wrap

- **What:** `.kozmos-button` sets `white-space: nowrap`
  (`packages/react/src/styles/owned-components.css:263`), which everything
  inside it inherits. A label wider than the button cannot break: it
  overflows, and the page scrolls sideways. There is no prop for it. A class
  on the Button does win here (measured), but it would overturn a property
  the component sets itself, which this site does not do (README, "Put layout
  classes on Box"), so the class goes on the text inside, where `white-space`
  is only inherited.
- **Evidence:** "GAP-57: a Button's label cannot wrap" measures `white-space`
  on a Button: `nowrap`. It reads the home page's emotions tile's first since
  the Button page's demos moved to Storybook (2026-09-28), and read that
  page's before. Until 2026-09-27 it measured the icons page, where the set's
  longest name, `taxonomy-transportation-space-boarding-gate`, asked for 372px
  inside a 288px button and scrolled a phone sideways. The icon set has since
  lost its taxonomy names — 56 icons, the longest 21 characters — so that page
  no longer shows the defect, which is itself unchanged.
- **Now:** composed on the icons page: the name takes `site-icon-name`
  (`white-space: normal; overflow-wrap: anywhere`), properties `Text` does
  not set. `anywhere` also lets the box shrink below its longest word, so the
  copy button fits a phone.
- **Lane:** Core.
- **Fix in Kozmos:** let a label that cannot fit wrap — `white-space: normal`
  with `overflow-wrap: anywhere` on `.kozmos-button`, or a `wrap` prop for
  the callers that want it. The short labels Kozmos draws today are
  unaffected: they fit on their line either way.

## GAP-58 · `Toast` draws no background of its own

- **What:** `Toast`'s root carries a border, a radius, padding and
  `shadow-floating`, but no fill
  (`packages/react/src/components/Toast/Toast.tsx:38`): its computed
  background is `rgba(0, 0, 0, 0)`. Over a white page it passes for solid;
  over anything else — a map, a photograph, a list — the page reads straight
  through the words. `ToastAction` is deliberately `bg-transparent`; the root
  is not deliberate, and no variant supplies one.
- **Evidence:** "GAP-58: a Toast draws no background" measures the alpha of
  the toast's background on the Toast page. The site only saw it once the
  toast stopped floating over an empty page: the screen that contains the
  viewport (GAP-36) puts the app's own list behind it.
- **Now:** open. Only the Toast page's demo showed a toast (GAP-36), and it
  moved to Storybook with the demos on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** `bg-background` on the toast's root, beside its border
  and shadow, as `Card`, `Dialog` and `Menu` have. A `destructive` variant, if
  one comes, takes its own fill.

## GAP-59 · `DynamicIsland` is its own dark theme, so a dark page hides it

- **What:** the island wraps itself in a provider pinned to the dark theme
  (`data-kozmos-root data-theme="dark"`, `display: contents`) and paints
  `bg-background text-foreground` inside it: black with white letters,
  whatever the page. On the light theme that is the look it is named for. On
  the dark theme the capsule is `#000000` on a `#000000` page — 1:1 — so
  only its letters and icons show, floating with no shape around them, and
  `shadow-overlay` cannot be seen on black either.
- **Evidence:** "GAP-59: the island's capsule disappears into a dark page"
  measures the capsule's background against the screen behind it on the
  DynamicIsland page in the dark theme.
- **Now:** open. The DynamicIsland page's demo showed it, in both themes,
  until the demos moved to Storybook on 2026-09-28.
- **Lane:** Platform / form factor.
- **Fix in Kozmos:** on a phone the island is drawn on the bezel, where black
  on black is the point; in a page it needs a shape of its own. A hairline in
  `--semantics-border-subtle` inside the island's own dark scope, or a fill a
  step off the background (`background-25` there), would keep it an island on
  any page. Its inverted colours are not the gap.

## GAP-60 · `DynamicIsland` keeps no room for the camera it wraps

- **What:** on a phone the island is the TrueDepth camera's housing, and every
  presentation is laid out around the camera. Apple's specification, for a
  393×852 screen: the island is 230pt wide and 36.67 tall with a 44pt corner
  radius; the compact presentation is two elements of 52.33×36.67, one each
  side of the camera, which leaves 125.3pt — 54% of the island's width — for
  the camera itself; the minimal presentation is 36.67–45 wide by 36.67 and
  appears only when two activities run, one attached and one detached; the
  expanded presentation is 371 wide by 84–160 tall, its height following its
  content, and its content wraps tightly around the camera
  ([Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities),
  Compact, Minimal, Expanded and Specifications).
  Kozmos's `DynamicIsland` keeps none of that room. Measured on its page: the
  compact capsule is 240×44 with the leading icon at 16–32 and the trailing
  text at 62–224, so 30px — 12% of its width — is clear in the middle and the
  trailing slot runs across where the camera would be. The expanded capsule is
  360×160 whatever it holds, and its content fills 16 to 344 from the top
  edge, straight over the camera. The minimal capsule is 56×56, centred.
- **Evidence:** "GAP-60: the island keeps no room for the camera" measures the
  clear middle of the compact capsule and the width of the expanded content on
  the DynamicIsland page.
- **Now:** open. The DynamicIsland page's demo showed it until the demos moved
  to Storybook on 2026-09-28. The room belongs inside the component, as it
  does on the device.
- **Lane:** Platform / form factor.
- **Fix in Kozmos:** lay the presentations out around a sensor region, as
  ActivityKit does — compact as leading and trailing slots with the camera's
  share between them, expanded with leading, trailing, centre and bottom
  regions, minimal at the camera's own height — and take the sizes from the
  specification above rather than round numbers. The React island is a
  fallback for pseudo-fullscreen web apps (its own MDX), so it needs the same
  geometry: a layout that fits here but not on the phone teaches the wrong
  thing.

## GAP-61 · No glyph mirrors for right to left

- **What:** `ThemeProvider`'s `dir` flips the layout and Radix's keyboard
  order, but a glyph that points along the reading direction keeps pointing
  the way it was drawn. Measured on the theming page's direction sample with
  the provider in `rtl`: the trail runs right to left correctly — Venues at
  the right edge, Bookshop at the left — while both `BreadcrumbSeparator`s
  draw `chevron-right` with no transform, so the separators point back up the
  trail instead of along it.
- **The same code, elsewhere (read, not measured):** the package carries
  exactly one right-to-left rule —
  `.kozmos-poi-gallery:dir(rtl) .kozmos-poi-gallery-arrow { transform: rotate(180deg) }`
  — so the technique is already in the system, used once. The components that
  draw a reading-direction glyph with nothing of the kind are `Breadcrumb`
  (the separator, `Breadcrumb.tsx:84`), `Menu` (the submenu chevron,
  `Menu.tsx:31`), `Tree` (a closed row, `Tree.tsx`), `Pagination` (previous
  and next, `Pagination.tsx:83` and `:100`) and `RoutePreviewPanel` (its back
  arrow, `:136`). No component reads the direction to choose a glyph;
  `POIMediaGallery` and `AdaptiveMapShell` read it, but for scrolling and for
  panel placement.
- **What must not mirror:** a manoeuvre is a real direction. `DirectionStep`
  and `DirectionIcon` draw turns and must keep drawing them the same way in
  either direction — a right turn stays a right turn.
- **Worth an audit at the same time:** 40 of the 106 component files use
  physical utilities (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`,
  `border-l`, `rounded-r`, `text-left` …) rather than their logical
  equivalents; `Menu.tsx` alone has `pl-8`, `ml-auto` and `left-2`/`right-2`.
  Each needs a look under `dir="rtl"`: some flip correctly through flexbox,
  some will not.
- **Evidence:** "GAP-61: the breadcrumb's separator points along the trail
  right to left" measures the separator's path and transform in the
  direction sample: the Pointr set's right-pointing `ChevronRight`
  (`M9 18L15 12L9 6`; lucide's until icons 0.2.0), now
  `matrix(-1, 0, 0, 1, 0, 0)`. The built package stopped emitting the glyph's
  class name on 2026-09-27, so the path is the anchor.
- **Fixed** in the design system on 2026-10-07, in two steps. #237 mirrored
  the separator, the submenu chevron, the tree's closed row, pagination's
  pair and the route preview's back arrow with `:dir(rtl)` rules, and moved
  Menu, Tree, Pagination and Breadcrumb to logical sides. Those rules never
  reached this site: Vite 8's lightningcss lowers `:dir(rtl)` for older
  targets into a list of `:lang()` guesses, which an English page never
  matches, and Chrome and Edge before 120 do not match `:dir()` at all. Every
  right-to-left rule in the package now reads the nearest `dir` attribute
  through `--kozmos-rtl` instead, and `scripts/check-direction-rules.mjs`
  measures them as built and as lowered, in Chromium, Firefox and WebKit.
  The tree's depth indent became logical at the same time.
- **Was:** left visible on the theming page, whose sample said which arrow
  was the page's choice and which the component's. The site still picks its
  own glyphs for the sample's buttons — an `Icon` is the glyph it names — and
  has no other right-to-left surface.
- **Lane:** Core.
- **Fix in Kozmos:** mirror the reading-direction glyphs the way the gallery's
  arrows already are — `:dir(rtl)` (or an `rtl:` variant) with a 180° rotation
  on the separator, the submenu chevron, the tree's closed row and
  pagination's pair — and leave the manoeuvre icons alone. Returning `dir`
  from `useTheme()` (GAP-27) would let a component choose a glyph rather than
  rotate one, for the cases where a mirrored glyph is not the same glyph.

## GAP-62 · `Combobox` and `MultiSelect` draw their list in the page

- **What:** both render their open list as `absolute z-50` inside their own
  box (`Combobox.tsx:326`, `MultiSelect.tsx:406`) rather than through a
  portal, so any ancestor that scrolls or clips cuts it off. `Dialog`,
  `Drawer`, `Menu`, `Popover`, `Select` and `Tooltip` all portal through
  `createThemePortal`; these two are the exception, and they offer no
  `portalContainer` escape hatch.
- **Evidence:** measured on the Combobox page at 1280×900 — the list is 256px
  tall (592 → 848) inside a demo card that ends at 674, so **174px of it, and
  every option after the first, is cut**. Nothing in the site's demo clips:
  the card and its stage are ordinary host chrome, which is what any product
  card would be.
- **Now:** open. The Combobox and MultiSelect pages' demos showed it until the
  demos moved to Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** portal the list as the other six do, with the same
  provider-aware portal, and keep it positioned against the field.

## GAP-63 · `ColorPicker`'s swatch is a circle around a rectangle

- **What:** the swatch is a 32×32 box carrying `rounded-control`
  (`ColorPicker.tsx:362`). `--semantics-radius-control` is 16, and 16px on a
  32px box is a full circle — so the swatch no longer echoes the field's
  corner. Inside it, the browser paints the colour itself
  (`::-webkit-color-swatch`) as a 24×20 rounded rectangle, which leaves white
  crescents left and right and grazes the ring: a rectangle inside a circle.
- **Evidence:** measured on the ColorPicker page — swatch 32×32, computed
  `border-radius: 16px` on all four corners, 1px `#747b8b` ring; the ink
  spans x 4→28, y 6→26 inside it.
- **Now:** open. The ColorPicker page's demo showed it until the demos moved
  to Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** decide the shape and draw all of it — either a round
  swatch with the native fill styled round and filling the ring, or a square
  one whose radius is a fraction of its size rather than the control token,
  which is sized for a 44px field.

## GAP-64 · `ChipGroup` always wraps, and never centres its chips

- **What:** `ChipGroup` is `cn("flex flex-wrap gap-2", className)`
  (`Chip.tsx:179`) — no `wrap` option, as `Stack` has (`Stack.tsx:29`), and no
  `items-center`. Two things follow. A `ChipGroup` inside a horizontal
  `ScrollArea` wraps onto a second line instead of scrolling, so the pairing
  the ScrollArea page documents cannot work. And a chip whose height differs
  from its neighbours sits at the top of the line instead of on its centre.
- **Evidence:** measured on the ScrollArea page — the horizontal viewport has
  `clientWidth` 448 and `scrollWidth` 448, `scrollLeft` cannot leave 0, and
  the ten chips sit on two rows (tops 518 and 554). Setting only
  `flex-wrap: nowrap` on the group takes `scrollWidth` to 816, and the row
  scrolls. On the MultiSelect page, the `sm` chip inside the field is 28px in
  a 32px line and sits **2px above** the field's centre, while the input, the
  clear button and the caret are exact.
- **Now:** open. MultiSelect's demos and the ScrollArea page's sideways one
  showed it until the demos moved to Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** a `wrap` prop on `ChipGroup` in `Stack`'s words, and
  `items-center` on the line.

## GAP-65 · `Textarea`'s resize grip paints outside its rounded corner

- **What:** `.kozmos-textarea` carries `rounded-control` (16px) with
  `resize: vertical` (`styles/owned-components.css:53`). The browser anchors
  the resize grip to the square padding-box corner and ignores the radius, so
  the grip is drawn across and beyond the rounded edge.
- **Evidence:** measured on the Textarea page at dpr 8 — the grip's ink is
  7.5×7.5px, starting 1.75px in from the right edge; **27% of its pixels land
  on the 1px border stroke and 31% fall outside the field's visible shape**,
  overshooting the outline by up to 2.16px. Forcing `border-radius: 0` in the
  browser leaves the ink identical, which proves the grip is not clipped —
  the corner simply is not where the grip is.
- **Now:** left visible in the examples' text areas — account settings' bio,
  the booking note, the feedback survey and saved places — which keep Kozmos's
  vertical resize grip. It was measured on the Textarea page, whose demos
  moved to Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** either reserve the corner (padding at the end, so the
  grip sits inside the rounded shape), draw a grip of Kozmos's own, or square
  that corner while `resize` is on.

## GAP-66 · `EmptyState`'s words are left-aligned in a centred block

- **What:** `EmptyState` puts `text-center` on its root (`EmptyState.tsx:17`)
  and then renders its title and description through `Text` with no `align`
  (`:27`, `:31`). `Text` defaults to `align: "left"` (`Text.tsx:45`), which
  puts `kozmos-text-left` on the paragraph itself, and a declaration on the
  element beats the parent's inherited `center`.
- **Evidence:** measured on the EmptyState page — both demos' roots compute
  `text-align: center`, both titles and descriptions compute `left`. It shows
  only when the text wraps: the second demo's description hits its 280px cap,
  so its second line ends 144px short of the right edge, ragged under a
  centred icon and title.
- **Fixed** in the design system on 2026-09-25 (`b9467b1f`): both of the empty
  state's words take `align="center"`, so a wrapped description centres under
  the title. Found on 2026-09-28, reading the component; "GAP-66 is fixed: an
  empty state's wrapped description is centred" measures it on the components
  page's empty state at 320px, where the description takes two lines.
- **Was:** left visible on the EmptyState page.
- **Lane:** Core.
- **Fix in Kozmos:** pass `align="center"` from `EmptyState`, or let a
  `Text` inherit alignment when its caller does not name one.

## GAP-67 · `Menu` opens centred on its trigger

- **What:** `MenuContent` defaults `sideOffset` and nothing else
  (`Menu.tsx:58`), so Radix's `align="center"` applies: a menu wider than its
  trigger hangs off both sides. `SplitButton` (`:67`) is the only place in
  the system that sets an alignment.
- **Evidence:** measured on the Menu page — trigger 313→420 (108 wide),
  content 282→452 (170 wide), `data-align="center"`, so the menu starts
  **31px left of the button that opened it**.
- **Now:** left visible in the site's own header menu (Theme). The Menu page's
  demo showed it too until the demos moved to Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** default `align="start"` on `MenuContent`, which is what a
  dropdown under a trigger means, and leave the prop open for the rest.

## GAP-68 · `BottomNavigation`'s taller density overflows its own bar

- **What:** the bar is `h-16` — a fixed 64px (`BottomNavigation.tsx:40`) —
  while an item at `density="default"` is `min-h-[72px]`
  (`NavigationItem.tsx:57`). The items cannot fit, so they spill out of the
  bar. The same line (`:49`) passes `w-auto`, which cancels the density's own
  width classes, so they never apply either.
- **Evidence:** measured on the BottomNavigation page in both states of the
  demo's switch. `compact`: item 64px, padding 6. `default`: item 72px,
  padding 8 — 3.5px above the bar's top border and 4.5px below it, with the
  selected item's fill crossing the border. Nothing else changes: icon 24,
  label 12/16, gap 4, badge 12, bar 64 in both.
- **Now:** open. The BottomNavigation page's demo showed it until the demos
  moved to Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** let the bar take its height from its items (`min-h-16`
  rather than `h-16`), and stop overriding the density's width.

## GAP-69 · Lift, escalator and stairs share one arrow

- **Now:** fixed on main (#193), not yet released: DirectionStep draws distinct
  lift, escalator and stairs up/down pairs, plus ramp and entry/exit, in Pointr
  Maps - Express wayfinding artwork (#199; walking since #201), on web, iOS,
  Android and Figma. The DirectionStep Glyph Atlas shows small/large sizes and
  RTL. SDK map sprites and physical-device legibility remain separate. The
  evidence below records the original defect.

- **What:** `DIRECTION_ICONS` (`DirectionStep.tsx:61`) maps fourteen
  manoeuvre types onto eight glyphs: `lift-up`, `escalator-up`, `stairs-up`
  and `level-up` are all `ArrowUpFromLine`, and the four "down" types are all
  `ArrowDownToLine`. A traveller cannot tell a lift from an escalator from a
  staircase, which is the one distinction a step-free route turns on.
  `straight`, `left` and `right` use the heavy `ArrowBig*` glyphs, which do
  not match the rest of the set's weight.
- **Evidence:** read from the map itself; the fourteen manoeuvres are shown
  on the DirectionStep page, where the three up arrows are identical.
- **Before #193:** left visible in the wayfinding example: the quickest route goes up
  by escalator and the step-free one by lift. The DirectionStep and Itinerary
  pages showed all fourteen manoeuvres until the demos moved to Storybook on
  2026-09-28.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** a glyph per manoeuvre — lift, escalator, stairs, ramp,
  level change — drawn in the set's own weight. The taxonomy sprites already
  carry most of them (GAP-79).

## GAP-70 · `SelectTrigger` hides a second `FieldWrapper`

- **What:** `SelectTrigger` wraps itself in a `FieldWrapper` and forwards
  `error` to it (`Select.tsx:53`). A caller who also needs the outer
  `FieldWrapper` for a label — which is the documented way, since
  `SelectTrigger` has no `label` prop (GAP-13) — has two wrappers, and an
  error passed to both prints twice. `aria-describedby` points at the inner
  one only; the outer message is unreferenced but still `role="alert"`, so it
  is announced anyway.
- **Evidence:** measured on the Select page before the site's own fix: two
  `p[role=alert]` reading "Choose a venue.", at y 877 and y 903.
- **Now:** open. The Select page's demo passed the error to the trigger alone
  until the demos moved to Storybook on 2026-09-28; no example's select shows
  an error. The nesting itself is unchanged.
- **Lane:** Core.
- **Fix in Kozmos:** give `SelectTrigger` a `label` so one wrapper does, or
  have it inherit the wrapper it is already inside instead of making another.

## GAP-71 · `AISearchButton` has no hover state

- **What:** the button's class string carries a focus ring
  (`focus-visible:ring-2`) and a disabled state, and nothing for hover
  (`AISearchButton.tsx:24`); no rule for `.kozmos-ai-search:hover` exists in
  the package's stylesheet either. A pointer gets no feedback before it
  presses the assistant.
- **Evidence:** read from the source and the built stylesheet; the only
  `kozmos-ai-search` rules are the ring's animation.
- **Now:** open. The AISearchButton page's demo showed it until the demos
  moved to Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** a hover state in the system's own idiom — the ring
  brightening, or the surface a step warmer — and the same on the ring's
  animation so it does not read as the only affordance.

## GAP-72 · `MapOverlay` clips what floats on it

- **What:** `MapOverlay` scrolls its own content (`overflow-auto`,
  `MapOverlay.tsx:74`), and its box is exactly its child's size, so anything
  the child paints outside its border box is cut. `AdaptiveMapShell` does the
  same in two places (`:659`, `:674`). A floating `SearchBar` carries
  `shadow-floating` — the shadow that makes it read as floating over a map.
- **Evidence:** measured on the SearchBar, MapOverlay and AdaptiveMapShell
  pages: the overlay's box is byte-for-byte the search bar's own 384×44, and
  **the whole shadow is cut** — 4px each side, 8px below. Sampled at dpr 2
  under the bar, the next row is the plain map fill; the same bar outside an
  overlay fades over about 11px.
- **Fixed** in the design system on 2026-09-28 (`ded56bc5`, its GAP-082): the
  overlay's stack is padded by the floating shadow's reach, so its scroll box
  no longer cuts a control's shadow. "GAP-72 is fixed: MapOverlay keeps what
  floats in it whole" measures the kiosk directory's overlay. The room was 4px
  above its floor list, 8 either side and 12 below, the reach of the floating
  `0 4px 8px` shadow; since the map controls took the SDK's heavier shadow
  (#143) it is 32 above and either side and 48 below. The fix was
  `MapOverlay`'s alone: the shell's two boxes still cut what they hold
  (GAP-91).
- **Was:** left visible on the SearchBar, MapOverlay and AdaptiveMapShell
  pages.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** scroll only when there is something to scroll
  (`overflow: visible` until a max height is reached), or pad the overlay by
  the elevation tokens' spread so a shadow has room.

## GAP-73 · `SplitButton`'s outline variant loses its border

- **What:** the main part carries `border-r border-primary-foreground/20`
  (`SplitButton.tsx:44`) to tint the seam. `border-r` sets a width on one
  side, but `border-primary-foreground/20` sets `border-color` on **all
  four**, and it outranks `.kozmos-button-outline`'s own colour. On the
  filled variant the tint is invisible against blue; on the outline variant it
  paints white at 20% over white — the button's whole outline disappears.
- **Evidence:** measured on the SplitButton page — the outline variant's main
  part has 1px borders on all four sides at `color(srgb 1 1 1 / 0.2)`,
  **1.00:1** against its own white fill, while the chevron keeps its blue
  border. A pixel scan across the middle finds no edge at the left of "Save"
  and a blue line only at the seam.
- **Now:** open. The SplitButton page's demo showed it until the demos moved
  to Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** tint the seam with a side-specific colour
  (`border-r-primary-foreground/20`) so the rest of the border survives.

## GAP-74 · `Tooltip` draws a line across its tail

- **What:** the content has a 1px border on all four sides
  (`Tooltip.tsx:71`) and the arrow is a filled polygon with no stroke and no
  offset (`:77`). The arrow is placed flush against the content's edge, so
  the border runs straight across the join, and the arrow's own two slanted
  edges carry no outline: the tooltip is outlined everywhere except its tail,
  with a line where the two meet.
- **Evidence:** measured on the Tooltip page — content bottom 538.0, arrow
  top 538.0, zero overlap; a pixel column down the arrow's centre reads a
  solid 1px `#c7cad1` band at the join, 12.8:1 against the white either side.
- **Now:** open. The Tooltip page's demo showed it until the demos moved to
  Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** draw the arrow with the body's border — an outlined
  polygon pulled 1px into the content so the two outlines join — or take the
  border off the content and let the shadow carry the edge.

## GAP-75 · `ToggleButton` puts no space between icon and label

- **What:** `ToggleButton`'s base class string has no `gap`
  (`ToggleButton.tsx:32`), so an icon beside a label touches it — the same
  defect as GAP-56, in a component that shares none of `Button`'s CSS. It is
  a Radix Toggle styled on its own, so fixing `.kozmos-button` leaves it as
  it is.
- **Evidence:** measured on the ToggleButton page — the check icon's box ends
  at 394.00 and the label's text box starts at 394.00: **0px**, with 2px of
  apparent space that is only the glyph's ink inset. `column-gap` computes
  `normal`.
- **Now:** composed on the site's own toggle, the cover's pause button, which
  carries `site-button-icon`. The ToggleButton page's demo showed the gap
  until the demos moved to Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** the spacing scale's 100, as GAP-56 asks for `Button`.
  Fix both together, and check `Chip`, `Tag` and `SegmentedControl` for the
  same.

## GAP-76 · Dates and times are the browser's controls

- **What:** `DatePicker`, `DateRangePicker` and `TimePicker` render native
  `<input type="date">` / `type="time"` fields in a Kozmos frame
  (`DatePicker.tsx:133`, `:264`, `TimePicker.tsx`). The frame is ours; the
  calendar and the clock are the browser's. They ignore the theme and the
  tokens, differ on every platform, cannot be a single field carrying a range,
  cannot show two months at once, and cannot be driven from a product's own
  data (available days, opening hours, a venue's time zone).
- **Evidence:** on the DateRangePicker page in the light theme, opening a
  field brings up the browser's dark panel, which also overlaps the demo
  below it. Nothing in the DOM belongs to Kozmos.
- **Now:** left visible in the booking example's date and time; the site does
  not hand-build a calendar. The DatePicker, TimePicker and DateRangePicker
  pages showed it until the demos moved to Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** a calendar and a clock of Kozmos's own, in the tokens,
  with the shapes a product needs: a range in one field, a two-month panel,
  a single date, a time range, and days or hours a product can disable.

## GAP-77 · No drag and drop: no handle, no dragging state, no target

- **What:** nothing in the library draws or handles a drag — no drag handle,
  no grabbed state, no drop target, no reorderable list. A product that lets
  someone reorder saved places, stops on a route, or floors in a list has to
  build all of it.
- **Evidence:** no `draggable`, `onDragStart`, drag handle or sortable list
  anywhere in `packages/react/src/components`.
- **Now:** open. No example on the site needs one yet.
- **Lane:** Core.
- **Fix in Kozmos:** a drag handle part, the states (grabbed, over a target,
  refused), and a reorderable list built on them — with keyboard reordering,
  which is where hand-built drag and drop usually fails.

## GAP-78 · `Switch` cannot lead with its label

- **What:** `Switch` renders the control and then its `label`
  (`Switch.tsx:52`), always in that order, and takes no prop for the other
  arrangement. A settings row — the label at the start of the line, the
  control at its end — cannot be built from it without a caller laying the
  two out and naming the control itself.
- **Evidence:** read from the component; its only label prop is a string
  rendered after the input.
- **Now:** open.
- **Lane:** Core.
- **Fix in Kozmos:** a `labelPlacement` (`"end"` by default, `"start"` for a
  settings row), keeping the label bound to the control either way.

## GAP-79 · The Pointr icons ship, but cannot be asked for by name

- **What:** the Pointr library has been generated into the package —
  `icons/src/pointr/icons.generated.ts` exports **1,174** icon components and
  `index.ts` re-exports them all. The registry did not follow: the named set
  that `Icon name="…"` resolves, which is also what the site's icons page and
  its search read, is **56**. The outlines ship and cannot be asked for by
  name, so a product that wants a venue's categories imports each component
  directly and loses the registry's names, aliases and categories.
- **Evidence:** counted from the package on 2026-09-27: 56 registry
  definitions (General 20, Arrows 10, Maps & travel 7, Time 4, and a tail of
  ones and twos — no Taxonomy category any more) against 1,174 generated
  Pointr components.
- **Now:** open. GAP-07 and GAP-15 list the particular glyphs the site and the
  examples went without.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** put the generated Pointr icons in the registry with
  their names, categories and aliases, so `Icon name="…"` reaches them and one
  source serves a venue's categories, its manoeuvres (GAP-69) and its
  amenities. The generation is done; the naming is what is missing.

## GAP-80 · No row actions: nothing shows on hover outside `Tree`

- **What:** `Tree` fades a row's actions in on hover, focus and selection
  (`Tree.tsx:548`). Nothing else does, and there is no part for the pattern:
  no overflow ("…") button, no row-actions slot on `Table`, `List` or the POI
  rows. A product that wants "hide", "lock" or "more" on a row builds the
  affordance, the timing and the keyboard path itself.
- **Evidence:** `group-hover` appears in three components only — `POICard`
  (an image zoom), `Toast` (its close button) and `Tree` (its actions).
- **Now:** open.
- **Lane:** Core.
- **Fix in Kozmos:** lift `Tree`'s pattern into a part every row can use — an
  actions slot that appears on hover and focus, stays for the selected row,
  and is reachable from the keyboard — with an overflow button among the
  icons.

## GAP-81 · Components carried placeholder documentation

- **What:** Components described themselves as "Displays the X interface
  topology natively" — a placeholder that says nothing about what the part is
  for or when to reach for it. `SegmentedControl` provided the model:
  it says to use it for one choice from a short visible set, to prefer
  `Radio` for longer lists and `Tabs` when the selection changes which
  content is visible. `Tabs` itself carried the placeholder, so the pair
  could not be told apart from the documentation.
- **Evidence:** counted from the component docs the site reads: 36 of 112 open
  with "Displays the <Name> interface topology natively." on 2026-09-28 (37 of
  104 on 2026-09-24), and the same 36 of 113 components on 2026-09-29, when
  MapStatusPill arrived with a description of its own. DatePicker and
  TimePicker repeated the sentence as a second paragraph.
- **Before this correction on 2026-10-01:** 35 of the 116 component docs opened
  with the placeholder; DatePicker and TimePicker repeated it later (37 occurrences).
  Counts are dated evidence, not a generated current-status total.
- **Now:** fixed in source: the placeholder introductions have been replaced
  with component-specific purpose and usage guidance. The site, search and
  generated API cards consume those descriptions. `skills:check` rejects the
  generic topology sentence; the site end-to-end test verifies Backdrop's real
  description and the absence of the old missing-description notice. This
  closes the placeholder-introduction gap, not all documentation or parity work.
- **Lane:** Core.
- **Maintenance:** keep introductions specific to the implemented component;
  build and verify the generated documentation when those descriptions change.

## GAP-82 · A category pill's fill is 2.52:1 on its own field

- **What:** a category's count pill is painted in
  `--semantics-category-fill-*` on a field washed with the same category's
  colour. The ink inside the pill passes — the tokens hold it to 4.5:1 — but
  the pill's own silhouette against the field behind it does not. WCAG 1.4.11
  asks 3:1 of a graphic that carries meaning, and the count's shape is what
  separates it from the label beside it.
- **Evidence:** measured on the CategoryField page in the light theme: the
  turquoise pill reads **2.52:1** against its field, green 3.02:1, blue
  3.74:1. Their text passes throughout (4.57, 4.82 and 5.88:1 at 12px/600).
- **Now:** left visible in the venue explorer and phone search examples, once
  a category is chosen: Information is the turquoise one. The site paints
  nothing here: the tints are the tokens', through the shared `tint()` helper.
  It was measured on the CategoryField page, whose demos moved to Storybook on
  2026-09-28.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** hold a category's fill to 3:1 against the wash it sits
  on, the way `pnpm tokens:contrast:check` already holds its ink to 4.5:1 —
  or give the pill an edge so its shape survives whatever the fills do.

## GAP-83 · `AIMessageList`'s scrolling thread cannot take focus

- **What:** the thread scrolls (`AIMessageList.tsx:61`, `overflow-y-auto`) and
  carries no `tabIndex`, so a keyboard alone cannot scroll it — and a thread of
  answers often holds no control to tab to. `ScrollArea.tsx:42` does give its
  viewport a tabindex, so the system knows the pattern. axe reports
  `scrollable-region-focusable`, serious.
- **Evidence:** the AIMessageList page failed axe until the demo passed
  `tabIndex={0}` itself.
- **Now:** composed in the phone search example, whose assistant passes
  `tabIndex={0}` to its thread, with a comment that says why; axe passes with
  the assistant open. The AIMessageList demos did the same until they moved
  to Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** give the scroller a tabindex, as `ScrollArea` does.

## GAP-84 · A `POIResultGroup` inside a list loses its words and its control

- **What:** `POIResultList` forwards a group's `label`, `collapsedCount` and
  `defaultExpanded` (`POIResultList.tsx:131`) but not `showMoreLabel`,
  `hideLabel`, `expanded` or `onExpandedChange` — while the component's own
  docs tell a product to hand groups straight to the list. So inside a list
  the group says "Show 3 more" in English, and a product cannot drive it.
- **Now:** open. The POIResultGroup page showed both the standalone group and
  one inside a list until the demos moved to Storybook on 2026-09-28.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** forward the rest of the group's props.

## GAP-85 · `POIResultGroup`'s label makes every group a landmark

- **What:** a labelled group is a named `<section>` (`POIResultGroup.tsx:97`),
  so two groups with the same name are two identical landmarks, and a list of
  groups nests landmarks inside the list's own section. axe's
  `landmark-unique` fails.
- **Now:** open. The demos named their groups differently until the demos
  moved to Storybook on 2026-09-28; no example has a group.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** a group is a list section, not a landmark; use a heading
  and `aria-labelledby`, or take the region role off.

## GAP-86 · No microphone or speaker glyph for the assistant's controls

- **What:** `AIInputBar`'s docs name `trailing` as the place for a voice
  control and `AIMessage` names a read-aloud control, and the icon registry's
  56 names carry neither a microphone nor a speaker.
- **Fixed** in the design system on 2026-09-28 (#140): `AIInputBar` draws the
  voice control itself, between the field and send, with the Pointr set's
  `Microphone01` at rest and listening, `VolumeMax` while the assistant speaks,
  `MicrophoneOff01` when voice is unavailable or failed, and the spinner while
  it connects. The phone search's assistant shows them, and "GAP-86 is fixed:
  the assistant's voice control draws its own marks" reads each state's mark.
  What is left is a speaker for a read-aloud control in `AIMessage`'s
  `trailing` slot: `VolumeMax` is exported, but `Icon name` cannot reach it
  (GAP-79).
- **Was:** the AIInputBar demo used `stars-01` for "Suggest a question", and
  said why, until the demos moved to Storybook on 2026-09-28. Related: GAP-07,
  GAP-15, GAP-79.
- **Lane:** Core.
- **Fix in Kozmos:** a microphone, a speaker and a stop, in the set's weight.

## GAP-87 · `AIInputBar`'s `disabled` does not reach its `trailing` slot

- **What:** `disabled` stops the field and the send button
  (`AIInputBar.tsx:61`) and leaves whatever sits in `trailing` live, so a bar
  that looks disabled still takes a press. Undocumented.
- **Now:** open. The AIInputBar page's demo said it until the demos moved to
  Storybook on 2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** pass the state to the slot, or document that a caller
  must disable its own control.

## GAP-88 · `ActionCard`'s title is a paragraph, not a heading

- **What:** the card's `title` renders as a `<p>` (`ActionCard.tsx:20`), so a
  card holding a result list is not reachable by heading navigation — the same
  shape as GAP-11 for `EmptyState`.
- **Now:** left visible in the phone search example: the assistant's answers
  put their places in an `ActionCard` titled "1 place" or "3 places", and the
  title is a paragraph, so heading navigation passes the places by. The
  ActionCard page's demo showed it until the demos moved to Storybook on
  2026-09-28.
- **Lane:** Core.
- **Fix in Kozmos:** a heading level, as `AlertTitle` now takes (GAP-12).

## GAP-89 · `BrowseCategoriesPanel`'s tiles overlap below about 360px

- **What:** the panel lays its categories in four fixed columns
  (`grid-cols-4`) while each tile's icon box is a fixed `h-16 w-16` that
  cannot shrink. Under about 361px of viewport a column is narrower than
  64px and the icons run over each other: measured at 320px the column is
  45.5px, the icon 64px, and neighbouring icons overlap by 10.5px, badges
  clipped and labels broken mid-word ("Transp / ort"). At 360px they touch
  (-0.5px); at 390px there is 7px between them.
- **Now:** open. The BrowseCategoriesPanel page showed it at 320px until the
  demos moved to Storybook on 2026-09-28. In the phone search example at 320px
  its six tiles are 61px wide and do not overlap (measured 2026-09-28).
- **Lane:** Product / SDK.
- **Fix in Kozmos:** size the track from the tile, not the count —
  `repeat(auto-fit, minmax(4rem, 1fr))` — so the row rewraps instead of
  overrunning.

## GAP-90 · The brand family is named but no font is shipped

- **What:** `--semantics-typography-family-brand: Readex Pro` carries no
  fallback and no `@font-face`, webfont link or font file exists in the
  repository; the tokens' own description says so. Every surface therefore
  renders in `--semantics-typography-family-system`, which ends in the
  host's `system-ui` — SF Pro on macOS, a much wider DejaVu Sans on the
  Linux the CI runs. The same page wraps in different places on the two: the
  home page's claim takes one line here and two there, which put the hero's
  buttons 34px below the fold on a 1280 by 720 laptop, and a part's name ran
  a component page off a 320px screen. Both were invisible to a macOS run.
- **Now:** every layout the site measures is measured twice, in the host's
  sans and in a deliberately wide one (`WIDE_SANS` in `tests/site.spec.ts`),
  and the hero's ring is sized for the wider.
- **Lane:** Core.
- **Fix in Kozmos:** ship the file and measure its metrics
  (`packages/tokens` names `scripts/measure-font-metrics.mjs` for this), or
  give the family a metric-compatible fallback stack so the type is the same
  everywhere it is not installed.

## GAP-91 · `AdaptiveMapShell` cuts its top bar's and controls' shadows

- **What:** the shell holds its `topBar` and its `controls` in boxes that
  scroll (`overflow-auto`, `AdaptiveMapShell.tsx:827` and `:842`), each the
  size of what it holds, so whatever those cast outside their own box is cut
  at its edge: a search bar's or a routing card's floating shadow, the floor
  selector's, and the map controls' heavier one (decision 40), which reaches
  32px either side and 48px below. GAP-72 named these boxes with
  `MapOverlay`'s; the fix that padded MapOverlay by the shadows' reach
  (`ded56bc5`) left the shell's as they were.
- **Evidence:** measured on 2026-09-28 at dpr 2 in the venue explorer and the
  wayfinding preview at 1280. The controls' box is 54px wide, the floor
  selector's width, and its bottom is the location control's: past those
  edges the map's fill starts at once. With the box's overflow made visible
  (a probe, not the page), the same shadows run on for about 24px to the
  side and further below. The routing card in the top bar loses its shadow
  along its bottom and its end the same way.
- **Now:** left visible in the venue explorer, the wayfinding and the phone
  search examples. "GAP-91: the map shell's boxes cut the shadows of what
  they hold" measures the room round each box's first part against its
  shadow's reach, and fails once there is room.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** what `MapOverlay`'s stack does now: pad both boxes by the
  reach of the shadows what they hold casts, read from the elevation tokens,
  and take it back with negative margins; or let them scroll only once they
  reach their maximum size.

## GAP-92 · `AdaptiveMapShell` does not say which edge its controls sit on

- **What:** the shell sets its `controls` against the inline start beside a
  side panel at the end, and against the inline end over a sheet
  (`AdaptiveMapShell.tsx:485`, `controlsOnLeft`), and anchors their box there;
  but it tells what it holds nothing of it. A column of controls — the floor
  selector over the map controls — has to line up on that edge itself, or a
  control that widens to say its mode (`MapControlsGroup`'s
  `locationRevealOnChange`) moves the others: with the column lined up on
  the inline end beside a side panel, the floor selector jumped 48px to the
  right in the venue explorer, and 77px in the wayfinding while step-free
  said "On", and back 2.5s later.
- **Now:** composed. The venue explorer and the wayfinding read the
  presentation from `onLayoutChange` and line their column up on the edge it
  gives (`src/examples/controls-edge.ts`), which repeats the shell's rule for
  a panel placed at the end. "The map controls keep their place when one
  widens to say its mode" measures the floor selector while it does, and the
  wayfinding's step-free test does the same.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** publish the edge — a `data-controls-edge` on the
  controls' box, or a property such as `--kozmos-map-controls-align` — or line
  what the box holds up on that edge itself.

## GAP-93 · `AICompanionPanel` leaves what it covers in the tab order

- **What:** the panel covers the frame, as its docs ask, and moves focus into
  itself as it opens, but what it covers stays in the tab order and the
  accessibility tree. Stepping back out of the panel with Shift+Tab lands on
  controls under it that nobody can see — WCAG 2.2's 2.4.11, Focus Not
  Obscured. The system has the pattern: `Select` makes the rest of the page
  inert while it is open (`utils/modal-inert`).
- **Evidence:** in the phone search with the assistant open, on 2026-09-28,
  Shift+Tab from the panel went to the sheet's category tiles, "Wi-Fi
  zones", then "Offices", then "Events", all under the panel.
- **Fixed** in the design system (2026-09-29): while it is open, the panel
  makes what it covers inert, with the `utils/modal-inert` that `Select`
  uses, scoped to the box it is laid over and fills — `absolute inset-0` in
  its positioned container, as its docs place it — and never the page beyond
  it. Live regions beneath still speak, and it gives everything back before
  it hands focus back as it closes. A panel in flow, or over part of its box,
  covers nothing and changes nothing. The phone search no longer passes
  `inert` to the map shell, and "the assistant keeps the keyboard out of what
  it covers" now walks Kozmos: without the fix it fails on "focus under the
  panel".
- **Was:** composed. The phone search passed `inert` to the map shell while
  the assistant was open, so Shift+Tab left the frame for the sheet switcher
  above it.
- **Lane:** Core.
- **Fix in Kozmos:** a way to say what the panel covers — a `covers` ref it
  makes inert while open — or a line in its docs that the product must.

## GAP-94 · `Text`'s muted colour does not follow a glass surface

- **What:** on glass, text that is muted elsewhere takes the foreground
  colour, so it reads at 4.5:1 over any map (decision 48). The glass says so
  through `--kozmos-surface-muted-foreground`. The parts the map shell hosts
  read it (`.kozmos-muted-text`), and since #151 so do the cards that take
  `surface`, and Surface's docs say every Kozmos part's muted text does; but
  `Text`'s `color="muted"` (`.kozmos-text-muted`, `owned-typography.css:64`)
  does not, so a product's own muted words on a glass panel stay the muted
  grey.
- **Evidence:** measured on 2026-09-28 on the elevation page
  (`/foundations/elevation`), whose glass card (`src/foundations/GlassStage.tsx`,
  a `Surface variant="glass"`) sits over the category colours. A muted `Text`'s
  own element, cloned from the page into the card, draws in the muted grey
  (93,98,111 in light, 162,157,144 in dark); a `.kozmos-muted-text` line
  beside it draws in the foreground colour. Against the glass as drawn behind
  each line, over the turquoise, the grey is at worst 4.51:1 in light and
  4.85:1 in dark, the foreground 15.5:1 and 13.1:1, in Chromium, Firefox and
  WebKit. #145 measured the same grey as low as 3.6:1 over a saturated map.
- **Now:** open. No example is glass since decision 49, so none shows it.
  "GAP-94: Text's muted colour stays grey on a glass Surface" reads it on the
  elevation page's card, and fails once the `Text` follows the glass.
- **Lane:** Core.
- **Fix in Kozmos:** let `.kozmos-text-muted` read the surface's property, as
  `.kozmos-muted-text` does, falling back to the muted colour.

## GAP-95 · `FloorSelector`'s column can grow out of the map it floats on

- **What:** the collapsible level switcher (decision 38, #144) opens its
  column in a `Popover`, portalled to the page and placed by Radix against
  the window: it grows up over the tile, and turns down only where the
  window's edge leaves it no room (`FloorSelector.tsx`, the collapsible's
  `PopoverContent`, `side="top"`). Nothing sets its collision boundary, so a
  map smaller than the window — a pane in a web app, the site's phone frame
  — cannot keep the column inside itself. iOS measures against the window's
  safe area too, which is right for a map that fills the screen.
- **Evidence:** measured on 2026-09-28 in the phone search at 1280×900 and
  1280×720, in Chromium, Firefox and WebKit. Opened from the tile under the
  search bar, the column rises 28px above the phone's frame, over the page's
  sheet switcher. In the wayfinding, whose map fills its canvas, it stays 52
  to 58px inside the canvas's top.
- **Now:** left visible in the phone search. "GAP-95: the level switcher's
  column grows out of the phone's frame" reads the column against the frame,
  and the same reading on the wayfinding finds it inside.
- **Lane:** Product / SDK.
- **Fix in Kozmos:** a collision boundary for the column (Radix's
  `collisionBoundary`), which `AdaptiveMapShell` can fill with its map's
  bounds, or the shell as the default boundary for what floats on it.
