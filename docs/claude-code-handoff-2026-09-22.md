# Claude Code handoff — every edge in its role, the five open, the five decisions, PR #56's CI, and the icon tints the live file lost (2026-09-22)

For the next chat. Everything below is on disk, in git or in the live Figma file; nothing depends
on this conversation. It supersedes `docs/claude-code-handoff-2026-09-21.md`, which stays the
detailed record of the 20th and 21st (its §3–§5: the parts' parameters, the QA app, the SDK).
Read §0 and §1, then §6 and §7. Times of commits are BST; times read from Figma are UTC (`Z`).

## 0a. Later on the 22nd (16:00–17:00 BST) — read this before §0

This section supersedes what it names below; the rest of the document stands.

- **Olcay's Figma run happened, and has to be finished.** At 15:24Z he pasted an Audit Library on
  `b3257790f931`: 22 warnings, 54 advisories. Read over REST: all 97 sets carry `b3257790f931`, but
  2,310 of 2,416 icons are still untinted. The node ids give the order — Update All Core (session
  1976), then Update All Product / SDK (session 1978), then Curated Icons → Update last (its new
  sources are `1978:37173…37283`, created after the last Product / SDK icon) — and that sync drew
  all 56 Pointr sources anew a second time, orphaning the tints the Updates had just laid; the 8
  taxonomy sources were kept. Every one of the 22 warnings is an untinted icon (black in dark mode,
  ratio 1). **Asked of Olcay:** do not run Curated Icons → Update; run Update All Core, then Update
  All Product / SDK, on the same build; Audit Library (expect 0 warnings); then the checks of §7
  item 1 from step 6 — `icon-tints.mjs` must exit 0. Then Import Foundations with the regenerated
  payload and Audit Library again, then the Code Connect readback, then publish; before all of it,
  the plugin re-imported from the new path (below). This replaces §7 item 1's steps 2–4; the whole
  run, step by step, is `figma-drift-2026-09-21.md` §9's last section.
- **The keep is broken in the live runtime, not a one-off.** A REST read at 14:03Z, of the file as
  the 09:47Z sync left it, found all 56 sources to be instances of remote components whose keys
  equal the stored `source-component-key`, and Olcay's afternoon sync still replaced every one. The
  code path is identical from `0b64d5867d71` on. Fix, in
  the next plugin build (after Olcay's pass, so the build does not change under him): replace a
  source only when its main component's key is read and differs, keep it (with a warning) when the
  key cannot be read, and name both keys in every replacement's warning. With it, the audit rule
  for icon-slot tints and `figma:verify`'s icon section (§7 item 3).
- **Correction to §5 "Why nothing caught it":** the Audit Library's contrast pass does flag
  untinted icons in dark mode (ratio 1, non-text) — the 15:24Z audit shows 21 such warnings — but it
  names contrast, not a lost tint, and no audit ran between 09:47Z and 15:24Z.
- **"Go with the recommendations" (Olcay, 16:00), done so far:**
  - **Status text on every neutral surface** (supersedes §6.2): `Semantics.Emotion.*.Text` one step
    darker in both theme files — success and alert 800 → 900, informative 700 → 800, danger 600 →
    700 — and `pnpm tokens:contrast:check` holds each emotion's text on background/0, /50 and /100
    in both themes (it failed seven times on the old tokens). React's status text and glyphs read
    them through new Tailwind roles, `text-success-text`, `text-warning-text`, `text-info-text`,
    `text-destructive-text` (39 uses in 16 files); `success`, `warning`, `info`, `destructive` stay
    the fills, edges and rings, pinned in `contrast-contract.json`. iOS `Tag` and Compose `Tag` and
    `Counter` read the tokens and follow. The full story audit passes, 0 of 1,104 (the POI sheet's
    "Open" included), and the interaction checks in all three browsers. The Figma payload is
    regenerated (`docs/figma-foundations-payload.json`); Olcay re-imports it after his pass, and the
    painters, which bind the emotion primitives directly (danger/600 ×28), follow in the next build.
  - **The natives' status colours** are a larger, older fault (success/alert/danger at 600 in 48
    files; success-600 is 2.74:1 even on white): offered as its own session, `task_a6b3124b`.
  - **Stepper labels** (supersedes §6.8): both natives draw React's label — the current step's in
    the foreground at medium weight, every other in foreground/400 (`e916524`); the pending number
    already matched. Figma's painter follows in the next build.
  - **Changesets**: every public package now has a minor one, so each reaches 0.1.0.
  - **The bundle, measured** (supersedes §6.3's "measure first"): of the ES bundle's 321.1 KB,
    core components are 62.8 %, Product / SDK components 29.0 %, form-factor 1.5 %, shared code
    about 7 % (AdaptiveMapShell 25 KB and POIDetailPanel 17.5 KB lead the SDK). A core entry would
    be about 225 KB raw and 50 KB gzip, well inside 300 / 70. The split changes public import paths,
    the React Code Connect snippets (a republish, his word) and the website app.

- **Decided by Olcay at 17:00, both as recommended:**
  - **The bundle split goes in its own PR after #56**: #56 merges with `analyze-bundle` knowingly
    red (`main` is not protected; no check is required), and the split — `@kozmos/react` core, a
    `@kozmos/react/sdk` entry for the Product / SDK parts, the analyzer measuring the core entry
    and its chunks, the React Code Connect imports republished on his word, the website app
    following — lands before 0.1.0.
  - **The worktree moved** to `/Volumes/4TB Depo/development/K/kozmos-design-system-pointr`: copied
    without `node_modules` (reinstalled from the pnpm store), git re-pointed with
    `git worktree repair`, the old copy's `.git` renamed to `.git.moved-2026-09-22` with a
    `MOVED-2026-09-22.txt` note, so nothing commits through it. The Storybook server on 6012 serves
    the new copy. **Olcay:** re-import the Figma importer plugin from the new path's
    `figma/foundations-importer/manifest.json` before deleting the old folder — Figma loads
    `code.js` from wherever the manifest was imported, so the next plugin build lands only there.
- **Correction: `QAConfig.json` was never lost.** The morning's check (06:44Z) looked for it at
  `apps/PointrPlayground/QAConfig.json`, a path the handoff of the 21st gave wrongly (corrected
  there now). The app bundles `apps/PointrPlayground/Sources/App/Resources/QAConfig.json` (0600, ignored, generated by
  `scripts/prepare-pointr-ios.mjs`), which has stood there since the 19th and moved with the
  worktree. Nothing waits on Olcay for it; the old folder holds a copy until he deletes it.
- **Dated reports keep the old path.** The reports of the 17th to the 20th, and `ds-handoff.md`'s
  log, name `/private/tmp/kozmos-browser-compat.uqPMBD`: they record where the work was done. Read
  it as the new path; the operators' guide and this handoff carry the new one.
- **Commits of the evening:** `e916524` (stepper labels), `42fbe70` (emotion text), `c5ec97c`
  (icons changeset), `a1a9423` (these documents re-pointed), pushed; CI runs on them.
- **The bundle, decided at 17:40 (Olcay): not raised — one file per module, instead of the split.**
  Measured first: as one file, importing `Button` alone cost an app 48.7 KB gzip of Kozmos code,
  of the whole library's 54.5, because neither Rollup nor esbuild can drop the unused components
  inside one module; that is what the 300 KB limit guarded. Built one ES file per module (Rollup
  `preserveModules`), with `package.json`'s `sideEffects` (CSS only) now doing its work: `Button`
  1.14 KB, the median export 1.14 KB, the heaviest (`POIDetailPanel`) 6.15 KB; everything still
  54.6 KB. The top-level code of all 120 modules was read: only pure factories (`forwardRef`,
  `cva`, `createContext`, `createThemePortal`), so nothing is lost when a bundler drops a module.
  Import paths do not change — no Code Connect republish, no site change — so it replaces the
  `@kozmos/react/sdk` split. It is on `claude/react-per-module-build` (worktree
  `/Volumes/4TB Depo/development/K/kozmos-design-system-per-module`), stacked on this branch and
  **not pushed**; it goes to `main` as its own PR after #56. Its analyzer measures what an app
  pays — every public export alone at most 8 KB gzip, `Button` 2 KB, everything 60 KB, the
  stylesheet 30 KB — and fails on the one-file build and without `sideEffects` (both run). The
  published ES output grows from 321 KB to 365 KB (120 files); the UMD file is unchanged.
  `.ai-skills/performance-benchmarks.md`'s budget tables are an early plan, never measured or
  enforced; the file is 394 lines off prettier's format, so it was left for its own change.
- **npm, measured at 17:30.** No `NPM_TOKEN` secret: the repository holds
  `CHROMATIC_PROJECT_TOKEN` and `FIGMA_ACCESS_TOKEN` only. The `@kozmos` scope exists — a personal
  npm account named `kozmos`, with no packages, no organisations and no public details. Olcay
  says the owner should be `vodoco` (the account that holds `pointr-design-system`). **Open, his:**
  whether anyone at Vodo created `kozmos` — then convert it to an organisation owned by `vodoco`;
  if not, npm's dispute process, or a scope he controls (`@kozmos-ds`, `@kozmosui` and
  `@kozmos-design` were free), renamed before the first publish. Add `NPM_TOKEN` only after #56
  merges: with no changeset on `main`, the token alone publishes 0.0.1 (`ds-handoff.md` §4.5).
  Also found: `release.yml` checks out `main`'s head, not the commit CI verified
  (`github.event.workflow_run.head_sha`) — a one-line fix before the first publish. Checked and
  already done: `ThemeProvider` has no default storage key, and `style.css`'s reset is scoped
  (`ds-handoff.md` §6 items 10 and 9). Two native `@scope` blocks remain in `style.css`, so the
  browser range (§6 item 6 below) stands.
- **npm, decided at 17:50 (Olcay): publish as `@kozmos-ds`.** Logged in as `vodoco` (a personal
  account with no organisation until then and one old package, `pointr-design-system`), he created
  the npm organisation `kozmos-ds`; `vodoco` is its only member and owner. **2FA is disabled on
  `vodoco`**: his to turn on, with the organisation's 2FA enforcement, before the first publish.
  The rename is on `claude/npm-scope-kozmos-ds` (worktree
  `/Volumes/4TB Depo/development/K/kozmos-design-system-npm-scope`), stacked on
  `claude/react-per-module-build` (pushed, `fb24774`), local, in three commits: `apps/docs` made private
  (`15993a4`) (it was public, and the first
  `changeset publish` would have published the Storybook app), eighteen files formatted alone (the
  commit hook formats every file a commit touches; the code compiles byte-identical; `63c4d8b`), then
  `@kozmos/` → `@kozmos-ds/` in 247 files and the lockfile (`ad491c2`; fifteen checks green, and
  Code Connect's 131 snippets import `@kozmos-ds/react`). Left as they were: the dated reports
  and the archive (records), and seventeen `.ai-skills` guides and `PROJECT_SCOPE.md`, which a
  rename would reformat — prettier rewrites their malformed nested code fences — so they are a
  docs change of their own. The website (#55) imports `@kozmos/react` and follows after the
  merge. Order: #56, then the per-module PR, then the rename PR; then his `NPM_TOKEN`; then the
  Version Packages PR publishes 0.1.0; then the React Code Connect republish, on his word.
- **GAP-56, the site's finding, fixed in the design system (18:30).** A Button put no space between a
  caller's icon and its label on React and Android; Figma (`itemSpacing` 8, bound) and iOS
  (`HStack(spacing: spacing100)`) keep 8. React: `.kozmos-button` takes `gap-2`, the loader loses
  its `mr-2` — a physical margin that spaced it left-to-right only, so right-to-left it touched
  the label — and the design system's own four compensating `mr-2`s go (RouteSummary,
  SaveLocationCard twice, the POICard story). Android: `ButtonContent` lays the loader and the
  content in a row spaced by `primitivesLayoutSpacing100`, and three compensating 8dp spacers go;
  RouteSummary's and SaveLocationCard's goldens came out pixel-identical, POIDetailPanel's two
  changed as meant (its action icons touched their labels). Tests fail on the old code:
  `test:owned-css` measures both gaps in both directions (and fails on a half-fix that keeps the
  loader's margin), and `theIconKeepsEightFromTheLabel` measures the layout (0.0 before, 8.0
  after). The site then flips its GAP-56 proof to expect 8 and deletes `site-button-icon`,
  `ex-dash-add` and `ex-inbox-prefs` in the same change, or those buttons show 16px.
- **Found on the way, open:** Paparazzi cannot render a loading KozmosButton — material3 1.1.2's
  indeterminate spinner throws `NoSuchMethodError` (`KeyframesSpecConfig.at`) against
  animation-core 1.6.0, both from BOM 2024.01.00. Whether a device crashes too is unverified (the
  Android playground has never run); a Compose BOM bump is the likely fix, with every golden
  re-verified.
- **#56's CI at `c5ec97c` is green** — Web (the story audit, and steps 40–47 on CI for the first
  time), iOS and Android; `analyze-bundle` is red as decided (the per-module PR replaces it).

## 0. In one screen

- **Where.** Worktree `/Volumes/4TB Depo/development/K/kozmos-design-system-pointr`, branch
  `claude/pointr-browse-repairs`, pushed. PR #56 opens it into `main`; PR #55 (the website)
  stacks on it. Nothing is merged.
- **Built.** Every ruling Olcay has given, on React, SwiftUI and Compose, each change with a test
  that fails on the old code (§2, §3). The Figma importer's build `b3257790f931` waits for his run.
- **Found this afternoon in the live Figma file (§5).** At 09:47:15Z a Curated Icons → Update
  drew all 56 Pointr icon sources anew and added the 8 taxonomy icons; no set was updated after
  it. 2,325 of the library's 2,415 icons, in 52 sets, now draw unbound black, because their tints
  were laid through the old sources. **Olcay's run grows**: Curated Icons → Update, then Update
  All Core, then Update All Product / SDK (§7 item 1), not only the eleven sets named before.
- **Found and fixed this afternoon.** CI's step "Enforce SDK Assembly & Accessibility
  Governance" would have failed as soon as the story audit passed: `STATUS.md` was stale since
  the branch's new components. It is regenerated in this handoff's commits, and the check no
  longer reads Compose's `Motion` folder as a component. The other steps after the audit
  pass locally (§4).
- **Olcay's, in order (§6):** the Figma run, then the library publish; the POI sheet's "Open"
  colour (through the site session); the bundle budget; Chromatic's first baselines; merging #56,
  then retargeting #55 by hand; the `@scope` browser policy and the npm first release; the
  stepper's pending colours; native releases.
- **Next for a session (§7, §13):** ask whether the Figma run has happened and verify it with
  `scripts/figma-rest/`; take CI to green with the site session; then the open items.

## 1. Read this first

### What this is

The Kozmos design system (React `@kozmos/react`, the SwiftUI package `Kozmos`, Compose
`com.kozmos`, DTCG tokens in `packages/tokens`, product contracts) seen through two apps: the
Pointr QA app (`apps/PointrPlayground`, PointrKit 10.3.0, the Boston Logan Design-QA venue, live
SDK data) and the fixture playground (`apps/Playground.swiftpm`). The reference for how screens
look is the live prototype `https://agentic-search-zeta.vercel.app`, driven and measured, never
eyeballed. The Figma library is the Kozmos Core Library, file `Yj4O8p6Y9h2Sa9zJVoAiVY`, drawn by
the local importer plugin `figma/foundations-importer`.

### Olcay's standing directions, verbatim where it matters

- The standing request, repeated through the 21st and 22nd: _"Once more, please analyse
  extensively to see if anything is overlooked, missed, mis-implemented or could have done
  better. No hacks - no cheats - do it propertly and perfectly. Otherwise please proceed with
  your recommendation. Provide me everything I'd need if I need to make changes myself. But
  remember you have CLI access. I don't want to miss anything"_
- _"Focus on the design system and what is missing — not on making the app most functional."_
- An adversarial self-audit before "done"; a green test proves nothing unless it names what you
  added and failed first on the old code.
- Measure, don't eyeball: DOM, bundle, pixels, recordings split into frames, REST reads of the
  live file.
- On the 22nd: _"go with your recommendations on the open ones too"_ (built as `4175fce`), then
  _"go with your recommendations on the decisions too / also when do you think we'll be ready for
  publish."_ (built as `022f961`; the answer is in §6), then _"Write an extensive hand off
  document so that we don't lose scope, context, key information or todo. I'll then continue in a
  new chat session"_ (this document).
- The last word of the 21st on the SDK's map still holds: _"I only wanted to render simple
  markers with icons that shows the selected pre-defined quick search items. No need to alter
  fill layers."_

### Rules in force

Verbatim from the 21st, with the Code Connect clause brought up to date:

> Nothing merged; nothing published but Code Connect, on Olcay's word (React and SwiftUI late on
> the 21st, Compose republished on the evening of the 22nd; `docs/figma-drift-2026-09-21.md`
> §9); no Cloud content edits; never print, copy or commit `QAConfig.json`, licence keys or
> tokens (the main checkout's `.env` holds a Figma token — never print it); never use the vendor
> sample's embedded GitHub token; SDK models and parsing stay in the host, no JavaScript
> evaluation in native code, never traverse the SDK's private UIKit subviews; preserve handoff
> docs before any `/tmp` cleanup; never delete project directories; a metadata row at most three
> cells; never label fixture or simulator wayfinding as live navigation. Git: stage by file,
> never `git add -A` or a directory, never bare `git stash`; commit messages end with the
> attribution the session's system reminder gives (on the 22nd,
> `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`); ask before a push to a new branch
> (pushes to this branch were authorised and are the practice).

