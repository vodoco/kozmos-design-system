# Session Handoff

> **Start with [`ds-handoff.md`](ds-handoff.md) instead.** Written 2026-09-12, it is the short door
> in: current state, open decisions, next actions and the traps. This file is the long historical
> record behind it — read §3 here when you need the reasoning behind a specific decision, and note
> that §0 and §4 below are a 2026-09-10 snapshot that `ds-handoff.md` supersedes.

Written 2026-08-24, updated 2026-09-10. Everything below was verified by
running it, not recalled.
Branches: `codex/wave-2-figma-components` (#16) and `codex/elevation-audit` (#18), stacked; §0 has the order.

## 0. Where things stand right now

This document is long because it records reasoning, not just state. If you are
picking the work up cold, this is the whole picture in one screen.

| Thing                   | State                                                                                                                                                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm figma:verify`     | matches what the importer generates; **94 of 94 sets on one build**, measured 2026-09-08 after a full Core and Product/SDK run. The stamp has moved since — the resumability change touched no painter — so the paint is current and the stamp reads behind |
| Figma publish           | **unblocked** — 0 unbound properties, 94 sets                                                                                                                                                                                                               |
| `main`                  | `46eb224` — PRs #1 through #15 merged                                                                                                                                                                                                                       |
| Open PRs                | **#16** native elevation → **#18** web elevation, native shadows that follow dark mode, and `tokens:raw:check`, stacked on #16 → **#17** iOS map panel and Playground app, from a parallel session                                                          |
| Merge order             | #16, then #18 (GitHub retargets it to `main`), then #17 once its tests pass — see §4                                                                                                                                                                        |
| Elevation               | roles on all four platforms, native following dark mode; every exception named in `tokens:elevation:check`                                                                                                                                                  |
| `tokens:raw:check`      | **a ratchet, not a pass mark** — 35 raw colours across 7 components, 7 raw radii across 6                                                                                                                                                                   |
| `tokens:radius:nesting` | **0** — measured 2026-09-03 after the run; `--strict` is in CI                                                                                                                                                                                              |
| Chromatic               | **snapshot limit reached** — nothing has been visually compared since early September, including a shadow change on 27 web components                                                                                                                       |
| Working tree            | **shared with parallel sessions** that switch branches and leave work uncommitted — stage by file path, never `-A` or a directory                                                                                                                           |
| Style playbook          | `docs/style-playbook.md` — start here to change how it looks                                                                                                                                                                                                |
| Gap audit               | `docs/gap-audit-2026-09-05.md` — what is missing, measured                                                                                                                                                                                                  |
| Local gates             | all green — the checks table in the playbook, plus `pnpm native:check` (Swift and Kotlin, about six seconds)                                                                                                                                                |

**This week, 2026-09-07 to 09-10: elevation reached the library.** The roles
added on 2026-09-07 had reached six Figma painters and no native component
by the next day, when this audit looked.
Thirteen Figma painters took a two-layer Tailwind shadow from a helper named
for Tooltip — 334 of the file's 368 shadows — and the check counted it as one
literal. The web had settled the same question on its own, in raw Tailwind
steps from `shadow-sm` to `shadow-2xl`. The roles had been generated for iOS
and Android and never copied into either package. All four platforms now read
them, native follows dark mode, and a bulk plugin run that dies partway resumes
instead of starting again. §3 has it in full, including the overnight stall
that led to the last of those.

**The library publishes.** Eleven unbound properties across five sets, two of
them Core, had held it out of Figma; on 2026-08-31 all five were fixed, run
through the plugin, and confirmed at zero over the REST API.

**The roundness work is done in code and half-landed in the file.** Olcay's
complaint — "uneven roundness", a 9999 sentinel, and two roles sharing one
number — became a rule (`docs/nested-radius.md`), a checker
(`tokens:radius:nesting`), and eleven commits. Measured, not modelled: the
first plugin run took the file from **50 to 37** findings, which was the number
predicted for it. The six Core sets were re-run by hand on 2026-09-03 and
**15** remained: NavigationItem cleared, the other five did not move at all.
Their popover padding is bound to a component variable that still said 4, so
the painter's 12 never rendered — the variable now derives, and the run is
pending. See §4 item 1 and §6.

Two rules came out of the publishing work that are worth knowing before
touching any component set, because both fail silently and both cost a round
trip here:

- **Only a `SLOT` node can carry a slot binding.** A frame named "... Slot"
  reads as one everywhere except where it counts.
- **A component's own property cannot drive a node inside that component's
  slot, or inside a nested instance.** Bound defaults sit _beside_ a slot —
  Drawer's `Title Text` beside `Header Slot` is the pattern.

And one from the radius work that generalises past radius:

- **A value that depends on another value must be derived, not written.**
  Three fixed radii went stale in one day — `control`, then `marker`, then
  `container` — each within hours of being set, because the thing it depended
  on moved. Every dependent radius in the plugin is now computed
  (`nestedRadius`, `PRODUCT_SDK_CARD_INSET`, `POPOVER_ROW_INSET`). The colour
  ramps have the same shape and have not been asked to move yet — see
  `docs/generated-color-scales.md`.

§3 has all of it in full, with the measurements behind each.

## 1. Verified State

**Read this first: verify against a clean checkout, not the working tree.**

For most of this branch's life a large part of its substance was uncommitted.
The tree had 97 React components; the committed branch had 79. Every coverage
number in earlier handoffs was measured against the working tree, so they
described something CI never saw. That is fixed — the tree is clean and the
commits contain everything — but the habit is what caused it. To check state:

```bash
git worktree add --detach /tmp/verify HEAD && cd /tmp/verify
```

All gates pass on a clean checkout as of this handoff:

| Gate                                         | Result                                       |
| -------------------------------------------- | -------------------------------------------- |
| `pnpm typecheck` / `lint` / `test` / `build` | exit 0                                       |
| `components:contract:check`                  | ok                                           |
| `docs:snippets:check`                        | ok (319 identifiers, 321 snippets)           |
| `components:variant:check`                   | ok (97 scanned, 1 gap)                       |
| `tokens:contrast:check`                      | ok (50 pairs, light + dark)                  |
| `figma:plugin:check`                         | ok                                           |
| `check-completion --check`                   | STATUS.md up to date                         |
| iOS                                          | `swift build` exit 0                         |
| Android                                      | `assembleDebug` + `testDebugUnitTest` exit 0 |

### Keeping the Figma file honest

Two things exist now that did not when this branch started, and they change the
loop:

- **`pnpm figma:verify`** reads the file over the REST API and reports drift
  from the terminal: sets present, axis names and values, collapsed text nodes,
  text truncated by its own box, and WCAG AA on every visible text node. It
  answers "did my change land?" in seconds, which is what several rounds of
  audits and screenshots were doing by hand. It reports **clean on all five
  checks** as of this handoff — every truncation it found has been fixed in code
  and rendered into the file.
- **Update All Product / SDK** in the plugin regenerates all 24 sets in one
  press, deferring the page reorganize until the end.

The working loop is: change code -> Update All Product / SDK -> `pnpm
figma:verify` -> then Figma's own Publish. Only the middle step needs Figma
open.

`figma:verify` cannot see everything. Contrast is **light theme only**, because
the REST API resolves variables in the file's default mode. It cannot check
component descriptions either: Figma only exposes those for _published_ library
components, so `componentSets` metadata reads as empty until the library is
published. The plugin's own audit remains the authority on both.

**It also never compares text _content_,** and that is a live gap, not a
theoretical one. RoutingInputGroup's fields read "Start", "Start", "Start" in
the file while `code.js` clearly assigned `["Start", "Add stop",
"Destination"]`. Every structural check passed on it, because a wrong string is
a perfectly well-formed node. The cause was in the code, not a stale file — see
§3 — but the point stands either way: green from `figma:verify` means the file
is structurally current, not that it says the right words.

It is also **not wired into CI**. `figma:verify` is a `package.json` script and
nothing else runs it, which is defensible — it fails whenever the code is ahead
of the file, which is the normal state between a commit and a plugin run, so as
a build gate it would be red most of the time. Just do not mistake a green CI
for a verified file.

### CI status

Local gates green does not mean CI green — the two disagreed for most of this
branch's life. Open PR: `vodoco/kozmos-design-system-#1`, merged with current
`main` and mergeable. (Commit and file counts are deliberately not quoted here —
updating this doc changes them, so any number written down is stale on arrival.
Read them off the PR.)

**Read the run status off the PR rather than this table.** Six jobs passed on
`db0d918`; everything since has been rerun after a merge, and a table here goes
stale the moment anything is pushed. What is worth keeping is the two ways this
repo's CI has gone red without the code being wrong — both below, and both
looking exactly like a build failure.

Two things a PR needs before CI will even schedule:

- **The PR must not be conflicting.** All four workflows trigger on
  `pull_request`, and GitHub cannot compute the merge ref for a conflicting PR,
  so it schedules nothing at all — no runs, no annotations, no indication that
  anything is waiting on you. On 2026-08-31 a push landed 33 commits and
  produced zero runs for that reason; the tell is that the PR says
  `CONFLICTING` while the run list still shows an older SHA.
- **`Release Kozmos System` goes green without releasing.** It is
  `workflow_run`-gated on CI passing on `main`, and it passed on 2026-09-02
  while doing nothing: the job emits `::notice::Skipping npm release because
NPM_TOKEN is not configured` and exits 0. There were also 0 pending
  changesets in `.changeset/`, so even with a token there was nothing to
  version — no tag was created on `fe4f4fa` and none exists on the repo. Same
  species as the Code Connect step that passes on an empty secret. Read the
  run's _annotations_, not its log: the log echoes every branch of the script
  inside `##[group]Run` blocks, so `can_publish=true` appears there whether or
  not it ran.
- **The account's Actions billing must be current.** A failed payment or a
  reached spending limit fails every job in 2-3 seconds with no step recorded
  and the annotation "The job was not started because recent account payments
  have failed or your spending limit needs to be increased." Four seconds and no
  failing step is the signature; it is not a code failure and no amount of
  reading the diff will explain it.

A green Code Connect job is not by itself proof it ran. Check the log says
`All Code Connect files are valid` and that no `Skipping` annotation was
emitted — §6 explains why an empty secret produces a passing job that verified
nothing. The skip text also appears in the `##[group]Run` block as echoed
script source, which looks alarming and means nothing.

Three CI failures were real and are fixed:

- **Lint**, which fails on `main` at `apps/mapscale-review`: four unescaped JSX
  apostrophes, and two `eslint-disable` directives naming
  `react-hooks/exhaustive-deps` — a rule this repo has never registered, so
  eslint errored on the unknown-rule directive while it suppressed nothing. Not
  fixable by registering the plugin: the hoisted
  `eslint-plugin-react-hooks@7.0.1` fails to load, importing a
  `zod-validation-error/v4` subpath that package does not export.
- **`analyze-bundle`**, which was ours. The wave took `@kozmos-ds/react` from 79 to
  97 components and the ESM bundle from 128.80 KB to 254.07 KB raw, past a
  250 KB ceiling set when the library was half the size. Gzip — what consumers
  actually download — went 26.15 KB to 51.07 KB against an unchanged 70 KB
  budget. The raw ceiling is now 300 KB. **Next time this is hit, do subpath
  exports rather than another bump**: one entry point means every consumer pays
  for ColorPicker whether they import it or not.
- **An expired `FIGMA_ACCESS_TOKEN`**, which failed all three Code Connect
  steps with a 403 and was pre-existing on `main`. Rotated 2026-08-26; §6 has
  the recurrence date and the procedure.

### Platform coverage

|                     | Web (React) | iOS       | Android   | Vue          | Figma     |
| ------------------- | ----------- | --------- | --------- | ------------ | --------- |
| Components          | 97/97       | 97/97     | 97/97     | 100 wrappers | **94/97** |
| Variant-axis gaps   | reference   | 0/26      | 0/26      | 0/26         | **1/26**  |
| Code Connect linked | **92/92**   | **92/92** | **92/92** | —            | —         |

Four of the 97 have no Figma set, not three, and the earlier list named the
wrong ones. The analyzer reports `FieldWrapper` (covered by the `FormField` set
via a documented Code Connect override), `Icon` (source components live on the
`Icons` page), `NavigationAnnouncer` (a screen-reader live region with nothing
to draw) and `ThemeProvider` (a context provider, likewise) — all intentional,
and all marked `—` in their STATUS.md Figma columns. `GlassSettingsPanel` is
not among them: it has no implementation anywhere in `packages/`, appearing
only in STATUS.md and the docs. The one variant-axis gap is `Icon`.

**Code Connect is complete**: 92/92 linked on React, SwiftUI and Compose, with
no scaffolds left on any platform. All 24 Product / SDK and platform sets are
mapped, validated against the live Figma file by
`figma:publish:{linked,ios:linked,android:linked}:dry`.

The weakest link is now **native test coverage** — 8 test files each against 97
components — and the Figma sets' visual fidelity, which no gate can judge.

## 2. What This Branch Changed

Original nine commits `0ac20a1`..`ab23fec`, plus this session:

- `0ac20a1` Native product contracts + the 10 missing Product / SDK components on
  iOS and Android, with contract tests.
- `f3083ba` Android package naming normalised (174/174 lowercase) + two RTL icon
  fixes.
- `673afbc` Heading, LocationPin, FloorSelector, MapControlsGroup variant axes —
  takes iOS and Android to zero variant gaps.
- `60765cf` Vue: 18 wrappers added, full parity.
- `e0fe6e9` Figma plugin Product / SDK lane, 6 builders.
- `199d992` Variant parity analyzer + this analysis.
- `a91cdce` Contract assertion made whitespace-tolerant.
- `6803f20` Fixed text collapsing to zero width in the built Figma sets.
- `ab23fec` Off-floor pins render as a hollow ring, not a cogwheel.
- Components page grid layout, the remaining 18 Figma builders, and the §5 risk
  cleanups. See §3.
- **This session** (2026-08-28): the visual pass on the 24 Product / SDK sets,
  the four defects it found, and a fifth `figma:verify` check. `fc135b3`,
  `681de17`. See the end of §3.

## 3. Done This Session

### Components page is a grid, not a ribbon

`reorganizeComponentsPage` packed everything into one column: sections stacked
vertically, and each section's sets stacked vertically inside it. The page was
5,792 x 94,012px — a 1:16 ribbon.

Both levels now flow into newspaper-style columns via `packBlocksIntoColumns`,
which tries every column count and picks the one whose bounding box is closest
to square. There is no target-height constant to re-tune as sets are added.
Measured from the file after the rebuild: **21,952 x 30,054px, aspect
1.37:1 — 3.1x shorter than before**, and that is while carrying 18 more sets
than the old page did. (An earlier simulation predicted 13,020 x 15,580; it
modelled the 76 sets that existed at the time, so it understated the real
result. The near-square goal holds; the specific figures did not.) Reading order stays column-major, so each
column holds a contiguous slice of the alphabetized list.

`stats` now records `sectionColumns`, `pageWidth`, `pageHeight`, and a
`columnCount` per section.

### The remaining 18 Figma builders

Every Product / SDK component now has a builder, plus the two platform surfaces.
Full axis table in `docs/archive/figma-upcoming-components.md`. Five of them close real
variant-parity gaps, taking Figma from 6/25 gaps to 1/25.

`DynamicIsland` and `FeedbackCard` went into a new `Platform / Form-Factor`
layout section rather than Product / SDK, matching STATUS.md's lanes.

Three shared helpers carry the repeated anatomy: `productSdkFrame`,
`productSdkVariantRoot`, `productSdkSlot`, `productSdkControlButton`, and
`productSdkPanelHeader`.

### The branch's own foundation was uncommitted

Rebasing onto `main` was the first thing all session to run against a clean
checkout, and it surfaced that 18 React component directories, the whole
`@kozmos-ds/product-contracts` package, half the SwiftUI and Compose packages, and
several script fixes existed only in the working tree. Committed in twelve
focused commits (`a75e1ac`..`7ca53a3`), including:

- Nine SwiftUI components that were 12-line `Text("Name")` placeholders, now
  implemented, and their files renamed off the `Kozmos` prefix so
  `check-completion`'s `{name}/{name}.swift` path matches.
- `packages/react/playwright/.cache` untracked — 85 files of Vite build output
  that made every `git status` unreadable.
- Package exports fixed to real `.mjs` / `.umd.cjs` names, matching what Vite
  emits, plus a `"use client";` banner React needs under RSC.

Two checker bugs fell out of it, both of the same species — a check asserting on
formatting rather than on code:

- `check-figma-plugin-compat.mjs` scanned raw source for `...`, `?.`, `??`. Any
  ellipsis in ordinary prose ("Calculating routes...") read as spread syntax. It
  was failing on the committed tree both before and after this work. Strings and
  comments are masked before the scan now.
- `check-component-contracts.mjs` compared single-quoted source snippets, so the
  pre-commit prettier run broke `React Text 4xl size` against a file that plainly
  contains the entry. Same class as `a91cdce`. String assertions now normalise
  quotes on both sides.

### Storybook docs, and a check that they are not fiction

MDX coverage is 97/97. Fourteen components had stories but no docs page — seven
added by this branch (ColorPicker, Combobox, DateRangePicker, Listbox,
MultiSelect, NumberInput, PasswordInput) and seven older ones (FeedbackCard,
FieldWrapper, MapControlsGroup, MapOverlay, NavigationAnnouncer,
SaveLocationCard, ScrollArea).

Each follows the `Input.mdx` shape: Usage, Implementation with
`<PlatformSnippets>` across React/Vue/SwiftUI/Compose, and a Canvas per story.
Note that most of the existing corpus is far thinner — 66 of the 97 files have
only an `## Implementation` section — so these sit above the current median
rather than matching it. They also carry an `## Accessibility` section, which no
previous MDX had; the justification is that the Figma plugin's `COMPONENT_DOCS`
already models an accessibility array per component, so Storybook was the one
place missing it.

**Four of the first seven pages named types that do not exist**, and it took a
manual cross-check against the native sources to notice: `KozmosComboboxOption`
(really `KozmosListboxOption`), `KozmosDateRange` (really
`KozmosDateRangeValue`), `KozmosOverlayPosition.TopLeft` in a Kotlin block
(really `OverlayPosition.TOP_LEFT`), and a `String` bound where SwiftUI wants a
`Date`. Parameter _names_ had been read from the real sources; the _types_ were
filled in from what looked idiomatic, and looked fine.

Hence `pnpm docs:snippets:check` (`scripts/check-doc-snippets.mjs`), now a CI
step. It resolves every `Kozmos*` identifier in a snippet against **that
platform's own sources** — the per-platform part is the point, since a global
search passes `KozmosOverlayPosition` in a Kotlin block because the type exists
in Swift. Identifiers a snippet declares itself are skipped, which matters:
several examples define their own type (`struct KozmosSwitchStyle: ToggleStyle`
in Switch.mdx), and the first version of the check failed CI on three innocent
files because of it.

It catches identifiers, not types, so the SwiftUI `Date`-versus-`String` mistake
would still slip through. Closing that means compiling the snippets.

### Getting CI to tell the truth

The branch had never had a green CI run. Four of six jobs failed. Two were real
and are fixed (the `apps/mapscale-review` lint errors, and the bundle budget —
both detailed in §1); three are one expired Figma token, which is pre-existing
on `main` and needs a human.

Also fixed while installing: the root `prepare` script still ran `husky install`,
which is removed in v10. The earlier commit fixed only `.husky/pre-commit` and
claimed the deprecation was done, so `29712c1` finishes it.

The branch is now rebased onto current `main`. The rebase itself was clean; the
one conflict was `pnpm-lock.yaml`, regenerated with `pnpm install --lockfile-only`
against the merged `package.json` files rather than resolved by hand.

### §5 risk cleanups

- **Silent `setLayoutSizing*` failures now surface.** The helpers record every
  failure into a module-level collector, and `postResultToUi` drains it into the
  result object each handler posts, so it lands in `stats.warnings` — which the
  UI already renders as a "warn" run. All 197 `figma.ui.postMessage` call sites
  were routed through that one seam, so a new handler branch cannot forget it.
  No call-site changes were needed across the 180 sizing calls.
- **Six dead Code Connect stubs deleted** (`Heading`, `Text`, `ThemeProvider`
  x `.figma.swift` / `.figma.kt`). Verified unreferenced by every config, and
  `check-completion` short-circuits file checks for not-applicable components,
  so STATUS.md did not move. iOS and Android still build.
- **Husky deprecation fixed.** `.husky/pre-commit` is now just `npx lint-staged`;
  the v9-deprecated shebang and `husky.sh` sourcing are gone.
- **Stale LocationPin doc fixed.** The generated accessibility copy still said
  off-floor pins use "a dashed outline"; `ab23fec` changed that to a hollow ring.
- **Analyzer window trap fixed.** `figmaAxes()` in `check-variant-parity.mjs`
  read a fixed 40,000-character slice of `expectedVariantAxesForComponentSetName`.
  The registry is now 12,333 characters and growing; past the cap it would have
  silently dropped axes and reported them as "component absent from Figma". It
  now ends at the function's own closing brace.

### The visual pass, and what looking actually found

§4 used to end with "no gate can judge whether they _look_ right". Rendering
each of the 24 sets through the REST image API and reading the images turned
that into four defects, one of them in Core. Every one passed all five existing
gates.

**Slot labels truncate.** `productSdkSlot` pads every slot by 12px whatever its
size. On a 240px content slot that is right; on a 40px icon slot it leaves 14px,
and Figma renders "Icon" as a bare ellipsis. Seven nodes across five sets:
"Logo" as "L", "Controls" as "Co", "Leading" as "Le", "Trailing" as "Tra".

A second cause compounds it, and it is worth knowing generally:
**`productSdkText`'s `fontSize` and `lineHeight` arguments are dead.**
`applyTextStyleToNodeAsync` runs after them and overwrites both from the text
style's own spec. Roughly a dozen call sites pass `fontSize: 12` and render at 14. The width budget was computed for a size the node never had.

`fitProductSdkSlotLabel` measures instead of guessing — a text node set to size
itself reports the exact width of its own string, so Figma is asked rather than
modelled — then steps padding 12 → 4 and, if still short, the style
`cardDescription` → `fieldMeta` (14/20 → 12/16). It also clamps vertical
padding, which on DynamicIsland's 24px-tall slots was consuming the entire box.
A label that fits at neither size now raises a warning rather than truncating in
silence.

**FileUpload's file meta, same symptom, different cause, and it is Core.**
"2.4 MB" rendered as "2.4" and an ellipsis. `setHorizontalFillTextSizing` ends
on `layoutAlign = "CENTER"`, which is the right cross-axis answer inside a
horizontal row and the wrong one in the vertical copy stack it was called in:
it overwrites the `FILL` set a line earlier and freezes the node at its natural
width. `setVerticalStackChildSizing` is the helper that fits. Only these two
call sites were changed — the check below is what should find any others,
rather than a sweep across the 19 call sites.

**POIDetailPanel's action glyphs were `actionLabel.charAt(0)`** — a literal
"N", "S" and "S" on the three buttons, two of them identical, all three reading
as a placeholder nobody filled in. Every other builder uses a real mark.

**Two component sets were mostly empty.** WayfindingCard's frame was 700x1058
around 700x134 of variants — 87% dead space — and POICard 74%. A component set
is a frame, and a frame keeps its size when its children shrink; both were left
over from taller earlier layouts. `layoutSingleAxisVariants` now refits the set.
This is not only cosmetic: the Components page packs blocks by bounding box, so
an 87%-empty block was costing a real column slot in the grid built last
session.

Measuring all 94 sets rather than only these 24 puts that in proportion: 66 sit
flush against their variants, one (`Link`) carries a deliberate symmetric inset,
and 27 have right/bottom slack. Almost all of that is a trailing grid gutter of
26–80px, which is tidy-up rather than defect. Three are not: POICard, and
WayfindingCard, and `List` at 359px of slack on the right. All three are on the
single-axis layout path, so the refit above covers them — but `List` is Core, so
it only moves when someone rebuilds `List`, not on an `Update All Product / SDK`.
Every set has its children flush at the origin, which is what makes refitting
safe; there is no left/top padding anywhere to preserve except `Link`'s.

**And a fifth check, so none of it returns quietly.** A truncated node is
indistinguishable from a healthy one in the REST payload — same type, same
width, full `characters` — so the check measures the string. There is no font
metric in the API, so the width model approximates Inter by character class and
deliberately runs narrow: it should miss a marginal case rather than invent
one. Validated against the 1,758 `TRUNCATE` nodes on the Components page, it
flags exactly 9, and all 9 were confirmed by eye in the render. Zero false
positives at that threshold.

### Two things the first pass got wrong

Re-auditing it caught both, and both are now fixed. They are recorded because
the mistakes are instructive, not because the outcome changed.

**RoutingInputGroup was diagnosed as a stale file. It was not.** Every field was
named `Point Field Slot`, and `configureNamedTextProperty` binds by node name
across the whole component set — so the one `Point Label Text` property captured
all three fields and painted its default over the labels the builder had just
set. The code produced exactly what the file showed; re-running the plugin would
have changed nothing. The first pass compared code to file, saw a mismatch, and
reached for "the file is behind" without following the property binding. Each
route role now has its own node name, chosen by role rather than position, so
that with two points the second field still carries the destination's name.
`Point Label Text` keeps its name and its node, so Code Connect on all three
platforms still validates — checked, not assumed.

**The verifier was reading the page at `depth=8`.** That silently cut the tree
at the sixth level inside a variant and hid 1,120 text nodes — 17% of the page —
from the collapsed, truncation and contrast walks. It had been that way since
the verifier was written, so "the first clean audit run" in `f52c27f` was clean
over 83% of the text. Full depth costs 1.7 MB more and no extra time; the walk
now reaches 5,987 visible text nodes instead of 4,867. Nothing new failed in the
newly visible 23%, which is worth stating plainly: the blind spot was real and
had not been hiding anything.

One glyph is worth a glance on the next run. `↗` for Share is the only mark in
the Product / SDK lane not yet seen in a render. Inter's coverage in this file
is demonstrably wide — `⇅`, `◌`, `✎` and `◈` all render — so it should be fine,
but it is an inference rather than an observation.

What the pass did **not** find is worth recording too, since it is evidence the
sets are broadly sound: no contrast failures, no collapsed text, no axis drift,
correct off-floor rings on LocationPin, and correct geometry on the other 22
sets. FeedbackCard's Success variant looked squashed and is not — 16px padding
all round, it is simply a one-line state.

### The semantic radius layer

"Change the roundness from 8 to 16" turned out not to be a config change,
because there was no place to make it. Radius had **four** sources of truth and
they already disagreed. A button was 16px on web (Tailwind `rounded-md` -> a
1rem token), 8px on iOS and Android (`primitivesLayoutRadius100`), and 8px in
Figma (a hardcoded number, one of 162). Nothing compared them: the contract
check compares variant axes and props, not styling values, so the drift sat
there unseen. Web had quietly been the odd one out all along — which is why the
change asked for was half-done before it started.

`Semantics.Radius` in `packages/tokens/src/tokens-*.json` is now the source, and
the roles are named for the job rather than the size:

| Role        | Value | What it is                                                 |
| ----------- | ----- | ---------------------------------------------------------- |
| `none`      | 0     | flush edges: sidebars, navbars, table shells               |
| `marker`    | 4     | small marks inside something else: badges, checkboxes      |
| `control`   | 16    | buttons, inputs, selects, rows, toasts — **the workhorse** |
| `container` | 16    | cards and dialogs                                          |
| `panel`     | 24    | large panels and sheets, mostly Product / SDK              |
| `pill`      | 9999  | chips, avatars, switches, segmented controls               |

**To change how round the product feels, repoint one alias.** `Control` moved
from `radius.100` to `radius.200` and that single edit is what took iOS, Android
and Figma from 8 to 16; web did not move, because it was already there. Then
`pnpm tokens:build`, copy the two generated `KozmosDimensions` files into
`packages/ios/Sources` and `packages/android/.../tokens/`, and re-run the
plugin.

The migration: **168** React class occurrences, **239** native references,
**136** plugin `cornerRadius` literals, **32** focus-ring and per-corner radii,
and **48** of the plugin's Figma corner-radius variables.

Two things worth knowing before touching this again:

- **A bound Figma variable beats the node's `cornerRadius`.** 73 components call
  `bindFloatVariable(component, "cornerRadius", "Button/radius", ...)`, so
  migrating the literal assignments alone would have been inert for most of the
  library — the plugin would have said 16 while the file rendered 8. The
  variables were the real lever and are migrated too; the parity check now
  covers them for exactly this reason.
- **The plugin's variables alias `Semantics/Radius/Control` by name.** If that
  variable does not exist in the Figma file yet, the importer warns
  (`alias target ... was not found`) and falls back to the numeric value, which
  is also 16 — so it degrades to the right answer either way. Run the
  foundations/variables import once to make the alias resolve properly.

`pnpm tokens:radius:check` is the guard. It asserts the plugin's
`KOZMOS_RADIUS`, its corner-radius variables, the Tailwind utilities and the
native sources all still agree with the tokens, and it reports anything sitting
off every role rather than failing on it. Eight component variables are off
scale on purpose (`ToggleButton` 12, `Alert` 12, `POICard` 12, `WayfindingCard`
12, `Tabs/trigger` 12, `FloorSelector/item` 6, two `ColorPicker` swatches 6), as
are 26 plugin literals and four web uses of the 32px `2xl`. Moving those is a
design decision, not a cleanup, so they were left.

Auditing the radius work afterwards turned up more than the work itself did.

**`verifyPaparazziDebug` does not verify anything.** This is the one to fix
first, because it has been giving false confidence for a while and it is in the
documented Android build command. Proved by experiment, not inference: with the
golden recorded at 16dp, `semanticsRadiusControl` was set to **2dp** — an eight
fold change, unmissable by eye — and `./gradlew verifyPaparazziDebug
--rerun-tasks` ran all 17 tasks, re-rendered, regenerated the report, and exited
**0**. The `-Dpaparazzi.test.verify=true` property _is_ passed to the test JVM
(confirmed in the worker command line), and `build/paparazzi/failures/` stays
empty, so the comparison is reached and silently agrees with itself. Paparazzi
1.3.5. Recording proves the render really does change: `recordPaparazziDebug`
wrote a visibly rounder button and a different checksum. The updated golden is
committed; the broken gate is not fixed.

**The iOS snapshot test never renders anything.**
`KozmosButtonSnapshotTests.swift` asserts properties — `view.label`,
`view.variant`, `view.isDisabled` — and never produces an image, despite
`swift-snapshot-testing` being a checked-out dependency. So between the two,
native visual regression coverage is effectively **zero**, which sharpens §4's
note that native testing is the weakest link: it is not thin, it is absent.

**The `roundness` config on web is dead code.** `DesignConfigContext` exposes
`roundness: number // 0 - 2x` and sets six CSS variables from it —
`--radius-sm` through `--radius-full`. Nothing reads any of them; `var(--radius-`
appears nowhere else in the repo. It is a roundness slider wired to nothing.
Worth knowing before anyone wires it up: a runtime, web-only radius multiplier
would re-create exactly the cross-platform drift the semantic layer just
removed, since native radii are compile-time constants. Deleting it is the
tidier option, but that is a product call.

Three latent bugs fell out of the work, all fixed:

- `Primitives.Radius.md` and `.lg` are both `1rem`. The rem scale has no 8px
  step except `DEFAULT`, so `rounded-md` was almost certainly meant to be 8px
  and has been rendering 16 instead. That is the whole origin of the drift.
- `build.mjs` resolved token values with `token.value || token.$value || ...`,
  so a value of **0** was treated as missing and fell through to the unresolved
  alias string. Every zero-valued dimension arriving by reference was silently
  dropped from the native outputs. Fixed at all four call sites.
- A literal `9999` with `$type: dimension` picked up a rem transform and emitted
  `9999rem` in CSS and `159984.dp` on Android. `Primitives.Layout.radius.full`
  now completes the numeric scale so every semantic alias resolves to a plain
  number.
- `parseFloat("1rem")` is `1`, so the three rem-valued dimensions that reach the
  native outputs — `primitivesRadiusCard`, `Input` and `Button` — emitted **one
  point** instead of sixteen. Unused, which is the only reason nobody ever saw a
  hairline corner on a card, but a live trap in a public generated API. The
  dimensions formats convert rem to px now; exactly those three constants moved,
  1 to 16.

One thing that could not be checked from here: the plugin's corner-radius
variables alias `Semantics/Radius/Control` **by name**, and whether that
variable exists in the file depends on the foundations import creating
`Semantics/*` variables from the tokens. The REST variables endpoint needs
`file_variables:read`, which is Enterprise-only and returns 403 on this token,
so it could not be confirmed without opening Figma. It fails safe either way:
an unresolved alias warns (`alias target ... was not found`) and falls back to
the numeric value, which is also 16.

### The semantic typography layer

Typography had drifted further than radius, and more quietly, because the
brand font was never actually delivered anywhere.

Web asked for `"Readex Pro", sans-serif` — and **nothing in this repo has ever
loaded Readex Pro**. No `@font-face`, no webfont link, no font file. Storybook's
`preview-head.html` loads Inter, Plus Jakarta Sans and Space Grotesk, none of
them the brand font. So every page fell through to generic `sans-serif`, which
on macOS is Helvetica. Meanwhile iOS reached for `.font(.subheadline)` and got
SF Pro, and Android set no family at all and got Roboto. **The Figma plugin is
the only surface that really renders Readex Pro**, so the mockups have been
describing type that no platform ships.

`Semantics.Typography.Family` holds the decision now — `System` (the default),
`Brand` (opt-in, aliasing the Readex Pro primitive) and `Mono`. The system stack
leads with `ui-sans-serif` and puts `system-ui` behind it rather than alone,
because bare `system-ui` has resolved to fonts with broken non-Latin coverage on
some Linux and ChromeOS builds.

Each platform now has one address for the decision, and none of them changed
what they render:

- **Web** — Tailwind's `sans` resolves to the System role. This _is_ a visible
  change: Helvetica to SF Pro on macOS, because the previous rendering was an
  accident. `font-brand` exists and falls back to the system stack rather than
  to a generic family.
- **iOS** — `KozmosTypography` wraps the Dynamic Type styles; 106 call sites
  moved off bare `.font(.subheadline)`. `Font.system(_:)` still scales with the
  reader's text-size setting, so accessibility behaviour is untouched. The
  brand-font branch is documented in the file rather than written, because
  writing it would mean shipping an unmeasured scale constant.
- **Android** — `KozmosTypography.typography()` is passed to `MaterialTheme`,
  which previously carried only a colour scheme. `FontFamily.Default` is the
  same font it already used.

`pnpm tokens:typography:check` guards it, and `scripts/measure-font-metrics.mjs`
computes real `size-adjust` / `ascent-override` / `descent-override` descriptors
by parsing sfnt tables directly — no dependency, no need for the font to be
installed. It was validated field-by-field against fontTools on SFNS and Arial.

Two things are deliberately **not** done:

- **The metric-matched fallback needs the Readex Pro file.** That is the piece
  that would let an App Clip drop the font and look identical rather than subtly
  different, and it is the whole point of `size-adjust`. It cannot be built
  honestly without measuring the real font; a hardcoded ratio is exactly the
  guess that puts text subtly wrong on every screen at once.
- **Figma rendered Readex Pro until 2026-08-31; it is `Inter` now.** Figma takes
  one real family and the System role is a stack — `ui-sans-serif, system-ui,
-apple-system, ... Roboto ...` resolves to SF Pro on Apple platforms, Roboto
  on Android and Segoe UI on Windows, and no single Figma font is all three.
  Inter is the closest honest stand-in: system-like metrics, present in every
  Figma file without anyone installing anything, and already what Storybook
  loads. `tokens:typography:check` now reports "matching the system-first
  decision" instead of the divergence. The restyle lands on the next plugin run,
  and it touches all 94 sets, so expect the whole file to shift.

And a finding that belongs to nobody yet: **`Primitives.Typography.font.size`
(the 0-1500 scale) is used by zero platforms.** Not iOS, which uses Dynamic Type
styles; not Android, which hardcodes `14.sp` and `12.sp`; not web, where Tailwind
has no `fontSize` override at all and its own scale applies. Sizes are the next
layer down and are entirely untokenised.

### The visual regression gates, repaired

Both native screenshot gates were inert. They are not any more, and both fixes
were proved the same way — break the thing on purpose, watch the gate go red.

**Android was a tolerance problem.** `Paparazzi()` defaults to
`maxPercentDifference = 0.1`, and taking a button's corner radius from 8dp to
16dp moves 0.1069% of the pixels in the frame — measured, not estimated, by
diffing the two goldens. A change nobody could miss by eye sat within a
hair of the default tolerance. layoutlib renders deterministically, so any
tolerance at all only buys silence: it is `0.0` now. With the radius set to
2dp the suite fails; at 16dp it passes.

**iOS had no rendering at all.** `KozmosButtonSnapshotTests` asserted
`view.label` and `view.variant` and never produced an image, while
`swift-snapshot-testing` sat in `Package.swift` as a dependency nothing
imported. It is renamed `KozmosButtonAPITests` — the name was part of why this
went unnoticed — and `KozmosButtonImageSnapshotTests` renders four states on a
simulator. Same proof: at 2pt the run reports "Snapshot does not match
reference" and fails.

The iOS snapshots do **not** run under `swift test`. That runs on the host,
where SwiftUI renders through AppKit rather than UIKit, so the file is behind
`#if os(iOS)` and compiles to nothing there; the 27 host tests are unaffected.
Rendering needs a simulator:

```bash
pnpm ios:snapshot:verify     # iPhone 16, iOS 18.4
pnpm ios:snapshot:record     # re-record after an intended change
```

**They are deliberately not wired into CI yet, and this is the decision to
make.** References are tied to the simulator's iOS version — baselines taken on
18.4 will not match 26.5 — so the CI job needs the runner image and the
simulator pinned together, and `macos-latest` moves. A gate that goes red
because a runner updated is a gate somebody switches off, which is exactly how
the previous one came to verify nothing. iPhone 16 / iOS 18.4 was chosen over
the newer simulators on this machine for the same reason: it is likelier to
exist on a hosted runner.

**The Android goldens are recorded on macOS and CI verifies them on
ubuntu-latest.** That mismatch is not new — `f225c26`, "stabilize ... Android
snapshot gates", was a bare re-record of the PNG, and CI has been green since
only because the 0.1% default was loose enough to absorb both cross-platform
rasterisation _and_ real changes. Tightening to 0.0 removes the second half of
that and may expose the first. Rendering is deterministic on one machine —
re-recording produces a byte-identical file on both platforms, checked — but
macOS versus Linux could not be settled from here, with Docker installed and
not running.

**CI settled it on 2026-08-31: it passes.** `verifyPaparazziDebug` ran on
ubuntu-latest against goldens recorded on macOS, at 0.0 tolerance, and the
Android job went green. So the cross-platform half of that worry was
unfounded, and the gate is now known to verify rather than absorb. The
paragraph below still applies if it ever reddens on an unchanged render.

If the Android job reddens on an unchanged render, that is the cause. Re-record
on the CI platform; do not widen the tolerance back out, because 0.1% is above
the 0.1069% that a doubled corner radius moves and the gate returns to
verifying nothing. That the signal is that close to the threshold is itself the
finding: the frame is mostly empty background, so more components rendered
tighter is the real fix.

**This is safer than it sounds**, because the bug class that started all of
this — a token not reaching a component — is gated separately and
platform-independently by `tokens:radius:check` and `tokens:typography:check`.
The pixel gates are for layout and visual drift, and a layout regression moves
far more than 0.1% of a frame.

Coverage is one component. That is the repair, not the finished job: the
harness works and is extensible, and Button was chosen because it exercises
radius, colour, type and state at once. Widening it to the rest of the library
is follow-on work.

### Unused component properties, and a blind analyzer

Figma's publish dialog listed **Invalid assets (5)** — `TreeChildItem`,
`ColorPicker`, `MultiSelect`, `NavigationItem` and `Drawer`, all "Unused
properties". Figma will not publish a set that carries one, so five components,
two of them Core, were being held out of the library.

Eleven properties. Read straight off the REST API rather than recalled — the
exact split matters, because an earlier draft of this section put three of them
on the wrong component:

| Set              | Unbound property                                   | Type          |
| ---------------- | -------------------------------------------------- | ------------- |
| `TreeChildItem`  | `Action 2 Icon`                                    | INSTANCE_SWAP |
| `NavigationItem` | `Leading Icon Slot`, `Badge Slot`, `Trailing Slot` | SLOT          |
| `Drawer`         | `Drawer Body`, `Slot`, `Slot2`                     | SLOT          |
| `MultiSelect`    | `Chip 1 Text`, `Chip 2 Text`                       | TEXT          |
| `ColorPicker`    | `Hex Label Text`, `Palette Text`                   | TEXT          |

All three of `Slot`, `Slot2` and `Drawer Body` are Drawer's. `NavigationItem`'s
three are its own declared slot API, which is a different failure entirely and
is described below.

`MultiSelect` shows the commonest mechanism. Its chips became nested `Chip`
instances, and a nested instance's label is driven by the _Chip's_ own
`Label Text` property, so a MultiSelect property binding a layer of that name
can never attach to anything. The property outlived the structure.

**The sweep reports; it does not delete.** `reportUnboundComponentProperties`
names every non-VARIANT property nothing references and leaves it alone —
`ea6f719` reversed an earlier version that deleted them, on the grounds that a
property controlling nothing is a capability someone declared and never wired
up, not litter. `TreeChildItem`'s `Action 2 Icon` is the case in point: the
Pointr row needs that hook, and deleting it would have removed it. So nothing
clears itself. VARIANT is exempt because those live in the variant's name rather
than in a layer reference — which is why Figma flags five sets and not all
ninety-four, and why a naive scan appears to condemn everything.

An earlier version of this section said the sweep deletes and that `Fix Audit
Issues` clears the file in one press. It does not, and planning around that is
how "invalid assets should fall to 1" got written below. Each of the eleven is
cleared by its own builder learning to render the thing the property names, or
by a decision to drop it.

**The variant analyzer was blind to single quotes.** Fixing the properties was
not what surfaced this; `components:variant:check` quietly went from 1 gap to 2
during the radius work, and the cause was that `Link.tsx` had never been through
prettier. Its `variant?: 'default' | 'subtle'` used single quotes, the analyzer's
union-prop regex matched only double, and lint-staged reformatting the file as a
side effect of an unrelated change made a real gap appear from nowhere. That is
the same species as `a91cdce` and the quote normalisation in
`check-component-contracts` — a check asserting on formatting rather than on
code, for the third time in this repo.

With both quote styles accepted the real numbers are **29 components declaring
variants and 3 gaps**, not 26 and 1:

| Component | Gap                                                      |
| --------- | -------------------------------------------------------- |
| `Icon`    | absent from Figma — intentional, source lives on `Icons` |
| `Link`    | **iOS and Android** missing `variant (default, subtle)`  |
| `Spinner` | **iOS and Android** missing `size (sm, md, lg, xl)`      |

So §1's "0/26 variant-axis gaps" on iOS and Android was measured with an
analyzer that could not see two of them. Closing them means new public enums on
both native packages, which is API design rather than a sweep — it belongs with
the naming decision in §5, not bolted onto a publishing fix.

### The Drawer slot API

The first piece of the Pointr Cloud work, and the one that also unblocks
publishing. `Drawer` now declares three slots rather than one:
`Header Slot`, `Content Slot`, `Footer Slot`.

The regions already existed — `Drawer Header` with a 44x44 `Drawer Close`,
`Drawer Body`, `Drawer Footer` with Secondary and Primary actions. What was
missing was somewhere for a product to put its own content, which is what the
Pointr `sideDrawer` needs: its own title row, and a Save / Exit footer. The
defaults stay, following the `Drawer Body` precedent of `Body Text` beside
`Content Slot` — the built-in content is the example, the slot is the API.

**Why the orphans existed.** `createSlot()` mints a fresh SLOT property every
call, and `renameContentSlotProperty` only renames the newest one. Drawer
recreated its slot on each update, so the old properties stayed behind bound to
nothing: `Drawer Body`, `Slot`, `Slot2`. `extractReusableSlotsByName` now keeps
every slot across an update, so the property is reused instead of replaced —
which stops it recurring rather than cleaning up after it.

`removeStraySlotProperties` clears what is already there, and both of its
conditions matter: a slot property is removed only if it is **outside the
component's declared slot API and bound to no node**. NavigationItem declares
`Leading Icon Slot`, `Badge Slot` and `Trailing Slot`, so those are never
touched even when a binding fails — deleting declared-but-unbound slots was the
mistake this replaces. Checked against the file: the rule reaches exactly
Drawer's three.

**Since confirmed by a run.** All three slots are native `SLOT` nodes on all
four `Side` variants and all three properties bind; the orphans are gone. Drawer
was the first of the five to clear, and it is the reference for the shape —
`Title Text` and `Body Text` sit beside their slots rather than inside them,
which is what makes them bindable. The other four are covered below.

### TreeChildItem's row actions

A Pointr Cloud `listItem` row carries five actions — edit, lock, eye, flag and
overflow — plus a show/hide toggle. Core rendered one and declared two, which is
why `Action 2 Icon` was unbound and the set would not publish.

It now renders five, and **the count is a property rather than a variant axis**.
That was the design question. A Figma axis applies to every variant in the set,
so crossing five values into Content x Depth x Density x State takes
TreeChildItem from **72 variants to 360** — to express something five booleans
say without adding one. So each action gets an instance-swap `Action N Icon` and
a boolean `Show <Name>`, and only the first is on by default, which leaves the
existing Actions variants looking exactly as they did.

**Overflow is not special-cased.** It is just another action, so a row that
needs six puts the overflow in the fifth. Treating it as a distinct affordance
would have meant a sixth slot with different semantics for no gain.

**The icon set cannot express the Pointr row.** Of its five icons, only edit and
lock have equivalents in the 38 Kozmos icons: there is no eye, no flag and no
dots/overflow glyph. The defaults are therefore generic — edit, lock, delete,
export, settings — and are instance-swap defaults rather than a vocabulary. If
those rows are to be rebuilt on Core, the icon set needs three additions; that
is a separate piece of work and nothing here is blocked on it.

### MultiSelect's chip labels, and nested property forwarding

`Chip 1 Text` and `Chip 2 Text` could not bind because the chips are nested
`Chip` instances: a layer inside an instance is driven by the _nested_
component's property, not the parent's. And unlike `TreeChildItem`'s
`Action 2 Icon`, these were never declared by the current builder at all —
`configureMultiSelectProperties` sets Label, Placeholder, three Options and
Helper, and no chip text. They were residue from an older structure, recreated
by nothing.

Residue is not the same as unwanted, though, and the capability is real: a
hundred `Tags` on one Pointr screen say chip labels get set. So rather than
delete them, the plugin gains the mechanism they were missing.

`forwardNestedInstanceTextProperty` has the instance reference the parent's
property under the **nested property's key** rather than under `characters`.
The key is discovered at runtime because it carries Chip's own id suffix
(`Label Text#227:0` in this file), which differs per file and cannot be
hardcoded. `configureNestedInstanceTextProperty` wraps that with
`ensureTextProperty` and warns when a property forwards into nothing, so the
next one fails loudly instead of surfacing months later at publish.

The chips already set `isExposedInstance`, which is Figma's other route — but it
surfaces Chip's whole property set under the instance name. Forwarding gives
MultiSelect the named, curated property its set already claimed to have. Both
can be true at once; they answer different needs.

This is the third distinct cause behind one symptom. `TreeChildItem` was a
declared capability never rendered, `Drawer` was `createSlot()` churn leaving
orphans, and `MultiSelect` is a structure that changed under a property. Only
`ColorPicker` is left, and it is a decision rather than code.

### A frame named "Slot" is not a slot

`NavigationItem` was going to survive everything above. Its three properties —
`Leading Icon Slot`, `Badge Slot`, `Trailing Slot` — are inside its declared slot
API, so `removeStraySlotProperties` is right to leave them alone, and the
regions they name were built by `createSampleSlotFrame`: plain frames. **Only a
`SLOT` node can carry a slot binding.** The properties were therefore created
unbound by the plugin itself, on every run, and nothing in the plan would have
cleared them.

Read off the file rather than argued: all 142 slot references on the Components
page sit on `SLOT` nodes under the `slotContentId` field. Not one frame carries
one — including NavigationItem's 180 correctly named frames, which
`bindSlotPropertyToNodesNamed` walked on every run since the property was
declared, and bound zero times. The key it writes, `"slot"`, appears nowhere in
the file.

What hid it was two questions sharing one predicate.
`isSlotReferenceCandidate` answered both "can this node's children be carried
across an update?" and "can this node accept a binding?" with `FRAME || SLOT`.
The first answer is right and the second never was, so the frames were preserved
by every update and the binding they could not accept was never missed. They are
separate now — `isReusableSlotContainer` for the hand-off, `SLOT`-only for the
binding — and a slot name that matches only frames raises a warning rather than
incrementing a counter called `attempted`.

The regions are native slots now, through the same `createOrReuseShellSlot` that
Navbar's `Logo Slot` uses. Navbar is also the proof the shape works: that slot
holds a `Brand Mark` and a `Logo Text` as its own defaults, so a native slot
carrying built-in example content is an established pattern here, not a new bet.

Two things about the run to come. The first pass migrates each frame's contents
into a real slot and deletes the frame, so **180 slots across 150 variants** —
against Navbar's 3 variants and Drawer's 4. If anything in this misbehaves, that
is where. And the variant used to be wiped and rebuilt wholesale, which at that
scale would mint 450 fresh properties per run for the dedupe to clear
afterwards; slots are preserved across updates now, and only the regions a
variant actually renders, since keeping one the variant has no builder for would
park it as a stray child.

### `figma:verify` can now answer "will this publish?"

The verifier reported five clean checks while eleven properties held five sets,
two of them Core, out of the library entirely. Nothing it asked was the question
that mattered: presence, axes, geometry, contrast and truncation are all true of
a set Figma refuses to publish.

The sixth check reads every set's `componentPropertyDefinitions`, walks its
`componentPropertyReferences`, and reports the difference. It names the
properties, which the publish dialog does not — the dialog names the sets. On
the file as it stands it reports exactly the eleven.

Worth knowing why this could not have been a plugin fix: `Fix Audit Issues`
sweeps the page but only _reports_ unbound properties (§3 above), and the plugin
cannot be run from CI or from a terminal. The check belongs where it can be run
without Figma open.

### Clearing the last blockers, and the two rules behind them

Five sets went in, and each needed its own fix. Two findings generalise well
past this branch.

**A component's own property cannot drive text inside a nested instance.**
MultiSelect's chips are `Chip` instances and ColorPicker's palette name lives
inside a `Select` instance, so `Chip 1 Text`, `Chip 2 Text` and `Palette Text`
had nothing to attach to. `forwardNestedInstanceTextProperty` existed for
exactly this and had never worked once: counted across the whole Components
page, every `componentPropertyReferences` key in the file is `characters`,
`visible`, `mainComponent` or `slotContentId` — 6,771 of them — and not one is a
nested property key. Figma rejects the assignment. The helper is deleted rather
than left looking like a mechanism, the properties are gone, and the capability
sits where the text does: both nested instances are `isExposedInstance`, so a
designer sets a chip label by selecting the chip.

**NavigationItem could not have all three slots**, and that took two rounds to
see. The slots bound fine; wrapping the leading icon in one silently unbound
`Leading Icon`, because the same rule applies to slot content. Sidebar's rows
are nested NavigationItem instances that set their icon through that property —
Overview, Explore and Settings would all have rendered the same home glyph. So
`Badge Slot` and `Trailing Slot` are real slots and the leading region is a
frame holding an instance-swap picker, which is the better affordance for an
icon anyway. Its node is called `Leading Icon Frame`, deliberately: naming a
frame "... Slot" is what caused the original bug.

Drawer shows the arrangement that works, and it is the rule to follow: **bound
defaults sit beside the slot, never inside it** — `Title Text` beside
`Header Slot`, `Body Text` beside `Content Slot`.

Two truncations surfaced once the sets rendered, both introduced by this
branch's own changes:

- **Tree rows reserved width for buttons nobody can see.** TreeChildItem draws
  five action buttons and hides four; a hidden child takes no room in an
  auto-layout frame, but the width maths counted all five and handed 120px to
  the spacer. The label was then clamped by a 40px floor, which made it look
  like a minimum-width problem. Measured across the depths: 66 / 46 / 40px
  before, a uniform 75px after, against the ~69px "Place item" needs.
- **One placeholder cannot serve a 278px row and an 81px one.** MultiSelect's
  hint has the whole row when empty and 81px once two chips, a clear button and
  a chevron are in there. The builder already asked for a different string when
  selections existed and could not get one: every node named `Placeholder Text`
  binds to one property, and that property paints its single default over all of
  them, so the branch was dead. The filled states have their own node and
  property now — `Filter Text`, defaulting to "Filter" at ~37px, which leaves
  44px of headroom rather than the 8px the builder's own "Type to filter" would
  have left. Third time this repo has needed per-node names for this exact
  reason, after RoutingInputGroup's three "Start" fields and FileUpload's
  `File Meta Text`.

`figma:verify` gained a sixth check in the same session, because the first five
were all green while eleven properties held the library out of Figma entirely.
It reads every set's `componentPropertyDefinitions`, walks its
`componentPropertyReferences`, and reports the difference — naming the
properties, which the publish dialog does not.

### Elevation reaches the library, a stalled run, and checks that name nothing

Written 2026-09-10. PRs #13 to #16, and #18.

**Figma.** Thirteen painters — Tooltip, Menu, Popover, Dialog, Drawer,
BottomSheet, Toast, and the dropdown panels of Combobox, MultiSelect,
DatePicker, DateRangePicker, TimePicker and ColorPicker — called
`tooltipShadowEffects()`, Tailwind's two-layer `shadow-md`. Update All Core ran
over all of them and changed none, which is how it surfaced: the shadows were
never stale, the painters never used the roles. Twelve now read `overlay` and
Toast reads `floating`. The file went from 34 shadows on a role and 334 off to
186 and 30, and the 30 are the two documented exceptions. The check had passed
throughout because it counted `type: "DROP_SHADOW"` occurrences, and a helper
is one occurrence; it now counts reach — which functions hold a literal, and how
many painters call each.

**Web.** The first web assertion named the nine components converted alongside
Figma, and checked those nine. It passed while 44 raw Tailwind shadow classes
sat in 29 components it did not name. It now scans every component and names
only the exceptions: 36 components read a role and 2 raw classes remain, both
named. Four map panels were first mapped to `floating` and are `overlay`, for
the reason given in the playbook.

**Native.** `KozmosShadows` was generated into `packages/tokens/dist` for both
platforms and never copied into either package, so 23 iOS sites held fifteen
distinct values and Android picked 4, 6 and 20 dp. Both packages now carry the
roles and the components read them. The first iOS copy carried the light values
only — 0.05, 0.1 and 0.1 alpha where dark mode wants 0.3, 0.4 and 0.5 — so every
native shadow was close to invisible in dark mode while the web's followed the
theme. The generator had the same defect: its shadow formatter read `lightVal`
and ignored the `darkValue` the colour formatter already used. Both follow the
theme now, the generator throws on a token whose geometry differs between modes,
and `tokens:elevation:check` compares the tracked native numbers against both
token files rather than only checking that three names exist.

**Update All Core stalled overnight on 2026-09-07**, on TreeItem — the largest
set at 216 variants — in a preflight read of `componentPropertyDefinitions`
that only the three Tree\*Item sets performed and that duplicated a read the
update makes anyway. It is gone, and so is that path's habit of rebuilding a set
on its own, which minted new node IDs behind Code Connect's back. Bulk runs now
resume: a completion stamp, written after an updater returns and distinct from
the `build` stamp written before it starts, lets a retry skip what is finished.
The runner also yields between sets and through the reorganize, because without
that a run is one block Figma cannot save through — a run progressing normally
looked identical to a hung one for forty-five minutes, long enough that the
advice to quit was given twice. **Silence in `lastModified` is not a stall.** The
only honest signal was a jump in saved sets after a quiet spell.

**Checks that name nothing.** Every parity check verified the tokens and then a
named list of consumers, which can only confirm what someone already looked at.
`pnpm tokens:raw:check` scans every component for values that bypass a role —
35 raw colours across 7 components and 7 raw radii across 6 — as a ratchet: it
fails when a count goes up, and also when one goes down, so a fix has to be
recorded rather than quietly re-spent. Its largest item is a missing role rather
than sloppiness: three map panels repeat the same translucent-panel classes
because there is no glass surface to read. The scan also found the web's rating
star at Tailwind's `#facc15`, where Figma and iOS agree on `Data/Yellow`; it now
reads the token.

**Tooling, and the shared checkout.** `pnpm native:check` compiles Swift and
Kotlin in about six seconds. Android needs `packages/android/local.properties`
pointing at the SDK, which was already installed — its absence is why the native
rollout first went to CI unverified. This checkout is shared with parallel
sessions that switch branches and leave work uncommitted; directory-wide staging
swept two of their changes into these commits before the practice changed to
staging by file path.

## 4. Immediate Next Actions, In Order

**Checkpoint 2026-09-10.** In order:

1. **Merge #16, then #18.** #18 is stacked on #16, and GitHub retargets it to
   `main` when #16 lands. Both are green apart from Chromatic.
2. **#17 needs its tests fixed before it merges.** Seven of the twelve
   `KozmosAdaptiveMapShellTests` fail under `swift test`, reproducibly. The
   shell decides where its panel docks from `isRegularWidth`, which is
   `horizontalSizeClass == .regular` on iOS and hard-wired to `true` everywhere
   else — and `swift test` runs on macOS, so every test sees the side-docked
   layout and the insets land on the wrong edge: a bottom inset of 0 where 384
   is expected, a side inset of 200 where 0 is. `resolvedCollisionInsets`
   already takes the size and layout direction as arguments so that it can be
   tested; the width class wants to be an argument too, pinned compact by the
   tests.
3. **The parallel session's local branch carries two of #18's commits.** Of the
   25 commits on `codex/wayfinding-map-panel` that it has not pushed, the first
   two are `dbc5fca` and `d0f36cf` — #18's elevation commits under their
   pre-split hashes — and the other 23 are its own mapscale work on top. The
   pushed branch is clean, so nothing is wrong unless it is pushed as it stands.
   **The fix is the merge order, not surgery.** Simulated on 2026-09-10: with #16
   and #18 merged, rebasing that branch onto `main` completes with no conflicts;
   git skips `d0f36cf` as already applied, and `dbc5fca` shrinks to the one file
   that was never #18's, `Checkbox.tsx` — still under an elevation title, so it
   is worth rewording during that rebase. The indeterminate-checkbox change is
   that session's own work, and is also preserved on
   `codex/checkbox-indeterminate`.
4. **Name a glass surface role.** Three map panels repeat the same
   translucent-panel classes because there is no role for them; naming one clears
   29 of the 35 raw colours in `tokens:raw:check`. A token decision.
5. **19 Figma sets cast no shadow** where at least one implementation does:
   POICard, WayfindingCard, RouteSummary, FeedbackCard, SaveLocationCard,
   RoutingInputGroup, MapControlsGroup, FloorSelector, POIDetailPanel,
   LocationPin, AdaptiveMapShell, UserLocationMarker, Navbar, DirectionStep,
   POIResultCard, POIMediaGallery, Listbox, Select and DynamicIsland. Each needs
   `elevationEffect(role)` in its painter, then a run.
6. **The type scale**, unchanged: 14 and 12 join the scale, or the library moves
   to 13 and 11. It governs 95% of the text in the file.
7. **Chromatic.** The snapshot limit has left every build since early September
   visually uncompared.

**A gap audit ran overnight on 2026-09-05** against the POI Details Card Revamp
designs and the whole monorepo: `docs/gap-audit-2026-09-05.md`. Its two
cheapest findings are worth pulling forward. **Text, Heading and Label have
never been built in Figma** — they are named in `CORE_UPDATE_SEQUENCE`, have
builders, and `Update All Core` has been skipping them silently on every run,
which is also why they are the only three components with no Code Connect on any
platform. And **two font-size tokens carry floating-point noise**
(`11.008000373840332`, `13.008000373840332`). The larger finding is that 95% of
the library's text sits off its own font scale, which needs one decision before
any sweep.

**Checkpoint 2026-09-03, late.** An adversarial audit of the week's work found
nine things and fixed all of them. The largest: there was **no border role at
all** — Figma painted container edges with `foreground/500` (4.2:1) while the
web used `background/200` (1.6:1), and nothing compared them. Then the same
defect again in dividers, which are borders drawn as 1px filled rectangles:
Separator, the menu separator and the stepper connector were the dark text
grey, and the web drew the same rules soft. `Semantics.Border.Subtle` and
`.Input` now exist, 78 plugin sites and every other consumer read them, and
`pnpm tokens:border:check` holds them together in CI — it caught the stepper
connector on its first run after learning the class.

Also fixed: the concentric popover inset had reached Figma and never the web
(`p-1` → `p-3` on five components), now pinned by contract assertions in both
directions; `Listbox/gap` aliased a badge; TreeItem declared none of the row
action toggles its siblings had; ColorPicker's web popover sat at the container
radius while every other popover and Figma sat at control, and its colour area
now derives its own radius through `calc` the way Figma derives it; five
fallbacks named a colour one ramp step away from the token beside them; and the
token generator emitted an unresolved alias string as an iOS dark hex for any
semantic colour alias, which had never fired because no semantic colour alias
existed until now.

**`Update All Core` exists.** 73 Core sets in one action, sharing a runner with
`Update All Product / SDK`, node IDs preserved, one failure never stranding the
rest. The sequence is derived from the dispatcher, and a contract assertion
fails the build if a component with an update handler is missing from it.

**`docs/style-playbook.md` is the document to hand anyone who has to change how
this looks**: the role vocabulary with measured numbers, a cookbook per kind of
change, the seven traps that fail silently, what each check guards, the Figma
loop in order, and where everything lives.

What is left, in order:

1. **Import variables-only** — the payload is 620 token candidates now, and the
   file's variable count should go 1412 → 1414 (`Border/Subtle`,
   `Border/Input`). Then **Update All Core** and **Update All Product / SDK**,
   which is now two clicks rather than 97. Every stroke and divider in the file
   rebinds to the roles on that run; until then the file still draws the old
   greys, because the painters changed and the file has not been re-run.
