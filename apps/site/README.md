# @kozmos-ds/site

The Kozmos design system's website: what Kozmos is, shown live; the
foundations, drawn from the tokens; a reference of every component with live
examples, props and three-platform code; thirteen page and app examples built
from Kozmos components and nothing else; and a search across all of it.

**Status, 2026-09-27:** pre-release, in a public repository. It lives on
`claude/kozmos-site`, based on `main`, and is open as pull request #55. It
touches nothing outside `apps/site` except `pnpm-lock.yaml`, the two
workflows that test and publish it, and the repository's own front door
(`README.md`, `SECURITY.md`, `CONTRIBUTING.md`). Merging it publishes the
site to <https://vodoco.github.io/kozmos-design-system/>; every page still
says `noindex` until the launch.

- [Where it lives](#where-it-lives)
- [Run it](#run-it)
- [The one rule](#the-one-rule)
- [How it is built](#how-it-is-built)
- [The pages](#the-pages)
- [Add an example](#add-an-example)
- [Add or change a component demo](#add-or-change-a-component-demo)
- [Add a foundations page](#add-a-foundations-page)
- [Add or change a page](#add-or-change-a-page)
- [Styling](#styling)
- [Testing](#testing)
- [Keeping up with the component branch](#keeping-up-with-the-component-branch)
- [The day the packages are published](#the-day-the-packages-are-published)
- [Deploying](#deploying)
- [Decisions still open](#decisions-still-open)
- [Found along the way, outside the site](#found-along-the-way-outside-the-site)
- [Troubleshooting](#troubleshooting)

---

## Where it lives

| What              | Where                                                               |
| ----------------- | ------------------------------------------------------------------- |
| Working copy      | `/Volumes/4TB Depo/development/K/kozmos-design-system-site`         |
| Branch            | `claude/kozmos-site`, pushed; pull request #55 against `main`       |
| Based on          | `main`                                                              |
| The site          | `apps/site` in that working copy                                    |
| Gaps it found     | [`GAPS.md`](./GAPS.md)                                              |
| Fixes for Kozmos  | [`DS-HANDOFF.md`](./DS-HANDOFF.md), for whoever changes `packages/` |
| The main checkout | `…/kozmos-design-system-dev`, on `main` — the site is not there     |

The working copy is a git worktree of the same repository, so its commits
live in the main checkout's `.git` and survive even if the folder is deleted.
Open the folder itself in your editor to work on the site. It sits next to
the repository, not in a temporary folder, because temporary worktrees get
cleaned away.

To make a fresh working copy elsewhere:

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-dev"
git worktree add ../another-folder claude/kozmos-site
```

## Run it

From the working copy's root:

```sh
pnpm install
pnpm turbo run build --filter=@kozmos-ds/site^...   # the four Kozmos packages the site uses
pnpm --filter @kozmos-ds/site dev                   # http://localhost:5180
```

The site reads each Kozmos package's built `dist`, so rebuild them (the
second line) after pulling component changes. Turbo only rebuilds what
changed.

| Script (`pnpm --filter @kozmos-ds/site …`) | What it does                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `generate`                                 | Rebuilds `src/generated/` from the design system's sources (below). Run by dev, build and typecheck. |
| `dev`                                      | Dev server with hot reload on port 5180.                                                             |
| `build`                                    | Generate, route types, `tsc`, then the static build into `build/client`.                             |
| `preview`                                  | Serves `build/client` on 5181 the way a static host does (404s included).                            |
| `typecheck`                                | Generate, route types and `tsc` only.                                                                |
| `lint`                                     | ESLint, then `scripts/check-ds-only.mjs` (the one rule).                                             |
| `test`                                     | Unit tests: the token parser, contrast, the brand override, the generators, the rule's checker.      |
| `test:e2e`                                 | Playwright in Chromium, Firefox and WebKit against the build. Build first.                           |
| `brand`                                    | Rewrites the K mark and the favicons from the logo and the tokens (needs Playwright's Chromium).     |

Screenshots of 23 pages — home, get started, the examples and each example,
a foundations page, five component pages, the 404 — light and dark, desktop
and phone, into `apps/site/screenshots/` (not committed; the list is in
`tests/screenshots.spec.ts`):

```sh
SCREENSHOTS=1 pnpm --filter @kozmos-ds/site test:e2e --project=chromium tests/screenshots.spec.ts
```

Ports: Storybook holds 6006, mapscale-review 5173; the site takes 5180 (Vite,
`strictPort`, so it fails loudly rather than drift) and 5181, where
`scripts/serve-static.mjs` serves the build. Outside CI the e2e tests reuse
whatever already answers on 5181 (`reuseExistingServer`), so stop an old
server after rebuilding if it predates a change to `serve-static.mjs`.

## The one rule

**What is on the page is Kozmos.** Every visible part is a component from
`@kozmos-ds/react`; every colour, radius, shadow, size and spacing value is a
Kozmos token. It is the rule Kozmos sets for its examples (only what the
design system exports, its tokens and its roles), applied to the whole site,
for the same reason: the site is the best test the system gets before it is
published, and a workaround destroys the evidence.

One allowance, decided on 2026-09-21: **site CSS may set typography from the
typography tokens** — a size, line height, family or spacing named by a token
variable, never a literal. The tokens carry a 60px heading the `Heading`
component cannot reach (GAP-21), and a landing page needs it. Colour tokens
are allowed in site CSS on the same footing.

When Kozmos cannot express something:

1. **Do not approximate it.** No hand-made div standing in for a component, no
   raw colour, no class that quietly reinvents a part.
2. **Write it in [`GAPS.md`](./GAPS.md)** — the component and part, what was
   tried, the lane, the evidence — and give it the next `GAP-nn`.
3. If a Kozmos composition can stand in honestly (a footer made of Container,
   Stack, Text and Link), build it, mark the entry _composed_, and say so in a
   comment naming the gap. If not, the part is left out and the entry stays
   _open_.
4. A gap parks **that** example or part, not the site.

`pnpm --filter @kozmos-ds/site lint` enforces the mechanical half of this with
`scripts/check-ds-only.mjs`, which reads every file in `src` (except the
generated data):

- **Imports** only from `react`, `react-dom`, `react-router`,
  `@react-router/dev` (the route table and config), the Kozmos packages
  (including a stylesheet's text through `?raw`), or the site itself (`node:`
  built-ins in tests only). No other UI library, icon set or class helper.
- **Elements:** no raw `div`, `span`, `p`, `h1`–`h6`, `a`, `button`, `input`,
  `select`, `textarea`, `label`, `ul`/`ol`/`li`, `table`, `hr`, `svg` or `img` —
  the message names the Kozmos component to use. Allowed, because Kozmos has
  no equivalent and they carry meaning: `main`, `section`, `article`, `aside`,
  `header`, `footer`, `nav`, `form`, `pre`, `code`, `kbd`, `strong`, `em`,
  `br`, `time`, `abbr` (and the document's `html`/`head`/`body`/`meta`/`link`).
- **`style`** may only pass CSS custom properties — how data reaches CSS,
  such as a pin's position on the map or a swatch's token. Their values, like
  every string, are checked for colours only.
  `src/lib/css-custom-properties.d.ts` lets TypeScript accept them.
- **`className`** names the site's own classes (`site-…`, or an example's
  `ex-…`), never one of Kozmos's utility classes (`w-full`): those are its
  internals, not an interface. A call such as `buttonVariants(…)` is
  Kozmos's own interface and passes.
- **Strings** may not hold a colour (`#1051e8`, `rgb(…)` and the like); a unit
  test's sample colours are exempt.
- **CSS:** no colour literals or named colours, no `!important`; typography
  only through `var()`s (by convention the typography tokens), never a typed
  number; radii and shadows only from tokens; fixed spacing (`gap`, `margin`,
  `padding`, `inset`) only from tokens — percentages are allowed, since they
  place rather than space. A `var()`'s fallback counts like any value
  (`var(--y, 1.4)` is a typed 1.4). No selector that reaches into Kozmos
  (`.kozmos-*`, `[data-slot]`), and no universal or element selector
  (`> *`, `h2`), which lands on Kozmos's elements too; `html` and `body` are
  the exceptions.
- **An example's CSS** reads the tokens themselves
  (`calc(var(--primitives-layout-spacing-300) * 1px)`), never the site's
  `--site-*` aliases: its Source tab shows it as it is, to be copied.

The checker has its own tests (`scripts/check-ds-only.test.mjs`) that feed it
bad code, so a green run means something.

The other half — whether each rule the site writes actually applies — is
measured in the browser: every page's e2e test adds each site and example
rule again with an ID's more weight and fails on whatever that changes
(`overriddenSiteCss`), because a declaration Kozmos outranks does nothing,
silently: its scoped utilities (GAP-04), and its scoped preflight, which
zeroes the border of any box inside the provider (GAP-52). A second check,
`clippedEdges`, fails where a rounded box that clips cuts the border of what
sits in its corner.

## How it is built

- **React Router 7, framework mode, pre-rendered.** `ssr: false` with
  `prerender`: every route is rendered to HTML at build time and hydrated in
  the browser; nothing runs on a server afterwards. Output: `build/client`.
  React Router 8 needs Node 22, and CI runs Node 20; all five `v8_` future
  flags are already on, so the upgrade is small.
- **React 19** with `@kozmos-ds/react` from the workspace (`workspace:*`).
- **`@react-router/node` and `isbot`** are dependencies even though nothing
  serves the site from Node: the pre-render step needs them, and React Router
  only looks in `dependencies`.
- **Generated data.** `scripts/generate-reference.mjs` reads the design
  system's own sources and writes `src/generated/` (gitignored; `pnpm
generate` runs before dev, build and typecheck):
  - `components.json` and `components/<slug>.json`: every component folder
    under `packages/react/src/components`, its lane from the sets in
    `scripts/skills/check-completion.ts` (the same ones that build
    `docs/status.md`), its description and its React, Vue, SwiftUI and Compose
    snippets from its `.mdx`, and its parts and props read from the
    TypeScript source with the compiler API: every component the package
    exports from that folder (re-exports followed), its props type resolved
    through `forwardRef`, `React.FC`, function parameters and aliases, unions
    merged, and only the props declared in this repository or by a Radix
    primitive (those carry `source`), with defaults from destructuring and
    `cva`'s `defaultVariants`, every string default written double-quoted as
    the type column writes a string. A component's code comes from its docs'
    `PlatformSnippets`, or failing that the first fenced block in each
    platform's language; the index records which platforms each has.
    `react-docgen-typescript` was tried first and read the wrong symbols
    (`Surface`'s "props" came out as string methods); it is no longer a
    dependency.
  - `contrast-contract.json`: a copy of `packages/tokens/src/contrast-contract.json`,
    so the colour page can measure the same pairs CI does.
  - `roadmap.json`, from `scripts/generate-roadmap.mjs`: every row of
    `GAPS.md`'s table (what, lane, status) under the priority `DS-HANDOFF.md`
    gives it (its `## Pn — …` sections, their `### GAP-nn` headings and
    table rows). A gap the handoff names that the table lacks, an unknown
    status or a gap given two priorities fails the run, so the roadmap page
    says what the two documents say.
- **Tokens at runtime.** `src/lib/tokens.ts` imports the tokens package's
  light and dark stylesheets as text and parses every variable, its two values
  and the description beside it. The foundations pages are drawn from that
  list, so they cannot drift from what the components use.

```
apps/site/
├── react-router.config.ts   static build; pre-renders /404 and copies it to 404.html
├── vite.config.ts           dedupes React; pre-bundles Kozmos's dependencies; port 5180
├── playwright.config.ts     three browsers against the build on 5181
├── tsconfig.json            maps React's types to this app's (see Troubleshooting)
├── turbo.json               the site's build and test inputs for Turbo's cache
├── eslint.config.js
├── GAPS.md                  what Kozmos cannot do yet, measured
├── DS-HANDOFF.md            the gaps as prioritised work for packages/
├── public/
│   ├── favicon.svg, favicon.ico, apple-touch-icon.png   generated (pnpm brand)
│   └── media/               three colour-free illustrations the gallery demos show
├── scripts/
│   ├── check-ds-only.mjs    the one rule, enforced (+ its tests)
│   ├── generate-reference.mjs  the generated data (+ its tests)
│   ├── generate-roadmap.mjs the roadmap's data, from GAPS.md and DS-HANDOFF.md (+ its tests)
│   ├── generate-brand.mjs   the K mark and favicons, from the logo and tokens (+ its tests)
│   └── serve-static.mjs     `preview` and the e2e tests' server
├── tests/
│   ├── site.spec.ts         end-to-end: every page, axe, themes, navigation, the live parts
│   └── screenshots.spec.ts  pictures for people (SCREENSHOTS=1)
└── src/
    ├── root.tsx             document, stylesheets, favicons, ThemeProvider, error page
    ├── routes.ts            the route table: plain pages, examples, foundations, one per component
    ├── brand/               the logo as supplied (canvas trimmed), and its K and star, generated
    ├── routes/              home, get-started, examples, roadmap, not-found, the two layouts,
    │                          foundations/ (one file per page), components/ (the
    │                          index and the page for one component)
    ├── site/                the frames (SiteShell, DocsShell), header, footer, links,
    │                          home bands, code block, copy button, inline code, reveal,
    │                          miniature, example page
    ├── home/                the cover (Cosmos.tsx), the live tiles, make it yours, the pipeline
    ├── foundations/         the page list, shared parts (swatches, tables, specimens),
    │                          the motion, glass and direction demos
    ├── examples/            manifest.ts (data, no React), registry.tsx (lazy components),
    │                          focus.ts (focus for a view that replaces another),
    │                          one folder per example
    ├── reference/           the component reference: types, the demo registry, the
    │                          sidebar's sections (nav.ts), the generated-data loader,
    │                          the shared sample data, the glass backdrop, demos/ (one
    │                          file per component)
    ├── snippets/            the code Get started shows, type-checked
    ├── lib/                 site facts, tokens, contrast, brand overrides, CI gates,
    │                          the import parser, CSS custom-property typing
    ├── generated/           written by `pnpm generate`, gitignored
    └── styles/site.css      layout, and type sizes from tokens
```

**Theming.** One `ThemeProvider` wraps the app (`defaultTheme="system"`,
remembered under `kozmos-site-theme`). Kozmos scopes its tokens to the
provider, so the document itself would have none; the site also loads the
tokens package's own light and dark stylesheets and mirrors the resolved theme
onto `<html data-theme>`, so the page canvas and scrollbars follow too. A
pre-rendered page starts light for a dark-mode visitor until it hydrates —
GAP-03.

**Pre-rendered text must hydrate to itself.** Anything formatted by the
locale — `toLocaleDateString`, `toLocaleString` — can differ between Node,
which pre-renders, and the browser: WebKit's "Sep" is not Node's "Sept", and
React reports the mismatch (error 418). Pages format dates and numbers by
hand (`src/examples/dashboard/data.ts`); anything locale-dependent may only
appear after an interaction.

**Lazy demos are cached per slug.** `src/reference/registry.ts` makes one
`React.lazy` component per slug and keeps it. A lazy component made during a
render (`useMemo(() => lazy(…))`) is thrown away when that render suspends,
so a same-route navigation — Tree to Tooltip — made a new one on every retry
and never settled: the address changed and the page did not.

**Nested providers paint nothing.** A `ThemeProvider` is `display: contents`;
put a `Surface` inside a nested provider, or its content sits on the outer
theme's background (the tokens tile learned this from axe).

**Links.** Kozmos's `Link` and `NavigationItem` render a real `<a href>`;
`src/site/links.tsx` adds React Router's `useLinkClickHandler`, so a plain
click navigates in the app and a modified click or no JavaScript behaves like
any link. Use `SiteLink` for text links, `SiteNavItem` in the header and
sidebar, and `ButtonLink` for links that look like buttons. After a
navigation, focus moves to `<main>` so a screen reader lands on the new page
— also when the navigation crosses the site's two frames, which mounts a new
`<main>`: the last address is kept outside the frames (`SiteShell.tsx`). A
link to part of a page (`/get-started#checks`) moves focus to that part —
sections with an id take focus — and the page's scroll padding keeps it clear
of the sticky header. The search and both drawers navigate only once they
have closed (`useNavigateAfterClose` in `links.tsx`): Radix gives focus back
to the button that opened them when their closing animation ends, which
would otherwise land after the new page had taken it.

**Focus and announcements in the examples.** Where a view replaces another
in place — a step, a place's details, a confirmation — the control that was
pressed goes with it, so `src/examples/focus.ts` moves focus to the new
view's heading or panel. A status message goes into a region that is always
on the page (a `Box role="status"`, or a `Text`), with `role="none"` on the
`Alert` drawn inside it: a live region that arrives with its message is often
missed (GAP-51). Empty, the region leaves the flow, so it opens no gap.

**One route per component.** `src/routes.ts` registers
`components/<slug>` for each component in the generated index, not one
`components/:slug` route: an unknown address then matches the not-found
route in the browser as it did when `404.html` was pre-rendered. (With a
`:slug` route it matched the component route, found no data for itself, and
showed "Something went wrong" with a hydration error.)

**The header.** One 64px row from 360px up, from Kozmos's `Navbar`.
Everything sits in its navigation slot — the Navbar's leading group has a
32rem basis, so its trailing slot drops to a second row on a phone (GAP-41):
the page links — the four pages, then Storybook — shown from 64rem and
centred on the header itself (the sticky Navbar is their containing block),
so they sit on the page's centre line whatever the logo's width — where the
row has room for that, which a container query on the bar measures in rem,
so enlarged text sends them back into the row, after the logo, before they
could touch it or the tools (WCAG 1.4.4); a theme menu (`ThemeMenu.tsx`: a
`Menu` of radio items behind one small button, words because there is no
sun or moon icon, GAP-07); search; and, below 64rem, a button that opens the
links in a `Drawer`. Five links need a page 848px wide to sit centred
between the logo and the tools (868px in a wide sans), so a tablet held
upright uses the drawer, as the docs pages' sidebar does below 64rem. The
navigation slot keeps a 16rem basis of its own, so beside it the logo is the
full logo from 48rem and its K below; at 320px the tools wrap to a second
row whatever the logo. The skip link is the header's first child: the
sticky Navbar sits at the top layer, and a link before it was painted under
it. Tests hold the header to one row at 1280, 1024, 768, 390 and 360px,
measure the 320px wrap (GAP-41), and check the focused skip link is what the
page paints at its own centre, and measure the links centred on the page,
clear of the logo and the tools, at 1024, 1280 and 1440px, back in the row
with the text at 150% and 200%, and in the drawer at 390 and 768px.

**Storybook's link.** Storybook is published beside the site, in its
`storybook/` folder (Deploying), and is not a route of it, so the header,
the drawer and the footer link to it with Kozmos's own `NavigationItem` and
`Link`, never through the router: a router link would look for a
`storybook` route and show the not-found page. `storybookHref()` in
`src/lib/storybook.ts` hangs the folder off the base, as `asset()` does
for `public/`, and the scan in `src/lib/asset.test.ts` fails a
root-absolute `/storybook` in the source. A test clicks each of the three
links and checks that a new document loaded. Outside the Pages artifact —
the dev server, the e2e tests' server — `/storybook/` is the site's 404
page.

**The logo.** `src/brand/kozmos-logo.svg` is the logo as supplied on
2026-09-22, its canvas trimmed to the artwork (its paths untouched). Kozmos
cannot draw an image (GAP-10), so the header paints a `Box` (`role="img"`,
named `LOGO_TEXT`, "Kozmos UI Design Systems", from `src/lib/site.ts`)
through the logo's shape with a CSS mask, in the text colour token: it
follows the theme, and forced-colours mode gets the system's text colour.
Below 48rem it shows `kozmos-mark.svg`, the logo's own K. The K, the star
the home page's cover scatters (`kozmos-star.svg`, the logo's first star)
and the favicons (`public/favicon.svg`, `.ico`, `apple-touch-icon.png`: the
K on the dark theme's black, as the logo was supplied in white) are
generated by `pnpm --filter @kozmos-ds/site brand` from the logo and the
tokens; a unit test fails if they drift from either. To change the logo: replace the file (keep
its four paths — wordmark, subline, two stars — or update
`scripts/generate-brand.mjs`), trim its canvas to the artwork, update the two
`aspect-ratio`s in `site.css` (`.site-logo`) and the proportions in the
header tests, run `brand`, and `LOGO_TEXT` if the words change.

**Nothing draws over the header.** Kozmos's map overlays are z-index 50, as
the sticky Navbar is, and `MapView` does not isolate them (GAP-40), so every
site frame that hosts a map — demo stages, index previews, example
canvases — has `isolation: isolate`. So does the home page's cover, whose
words are raised over its own layers inside it. A test scrolls each stacked
element of a page under the header and checks what is painted there.

**Search.** `src/site/SiteSearch.tsx` is a `Dialog` with a `SearchBar` and
a `Listbox`, opened from the header or with ⌘K / Ctrl+K. Its index is the
same data the pages read — the generated component index, the examples
manifest, the foundations pages — so a new component, example or foundations
page is searchable the moment it is registered; the four top-level pages are
listed in the file itself. Matching is word by word, as the components
index's own filter is. Enter opens the first result; the down arrow moves
into the list; a live line says how many results there are (the best 12 are
shown, and it says so); the field starts empty each time.

**Two frames.** `SiteShell` is header, main, footer. `DocsShell` adds
Kozmos's `Sidebar` beside the content — kept outside `<main>` so it is a
top-level landmark — and, below 64rem, a `Drawer` with the same navigation,
opened from a button above the content.

**The cover.** The home page opens on the Figma file's cover (Core
Library, node `143:13175`), drawn with Kozmos in `src/home/Cosmos.tsx`: the
logo in a ring, orbits, planets, glass panes, amber diamonds, the logo's own
stars and a galaxy under the ring, in the dark theme whatever the site's.
The cover is a raster; Kozmos draws no picture (GAP-10) and has no glow,
gradient or blur of its own (GAP-54), so each part is a `Box` painted in
`site.css` ("Home: the cover") from the colour ramps — the violet is the
second brand ramp, the glow the first ramp's 700, the amber and rose the
alert and danger ramps — and the panes are Kozmos's glass `Surface`. Where
each thing sits is data in the component, as a share of the ring's square.
The ring and the orbits are lines painted through two SVG circles' strokes
used as masks (`src/home/cosmos-ring.svg`, `cosmos-line.svg`: 3px and 1.5px
at any size), and each planet's outline is its box's round clip: WebKit
draws a gradient's thin or sharp edge in steps, where every engine smooths
a stroke and a rounded box. A test checks both masks decode.
The claim and both buttons fit a laptop's first screen (1280 by 720 up) and
sit on the page's black, over a pool the orbits and stars fade into. Some of
it loops — bodies travel their orbits, the stars twinkle, the panes float,
the galaxy turns, the ring breathes — timed in multiples of the deliberate
duration; it pauses from its "Pause motion" button (WCAG 2.2.2) and when the
band is off screen, and never runs under reduced motion.

**Revealed on scroll.** `Reveal` wraps the home page's sections; they fade
and rise on the motion tokens as they come into view, only after hydration
(the pre-rendered page shows everything) and never under reduced motion.

## The pages

| Page           | What it shows                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`            | In the order a visitor asks: the Figma file's cover, drawn with Kozmos and partly moving, with the claim and two next steps under it; three featured examples, live and small; five live tiles (the adaptive shell under a slider, three-platform code, tokens, emotions, contrast) with links to the rest in Foundations; "Make it yours"; Web, iOS, Android and Figma; the CI checks as a short list, linking to the full pipeline on Get started. Bands alternate plain and muted, all with the same padding. About 6 screens on a laptop (1280 × 800), the limit a test holds it to. |
| `/get-started` | Install, set-up, using a component, dark mode, right to left, button-styled links, tokens in your own CSS, analytics, browser support, iOS and Android, working inside the repository, and what every pull request runs (`#checks`).                                                                                                                                                                                                                                                                                                                                                     |
| `/roadmap`     | What Kozmos cannot do yet, as work for the design system: every item in `GAPS.md` under the priority `DS-HANDOFF.md` gives it (P0 to P3), with its status — open, worked around, shown as is, fixed — its lane and the examples it shows in. Linked from the footer, the search, the home page and every example.                                                                                                                                                                                                                                                                        |
| `/foundations` | Seven pages, each drawn from the tokens: colour (every ramp and role, the contrast contract measured in both themes, the component layer), typography, layout, elevation and effects, motion, icons, theming.                                                                                                                                                                                                                                                                                                                                                                            |
| `/components`  | The reference: 104 pages, one per component, in four lanes. Each page has live examples with their source, the React, SwiftUI and Compose code where the component's docs carry it (89 have all three; 11 have none yet), and a props table per part read from the TypeScript source, with a Radix primitive's own props marked. The index searches and filters by lane and shows each component's first example, live but inert, as it scrolls into view.                                                                                                                               |
| `/examples`    | The index; each example on its own canvas with its source and its Kozmos parts, and a link to the roadmap for what it found Kozmos cannot do. SDK flows: wayfinding, the phone search sheet, the kiosk directory, the venue explorer. Product pages: sign in, the operations dashboard, room booking, the notifications inbox, onboarding, account settings. Patterns: loading, empty, error and offline states; the feedback survey; saved places.                                                                                                                                      |

## Add an example

An example is a page or an app, built from Kozmos only, shown on its own
canvas with its source, the components it uses and the gaps it hit.

1. **Register it** in `src/examples/manifest.ts`: `slug`, `title`, `kind`
   (`"page"` or `"app"`), a one-sentence `summary`, and `gaps` (empty to
   start); `featured: true` also shows it small on the home page, with its
   `tagline` (one sentence) instead of the summary. Feature exactly three,
   and three that look different: the home grid is one row of three. The
   route is created from this entry, and the search finds it.
2. **Add its component** to `src/examples/registry.tsx` as a lazy import, so
   the home page can show it as a miniature without pulling it into its
   chunk.
3. **Make the folder** `src/examples/<slug>/` with:
   - `<Name>.tsx` — the example, a default export. It must not render `<main>`
     (the page already has one) and its top heading is an `h2` (the page's
     `h1` is the example's title).
   - `<Name>.css` — layout only, class names prefixed `ex-` and a short name
     for the example (`ex-dash-`, `ex-way-`). Import it from `<Name>.tsx`.
     It reads the tokens themselves — `calc(var(--primitives-layout-spacing-300) * 1px)`,
     not the site's `--site-*` aliases — so its Source tab can be copied (the
     checker refuses the aliases here).
   - `route.tsx` — copy `account-settings/route.tsx` and change the names. It
     imports the example's own files with `?raw`, so the "Source" tab always
     shows what runs.
4. **App examples** (`kind: "app"`) get a canvas of definite height, as
   `AdaptiveMapShell` needs; fill it with `block-size: 100%`.
5. **Focus and announcements:** where a view replaces the one holding the
   focused control, move focus to the new view with `useFocusOnChange` from
   `../focus` (and list `focus.ts` in the route's files); put a status
   message in a region that is always on the page. The existing examples
   show both.
6. **Phone width:** look at it at 375px. The e2e tests check the page never
   scrolls sideways at 320px, but an example's canvas scrolls inside, so a
   card wider than the phone only shows in the screenshots.
7. **Gaps:** add each to `GAPS.md` (and give it a priority in
   `DS-HANDOFF.md`), and list it in the entry's `gaps`, as
   `"GAP-nn · what differs"`. The example page links to the roadmap, and the
   roadmap lists the example against the item. Claim only what a test or a
   measurement shows.
8. **Check:** `pnpm --filter @kozmos-ds/site lint`, `build`, then `test:e2e`.
   Add the new path to `pages` in `tests/site.spec.ts` (axe in both themes,
   no sideways scroll at 320px) and a test for what the example does.

Data in examples is invented and must look it (`sam.rivera@example.com`);
nothing submits anywhere.

## Add or change a component demo

A component's page comes from two places: the generated data (name, lane,
description, parts, props, snippets — nothing to write) and its demo file.

- **The file** is `src/reference/demos/<slug>.tsx`, where the slug is the
  component folder's name in kebab case (`POIDetailPanel` →
  `poi-detail-panel`). It exports `demos: DemoModule["demos"]`, a list of
  `{ title, description?, Component, tall? }`. A component without a file
  still gets its page, with the props and code and a note that no example
  has been written; `pnpm generate` does not care either way. The registry
  (`src/reference/registry.ts`) finds the files with `import.meta.glob`, so a
  new file is a new set of examples, and the file's source is what the
  "Examples" code tab shows, so write it as you would want it read.
- **A demo is a small component**, built from Kozmos parts and the site's
  layout classes only (the one rule applies; `pnpm lint` runs it). The stage
  is a `Card`; `tall: true` gives it room for a map, a sheet or a shell.
  `src/reference/sample-data.ts` has the venue, places, categories, floors,
  routes and an itinerary, all invented, so demos agree with one another; a
  glass part sits on `GlassBackdrop` (`src/reference/GlassBackdrop.tsx`).
- **A part that pins itself to the window goes in a `Screen`**
  (`src/reference/Screen.tsx`): `DynamicIsland`, `BottomNavigation`,
  `Backdrop`, `ToastViewport` and a `FloatingActionButton` with
  `placement="fixed"` are all `position: fixed` and take no placement from
  their host (GAP-24, 29, 34, 36). The screen has paint containment, which
  makes it the containing block for its fixed children, so the part sits
  where it would on a phone instead of over this site's header or across the
  whole window. It brings its own page for the part to cover.
  It is a phone's **shape** — portrait, 9:16 — and not a phone: no bezel,
  notch or status bar. Those belong to a device, not to Kozmos, and could
  only be drawn by hand; and `DynamicIsland` is a capsule that mirrors iOS's
  island, not iOS's own, which its page says in as many words. Decided with
  Olcay on 2026-09-22, when he asked whether an iPhone mockup would fit.
- **A description says only what the component does.** The copy review of
  2026-09-22 found demos claiming a stroke that stays 2px, a spinner that
  stops for reduced motion and a loading button that keeps its width — none
  true. Check the component's source before writing a claim.
- **The first demo is also the preview** on `/components`: it mounts inside
  an `aria-hidden`, `inert` frame as the card scrolls into view. So the first
  demo must not mount anything fixed to the viewport unless a `Screen` holds
  it, must not need a click to show something, and should be the plainest
  state — put the interactive states in a later demo.
- **Several of one landmark on a page** need different names: three
  `AdaptiveMapShell`s each name their map region and their panel with the
  demo's name, or axe's `landmark-unique` fails the page (the tests run axe
  on every component page).
- **Status text** beside a demo uses `Text` with `aria-live="polite"`, so a
  screen reader hears what a click did.
- **Props tables** show what the TypeScript source declares in this
  repository, plus a Radix primitive's own props (marked as such). Native
  HTML attributes are left out on purpose: they are the element's, not the
  component's. If a prop looks wrong, the reader is
  `scripts/generate-reference.mjs` (`readParts`), with tests beside it.

## Add a foundations page

1. Add it to `foundationPages` in `src/foundations/nav.ts` (`slug`, `title`,
   `summary`): the sidebar, the index card and the route come from that.
2. Create `src/routes/foundations/<slug>.tsx`: export `meta()` through
   `foundationMeta(page)` and a default component wrapped in `DocsPage`, with
   `Section`s inside. Read tokens through `tokensWithPrefix`, `ramp` and
   `token` from `src/lib/tokens.ts`, never by restating values; draw them with
   the parts in `src/foundations/parts.tsx` (`Ramp`, `Swatch`, `SwatchList`,
   `TokenTable`, `Specimen`).
3. Give the index a preview in `routes/foundations/index.tsx`'s `Preview`.
4. Add the path to `pages` in `tests/site.spec.ts`.

## Add or change a page

- A page is a file in `src/routes/` registered in `src/routes.ts`. It exports
  `meta()` (title through `pageTitle()`, and a description) and a default
  component starting with `PageHeader` (its `h1`), then `Section`s (`h2`).
- **Facts said in more than one place** live in `src/lib/site.ts`:
  `PACKAGES_PUBLISHED`, `SITE_INDEXABLE`, the public package list, the theme
  storage key. The CI pipeline's steps are in `src/lib/ci-gates.ts`, worded
  from `.github/workflows/ci.yml`.
- **Code on Get started** lives in `src/snippets/` as real modules, checked by
  `tsc` against the built packages and shown with `?raw`. Change the snippet,
  not a string in the page. Component snippets on the home page and the
  theming page come from the generated data, that is, from each component's
  own docs.
- **Claims** on the home page are sourced from the repository (package
  READMEs, `ci.yml`, `docs/status.md`, `Package.swift`). Numbers on the page are
  computed from data (token counts, contrast ratios), not typed in.

## Styling

- `src/styles/site.css` arranges components: widths, grids, gaps. It reads
  spacing through aliases (`--site-space-200` is
  `calc(var(--primitives-layout-spacing-200) * 1px)`; the layout tokens are
  unitless) and radii through `--site-radius-*`.
- **Type from tokens.** `.site-display` (the token h1, 60px), `.site-title`
  (h2, 48px) and `.site-headline` (h3, 38px) go on a `Heading`; the weight
  stays the Heading's. `.site-specimen` renders any token size the page sets
  through `--size` and `--lh`. `.site-mono` is the mono family token.
- **Put layout classes on `Box` or on elements you own, not on utility-based
  Kozmos components** (Grid, Stack, Container, Card, Sidebar …) for a property
  the component sets itself: Kozmos scopes its utilities as `:scope .x`,
  which outranks your class (GAP-04). Adding a property the component does
  not set is fine. A class on a `Text` or `Heading` can override its size and
  colour, because those classes are unscoped and `site.css` loads later.
- Never select into a Kozmos component; the checker refuses it, and element
  or universal selectors too.
- **A layout class that must win goes on a `Box`.** The e2e tests fail any
  site rule Kozmos outranks (`overriddenSiteCss`), naming the rule and the
  value that won.
- **Never draw a border in `site.css`.** Inside the provider, Kozmos's
  preflight zeroes it (GAP-52). An edge is a Kozmos part: a `Surface` (its
  solid surface has the subtle border; fill a colour from a `Box` inside), or
  a `Separator` for a hairline.
- **A rounded frame that clips takes its corners from what it holds.** A
  `MapView` is `rounded-container`; a frame of any other radius cuts the
  map's border (`clippedEdges` says where).
- **Single-column grids say `grid-template-columns: minmax(0, 1fr)`.** An
  implicit column grows to its widest child's minimum width — a row of tabs,
  a line of code — and pushes the page sideways on a phone.
- **A frame with `aspect-ratio` must not also have a minimum height**, or its
  width follows its height and overflows a narrow column; give it a height.
- **Examples sit in a frame** (`.site-example-canvas`) of definite height that
  scrolls inside. An app needs the height; a page needs the frame, because its
  own Navbar is always sticky (GAP-19).

## Testing

| Layer         | Command                    | What it proves                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types         | `typecheck`                | Pages, examples, tiles and every snippet compile against the built packages and the generated data.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Lint and rule | `lint`                     | ESLint with the React hooks rules; the one rule.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Unit          | `test`                     | The token parser, the contrast maths, the brand override's matching, the generator's parsers (slugs, lanes, descriptions, snippets, prop types), the import parser; the checker refuses what it should.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| End to end    | `test:e2e` (after `build`) | Every page in both themes, in three browsers: status, one `h1`, `noindex`, axe (WCAG 2.2 AA and best practices) measured from the top after a full scroll, no console errors, no site CSS that Kozmos outranks (shorthands included), no rounded box cutting an edge, no sideways scroll or cut edge at 320px. Every one of the 104 component pages in Chromium, in both themes: status, name, a live example, axe, the site's CSS applying, no edge cut, no sideways scroll at 320px. Both 404s (an unknown page, an unknown component). The header: the logo and its K at their proportions and decodable, forced colours, the favicons served and drawn, one row at five widths, nothing drawn over it, the drawer on a phone, the skip link painted on top. Focus: after a navigation, after a drawer closes, on a linked section. The theme kept across a reload and back to System; the cover (the dark theme on a light page, painted from the dark ramps, its picture hidden from assistive technology, the claim and both buttons on a laptop's first screen at four sizes, its words measured against the brightest pixel behind them, its loops paused by the button, off screen and under reduced motion, its travellers round wherever they are); the tiles; the brand override; miniatures inert; the featured taglines, and their pictures one shape so the titles line up; the colour contract in words; icons search and copy; the measured type scale; the motion race; every example driven end to end (each flow's states, each form's validation, each undo); the search (keyboard, header, arrow keys, the empty field); the component index and pages (search, lanes, previews, code tabs, Radix props marked, demos driven); the home page's order, grids, spacing, length and band hairlines; swatches, samples and shapes edged; each map shell's list inside the panel's padding; and the design-system gaps, measured (below). |

The e2e tests wait for the page to hydrate **and** for finite animations to
finish before measuring: a dark-mode page animates from light (GAP-03), and
axe would otherwise measure contrast mid-transition. The location marker's
pulse and the cover's loops never end and are ignored; `overriddenSiteCss`
leaves out, for each element, the properties a running animation drives —
they read as the animation's value, which WebKit moves on between the
check's two reads.

A violation that comes from inside a Kozmos component is listed in
`knownViolations` in `tests/site.spec.ts` as `{ id, only, theme }`: `only` is
a pattern every flagged node must match, so a known finding cannot hide a new
one under the same rule, and `theme` limits it to light or dark. A contrast
finding is reported with its colours and ratio. Today: `SHELL_PANEL` (GAP-17,
AdaptiveMapShell's aside) on the three map examples, the home page and the
AdaptiveMapShell page; `SIDEBAR` (not a gap: a Sidebar is an aside by
nature) on the dashboard and the Sidebar page; GAP-28, GAP-30 and GAP-12 on
the pages that show them; GAP-31 in the light theme on the Alert, Input,
DatePicker and Tag pages; GAP-45 in the dark theme on the ThemeProvider
page. The tests expect exactly those, so a new violation fails — and so does
a known one that disappears, which is the signal to close its gap. The same
holds for GAP-20: the search-field test is marked `test.fail` in WebKit
only, so Playwright reports it the day Kozmos fixes the field.

**Design-system gaps, measured.** Twenty tests measure what Kozmos draws
today. Four of them now measure a fix rather than a defect: the sheet
handle's 16px row and 40 × 4 grip (GAP-38), the Button's 8px between icon
and label (GAP-56), the spinner and the skeleton resting under the
reduced-motion preference (GAP-50) and SearchBar hiding the browser's own
clear (GAP-37). Beside them, emotion text now reads on every neutral surface
(GAP-31), whose four known-violation allowances are deleted. The rest still
pin defects — the preflight zeroing a caller's border (GAP-52), the sheet's
square corners on a rounded screen (GAP-53), the button link's underline
(GAP-09), the label that cannot wrap (GAP-57), the `Listbox` column as wide
as its widest option (GAP-55), the toast with no fill (GAP-58), the island
that is black on a black page (GAP-59) and keeps no room for the camera
(GAP-60), the breadcrumb's separator pointing back up its own trail in right
to left (GAP-61), the four parts that pin themselves to the window and are
held by a screen (GAP-24, 29, 34, 36), MapView's missing isolation (GAP-40),
CardTitle's 1.0 line height (GAP-42), where a touch 20px from the slider's
thumb lands (GAP-43), the header's white first paint for a dark-mode visitor
with the scripts blocked (GAP-03), the two-row header at 320px (GAP-41) and
brand variant 1's 4.20:1 (GAP-45). Each measures what a visitor gets, so any
honest fix flips it; [`DS-HANDOFF.md`](./DS-HANDOFF.md) says what to flip it
to.

**A tripwire must be able to trip.** GAP-37's first test read
`getComputedStyle(field, "::-webkit-search-cancel-button")`, which answers
with the host element's own values, so it could only ever report the button
as drawn — so it could never have caught the fix, whenever it landed; it
was found by reading the upstream commit. GAP-50 had no test at all, and its
fix sat unnoticed for four days. When a gap lives in CSS a browser will
not hand back, read the rule out of the stylesheet; when it lives in a
preference, measure both states. Either way, take the fix out again and
watch the test fail before trusting it.

**The host picks the font.** Nothing loads a brand font (GAP-90), so text
wraps where the host's `system-ui` decides: SF Pro on macOS, a wider DejaVu
Sans on the Linux the CI runs. A layout measured only on a laptop can
overflow there, and did. The first-screen fit and every component page's
320px reflow are therefore measured twice, the second time in `WIDE_SANS`
(`tests/site.spec.ts`). A number that depends on where text wraps — the
page's height budget — is written with that slack and says so.

**In CI:** `.github/workflows/site.yml` runs lint (with the rule),
typecheck, unit tests, the build and the e2e suite in all three engines on
every pull request that touches `apps/site`, `packages` or the lockfile, and
then builds the site again for its subpath and reads the pages back for any
address that points at the domain's root.

## Keeping up with `main`

The components live in the same repository and other sessions change them.
The site never commits to `packages/`. To take the latest, from the working
copy:

```sh
git fetch origin
git merge origin/main
```

If the lockfile conflicts, take `main`'s version and let pnpm add the site
back:

```sh
git checkout --theirs pnpm-lock.yaml
pnpm install
npx prettier --write pnpm-lock.yaml        # the repository commits the lockfile prettier-formatted
git add pnpm-lock.yaml
```

Then rebuild the packages the site uses
(`pnpm turbo run build --filter=@kozmos-ds/site^...` from the repository
root), run `generate` — a component's docs or props may have changed — and
run `lint`, `typecheck`, `build`, `test`, `test:e2e`. A component change can
break an example or a tile, and a gap the site pins can be fixed upstream;
both are the point. A gap test that starts failing with "no longer occurs"
means the gap is fixed: change the expectation and mark it fixed in
`GAPS.md`.

## The packages on npm

Published since 2026-09-24 under the `@kozmos-ds` scope: `react` 0.4.0,
`icons` 0.3.0, `product-contracts` 0.3.0, `tokens` 0.1.0.
`PACKAGES_PUBLISHED` in `src/lib/site.ts` is `true`, which is what the home
page's status tags and the Get started install note read.

The site keeps `workspace:*`: it lives in the repository and builds from its
source, so what it shows is what the repository holds. Deploy it from a
release commit if you want the page to match a published version exactly.
Still to do: check the install command on Get started against a clean
project, as `pnpm packages:install:check` does for the packages.

## Deploying

GitHub Pages, from `main`, by `.github/workflows/pages.yml`. A project site
is served from a subpath, so the build takes `BASE_PATH=/kozmos-design-system/`
as Vite's base and React Router's basename; the pages come out under a folder
of that name and the assets at the build's root, and the workflow merges the
two into the artifact it publishes. Everything the document addresses goes
through `asset()` (`src/lib/asset.ts`), which hangs it off that base.

**Storybook is published with it** (decision 34): the same workflow builds
`apps/docs` and puts it in the artifact's `storybook/` folder, so it is
served at <https://vodoco.github.io/kozmos-design-system/storybook/>, and a
docs page at `…/storybook/?path=/docs/<id>--docs`. A repository has one
Pages deployment — a second workflow deploying would replace this one — so
this workflow is the only one. Storybook needs no base of its own: its
build addresses everything from its own page (its Vite base is `./`), so it
works in any folder. The assembly fails if the site ever has a page at
`storybook/`, if Storybook's build is missing a file it needs, or if its
pages address the domain's root. A push to `main` that touches `apps/site`,
`apps/docs`, `packages` or the lockfile deploys both.

- **Output:** `apps/site/build/client` — one `index.html` per route, assets
  under `assets/`, and `404.html` for unknown addresses. Pages resolves a
  directory to its index and serves `404.html` for a miss, which is what the
  prerendered build expects. (A plain blob container does neither.)
- **To see the artifact as the host will serve it,** from the repository
  root: build it, run the workflow's own assembly step, read out of the
  workflow, and serve it under the subpath.

  ```sh
  pnpm turbo run build --filter=@kozmos-ds/site^... --filter=@kozmos-ds/react...
  BASE_PATH=/kozmos-design-system/ pnpm --filter @kozmos-ds/site build
  pnpm --filter @kozmos-ds/docs build-storybook
  node -e 'const w = require("yaml").parse(require("fs").readFileSync(".github/workflows/pages.yml", "utf8")); process.stdout.write(w.jobs.build.steps.find((s) => s.name === "Assemble the artifact").run)' > /tmp/assemble.sh
  BASE_PATH=/kozmos-design-system/ bash /tmp/assemble.sh
  rm -rf /tmp/pages-root && mkdir /tmp/pages-root
  cp -R apps/site/build/pages /tmp/pages-root/kozmos-design-system
  python3 -m http.server 6320 --bind 127.0.0.1 --directory /tmp/pages-root
  # http://127.0.0.1:6320/kozmos-design-system/ and …/kozmos-design-system/storybook/
  ```

- **Until the launch** every page says `noindex` (`SITE_INDEXABLE` in
  `src/lib/site.ts`), so the published site is not found by search engines.
- **Before it is public:** a canonical domain if it is not to stay on
  github.io; a sitemap and `robots.txt`; an Open Graph image and `og:` tags
  (they need absolute addresses, so the domain first — the logo on the dark
  theme's black, like the icons, is the obvious image); a `theme-color`;
  then `SITE_INDEXABLE = true`.

## Decisions still open

These need someone to decide; the site does not guess:

1. **The public address.** It is on GitHub Pages at
   <https://vodoco.github.io/kozmos-design-system/> for now; a domain of its
   own is still a decision, and the launch checklist under Deploying waits
   on it.
2. **The logo's small forms.** The header shows the full logo from 48rem
   and the logo's own K below it; the favicons are that K, white on the dark
   theme's black. Both are derived from the supplied logo, not designed:
   confirm them, or supply a dedicated mark (then `pnpm brand` and the
   tests' proportions).
3. **Linking the source.** The repository is public now, and the site still
   links to no GitHub page — a "view the source" link from a component page
   to its file would be a small, useful addition.
4. **Whether each gap is fixed in Kozmos** (the fixes are in `GAPS.md`), and
   whether GAP-09's underline may be hidden meanwhile.
5. **Figma counterparts** for the examples, as the SDK examples have on the
   `Examples` page — out of this site's scope so far.
6. **The cover’s buttons.** The cover paints the Figma file's violet from
   the second brand ramp; its buttons and tag keep Kozmos's own blue, like
   every other page. Re-pointing the band's ramp to the variant (as "Make it
   yours" does for its module) would make them violet too.

## Found along the way, outside the site

Measured while building the site; none of it is the site's to fix.

- **`@kozmos-ds/react` is not tree-shaken.** Components the site never uses ship
  in its bundle: the shared chunk is 523 kB minified, about 155 kB gzipped,
  plus 38 kB of gzipped CSS. The package's 185 `displayName` writes (184 at
  the top level) are the likely cause (unverified). This is also why Vite
  warns about a chunk over 500 kB.
- **`@kozmos-ds/react` develops against React 19 but `@types/react` 18.** In the
  workspace, a React 19 app's `ReactNode` does not fit Kozmos's props; the
  site maps the types to its own (tsconfig `paths`). Installed from npm, the
  declarations would read the consumer's types and this does not arise.
- **`docs/status.md` is out of date on the component branch.**
  `check-completion.ts --check` fails there: Core counts 75 components after
  the internal exclusion (69 in the file), five with platform or Code Connect
  gaps. The site's generator reads the same sets, so its counts are current.
  Those sets also predate the newest components: they put AISearchButton and
  CategoryField in Core where Storybook files them under Product SDK, and
  Itinerary, ManoeuvreCard and RouteProgressRail in Core where Storybook
  files them under Map. The reference shows the script's lanes.
- **Some CI checks exist only on this branch.** On `main`, `ci.yml` has no
  `figma:painters:check`, `test:adaptive`, `test:storybook-audit` or the
  POI-fixture and taxonomy steps; the site describes the pipeline of the
  branch it is built on, which is the one it will merge after.
- **`scripts/check-token-contrast.mjs` counts the category pairs twice** in
  the dark theme (it pushes them inside its per-theme loop); the "218 pairs"
  it prints includes the duplicates.
- **`eslint-plugin-react-hooks` 7.0.1 cannot load in this workspace.** It
  requires `zod-validation-error/v4`, but the lockfile resolves 3.5.4, which
  has no such export (7.1.1 still declares the same range). The site uses the
  5.x line. mapscale-review and playground-web list 7.0.1 but never load it.
- **CI runs Node 20,** which reached end of life on 2026-04-30.
- **`@kozmos-ds/vue` is private**, an internal harness, so the site presents the
  web, iOS and Android only.
- **iOS and Android are not distributable yet.** The Swift package sits in
  `packages/ios`, not at the repository root, so it cannot be added by URL,
  and its library target depends on Figma's `code-connect` package. The
  Compose module has no Maven publishing configured.
- **11 of the 104 components' docs carry no code at all** (AdaptiveMapShell,
  BrowseCategoriesPanel, CategoryField, CategoryTile, MetaStrip, the four POI
  parts, RouteOptionCard, RoutePreviewPanel), and 4 more lack SwiftUI or
  Compose; 89 have all three. Six docs show their code in fenced blocks under
  platform headings instead of `PlatformSnippets`; the generator reads those
  too. CategoryField has no `.mdx` at all.
- **37 of 104 component docs open with the placeholder "Displays the X
  interface topology natively."** (Backdrop, BottomNavigation, BottomSheet,
  Box, Breadcrumb, Container, FileUpload, FloatingActionButton,
  FloorSelector, Grid, Heading, Icon, Link, List, LocationPin, MapView, Menu,
  OTPInput, Pagination, POICard, Popover, Rating, Search, SearchBar,
  Separator, Skeleton, Spinner, SplitButton, Stack, Stepper, Table, Tabs, Tag,
  Text, Textarea, ThemeProvider, ToggleButton); DatePicker and TimePicker
  repeat it as a second paragraph. The reference shows the docs' own words,
  so those pages and index cards open with it; the fix is one sentence per
  `.mdx`, and `pnpm generate` picks it up.

## Troubleshooting

- **`Cannot find module '@kozmos-ds/react'` or stale components** — build the
  packages: `pnpm turbo run build --filter=@kozmos-ds/site^...`.
- **`Cannot find module '../generated/…'`** — run
  `pnpm --filter @kozmos-ds/site generate` (dev, build and typecheck do it
  themselves).
- **`Type 'React.ReactNode' is not assignable to type 'ReactNode'`
  (`bigint`)** — the `paths` mapping in `tsconfig.json` is missing or its
  `node_modules/@types/react` does not exist; run `pnpm install`.
- **`Could not determine server runtime. Please install @react-router/node`**
  — it must be in `dependencies`, not `devDependencies`.
- **`Cannot find module 'zod-validation-error/v4'`** — something loaded
  `eslint-plugin-react-hooks` 7.x; the site's config must use 5.x.
- **A class on a Kozmos component does nothing** — GAP-04: wrap in a `Box`
  and style that. The e2e tests name any such rule (`overriddenSiteCss`).
- **A border in `site.css` never shows** — GAP-52: use a `Surface` or a
  `Separator`.
- **Light text on a dark card inside a nested provider** — the provider
  paints nothing; put a `Surface` inside it.
- **A phone scrolls sideways** — a grid's implicit column grew to a wide
  child (`minmax(0, 1fr)`), or a frame with `aspect-ratio` also has a minimum
  height, or a long word sits inside a `Button`, which keeps everything on
  one line (GAP-57: the wrapping goes on the text inside, not on the button).
  `pnpm --filter @kozmos-ds/site test:e2e` checks every page at 320px.
- **An e2e test times out waiting for animations** — something on the page
  animates forever; `hydrated()` in `tests/site.spec.ts` ignores infinite
  animations, so a new one needs that check, not a longer timeout.
- **Port 5180 or 5181 is in use** — another server; stop it, or change 5180
  in `vite.config.ts` and 5181 in `playwright.config.ts` and
  `scripts/serve-static.mjs`.
- **A change does not show in a Turbo build** — the site's inputs are in
  `apps/site/turbo.json` (`src`, `public`, `scripts`, `tests`, the configs and
  the repository's `scripts/skills/check-completion.ts`); add any new
  top-level folder there.
- **An SVG draws nothing** — as an image or a mask it is parsed as XML, and
  one error blanks it: a double hyphen inside a comment is enough. The brand
  test checks the logo and its generated files.
- **An unknown component address shows "Something went wrong"** — the
  component routes must stay one per slug (`src/routes.ts`), not a
  `:slug` route.
- **The lockfile shows thousands of changed lines** — pnpm writes it with
  single quotes and the repository commits it prettier-formatted; run
  `npx prettier --write pnpm-lock.yaml` (the pre-commit hook does too).