And, from the same days:

- Figma: **never Rebuild** in the plugin (it changes the node IDs Code Connect pins); never run
  Apply Text Styles; the library publish is Olcay's action, after a clean audit and verify; Code
  Connect is published again only on his word, from this branch or from `main` after the merge.
- Export only `FIGMA_ACCESS_TOKEN`, through `scripts/figma-rest/with-figma-token.sh`, and never
  print it. Never call the Dev Mode MCP's write tools.
- Opening or merging a PR needs his word (#55 and #56 were opened by the site session).
- Never `git worktree prune` while `git worktree list` reads "prunable". The worktree moved off
  `/private/tmp` on his word on the 22nd (§0a); the old copy is his to delete.
- Temporary files go in the session's scratchpad, not `/tmp`.
- Every Bash call starts in the main checkout (`/Volumes/4TB Depo/development/K/kozmos-design-system-dev`),
  whatever the last call `cd`ed to: give worktree paths absolutely, or `cd` on the same line.

### The other session, and how the two work together

The website session — its title is **"Design system landing page"**; find it with `ListAgents` and
write to it with `SendMessage` — owns `apps/site` on branch `claude/kozmos-site` (worktree
`/Volumes/4TB Depo/development/K/kozmos-design-system-site`) and PR #55, which stacks on this
branch. It builds the site from Kozmos alone and writes what the design system lacks into
`apps/site/DS-HANDOFF.md` (GAP-01…53); it never edits `packages/`. It opened #55 and #56 on the
22nd. Agreed by message:

- Both sessions push to `claude/pointr-browse-repairs`: **tell it before pushing**, name the
  files, fetch and rebase first. Its `3bedd72` (the map sheet settles in place; `test:adaptive`)
  must survive any rebase.
- This session took the five Android goldens that failed only on Linux, and the two story-audit
  overflows (done: `4df611b`, `3610636`). The site session took `analyze-bundle` and Lighthouse
  (Lighthouse fixed in `d83feb4`) and stays out of `packages/android`.
- Neither session raises the bundle budget; that is Olcay's decision.
- The POI sheet's "Open" contrast goes to Olcay **through the site session**; this session does
  not touch it. The site session merges this branch into #55 after that ruling.

### Exact working state

- **Worktree:** `/Volumes/4TB Depo/development/K/kozmos-design-system-pointr`, a git worktree of
  the main checkout `/Volumes/4TB Depo/development/K/kozmos-design-system-dev`, which stays on
  `main` and is shared with other sessions.
- **Branch:** `claude/pointr-browse-repairs`, pushed; `d767f9d` before this handoff's commits.
  The last change commits are `022f961` (the five decisions), `4df611b` (the Paparazzi
  tolerance) and `3610636` (the two overflows).
- **PR #56:** the branch into `main`, open and mergeable; its CI is §4.
- **PR #55:** `claude/kozmos-site` into this branch, open, head `d917091`, which does not yet
  carry `3610636`.
- **Plugin build:** **`b3257790f931`** (`PLUGIN_BUILD` in `figma/foundations-importer/code.js`),
  never run in Figma.
- **The live file:** last written 09:47:15Z on the 22nd. Its 97 sets carry `01f3be6891dc` (66
  Core sets), `dd9f78a05cc0` (Timeline and the four Tree sets) and `7241e855b611` (the 26 Product / SDK
  sets). The icon baseline for the run is `docs/figma-icons-2026-09-22-0947Z.json`.
- **Tree:** clean after this handoff's commits.
- **Ignored files in the worktree:** `apps/PointrPlayground/.local/` (`PointrKit.xcframework`, the
  SDK, whose `Modules/…swiftinterface` and `Headers/` are the API reference; `MapLibre.xcframework`;
  `Info.plist`), `apps/PointrPlayground/Sources/App/Resources/QAConfig.json` (0600) and the
  generated `KozmosPointrQA.xcodeproj`. Ask before any cleanup; preserve first. Never recreate,
  print or commit `QAConfig.json` (it was never lost — §0a).
- **Simulators:** iPhone 17 Pro `51937B59-CEAE-4BC7-BC34-FEB17E28FAE7` (iOS 26.5, English
  since the 21st); iPad Pro 11 `1CB35135-48B2-407B-8515-C8C6EFC1D963` (the QA app's unit tests);
  iPhone 16 on iOS 18.4 (package tests, button baselines).
- **Servers left running:** `127.0.0.1:6012`, Python serving this worktree's
  `apps/docs/storybook-static` (the guide's commands use it); `127.0.0.1:6006`, a Storybook dev
  server from **another** worktree, `/private/tmp/kozmos-owned-css-verify.dV1etM` (§9).

Gates at the last full run (after `4175fce`, `022f961` and `3610636`): iOS 150 tests on iOS 26.5,
152 on 18.4, 91 on macOS; React 552 unit tests and 58 component tests on Chromium and WebKit (one
expected WebKit failure, `@scope`); Android 70 Paparazzi goldens, green on Linux CI too; the
painter check 356 assertions; `tokens:theme:check`, `tokens:copies:check`, `tokens:border:check`
and every other repository check; CI's Web job at `d767f9d` passes its steps 1–38.

## 2. The 22nd, in order: what was asked, what was done

Twenty-four commits on the branch are dated the 22nd before this handoff's three; three of them
are the site session's (`7dec6c0`, `3bedd72`, `d83feb4`). Each ruling is recorded whole in `docs/claude-code-handoff-2026-09-21.md`
§7 and, for Figma, in `docs/figma-drift-2026-09-21.md` §9 (its sections run in time order).

1. **The overnight cleanup** (`42a35fc`, 07:47). A `/private/tmp` cleanup at midnight took the
   worktree's `.git` file and 1,385 tracked files. Relinked by writing the `gitdir:` line back and
   `git restore .`. (It was also said to have taken `QAConfig.json`; it had not — §0a.)
2. **The audit of 06:58Z and its REST read-back** (`fc1adcc`, docs `16f7ffc`): CategoryTile's
   label takes two lines in the live runtime; the Product / SDK run puts CategoryTile before
   BrowseCategoriesPanel; ratios below a threshold round down; Dialog's and Drawer's footer
   actions take their content's width; a slot's fit leaves its stroke room. Build
   `7241e855b611`, which Olcay's Update All Product / SDK ran at 08:10Z.
3. **The three decisions of the morning, as recommended** (`1221183`, `b6830f4`, docs `e0a040a`):
   the taxonomy's eight quick-access symbols on the browse tiles, vendored into `packages/icons`
   (`pnpm icons:taxonomy:build`) and drawn on the Icons page as `Icon / taxonomy-*`;
   DynamicIsland drawn as React draws it, its Minimal slot an icon; the panel's title hidden (its
   layer kept for Code Connect); Curated Icons → Update keeping every icon's source. With them
   `36d04e8`: the typography rule had read `KozmosTypography.font(.callout)` as a bare style since
   `a38e24a`. Builds `0b64d5867d71`, then `6fdc2ffbc635`.
4. **The four rulings, as recommended** (`21f508b`, docs `a086a16`, `504055f`): SwiftUI's island
   at React's geometry (240×44 capsule, 56 circle); the browse grid's rows 12 apart on every
   platform (the prototype, re-measured: `row-gap` 12px, `column-gap` 8px); the panel's rule and
   empty edge in the border role on SwiftUI and Compose; a symbol swapped into a tile by hand
   arrives black, documented. Build `c35a625c8160`.
5. **Every edge in its role, on his word** (`6fd94f9`, docs `c2193a5`): 94 native edges out of
   their roles moved (42 in 26 SwiftUI files, 52 in 30 Compose ones): container edges and
   dividers on `Semantics.Border.Subtle`, control boundaries on `Border.Input`; a bare React
   `border` draws Subtle instead of Tailwind's gray-200; Compose reads both through
   `KozmosThemeTokens`. Named marks keep one primitive each (the stepper's pending ring, the colour
   handle's ring, the pin's halo, a later waypoint's ring, the save button's hairline).
   `pnpm tokens:border:check` holds it and failed 95 times on the tree before.
6. **The five left open, as recommended** (`4175fce`, docs `7d88690`): Compose follows the theme
   (a generated `KozmosThemeTokens` for all 453 colours; 272 component reads moved onto it); iOS's
   colour parser reads alpha colours (the scrim had drawn nothing on Dialog and Drawer); Backdrop
   on the scrim role on both natives; SwiftUI's island scopes its own scheme; the token copies
   held to the build; WayfindingInputRow on both natives as React's row; RoutingInputGroup at the
   control radius with React's washed 40 fields; `surface` on the native FeedbackCard,
   RoutingInputGroup and SaveLocationCard; the steppers at the plugin's rings.
7. **The five decisions of the evening, as recommended** (`022f961`, docs `3a310a4`, `7622daf`):
   the four map cards on the panel radius 24; the island black with its content in the dark theme
   everywhere; the native comment box washed through one internal `KozmosWashedField`; the
   stepper's accent React's primary pair (theme/600, foreground/1000 on it) everywhere, Figma
   included; Compose Code Connect republished (111 docs). Build **`b3257790f931`**.
8. **PR #56's CI** (12:46–13:35): `da0422d` uploads Paparazzi's failure images; the site
   session's `7dec6c0` makes a failing Android test print its difference, `3bedd72` repairs
   `test:adaptive` and `d83feb4` points Lighthouse at the public POI card; `4df611b` gives the
   three Paparazzi classes that meet the renderers' rounding a calibrated tolerance; `3610636`
   fits the AI button's turning ring and the stepper's labels in a 320 row; `d767f9d` documents
   the story audit's first run.
9. **Asked: when is it ready to publish** — answered in §6 ("Publishing").
10. **This handoff** (the afternoon): the live Figma file read again (§5: the icon tints); CI's
    steps after the story audit run locally (§4: `STATUS.md`); the session's Figma read tools
    kept in `scripts/figma-rest/`; the documents brought up to date.

## 3. The design system after the 22nd

### Tokens and the theme pipeline

- **Compose reads every colour through `KozmosThemeTokens`**, generated by `pnpm tokens:build`
  (`packages/tokens/build.mjs`, format `android-compose/themed`) for the 453 colours of both
  palettes: `@Composable @ReadOnlyComposable` getters, each token's `$description` as its KDoc,
  and `KozmosThemeTokens.isDark` for what one colour cannot carry (the routing field's wash is
  black at 5 % light, white at 10 % dark). `KozmosColors` and `KozmosColorsDark` are one theme
  each, for tests. `pnpm tokens:theme:check` (`scripts/check-theme-parity.mjs`) holds the
  components to it; a Code Connect file may read `KozmosColors` only for a colour both themes
  share (72 category reads).
- **One colour converter for both natives**: `cssColorToArgb` in the build feeds the Compose and
  Swift formats (`swiftColorHex`); Swift's `UIColor(hex:)` reads `#AARRGGBB`, alpha first; the
  build converts CSS's `#RRGGBBAA` and `rgba()` and throws on a value it cannot write.
- **The packages' token copies follow the build**: `pnpm tokens:native:copy` copies all 15
  native outputs, `pnpm tokens:copies:check` fails while any differs; both run in CI, and the
  Figma token sync (`.github/workflows/figma-tokens.yml`) copies and checks.
- **Edges**: `pnpm tokens:border:check` (`scripts/check-border-parity.mjs`, with
  `scripts/lib/native-edges.mjs` following each edge call across lines).

### A subtree in its own theme, per platform

- React: nest `<ThemeProvider theme="dark">`; its root is `display: contents`, and the dark
  tokens are scoped to `[data-kozmos-root][data-theme=dark]`.
- SwiftUI: `.environment(\.colorScheme, .dark)`. Never `.preferredColorScheme` below the theme
  provider: it sets the hosting controller's `overrideUserInterfaceStyle`, the whole window.
- Compose: `CompositionLocalProvider(LocalKozmosUseDarkTokens provides true)`.
- Figma: `applyKozmosDarkMode(node, stats)` in the importer sets the Dark mode of every
  "Kozmos …" variable collection on the node.

### Parts changed on the 22nd

- **Every native edge** in the border roles (`6fd94f9`); the empty and status boxes dashed on
  every platform; Compose's routing fields washed, not outlined.
- **DynamicIsland**: React's geometry on SwiftUI (`21f508b`); its own scheme, not the window's
  (`4175fce`); black with its content in the dark theme on all three and in Figma (`022f961`).
- **BrowseCategoriesPanel / CategoryTile**: the taxonomy symbols, rows 12 apart, the title
  hidden, the rule and empty edge in the border role (`1221183`, `21f508b`).
- **WayfindingInputRow** (natives): React's rail and two borderless raised fields in the opaque
  `background/50`, the swap floating at their end; React's own rail ring fixed (`4175fce`).
- **RoutingInputGroup**: the control radius 16, React's 40-high washed fields, the standard focus
  ring, React's rail and actions on both natives (`4175fce`); the card on the panel radius 24
  (`022f961`).
- **FeedbackCard, SaveLocationCard, RouteSummary**: `surface` on the natives (`4175fce`); the
  panel radius 24 everywhere (`022f961`); FeedbackCard's comment box washed on the natives through
  `KozmosWashedField` (internal; `Input/WashedField.swift` and `Input/WashedField.kt`), which the
  route points share (`022f961`).
- **Stepper**: 32 circles; ring 2 for the current and completed steps, 1 for pending
  (`4175fce`); the accent React's primary pair on all three and in Figma, a completed step's ring
  its fill's colour, the pending connector `Border/Subtle` at full strength (`022f961`); on the
  web, connectors 8 a side below `sm` and a label that truncates (`3610636`).
- **Backdrop** (natives): the scrim role (`4175fce`).
- **CategoryField** (Compose): `tint: KozmosCategoryTint? = null`, resolved to the theme's tint;
  Code Connect maps its Theme to null, as React and the other sets do (`022f961`).
- **AISearchButton** (web): the button clips its turning ring (`overflow-clip`), whose layout box
  is the rotated square (`3610636`).

### The Figma importer

- Builds on the 22nd: `7241e855b611` (`fc1adcc`) → `0b64d5867d71` (`1221183`) →
  `6fdc2ffbc635` (`b6830f4`) → `c35a625c8160` (`21f508b`) → **`b3257790f931`** (`022f961`).
  Of these builds, only `7241e855b611` has updated sets in the live file (08:10Z). A Curated Icons → Update ran at
  09:47:15Z on one of the builds from `0b64d5867d71` on — they alone draw the taxonomy icons it
  added — and their icon-sync code is identical to `b3257790f931`'s (§5).
- In `b3257790f931`: the four map cards use `KOZMOS_RADIUS.panel` with slots at
  `parentRadius: KOZMOS_RADIUS.panel`; the island takes `applyKozmosDarkMode` and binds
  `Surface/0` (fallback `#000000`); the stepper binds `Colors/theme/600`, rings a completed step
  in its fill's colour, and draws its connector at opacity 1.
- `pnpm figma:painters:check`: 356 assertions (nine fail on `c35a625c8160`). The harness
  (`scripts/lib/figma-plugin-harness.mjs`) takes `createFigmaMock({ pages, library, collections })`,
  and its nodes keep explicit variable modes.
- `scripts/check-raw-values.mjs`: the radius baseline is 2 / 1.

### Tests added on the 22nd (each failed on the old code)

- iOS (`packages/ios/Tests/KozmosTests`): `KozmosThemeScopeTests`, `KozmosColorAlphaTests`,
  `KozmosWayfindingInputRowTests`, `KozmosRoutingInputGroupTests`, `KozmosCardSurfaceTests`,
  `KozmosStepperTests` (with the accent test), `KozmosWashedFieldTests`, and the island and panel
  tests of the morning.
- Compose Paparazzi: `theme/KozmosThemeTokensPaparazziTest` (with its Night test),
  `theme/KozmosDarkModePaparazziTest`, the wayfinding card's, the routing group's,
  `surface/KozmosCardSurfacePaparazziTest`, and `KozmosEdgeRolesPaparazziTest`;
  `PaparazziTolerance.kt` holds the calibrated tolerance.
- React e2e (`packages/react/e2e`): `WayfindingInputRow.*`, `FieldFocus.*`, `PanelSurfaces.*`,
  `NarrowRows.*`, and the stepper cases in `EdgeRoles.*`.
- Figma: three new sections in `scripts/check-figma-painters.mjs`.

### CI, as changed on the 22nd

- `.github/workflows/ci.yml`: the "Verify Theme Parity" and "Verify Native Token Copies Match
  the Build" steps; "Upload Paparazzi Failures" (`if: failure()`, artifact `paparazzi-failures`).
- `PaparazziTolerance.kt`: `CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE` 0.0001 % for
  `KozmosSearchSheetPaparazziTest`, `KozmosCardSurfacePaparazziTest` and
  `KozmosDarkModePaparazziTest`. Paparazzi 1.3.5's differ (OffByTwo) counts only pixels more than
  two levels off; CI's Linux drew 2 to 20 such pixels (0.000002–0.000028 %) where the smallest
  real change measured is 0.087 %. Read the delta images before raising it.

## 4. CI, measured on the afternoon of the 22nd

**PR #56 at `d767f9d`** (read with `gh pr checks 56` and the jobs' logs):

- **Passing:** Android Build (every golden, on Linux), iOS Build, Lighthouse, Run Chromatic,
  Storybook Publish.
- **Web Build & Test — fails at step 39 only**, "Audit Every React Story and Keyboard Scroll
  Interaction": `product-sdk-poidetailpanel--sheet`, light theme, at 320 and at 1280,
  `color-contrast` — the POI sheet's "Open" at 3.95:1 on its `background/100` grey. Olcay's
  colour ruling, brought to him by the site session. The audit covers 1,104 cases (276 stories,
  two themes, 320 and 1280); every overflow is fixed.
- **Web steps 40–47 have never run on CI** (they are skipped after a failure). Run locally on
  `d767f9d` this afternoon, exactly as CI runs them: "Verify Public Documentation" (docs and the
  audit fixes on three browsers), "Verify SDK POI Reference Examples", "Verify SDK POI Reference
  Screens" (66 cases per browser), the Vue harness smoke test and "Verify Proof-of-Output" all
  pass. **"Enforce SDK Assembly & Accessibility Governance" failed**: `STATUS.md` was out of date,
  since the branch added AISearchButton, CategoryField, Itinerary, ManoeuvreCard,
  RouteProgressRail and Surface, and the check also read Compose's `components/Motion` folder
  (`Transitions.kt`, `KozmosTransitions`) as a component. Fixed in this handoff's commits:
  `scripts/skills/check-completion.ts` skips folders that hold no component
  (`NON_COMPONENT_DIRECTORIES`), and `STATUS.md` is regenerated — 104 components, Code Connect on
  95 of 99 (Itinerary, ManoeuvreCard, RouteProgressRail and Surface have no Figma set yet), and
  Surface without an iOS entry because iOS keeps it at `Sources/KozmosSurface.swift` rather than
  `Sources/Components/Surface/` (§7 item 6). `--check` passes.
- **analyze-bundle — fails:** raw 321.02 KB against the 300 KB budget, gzip 70.79 KB against
  70.00. Olcay's decision (§6).
- **UI Tests (Chromatic) — pending:** Chromatic's build 269 "passed" with the message _"Welcome to
  Chromatic! We found 110 components with 276 stories and captured 276 snapshots"_ and asks to
  _"continue setup"_: the project has no accepted baselines, so the check waits until Olcay
  accepts the 276 snapshots in Chromatic. (The handoff of the 21st called these "276 changes";
  they are first snapshots.)

**PR #55 at `d917091`:** iOS and Android pass; Web fails at step 39 with the same two contrast
cases and four overflows (the AI button's ring at 320 in both themes, the stepper's interactive
story at 320 in both) that `3610636` fixed on this branch after `d917091`. It clears when the
site session merges the branch in again.

## 5. The live Figma file, measured on the afternoon of the 22nd

Read over REST with the tools in `scripts/figma-rest/` (read-only; the token is never printed).

- **State:** last written **09:47:15Z**. No set carries `c35a625c8160` or `b3257790f931`: 66
  Core sets on `01f3be6891dc`, Timeline and the four Tree sets on `dd9f78a05cc0`, the 26 Product / SDK sets on
  `7241e855b611`. CategoryField is `1933:9257`, AISearchButton `1933:9270`; no duplicate names.
- **What happened at 09:47:15Z:** a Curated Icons → Update. The Icons page (`44:1698`) went from
  56 icon components to 64: the eight `Icon / taxonomy-*` were added (ids `1968:13974` on), and
  **every one of the 56 Pointr Sources was drawn again under a new id** — `Icon / activity`'s
  source `1923:8834` → `1968:14005`, `Icon / bus`'s `1923:8924` → `1968:14023`. The icon
  components kept their ids. Both states are in `docs/`: `figma-icons-2026-09-22-0810Z.json`
  (read at 08:56Z) and `figma-icons-2026-09-22-0947Z.json`. Only a build from `0b64d5867d71` on
  draws the taxonomy icons, and every one of them carries the sync that keeps sources — its code
  is identical from `0b64d5867d71` to `b3257790f931` (`syncIconSourceLibrary`,
  `keepIconSourceLayer`, `mainComponentKey`, `syncKozmosIconSourceComponent`, and the 56 component
  keys). It kept none. Why is not known: the token cannot read the file's version history (403)
  and the run's report was not pasted. One clue: the drift doc's override path
  `I1965:11750;1923:8924;1007:11762` puts the old source's drawing in the `1007:` id range, where
  today's sources are instances of the remote components `44:…`. All 56 of today's match the
  stored `source-component-key`, so a run on `b3257790f931` should keep all 64 sources (the eight
  taxonomy artworks' stamps match the build too).
- **What it did to the library:** an icon's tint is an override laid through its source's id, so
  drawing the source again orphans it. `scripts/figma-rest/icon-tints.mjs` reads every icon in
  every set: **2,415 icons in 57 sets; 90 tinted; 2,325 untinted in 52 sets**, each an importer
  icon slot (it names its `foreground-token`) painting unbound `#000000`. Tinted: Button (14),
  IconButton (42), FloatingActionButton (27) and Badge (6), which the sync repaints itself, and
  WayfindingCard's one. Untinted include the three Tree item sets (1,044), NavigationItem (150),
  MultiSelect and ColorPicker (144 each), the pickers and inputs, Chip, Tag, Alert, Toast, Dialog,
  Drawer, Stepper, and all fifteen Product / SDK sets that hold an icon (DirectionStep, FloorSelector,
  CategoryTile, BrowseCategoriesPanel, CategoryField, AISearchButton, POIDetailPanel,
  POIMediaGallery, RoutePreviewPanel, RouteSummary, RoutingInputGroup, SaveLocationCard,
  FeedbackCard, MapControlsGroup, MapControlButton). In the light
  theme black reads near the foreground; in dark mode, and wherever an icon should wear a status,
  category or on-primary colour, it is wrong.
- **Why nothing caught it:** Audit Library never compares an icon slot's paint with its token —
  `iconSlotPaintIsExpected` runs only when an Update re-syncs a slot — and `pnpm figma:verify`
  and CI do not read icon paints. `icon-tints.mjs` is now the check (exit 1 while any icon is
  untinted); §7 item 3 is making it part of the audit and `figma:verify`.
- **The consequence for the run:** an Update re-tints every slot whose paint is not its token
  (`syncIconSlotInstance`), so after Curated Icons → Update, **Update All Core and Update All
  Product / SDK** bring the 52 sets back; updating only the eleven sets named on the evening of
  the 22nd would leave 42 sets black (DynamicIsland, the eleventh, holds no icon). What else the
  Updates draw differently, replayed this afternoon (`scripts/figma-rest/replay-diff.mjs`, each
  live build against `b3257790f931`): of the 41 Core sets the harness reaches, none; of the 26
  Product / SDK sets, six —
  BrowseCategoriesPanel, RouteSummary, RoutingInputGroup, SaveLocationCard, DynamicIsland and
  FeedbackCard, the decisions' own. Stepper, Dialog and Drawer paint their own variants, which the
  replay cannot reach, and change as the decisions and `fc1adcc` meant. The other sets it cannot
  reach are updated for their icons; the audit and `figma:verify` after the run are the check.

## 6. Decisions still Olcay's

1. **The Figma run, then the library publish** — his actions; the steps are §7 item 1.
2. **The POI sheet's "Open"** — the one story-audit failure left: `text-success`
   (`emotional-success-800`, `#197F4C`) at 12px semibold reads 3.95:1 on the sheet's
   `background/100`. It is not one label. Measured on the 22nd, four of the five emotion text
   tokens fail on the grey surfaces in the light theme — success, alert, informative and danger
   read 3.59–4.09:1 on `background/100`, and all but danger stay under 4.5 on `background/50` —
   because they were calibrated on white only; every dark value passes. **Recommended:** one step
   darker in the light theme, which passes on all three neutral backgrounds in both themes —
   success and alert 800 → 900 (5.59 and 5.89 on the grey), informative 700 → 800 (5.43), danger
   600 → 700 (5.47); themed passes as it is — with Tailwind's status colours read from the
   semantic text tokens (today each reads its primitive step directly) and
   `scripts/check-token-contrast.mjs` holding every emotion's text on `background/0`, `/50` and
   `/100`. The narrow alternative is the "Open" alone at `success-900`. (The prototype's own green,
   `#23B26B`, reads 2.74:1 on white.) The site session brings the ruling to him.
3. **The bundle budget** — 321.02 KB raw against 300, gzip 70.79 against 70, grown by real
   features (the adaptive shell, the POI anatomy, the navigation parts). Recommended: subpath
   exports for the Product / SDK layer before the first npm release, while the import paths are
   still free to change; raising the budget alone makes every consumer carry the SDK parts. The
   check measures `dist/kozmos-react.mjs`, the whole library in one file — an app that imports a
   few parts through a bundler pays less, since the package declares its side effects — so
   measure the split first: build a core entry and an SDK entry and read both. Neither session
   raises it.
4. **Chromatic's first baselines** — accept the 276 snapshots of build 269 in Chromatic (the
   project's setup was never finished), or say which to reject.
5. **Merging #56** — his word. Then #55: GitHub does not retarget a stacked PR while its base
   branch exists, so retarget #55 to `main` by hand before merging it, or it lands in the old
   branch (memory `kozmos-stacked-pr-runs-only-ci`).
6. **The browser range for `@scope`** — WebKit before Safari 26.4 drops `@scope` rules on inputs
   (`docs/browser-compatibility-2026-09-17.md`; `WayfindingInputRow.spec.tsx` pins it with
   `test.fail`). The 17th's recommendation stands: ask Pointr for its minimum Safari / iOS and
   Android WebView / Chrome versions; if they include any Safari before 26.4 — every iPhone not
   on iOS 26.4 or later — finish moving the components off `@scope`
   (`docs/component-owned-css-2026-09-17.md` is the migration) before 0.1.0. A modern-only range
   is the fast path only if Pointr's hosts guarantee current engines.
7. **The npm first release** — claim the `@kozmos` scope; a minor changeset per package for 0.1.0
   for the packages that lack one — the eleven pending changesets bump `@kozmos/react` (two minors,
   nine patches) and `@kozmos/product-contracts` (three minors), so both reach 0.1.0, while
   `@kozmos/tokens` and `@kozmos/icons` have none; the four public packages are at 0.0.1 and npm
   answers 404 for them; recheck the published types; add `NPM_TOKEN` (the release workflow
   skips publishing without it). Mechanics: `docs/ds-handoff.md` §4.5.
8. **The stepper's pending number and label colours** — they differ four ways (React muted,
   Figma the ink, SwiftUI and Compose each their own). A small ruling.
9. **Native releases** — none exist: no `maven-publish`, no tags for SwiftPM. SwiftPM installs a
   package from a repository's root `Package.swift`, and this one is in `packages/ios`, so a Swift
   release needs a root manifest or a mirror repository; Compose needs `maven-publish` (GitHub
   Packages is the simplest channel). Recommended after npm.
10. **Two tasks offered as separate sessions** (chips in the desktop app): `task_5764ffc8` — fills
    fixed across themes (theme/500) under inks that flip, about 3.7:1 in the dark on both natives;
    `task_063ad520` — a Compose glass card shows its elevation shadow through the tint, and iOS
    may. They replace `task_4270cdfe` and `task_d0f28ad7`, whose prompts sent a new session into
    this worktree and branch, and, since the move, `task_66e62865` and `task_92e3c39c`, which fenced
    off only the old path; the new ones work in their own worktree and branch, from `main` once
    #56 has merged (from this branch before). Recommended: start both after the merge.
11. **The AI companion** (carried): the device floor (iOS 26 on Apple Intelligence-capable
    iPhones), Apple Intelligence on in his Mac's System Settings for the simulators, and the
    companion surface the design system lacks (`docs/pointr-prototype-ai-companion-2026-09-21.md`).
12. **The worktree** moved on the 22nd, on his word, from `/private/tmp` (which a cleanup emptied
    once) to `/Volumes/4TB Depo/development/K/kozmos-design-system-pointr` (§0a), with the ignored SDK
    frameworks and `QAConfig.json`; the old copy is his to delete.

**Publishing, as answered on the 22nd.** The Figma library can be published once his run is
clean (§7 item 1) — now including the two Update Alls. npm is blocked, in order, by: the bundle
decision; Chromatic's baselines; CI green and the merge; the `@scope` range; the first-release
mechanics. About two to three working days if he chooses a modern-only range, one to two weeks if
`@scope` has to leave the inputs first. The native packages have no release path yet.

## 7. Open, in order

### 1. The run in Figma with build `b3257790f931` (Olcay's), revised on the 22nd's afternoon

It supersedes the run in `docs/figma-drift-2026-09-21.md` §9's last section (and `c35a625c8160`,
never run). The file is as §5 reads it: the sources drawn anew at 09:47:15Z, 2,325 icons black.

0. **Before**, from the worktree:
   `scripts/figma-rest/with-figma-token.sh node scripts/figma-rest/figma-state.mjs` — the file
   must still read `lastModified 2026-09-22T09:47:15Z`. If it has moved, record the icons again
   (`icons-baseline.mjs` to a new file) and compare against that instead.
1. Relaunch the plugin; its header must read **Build b3257790f931**.
2. **Curated Icons → Update.** Expected under Show Details: `planned` 64, `imported` 56, `drawn`
   8, `created` 0, `refreshed` 64, **`sourcesKept` 64, `sourcesReplaced` 0**, `failed` 0, and no
   warning that a source was drawn anew. It repaints the Button, IconButton,
   FloatingActionButton and Badge icon slots, as it always has. **If `sourcesReplaced` is above 0,
   paste the report**: the keep has failed in the live runtime twice then, which is a plugin bug
   to fix; the Updates below re-tint through whatever sources exist, so the run can go on.
3. **Update All Core** (never Rebuild). It re-tints the 37 Core sets' icons (TreeItem, TreeParentItem
   and TreeChildItem hold 1,044 of them; a long set reports each variant and phase and yields since `b1d7702`), and
   it carries Dialog, Drawer and Stepper, owed from the evening's decisions.