2. **Verify**: `pnpm figma:verify` and `pnpm tokens:radius:nesting` should stay
   clean, and the plugin's own audit should stay at 0 warnings. The nesting
   check is `--strict` in CI now, so a regression fails the build.
3. **Chromatic's billed snapshot limit** is still unresolved and still means the
   visual gate compares nothing. It matters more after this change than before,
   because the border sweep touches almost every story.
4. **The native freeze**: the tracked `KozmosColors.swift` and `.kt` are a May
   baseline that has drifted from the generator's output, and 13 iOS plus 16
   Android border references still hard-code the old grey rather than reading
   the role. Both need a decision before a sweep.

Everything below is either one plugin run, one PR, one account setting, or a
scoped piece of work with its own document. Nothing is blocked on a decision
that has not been asked.

**Before any plugin run, make Figma load the current `code.js`.** Not a step of
its own, but the thing that has wasted the most time on this branch. Figma reads
a development plugin's files when the plugin _launches_, so quit Figma entirely
(⌘Q) and relaunch after every code change — reopening the panel is not enough.
`pnpm figma:verify` is the cheap way to tell whether a run landed: it reads the
file, not the plugin's own report.

**Status at the end of 2026-09-03: done.** Nesting reads 0, `figma:verify`
is clean, the strict gate is in CI, and the plugin's own audit is clean at
1412 variables. The foundations import ran variables-only and created 14 —
the two new background steps and twelve others the file had been missing
since earlier in the week, which the plugin had been falling back on without
anyone noticing. The active rows now bind `Colors/background/50`, distinct
from the selected rows on `/100`, confirmed over REST. Everything below in
this item is history, kept because each step hid a trap.