4. **Update All Product / SDK** (never Rebuild). It re-tints the fifteen Product / SDK sets and
   carries CategoryTile (before BrowseCategoriesPanel, which writes inside it), CategoryField,
   DynamicIsland, RouteSummary, RoutingInputGroup, SaveLocationCard and FeedbackCard.
5. **Audit Library**, and paste it. Expected: no warning; icons 64 of 64; Surface QA 64 of 64;
   `pluginBuild` `b3257790f931`; the advisories near 54 (the island's content now in the dark
   theme may move the count — paste it and reconcile against the harness).
6. **From the terminal**, in the worktree:
   - `pnpm figma:verify` — every enforced check ok, no overflow, no typed glyph; the build
     coverage should read every set on `b3257790f931`.
   - `pnpm tokens:radius:nesting --strict` — CI's gate on the live file; the four cards at 24 with
     slots at 11 are exact concentrics.
   - `scripts/figma-rest/with-figma-token.sh node scripts/figma-rest/icon-tints.mjs` — **exit 0**,
     every icon tinted.
   - The sources kept: `icons-baseline.mjs` to an "after" file, compared with
     `docs/figma-icons-2026-09-22-0947Z.json` by the one-liner in `scripts/figma-rest/README.md` —
     every source id kept, none new.
   - Over REST: the four cards' radius 24; the island's `explicitVariableModes` naming Dark for
     the Kozmos collections (`modes.mjs`) and its fill bound (`bindings.mjs`) to `Surface/0`'s
     variable; the stepper's indicators bound to `Colors/theme/600`. REST cannot resolve a
     variable id to a name (the token has no variables scope, 403), and a bound paint renders its
     stored colour there, not the variable's: read the ids, then the variables in Figma or with
     `mcp-vars.mjs` while Figma is in front.
   - From the earlier run's list: the panel's eight tiles on their symbols, filled in their
     accents, rows 12 apart, its title hidden; the island at 240×44, 360×160 and 56×56 with its
     slots at 24, 24 and 32; the footers at 158 and 126.
7. **With Figma desktop in front:**
   `pnpm figma:connect:readback -- --node 1933-9257 --node 280-1157 --node 170-1002` — the three
   Compose snippets republished on the 22nd (CategoryField, Pagination, Box). The Dev Mode server
   answers only while Figma is frontmost, and has a daily limit of some 500 calls per account.
8. **Then Olcay publishes the library.** Do not run Apply Text Styles at any point.

### 2. CI to green on #56 (and #55)

- The "Open" ruling (§6.2) → the story audit passes → steps 40–47 run on CI for the first time;
  locally they pass with this handoff's commits.
- `analyze-bundle` waits for §6.3. Chromatic's UI Tests wait for §6.4.
- #55 needs the branch merged in again (the site session's step, after the ruling).
- Coordinate every push with the site session (§1).

### 3. After the run: make the audit see icon tints

The live file lost 2,325 tints and every check passed. Recommended, in this order, after Olcay's
run (a plugin change makes a new build, which would change the run he is about to do):

- An Audit Library rule that reads every icon slot (`kind: icon-slot-instance`) against its
  `foreground-token`, as `iconSlotPaintIsExpected` does, with the painter check asserting it on
  an orphaned slot and on a tinted one.
- The same reading in `pnpm figma:verify` over REST, from `scripts/figma-rest/icon-tints.mjs`.
- Why the 09:47:15Z sync kept none of the 56 sources although its code keeps a source whose main
  component carries the definition's key: reproduce it in the harness with a source whose main
  component is a second remote node (the clue in §5), or ask Olcay for that run's report.