1. **Done 2026-09-03.** The record: quit Figma (⌘Q), then Update the sets by
   hand, one at a time from the
   plugin's dropdown: `Listbox`, `MultiSelect`, `ColorPicker`, `Combobox`,
   `TimePicker`, `Menu`, and `TreeParentItem`. `NavigationItem` is already done.
   Load the payload from **this checkout**, `docs/figma-foundations-payload.json`
   with 618 token candidates; a second checkout under `P/Pointr Cloud/` holds
   one from before `background/25` and `/50` existed, with 615, and an import
   from it creates nothing new — which is why the active rows were still a
   solid fallback after an import on 2026-09-03. TreeParentItem also needs an
   Update for its count text: the audit expected the row style where the
   painter applies Counter Small, and the rule now says so. NavigationItem
   needs one more Update as well: Apply Text Styles restyled its badge text
   to the label size, the badge grew, and the pill radius resolved for the
   smaller box stayed behind — eight nesting findings on 2026-09-03. The rule
   now expects the painter's sidebar-section style for badge text, and the
   style pass re-resolves pills.
   TreeParentItem is on the list because a run on 2026-09-03 declared the
   five leaf-row actions on it while its rows render two, which left seven
   properties bound to no layer and publishing blocked; the property pass
   now declares from the set's own list and removes the rest. Check Figma's
   sync state before starting: at 08:10Z on 2026-09-03 the file's last
   modification was 06:39Z, so an import and four Updates reported after
   that had not reached the file. The quit
   matters: `code.js` changed on 2026-09-03 and the plugin runs cached code
   until Figma restarts. There is still no "Update All Core". `Menu` was never
   flagged — its rows carry no fill in the variants measured, so the checker
   cannot see them — but it binds the same padding family and moves with the
   same fix. **Prediction on record:** `tokens:radius:nesting` reads **0**
   afterwards and reports `6 skipped as a control`. If ColorPicker's colour
   area still reads 16, that one Update did not run: the area is recreated at
   3 on every run.