### 4. The Figma remainder (stage doc §5)

`Surface` and its axis on five sets; ManoeuvreCard, Itinerary and RouteProgressRail as sets (they
are also the four Code Connect gaps `STATUS.md` names, with Surface); the shell's phone sheet (a
decision); the 15th–19th drift — Tag's and Counter's `emotion`, MapControlButton's axes, the POI
panel's anatomy; `⇅`.

### 5. The web and Android

The prototype's rubber band on the sheet is not drawn; Firefox ignores `pan-down`. Android on the
`pointr-a16` or `outdoor3d` emulator (`apps/playground-android`) has not been run.

### 6. Small ones found on the 22nd

- iOS keeps Surface at `packages/ios/Sources/KozmosSurface.swift`, where every other component is
  `Sources/Components/<Name>/<Name>.swift`, so `STATUS.md` shows it without an iOS entry. Moving
  it (and its tests' imports) or teaching the check the path are both small; ask which he prefers.
- Compose keeps `KozmosTransitions` in `components/Motion` (package
  `com.kozmos.components.motion`) and iOS beside the components; the check now skips the folder.

### 7. Carried from before

The earlier handoffs' items F (search and selection lifecycle), G (floor correctness) and Pass 4
(`docs/claude-code-handoff-2026-09-19.md`); MAP-595 is parked and complete; a note for Pointr:
the SDK draws no host view on its map, and its two marker palettes differ.

## 8. How to run everything

The operators' guide (`docs/kozmos-pointr-operators-guide-2026-09-20.md` §3–§4) has each command
in full; these are the ones the 22nd used. Run them in the worktree, with absolute paths.

**iOS package** — in `packages/ios`, on the iPhone 17 Pro; the same on `name=iPhone 16,OS=18.4`
without the skip; `swift test` on macOS:

```bash
xcodebuild -scheme Kozmos -destination "platform=iOS Simulator,id=51937B59-CEAE-4BC7-BC34-FEB17E28FAE7" -derivedDataPath /tmp/kozmos-ios-poi-tests CODE_SIGNING_ALLOWED=NO -skip-testing:KozmosTests/KozmosButtonImageSnapshotTests test
```

**QA app** — `xcodegen generate` after adding files; build, install and launch with
`xcrun simctl`; the UI tests on the `KozmosPointrQAUI` scheme with
`TEST_RUNNER_KOZMOS_QA_DESTINATION="Airport Shuttles"` and `TEST_RUNNER_KOZMOS_QA_ORIGIN="Dunkin"`.
It reads the ignored `Sources/App/Resources/QAConfig.json`, which is in place (§1).

**Web** — `pnpm build` (turbo, as CI's "Build Web"), or `pnpm --filter '@kozmos/react...' build`
and `pnpm --filter @kozmos/docs build-storybook`; vitest, eslint and tsc per package; the
component tests with `pnpm --filter @kozmos/react exec playwright test` (Chromium and WebKit);
`pnpm test:adaptive`; `pnpm components:classes:check` (refuses a stale `dist/style.css`);
`pnpm test:owned-css`. Against the served Storybook, **always with `STORYBOOK_URL` set** (§9);
the same for `test:map-sheet`, `test:poi-details`, `test:navigation`, `test:storybook-docs` and
`test:storybook-audit-fixes`:

```bash
STORYBOOK_URL=http://127.0.0.1:6012 ADAPTIVE_BROWSER=webkit pnpm test:search-sheet
```

**The story audit** (CI's step 39) — narrowed with `STORY_FILTER=<part of a story id>`;
`STORY_SCOPE=all` takes every story; `AUDIT_OUTPUT` names the JSON it writes:

```bash
STORYBOOK_URL=http://127.0.0.1:6012 STORY_FILTER=poidetailpanel pnpm test:storybook-audit
```

**CI's later steps, locally** — each `run:` block of `.github/workflows/ci.yml` after step 39,
run with `bash -e` from the worktree, with its ports moved off 6008 and 6009 when they are taken;
on the 22nd they took eight minutes. The governance step alone (`--write` after adding a
component folder):

```bash
pnpm exec tsx scripts/skills/check-completion.ts --check
```

**Android** — in `packages/android`; `testDebugUnitTest` the same way; `recordPaparazziDebug
--tests "*Name*"` re-records one golden, then verify, then measure the PNG:

```bash
ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew --no-daemon -q verifyPaparazziDebug
```

**Tokens** — `pnpm tokens:build`, then `pnpm tokens:native:copy` and `pnpm tokens:copies:check`;
`pnpm tokens:theme:check`, `tokens:border:check`, `tokens:contrast:check`, `tokens:raw:check`,
`tokens:motion:check`; `pnpm components:contract:check`.

**Figma, headless** — `pnpm figma:painters:check` (356), `pnpm figma:plugin:check` (the
sandbox's syntax), `pnpm figma:stamp:check` (the build stamp; the pre-commit hook stamps `code.js`
after prettier).

**Figma, live** — `pnpm figma:verify`, `pnpm tokens:radius:nesting --strict`,
`pnpm figma:connect:readback -- --node …` (with Figma in front), and the tools in
`scripts/figma-rest/` (its README says what each reads), each through the wrapper that exports
only `FIGMA_ACCESS_TOKEN` from the main checkout's `.env`:

```bash
scripts/figma-rest/with-figma-token.sh node scripts/figma-rest/icon-tints.mjs
```

**CI's logs** — `gh pr checks 56` (this `gh` has no `--json`; the fourth tab-separated column is
the job's URL, which ends in its id); then a job's log, or its steps with
`--jq '.steps[] | "\(.number) \(.conclusion) \(.name)"'` on the job itself:

```bash
gh api repos/vodoco/kozmos-design-system-/actions/jobs/<job id>/logs
```

## 9. Traps met on the 22nd

The guide's §9 holds every earlier one, each with its fix. New today:

- **A sync that draws an icon's source again orphans every tint laid through it**, in every set
  but the four it repaints — 2,325 icons at 09:47:15Z — and no audit, verify or CI step reads
  icon paints. `icon-tints.mjs` does. A baseline is evidence about its own `lastModified`: the
  one recorded at 08:10:23Z went stale at 09:47:15Z, and nobody read the file between.
- **A red CI step hides the steps after it.** Steps 40–47 had never run on the branch; one of
  them was red. Run the later steps locally before calling CI "one ruling from green".
- **`STATUS.md` is generated** by `scripts/skills/check-completion.ts` from the component folders
  of the three platforms. A new folder makes it stale and CI's governance step red; a folder
  that holds no component goes in `NON_COMPONENT_DIRECTORIES`.
- **Port 6006 belongs to another worktree's Storybook** (`/private/tmp/kozmos-owned-css-verify.dV1etM`,
  running since the 18th). Eight check scripts default `STORYBOOK_URL` to 6006 (the audit to
  6008), so a run without the variable tests that worktree's code and passes or fails on it. Set
  `STORYBOOK_URL` every time.
- **CI's Linux draws text in DejaVu Sans**, about as wide as Verdana and wider than SF: a row
  that fits on the Mac overflows a 320 page there. Test narrow rows in Verdana
  (`NarrowRows.spec.tsx`). The audit's "overflow" is the document's `scrollWidth` above
  `innerWidth`.
- **A rotated element's layout box is its turned square**: a 48 square at 45° is 68 wide, so an
  absolutely placed turning ring can widen the page for part of every turn. Clip it at its owner.
- **Chromatic's "Build passed" with "Welcome to Chromatic! … continue setup"** means no baselines:
  UI Tests stays pending until someone accepts the snapshots.
- **Linux-only Paparazzi differences:** read the delta images (`paparazzi-failures`) before any
  tolerance; OffByTwo counts only pixels more than two levels off.
- **Figma over REST:** a bound paint renders its stored fallback, not the variable; the token has
  no variables scope and no version-history scope (both 403).
- **The shell:** zsh — an unquoted `$VAR` does not split, `${pipestatus[1]}` not `PIPESTATUS`;
  macOS has no `timeout`; `curl` over HTTPS fails while the session injects a missing
  `SSL_CERT_FILE` (prefix `SSL_CERT_FILE=/etc/ssl/cert.pem`), Node's `fetch` works; every call
  starts in the main checkout.

## 10. Where things are

- **Tokens:** `packages/tokens/src/tokens*.json`; the build `packages/tokens/build.mjs`; generated
  `KozmosThemeTokens.kt` in `packages/android/src/main/java/com/kozmos/tokens/`, the palettes
  `KozmosColors(.kt|Dark.kt|.swift)` and `colors.xml` copied by `tokens:native:copy`
  (`scripts/lib/native-token-copies.mjs`).
- **Components:** React `packages/react/src/components/<Name>/`; SwiftUI
  `packages/ios/Sources/Components/<Name>/` (a few at `Sources/`, such as `KozmosSurface.swift`
  and `KozmosTransitions.swift`); Compose `packages/android/src/main/java/com/kozmos/components/<Name>/`.
  The washed field: `Input/WashedField.swift`, `Input/WashedField.kt`.
- **Tests:** iOS `packages/ios/Tests/KozmosTests/`; Compose Paparazzi under
  `packages/android/src/test/`; React unit tests beside the components, component tests in
  `packages/react/e2e/`.
- **Checks:** `scripts/check-*.mjs` (theme, border, copies, contrast, raw values, radius,
  typography, contract, painters, story audit), `scripts/skills/check-completion.ts`
  (`STATUS.md`), `scripts/verify-figma-library.mjs` (`figma:verify`),
  `scripts/check-nested-radius.mjs`, `scripts/figma-connect-readback.mjs`.
- **Figma:** the importer `figma/foundations-importer/code.js` (`PLUGIN_BUILD` near the top); the
  harness `scripts/lib/figma-plugin-harness.mjs`; the live read tools `scripts/figma-rest/`; the
  icon states `docs/figma-icons-2026-09-22-0810Z.json` and `-0947Z.json`.
- **CI:** `.github/workflows/ci.yml` (Web, iOS, Android, bundle, Lighthouse, Chromatic),
  `figma-tokens.yml`, `release.yml`.

## 11. The documents

- `docs/claude-code-handoff-2026-09-22.md` — this one.
- `docs/claude-code-handoff-2026-09-21.md` — the 20th and 21st: the parts' parameters, the QA app,
  the SDK, and §7's rulings in full.
- `docs/figma-drift-2026-09-21.md` — the Figma record: the inventory, the Tint model, every audit
  and run, every decision's Figma side; §9's sections run in time order, the last is the newest.
- `docs/kozmos-pointr-operators-guide-2026-09-20.md` — every command, gate, procedure and trap.
- `docs/initial-sheet-2026-09-20.md` — the stage report of the sheet and category work.
- `docs/ds-handoff.md` — the running log (its §12 is the latest), §4.5 the npm mechanics.
- `docs/pointr-prototype-*.md` — the prototype, measured (sheet, screen states, AI companion).
- `docs/browser-compatibility-2026-09-17.md` — the `@scope` finding.
- `docs/claude-code-handoff-2026-09-19.md` — items F, G and Pass 4.
- `scripts/figma-rest/README.md` — the live read tools.
- `apps/site/DS-HANDOFF.md` (on `claude/kozmos-site`) — the website session's design-system gaps.

## 12. Memory

The auto-memory index (`MEMORY.md`) points at this document through
`kozmos-session-handoff-pointer`. Most relevant besides: `kozmos-figma-plugin-is-the-path`,
`kozmos-plugin-may-run-stale-code`, `figma-update-resets-nested-overrides`,
`kozmos-never-rebuild-in-plugin`, `figma-painters-measured-headlessly`,
`figma-replay-update-headlessly`, `figma-dev-mode-mcp-readback`, `kozmos-colours-follow-the-theme`,
`paparazzi-window-is-dark`, `swiftui-preferredcolorscheme-is-window-wide`,
`native-shadow-shows-through-translucent-fill`, `kozmos-stacked-pr-runs-only-ci`,
`pointr-branch-first-ci-run`, `bash-cwd-resets-to-main-checkout`, `shell-is-zsh-three-traps`,
`kozmos-shared-checkout-stage-by-file`, `never-delete-project-directories`.

## 13. To resume in a new chat

1. Check the worktree. Expect a clean tree, with this handoff's commits at the top or below the
   site session's:

   ```bash
   cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && git status && git fetch origin && git log --oneline -6 origin/claude/pointr-browse-repairs
   ```

   If the worktree is gone, check the branch out again next to the repository on the 4 TB
   volume (not in `/private/tmp`), and ask Olcay for the ignored SDK frameworks
   (`apps/PointrPlayground/.local/`) and `apps/PointrPlayground/Sources/App/Resources/QAConfig.json`.

2. Read §0, §6 and §7 here; then the guide's §9 before running anything.
3. Ask Olcay whether the Figma run (§7 item 1) has happened. If it has, verify it with §7 item
   1's steps 5–7 and the tools in `scripts/figma-rest/`; if not, give him the steps.
4. Read `ListAgents` for the website session and ask what it has pushed; coordinate before any
   push to the branch.
5. Run one gate per platform before changing anything, so the first red is yours:
   `pnpm figma:painters:check`, the iOS package, Paparazzi verify, vitest.
6. Then §7 item 2 (CI) or whatever Olcay names.