2. **Done 2026-09-03: `tokens:radius:nesting --strict` is in CI** as the
   `Verify Nested Radius` step, skipped without the Figma token. The reasoning
   it was held for, kept for the record: it exits 0 today
   while the backlog is open, by design — a gate that is red on purpose is a
   gate somebody switches off. Once item 2 lands it can fail the build, and it
   stops being a report.

3. **Clear Chromatic's billed snapshot limit.** Builds 128, 129 and 130 were
   all limited — no comparison ran, and `UI Tests` sat at PENDING not because a
   human was reviewing but because there was nothing to review. PR #1 (128
   commits, the type restyle across every story) merged without visual
   verification for that reason. 218 stories per build is the cost; raise the
   plan, wait for the period, or enable TurboSnap so a token-only PR
   snapshots nearly nothing. **Do this before the colour-scale work**, which
   touches every story.

4. **Consider an `Update All Core` action in the plugin.** ~20 Core sets still
   carry the stale 12 focus ring (the old `8 + 4`) and Chip, Radio, Switch and
   Slider still store 9999 on their rings. None of it is a nesting finding —
   it is the "impossible radius" count — and fixing it by hand is twenty
   dropdown-and-Update rounds. One bulk action would pay for itself the next
   time any shared helper changes.

5. **Generated colour scales** — scoped in `docs/generated-color-scales.md`.
   Every ramp is hand-typed hex; "make the background pink" is thirteen edits.
   Measured in OKLab, the ramps are mostly even and defective exactly where a
   human pinned a value: both greys jump ΔL 21 at the black end against ~9
   elsewhere, and `theme` 500→600 is ΔL 2.2, two adjacent steps doing the job
   of one. Two sessions. Depends on item 4.

6. **The 11 pill radii applied by bound Figma variables.** A clamp cannot
   reach them — the variable wins — so they still store 9999 on the node.
   `markPillRadius` / `resolvePillRadii` is the mechanism (it fixed
   NavigationItem's badge); applying it means dropping the variable binding
   for pills and resolving the cap after layout. Defensible, since a pill has
   no value to propagate, but it removes a token link on 11 components and is
   therefore a decision.

7. **Screen breakpoints are emitted 16x inflated.** `primitivesScreenTablet =
12288.dp`, should be 768. Pre-existing rem-conversion bug in `build.mjs`,
   surfaced by the pill filter and deliberately left visible rather than
   hidden. Nothing consumes the constants today.

8. **`SegmentedControl` un-decide is not tracked.** Deselect now reports
   `undefined` (Olcay's ruling) but analytics fires only on a real selection,
   because sending `segmented_control_toggled` with no value would change what
   that event means for anything counting it. Worth its own event if the
   review funnel is measured.

9. **Decide how the iOS snapshots run in CI**, then widen coverage past
   Button. The harness works; it needs a pinned runner image plus simulator.

10. **Script-aware typography.** Nine components apply `tracking-tight`, which
    collides CJK glyphs and disrupts Arabic joining, and the product ships
    both. The `letterSpacing` and `line.height` scales are unused by every
    platform, so there is nowhere yet to say "tighter for Latin, normal for
    CJK".

11. **Font sizes are untokenised everywhere.** `Primitives.Typography.font.size`
    is read by no platform. Same shape as the radius and family layers.

12. **Decide the brand font's fate.** Figma renders Inter now; `Brand` is an
    opt-in role no surface uses. Readex Pro has no CJK. Drop it, or scope it to
    Latin with `unicode-range`.

13. **`Link` and `Spinner` each miss a variant axis on iOS and Android.** New
    public enums on both native packages; belongs with the naming decision in
    §5.

14. **`RoutePreviewPanel`'s five states look like two** — see §5.

15. **The Pointr Cloud dashboard work** in `docs/archive/figma-upcoming-components.md`.
    Drawer's slots, TreeChildItem's row actions, and the four DS components
    the prototype's backlog asked for (`PopoverArrow`, disabled-trigger
    `Tooltip`, `Slider` value bubble, `SegmentedControl` deselect) are done.
    The app side is theirs: merge → rebuild `packages/react` → swap. Anyone
    pulling `main` must rebuild, since the export names changed and a stale
    dist stops resolving.

### Not blocking, and not this branch's to fix

- `apps/mapscale-review` has one lint error (`UploadDropConfirm.tsx:69`, an
  unescaped apostrophe) and three unused-variable warnings. Since CI no longer
  gates the design system on that app, none of it blocks a merge.
- That app has never been prettier-formatted. Any commit touching it sweeps a
  wholesale reformat into the diff — which is exactly how a 1,300-line
  reformat once landed in a design-system branch and collided with in-flight
  MAP-566 work. Run prettier over it once, deliberately, as its own commit,
  at a moment when nothing is in flight there.

## 5. Open Decisions

These need a human call; none are blocked on code.

- **Vue: shipped SDK surface or internal convenience?** It is at full parity via
  `createVueWrapper`, but the adapter creates a React root per component
  instance, re-renders the whole root on any prop change (`watch(…, { deep: true
})`), DOM-transplants slots, cannot SSR (`createRoot` is client-only), and
  makes every consumer ship react + react-dom (~130KB). Fine internally; not
  fine for a public SDK.
- **Naming normalisation.** Native enums are inconsistently prefixed
  (`AlertStatus`, `BadgeVariant`, `ChipSize`, `CounterTone`,
  `SegmentedControlSize`, `StackDirection` lack `Kozmos`), and
  `AlertStatus.Error` maps to React's `destructive`. Cosmetic but breaking — do
  it deliberately with deprecated aliases.
- **LocationPin `variant` and `labelPlacement` in Figma.** Recorded as
  intentional (colour is a token override, label placement is renderer layout).
  `Size` was added. Revisit only if designers ask.
- **RoutePreviewPanel's five states look like two.** Only `Ready` renders
  RouteOptionCard slots; the other four show the same generic "Status content
  slot" placeholder, so Loading, Empty and Error are distinguishable from each
  other only by the header line — and Error only because it turns red. Nothing
  is broken and every gate passes; the question is whether a designer opening
  the set can tell the states apart, and that is a call for whoever owns the
  routing flow. Differentiating them means giving each state its own placeholder
  anatomy rather than sharing one.
- **Should a pill sit inside a merely rounded box?** 23 pairs do — MultiSelect's
  chips in their field, ScrollArea's thumbs in their track. Concentric radii
  would force each parent out to a full stadium, so `tokens:radius:nesting`
  declines to judge them. The question is really upstream: if MultiSelect's
  chips were `marker` (4) rather than `pill`, the field's 16 would already be
  right, since 4 + 12 = 16. Full write-up in `docs/nested-radius.md`.
- **The 15 Product / SDK cards and FeedbackCard are on `container` (16) as of
  2026-08-31**, off the off-scale 12. Recorded because the reasoning given for it was wrong: it
  resolves **none** of the 50 nesting findings (50 before, 50 after, simulated
  before the change). A 16 card holding a 16 slot across 13px of padding wants 29. The move was still right — those sets now read from the semantic scale
  rather than a literal — but the nesting fix is the **slot**, which wants
  roughly 3 at that padding. The slots moved to `marker` (4) on the same day,
  taking the findings from 50 to 37 — and note that squaring them outright
  would have taken it to **53**, since a square child at 13px of inset wants a
  parent of 13 rather than 16. "Less round" is not a direction; the concentric
  ideal is a number with a wrong side either way.
- **MapOverlay `position` in Figma.** The set carries `Width` only. Crossing 6
  positions with 5 widths would be 30 variants for what is renderer placement.
  Recorded in the set description; revisit if designers ask.

## 6. Known Risks And Gotchas

- **`FIGMA_ACCESS_TOKEN` expires 24 November 2026.** When it lapses, three CI
  jobs fail at their Code Connect step with `Failed to fetch node info (403):
403 Token expired`, and `figma:publish:linked:dry` fails the same way locally.
  Nothing names the cause, so it reads as a code failure; the previous lapse
  cost most of a session. The fix is a new Figma personal access token scoped to
  **`file_content:read`** and **`file_code_connect:write`** only, then:

  ```bash
  gh secret set FIGMA_ACCESS_TOKEN --repo vodoco/kozmos-design-system-
  ```

  Paste at the prompt. Do not route it through `.env` and a `$(grep ...)`
  substitution — that is how the secret was once set to an empty string, and an
  empty secret is worse than an expired one: the step's `if [ -z ... ]` guard
  then skips Code Connect and the job goes **green without verifying anything**.
  Put the same value in `.env` separately so local publishes work.

  Two verification notes. `GET /v1/me` returns 403 with the scopes above and
  that is correct — test `/v1/files/Yj4O8p6Y9h2Sa9zJVoAiVY/nodes?ids=4:4`
  instead, which is what CI actually calls. And a green job is not proof the
  step ran: check the log says `All Code Connect files are valid` and that no
  `Skipping ...` annotation was emitted. The skip text also appears in the
  `##[group]Run` block as echoed script source, which looks alarming and means
  nothing.

- **`figma:verify` green does not mean the file says the right words.** It
  checks structure — presence, axes, geometry, contrast, and now truncation —
  and never compares text content against the builder. RoutingInputGroup read
  "Start" three times for the whole life of the set without a check noticing.
  If you want this class closed properly, the shape is for the plugin to stamp
  each set with a fingerprint of the builder source at generation time and for
  the verifier to compare it; that was scoped and deliberately not built here.
  It is also not run in CI at all — see §1.
- **A text property binds by node name across the entire component set.**
  `configureNamedTextProperty` walks every variant and binds every TEXT node
  carrying the given name, then paints the property's single default over all of
  them. Two sibling nodes sharing a name is therefore not a cosmetic
  duplication; it silently collapses them to one value. That is what happened to
  RoutingInputGroup's three fields. If a builder emits N of the same thing, give
  each its own name — FileUpload's `File Meta Text` / `File Meta Text 2` is the
  convention.
- **A component's own property cannot drive a node inside its own slot, or
  inside a nested instance.** Both fail the same way: the property is created,
  nothing binds to it, and Figma refuses to publish the set without saying which
  property or why. Measured on this file — 5,785 own-property references, none
  of them inside a slot, and every reference key in the whole page is
  `characters`, `visible`, `mainComponent` or `slotContentId`. So bound defaults
  sit _beside_ a slot (Drawer's `Title Text` beside `Header Slot`), and text
  inside a nested instance belongs to that instance — expose it with
  `isExposedInstance` rather than trying to forward it upward. There is no
  forwarding mechanism; the one that used to be in `code.js` never bound
  anything in any run.
- **A frame named like a slot binds to nothing, silently.** Figma's slot
  properties attach only to `SLOT` nodes, under the `componentPropertyReferences`
  field `slotContentId`. A frame with the right name reads as a slot in the
  layers panel and passes any name-based check, while the property it was meant
  to drive stays attached to nothing — and Figma then refuses to publish the set
  with no indication of which property or why. Build slot regions with
  `component.createSlot()`; `createOrReuseShellSlot` is the helper, and it also
  migrates an existing frame's children into the new slot. The plugin warns on
  this now, but only on a run.
- **Query the file at full depth.** `depth=8` on the nodes endpoint looks like a
  harmless optimisation and drops 17% of the page's text nodes on the floor,
  with no error and no truncation marker in the response. Any new check that
  walks the tree should fetch without a depth cap.
- **`productSdkText` ignores the `fontSize` and `lineHeight` you pass it.**
  `applyTextStyleToNodeAsync` runs after both assignments and overwrites them
  from the style spec, so a call site asking for 12 renders at 14. Around a
  dozen call sites do exactly that. Nothing currently breaks because of it, but
  any width arithmetic derived from the argument is wrong — which is half of
  why the slot labels truncated.
- **A plugin run may be executing stale code, and it looks identical to a run
  that did nothing.** Figma reads a development plugin's files when the plugin
  launches, so a panel left open keeps whatever it loaded first. Two runs this
  session were read as "the fix did not work" when the fix had never been
  loaded: `code.js` held all six markers, the working copy matched HEAD, the
  manifest pointed straight at it with no build step, and the file had been
  written two hours before the run. Verify with the marker — `Fix Audit Issues`
  logs `unbound properties: N set(s) scanned,` — or by checking for a node only
  the new code creates, such as Drawer's `Header Slot`. Quitting Figma entirely
  is more reliable than reopening the plugin panel, and it is worth confirming
  `Plugins > Development > Manage plugins in development` points at this
  checkout rather than another copy of the repo.
- **Prose and code samples are unverified by default.** The MDX platform
  snippets are template strings; nothing compiled them, and four wrong type
  names shipped looking perfectly plausible. `docs:snippets:check` closes the
  identifier half of that. The same caution applies to the Figma plugin's
  `COMPONENT_DOCS` strings and to this handoff: anything not executed by a gate
  is only as good as the last person who read it. The stale LocationPin
  "dashed outline" line survived a commit that changed the behaviour for exactly
  this reason.
- **Local gates green is not CI green.** They disagreed here for two independent
  reasons at once: an uncommitted working tree, and checks that only exist in CI
  (bundle budget, Code Connect dry-runs against the live Figma file). Read the
  actual job logs — the GitHub check annotations point at workflow line numbers,
  not at the failing command, and are close to useless for diagnosis.
- **Verify against a clean checkout, not the working tree.** This is how the
  branch ended up with 79 committed components while every report said 97. A
  `git worktree add --detach /tmp/verify HEAD` costs seconds and is the only
  thing that measures what CI will see.
- **`Sidebar`'s rows are stale frames, not a frozen-Core decision.** The one
  audit warning left reads `sidebar-navigation-slot-overflow (Content=Rail /
Navigation Slot)`, and the earlier diagnosis here — that the builder emits
  plain frames where the audit wants instances, so fixing it means composing
  `NavigationItem` instances into the Rail variant — was wrong on both counts.
  The builder already composes them: `createSidebarRailNavigationRow` calls
  `createNavigationItemNestedInstance`. The set is simply older than
  `NavigationItem` (node `752:6807` versus `861:7297`), so at build time the
  lookup failed and every row fell back to a frame. All four variants are
  frames, not just Rail; Rail is only the one that overflows, by 4px, because
  its fallback frames are 80px tall where a real instance is 72 — 3x80 + 2x8 =
  256 against 252 of slot. `Navbar` came through the same code later and is
  entirely instances, which is the contrast.

  It could not be healed either way until now. `Update Sidebar` reuses the
  existing rows unless `shouldRefreshGeneratedShellSlotDefaults` says otherwise,
  and that demanded a `missing-nested-component` stamp these frames predate — so
  Update was a no-op on them for ever. `Rebuild Sidebar` would have worked and
  changed the set's node ID, which six Code Connect declarations pin across
  React, SwiftUI and Compose. The predicate now also accepts an unstamped frame
  under a generated row name, so **`Update Sidebar` heals it in place**, node ID
  intact. Every variant fits afterwards: Side instances are 248x44 (3x44 + 2x8 =
  148 of 220) and Rail 72x72 (232 of 252).

- **The new sets have never been run in Figma.** Every builder is statically
  audited — axis names agree across config, variant root, and parser; every
  handler action resolves; every `productSdkText` call has an explicit width, the
  §5 failure mode — but static checks cannot catch a layout that simply looks
  wrong. Expect a visual pass.
- **Plugin syntax is restricted.** No spread, optional chaining, or nullish
  coalescing anywhere in `code.js`; `figma:plugin:check` enforces it.
- **Axis names that close variant gaps must stay single alphabetic tokens.**
  The analyzer extracts them with `/([A-Za-z]+):/`, so `PanelPlacement` matches
  React's `panelPlacement` but `"Panel Placement"` would capture only
  `Placement` and silently reopen the gap.
- **`code.js` versus prettier.** The pre-commit hook prettiers any staged
  commit, so re-run `components:contract:check` **after** formatting.
- **Android needs an SDK path.** Without `ANDROID_HOME` or
  `packages/android/local.properties`, every Gradle task fails before
  compilation. Documented in `packages/android/README.md`.
- **Piping Gradle through `tail`/`grep` swallows its exit code.** Use
  `set -o pipefail` or check `${PIPESTATUS[0]}`.
- **Some commits on this branch bundle pre-existing uncommitted work.** Review
  before pushing.
- **~588 files remain uncommitted** and are untouched pre-existing work.
- **A bound property ignores the painter.** Most layout properties on
  generated nodes are bound to component variables, and a bound property
  renders the variable — a raw `paddingLeft = 12` in a painter changes
  nothing. When the file disagrees with the code, read `boundVariables` on
  the node first (`tokens:radius:nesting` prints them on every finding) and
  fix the entry in the component-token table; `ensureComponentRuntimeVariables`
  re-applies it on every Update. An alias typed beside a derived value is the
  same trap one step over, which is what `spacingAliasFor()` is for.
- **A set may only declare what its rows render.** The tree property pass
  declared the five leaf-row actions on every tree set; TreeParentItem's rows
  draw Hide and Lock, so four booleans and three icon swaps referenced no
  layer, and one such property is enough for "Invalid assets". It is now
  `treeSetActions()` per set, with the stale ones deleted on Update.
  `pnpm figma:verify` catches this class; run it after any set Update.
- **The audit's rules must agree with the painters.** Twice on 2026-09-03 a
  text rule expected a different style from the one the painter applies
  (TreeParentItem's count text, NavigationItem's badge text). The audit then
  reports stale text no Update can clear, and Apply Text Styles rewrites the
  node to the rule's style, which can resize a box and strand anything derived
  from it. When a stale-text count survives an Update, compare
  `inferTextStyleKeyForComponentText` with the painter before touching the
  file.
- **Corners bind one at a time.** A radius bound through the variables panel
  arrives in REST as `rectangleCornerRadii`, four aliases in one object, and
  `boundVariables.cornerRadius` stays empty. Reading only the latter is how
  `ColorPicker/color-area/radius` passed for "not bound" for a day.
- **"Found" is not "loaded".** The Setup badge says Found when the file
  already carries foundations; the payload textarea and file picker are
  separate, and Import Foundations is disabled until a payload is parsed. An
  audit that keeps reporting the same contrast failures after every Update,
  with the Variables count unchanged, means the import never ran.
- **Two checkouts, two payloads.** `P/Pointr Cloud/kozmos-design-system-` is a
  second clone with an older `docs/figma-foundations-payload.json`. The plugin
  takes whichever file is picked; Figma is registered to run the plugin from
  this checkout (`K/kozmos-design-system-dev`), and the payload must come from
  the same place.

## 7. How To Check Anything Here

Every claim in this document was produced by one of these. None needs Figma
open except where noted.

```bash
pnpm figma:verify                 # is the file behind the code, and will it publish?
pnpm figma:plugin:check           # no spread / ?. / ?? in the plugin source
pnpm components:contract:check    # React/native/Figma contract parity
pnpm components:variant:check     # variant axes across all four platforms
pnpm tokens:contrast:check        # token pair contrast, light + dark
pnpm tokens:radius:check          # all four surfaces agree on corner radius
pnpm tokens:radius:nesting        # does each rounded shape hug the one inside it? (--all, --strict)
pnpm tokens:typography:check      # all surfaces read the same font family role
pnpm ios:snapshot:verify          # iOS renders match their baselines (needs a simulator)
node scripts/measure-font-metrics.mjs <brand> <fallback>   # real size-adjust numbers
pnpm docs:snippets:check          # MDX snippets name real identifiers
pnpm exec tsx scripts/skills/check-completion.ts --check   # STATUS.md current
pnpm figma:publish:linked:dry            # React Code Connect vs the live file
pnpm figma:publish:native:linked:dry     # SwiftUI + Compose likewise
cd packages/ios && swift build && swift test
cd packages/android && ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew assembleDebug testDebugUnitTest
cd packages/android && ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew verifyPaparazziDebug   # goldens are macOS-recorded, CI verifies on Linux — see §3
```

Verify against a clean checkout, not the working tree:

```bash
git worktree add --detach /tmp/verify HEAD && cd /tmp/verify
```

### Traps that cost real time here

- **The working tree is not the branch.** This branch once had 97 components in
  the tree and 79 committed, and every coverage number reported was measured
  against the tree. A clean checkout is the only thing that measures what CI
  sees.
- **`lint-staged` prettiers whatever you stage.** On a file that has never been
  formatted this turns a six-line fix into a 1,300-line reformat, attached to
  your commit without comment. Check `git show --stat` before describing what a
  commit does.
- **Regex over Swift and Kotlin signatures gives wrong answers in both
  directions.** Single-line inits are missed; files declaring a helper struct
  beside the component yield the wrong init. Read the file.
- **A bulk regex across files you just wrote will reach files you did not.** One
  here added duplicate imports to seven pre-existing Core files. Always check
  `git status` for modified files you did not intend to touch.
- **GitHub check annotations point at workflow line numbers**, not the failing
  command. Read the job log.

## 8. The Variant Analyzer

`pnpm components:variant:check` — reads React cva blocks and union props,
SwiftUI/Compose enums (declared _and_ parameter-typed), and the Figma plugin's
axis registry, then diffs them.

**Treat its output as an upper bound.** It needed six parser fixes in the prior
session and one more here, and every one _shrank_ the backlog. Eyeball a
specific finding before acting on it.

Decisions on record live in its `INTENTIONAL` registry with the reasoning
inline. Full write-up: `docs/component-variant-gap-analysis.md`.

## 9. Key Facts

- Figma file: `Kozmos DS - Core Library`, key `Yj4O8p6Y9h2Sa9zJVoAiVY`.
- Components page node: `4:4`. Product / SDK section: `1340:6764`.
- Components are inserted into Figma **through the plugin**
  (`figma/foundations-importer/manifest.json`), not via MCP writes.
- Product / SDK is deliberately outside Core — see `docs/archive/figma-core-gap-audit.md`.
- Native presentation contracts mirror `@kozmos-ds/product-contracts`:
  `packages/ios/Sources/ProductContracts/` and `com.kozmos.contracts`.
- Build commands:
  - `cd packages/android && ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew assembleDebug testDebugUnitTest verifyPaparazziDebug`
  - `cd packages/ios && swift build && swift test`
