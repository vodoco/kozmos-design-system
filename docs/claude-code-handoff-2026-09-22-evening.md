# Claude Code handoff — the evening of 2026-09-22: npm as `@kozmos-ds`, one file per module, GAP-56, and the Figma pass under way

For the next Claude Code session. Written at 18:27 BST on the 22nd, when Olcay closed the session to
continue in a new one. **This is the door in.** The day's first handoff,
[claude-code-handoff-2026-09-22.md](claude-code-handoff-2026-09-22.md), keeps the detail of the
morning and afternoon (its §0a is the afternoon's log; its §1 rules and §6 decisions still stand);
[ds-handoff.md](ds-handoff.md) remains the design system's long record. Times of commits are BST;
times read from Figma are UTC (Z).

## 0. In one screen

**Where the work is**

| What                                     | Where                                                                                              | State at 18:27                                                            |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| PR #56, the design system (→ `main`)     | `/Volumes/4TB Depo/development/K/kozmos-design-system-pointr`, `claude/pointr-browse-repairs`      | `418eb0e`, pushed; CI running on it                                       |
| One file per module (after #56)          | `/Volumes/4TB Depo/development/K/kozmos-design-system-per-module`, `claude/react-per-module-build` | `fb24774`, pushed; no PR yet                                              |
| npm scope `@kozmos-ds` (after the above) | `/Volumes/4TB Depo/development/K/kozmos-design-system-npm-scope`, `claude/npm-scope-kozmos-ds`     | `ad491c2`, **local only** — pushing needs Olcay's word                    |
| The main checkout                        | `/Volumes/4TB Depo/development/K/kozmos-design-system-dev`, `main`                                 | shared with other sessions; 8 commits behind `origin/main` — do not touch |
| The website, PR #55 (→ #56's branch)     | `/Volumes/4TB Depo/development/K/kozmos-design-system-site`, `claude/kozmos-site`                  | **ignored, except its gap findings** (Olcay, this evening)                |
| Figma library                            | `Kozmos DS - Core Library`, `Yj4O8p6Y9h2Sa9zJVoAiVY`                                               | Olcay re-tinting set by set: 2,245 of 2,416 icons untinted at 17:23Z      |
| npm                                      | organisation `kozmos-ds`, owner `vodoco` (Olcay)                                                   | nothing published; no `NPM_TOKEN`; 2FA off on `vodoco`                    |

**Merge order, each on Olcay's word:** #56 → the per-module PR → the scope PR → (#54, the approved
release path) → `NPM_TOKEN` → the Version Packages PR, which publishes 0.1.0.

**Waiting on Olcay:** finish the Figma re-tint pass (§4); turn on 2FA on `vodoco` and the
organisation's 2FA enforcement; say whether `claude/npm-scope-kozmos-ds` may be pushed; merge #56
when its CI on `418eb0e` is green bar the bundle check; accept Chromatic's 276 first baselines
("UI Tests"); decide on #54 (§2.4).

**First moves for the next session:** read §1; run the resume block (§9); ask Olcay whether his
Figma pass is done and verify it (§4.2); then the next item in §7 he chooses.

## 1. Rules in force

Verbatim from the day's handoff, with the evening's additions last:

- Nothing merged; nothing published but Code Connect, on Olcay's word (React and SwiftUI late on
  the 21st, Compose republished on the evening of the 22nd; `docs/figma-drift-2026-09-21.md` §9).
- No Cloud content edits. Never print, copy or commit `QAConfig.json`, licence keys or tokens (the
  main checkout's `.env` holds a Figma token — never print it); never use the vendor sample's
  embedded GitHub token.
- SDK models and parsing stay in the host, no JavaScript evaluation in native code, never traverse
  the SDK's private UIKit subviews.
- Preserve handoff docs before any `/tmp` cleanup; never delete project directories (the old
  worktree `/private/tmp/kozmos-browser-compat.uqPMBD` is Olcay's to delete, after he re-imports
  the Figma plugin from the new path).
- A metadata row at most three cells; never label fixture or simulator wayfinding as live
  navigation.
- Git: stage by file, never `git add -A` or a directory, never a bare `git stash`; commit messages
  end with the attribution the session's system reminder gives; ask before a push to a new branch
  (pushes to `claude/pointr-browse-repairs` are authorised and are the practice).
- Never Rebuild in the Figma plugin; never run Apply Text Styles. The library publish is Olcay's
  action, after a clean audit and verify. Code Connect is republished only on his word.
- Export only `FIGMA_ACCESS_TOKEN`, through `scripts/figma-rest/with-figma-token.sh`, and never print
  it. Never call the Dev Mode MCP's write tools.
- Opening or merging a PR needs his word. Never `git worktree prune` while `git worktree list`
  reads "prunable".
- Temporary files go in the session's scratchpad, not `/tmp`; every Bash call starts in the main
  checkout, so use absolute worktree paths.
- Permanently deleting data is Olcay's: never delete the old worktree folder, a branch or a PR.
- **Do not change `figma/foundations-importer/code.js` until Olcay's re-tint pass is done** (§4).
- **New, this evening:** ignore everything to do with the landing page (the website, PR #55, its session)
  **except its gap findings** — the design-system work in §5. Do not message the site's session.
- **New:** never create npm organisations, accounts or tokens, and never handle a token: those
  are Olcay's steps in his browser.

## 2. The branches, in merge order

### 2.1 PR #56 — `claude/pointr-browse-repairs` → `main`, at `418eb0e`

The design system's branch since the 19th (the Pointr work, the three platforms, the Figma
plugin). The evening added, in order: `e916524` the natives' stepper labels; `42fbe70` status text
one step darker (`Semantics.Emotion.*.text`, with React's `text-<role>-text` roles); `c5ec97c` the
icons changeset; docs `a1a9423`, `8851980`, `821ead9`, `203c782`, `35625ba`; **`7775c73` GAP-56**
(§5.2); docs `418eb0e`.

**CI.** At `c5ec97c` everything but the bundle check passed — Web (the full story audit, and CI's
steps 40–47 for the first time), iOS, Android, Lighthouse, Chromatic's build, Storybook Publish.
`analyze-bundle` is red (321 KB raw of 300, 70.87 KB gzip of 70) as Olcay decided: the per-module
PR replaces that check. Chromatic's "UI Tests" wait for Olcay to accept the project's 276 first
baselines. CI is running on `418eb0e` (the GAP-56 fix and docs). `main` is not protected; no check
is required. #56 already contains `origin/main`.

### 2.2 `claude/react-per-module-build`, at `fb24774` (pushed, no PR)

One commit on #56's `203c782`. The React ES build is one file per module (Rollup
`preserveModules`), entry still `dist/kozmos-react.mjs`, modules under `dist/esm/`, UMD unchanged.
Measured with Rollup as a Vite app builds, dependencies external, minified and gzipped:

| What an app imports            | One file (before) | One file per module |
| ------------------------------ | ----------------- | ------------------- |
| `Button`                       | 48.7 KB           | 1.14 KB             |
| the median of 249 exports      | 48.7 KB           | 1.14 KB             |
| the heaviest, `POIDetailPanel` | 51 KB             | 6.15 KB             |
| everything                     | 54.5 KB           | 54.6 KB             |

All 120 modules' top-level code is pure (`forwardRef`, `cva`, `createContext`,
`createThemePortal`), so dropping a module loses nothing. `scripts/performance/bundle-analyzer.ts`
now budgets what an app pays: every export alone ≤ 8 KB gzip, `Button` ≤ 2 KB, everything ≤ 60 KB,
the stylesheet ≤ 30 KB (26.4 now); it fails on the one-file build and without `sideEffects` (both
run). Verified: tarball install, declarations, doc snippets, classes, a Vite app build, eight
browser suites × three browsers. The published ES output grows 321 → 365 KB on disk (per-file
imports). **Next:** after #56 merges, rebase onto `main`, open the PR (his word). It replaces the
`@kozmos/react/sdk` split decided at 17:00 — no import path changes, no Code Connect republish.

### 2.3 `claude/npm-scope-kozmos-ds`, at `ad491c2` — local only

Three commits on the per-module branch:

1. `15993a4` — `apps/docs` is private. It was public, and `changeset status` listed `@kozmos/docs`:
   the first `changeset publish` would have published the Storybook app.
2. `63c4d8b` — eighteen files formatted alone, because the commit hook (`lint-staged`) prettier-
   formats every `.ts/.tsx/.js/.jsx/.json/.md/.yml/.yaml` file a commit touches; the eleven code
   files compile byte-identical before and after (esbuild, minified).
3. `ad491c2` — `@kozmos/` → `@kozmos-ds/` in 247 files (package names, workspace deps, imports,
   the Storybook alias and `check-package-install.mjs`'s regex in escaped form, turbo filters,
   thirteen changesets, both Code Connect configs, apps, living docs); the lockfile by exactly 13
   renamed keys; `ds-handoff.md`'s release section. Fifteen checks green; Code Connect's parse gives
   131 snippets importing `@kozmos-ds/react`, none the old name.

**Left as they were, on purpose:** the 37 dated reports and `docs/archive/` (records); seventeen
`.ai-skills/*.md` guides and `PROJECT_SCOPE.md`, which still say `@kozmos/`: renaming them makes
the hook reformat them, and prettier rewrites their malformed nested code fences (a ` ```markdown `
block holding ` ``` ` fences), which changes how they render — a docs change of its own,
reviewed as such. `.mdx`, `.mjs` and `.mts` files are never formatted by the hook (in `Tooltip.mdx`
prettier would flatten the Swift example and escape an underscore — never prettier an MDX file by hand).

**Next:** push on Olcay's word; after the per-module PR merges, rebase onto `main`, PR, merge.

### 2.4 PR #54 — `astra/release-safeguards` → `main`, open since the 17th

Astra's "ci: require approved SHA-bound npm releases": replaces automatic publication with a manual,
approved path — a reviewed version plan, the exact `main` SHA with green CI, typed SHA confirmation,
an `npm-release` environment with reviewers, publishing the retained tarballs after integrity
checks, registry collision preflights. It answers two problems found today: `release.yml` checks
out `main`'s head, not the commit CI verified, and a valid `NPM_TOKEN` with no changeset pending
publishes every package at 0.0.1 by itself. **Recommendation:** land #54 (rebased onto `main` after
the scope PR — it will conflict on `release.yml` and package names) before the token exists.
Olcay decides.

### 2.5 PR #55 — the website

Stacked on #56's branch. **Ignored**, except its gap findings (§5). Its session rebases on its own.

## 3. npm — the road to `@kozmos-ds` 0.1.0

**Facts (read in the in-app browser, logged in as `vodoco`, 17:45–17:55).** `@kozmos` belongs to an
unrelated personal npm account named `kozmos` (no packages, no organisations). `vodoco` is Olcay's
personal account; it holds `pointr-design-system` 1.0.22 (seven years old). Olcay created the
organisation **`kozmos-ds`**: one member, `vodoco`, owner. **2FA is disabled on `vodoco`**; the
organisation offers "Enable 2FA Enforcement". Nothing is published under any Kozmos name; the
repository has no `NPM_TOKEN` secret (it holds `CHROMATIC_PROJECT_TOKEN`, `FIGMA_ACCESS_TOKEN`).

**The four public packages** after the scope PR: `@kozmos-ds/react`, `@kozmos-ds/tokens`,
`@kozmos-ds/icons`, `@kozmos-ds/product-contracts`, each at 0.0.1 with a minor changeset, so each
reaches 0.1.0. Private: `@kozmos-ds/vue`, `@kozmos-ds/docs`, `mapscale-review`, `playground-*`.

**Steps, in order (owner):**

1. 2FA on `vodoco`, then the organisation's enforcement (Olcay).
2. Merge #56, the per-module PR, the scope PR (Olcay's word each).
3. #54, rebased, merged — or explicitly declined (Olcay).
4. A publish token from `vodoco` for `kozmos-ds`, saved as the repository secret `NPM_TOKEN` — only
   now, with the changesets on `main` (Olcay; never an agent).
5. The release workflow opens "Version Packages"; merging it publishes 0.1.0 (Olcay's word).
6. Republish React Code Connect so Dev Mode shows `@kozmos-ds/react` (Olcay's word).
7. The website follows the rename (its session; ignored here).

**Still open before 0.1.0, each small:** the browser floor — two native `@scope` blocks remain in
`style.css`, so Pointr's minimum Safari decides whether the component-owned CSS migration must
finish first (ask Pointr); `@kozmos/icons` ships two `.d.ts.map` files pointing at a `src/` it
does not include; `@arethetypeswrong` reports FalseCJS on react and icons (held as a ratchet by the
install check); the legacy docs' rename (§2.3). Already done and checked: `ThemeProvider` has no
default storage key; `style.css`'s reset is scoped (`reset.css` is opt-in); the changesets.

## 4. Figma

### 4.1 State at 17:23Z

All 97 sets carry build **`b3257790f931`**; the file was last written at **16:52:24Z**. Icon tints
(`scripts/figma-rest/icon-tints.mjs`): **171 tinted, 2,245 untinted in 46 sets** — Olcay is
re-tinting set by set (SplitButton and Alert first, then four more; it read 2,310 in 52 sets at
15:26Z). Why the tints went: his run at ~15:0xZ ran Curated Icons → Update **last**, and the sync
replaced all 56 Pointr sources although their main components carried the stored keys (REST, 14:03Z)
— the keep logic fails in the live runtime; cause unknown (the versions API answers 403).

His last pasted Audit Library (16:27Z): 20 warnings, 54 advisories. Every warning is an untinted icon
(black in dark mode, ratio 1–1.19) in 19 sets plus the QA page's Search/Select copies. **The audit
understates it:** 46 sets are untinted but only 19 warn (TreeItem's 1,044 icons raise none), so
`icon-tints.mjs` exiting 0 — not "0 warnings" — is the finish line. **Ignore the warning's "run Build
Surface QA"**: the QA page holds instances, which follow the components once re-tinted. "Kozmos
Effects" has 0 variables, as the payload does (effects are styles); Primitives 265 and Semantics 77
match the payload.

### 4.2 Olcay's steps, and the checks after them

1. Re-import the plugin from the new worktree: Plugins → Development → Import plugin from manifest…,
   `/Volumes/4TB Depo/development/K/kozmos-design-system-pointr/figma/foundations-importer/manifest.json`;
   the header must read **Build b3257790f931**.
2. **Do not run Curated Icons → Update.**
3. Update All Core, never Rebuild (or set by set, as he is doing).
4. Update All Product / SDK, never Rebuild.
5. Audit Library; paste it (expect 0 warnings).
6. The session runs, from the pointr worktree:
   `scripts/figma-rest/with-figma-token.sh node scripts/figma-rest/icon-tints.mjs` (must exit 0),
   `pnpm figma:verify`, `pnpm tokens:radius:nesting --strict`, and the REST reads in
   `docs/figma-drift-2026-09-21.md` §9's last section.
7. Import Foundations with the payload file `docs/figma-foundations-payload.json` from the pointr
   worktree (the darker emotion text); Audit Library again.
8. With Figma in front: `pnpm figma:connect:readback -- --node 1933-9257 --node 280-1157 --node 170-1002`.
9. Olcay publishes the library. Never Apply Text Styles. Then he may delete the old worktree folder.

The full run with the reasons is `docs/figma-drift-2026-09-21.md` §9, "Olcay's run of the afternoon,
and what is left of it".

### 4.3 The next plugin build — only after his pass

- The icon-source keep: replace a source only when its main component's key is read and differs;
  keep it with a warning when the key cannot be read; name both keys in every replacement warning.
- An Audit Library rule reading every icon slot against its `foreground-token` (as
  `iconSlotPaintIsExpected` does), with painter checks on an orphaned and a tinted slot; the same
  in `pnpm figma:verify` over REST, from `icon-tints.mjs`.
- Painters: the stepper's labels (current step foreground at medium weight, others foreground/400,
  as React and now both natives); the emotion text roles (the painters bind the emotion primitives
  directly, e.g. danger/600 ×28). Button's gap is already 8 in Figma.
- Then `pnpm figma:painters:check` (run it against the old plugin too), `figma:plugin:check`,
  `figma:stamp:check`, and a replay (`scripts/figma-rest/replay-diff.mjs`).

## 5. The design-system roadmap — the website's gap findings

### 5.1 Where it lives

The website records every place Kozmos fell short in
`/Volumes/4TB Depo/development/K/kozmos-design-system-site/apps/site/GAPS.md` (GAP-01…56, evidence,
status) and turns them into work for `packages/`, in priority order with file, line, change and the
site's proof, in `apps/site/DS-HANDOFF.md`. The site's `/roadmap` page is generated from those two
files. **This is the design system's work queue.** Read the gap's section there before fixing it.
Status words: _open_ (nothing done), _left visible_ (the site shows the defect), _composed_ (the
site built an honest stand-in from Kozmos parts, to delete once fixed).

How to fix one: change `packages/` on #56's branch (or a follow-up branch once #56 merges), every
platform the part exists on (`pnpm components:contract:check`), a test that fails on the old code
(run it before the fix), a changeset. The site flips its own proof test afterwards.

### 5.2 Done this evening

- **GAP-56 — Button icon gap (P1): fixed, `7775c73`.** Figma (`itemSpacing` 8, bound) and iOS
  (`HStack(spacing: spacing100)`) kept 8; React and Android kept 0. React: `.kozmos-button` takes
  `gap-2`; the loader's `mr-2` goes (a physical margin: it spaced the loader left-to-right only,
  right-to-left it touched the label); four compensating `mr-2`s go (RouteSummary, SaveLocationCard
  ×2, the POICard story). Android: `ButtonContent` is a row spaced by `primitivesLayoutSpacing100`;
  three compensating spacers go; RouteSummary's and SaveLocationCard's goldens are pixel-identical,
  POIDetailPanel's two changed as meant. Tests: `test:owned-css` measures both gaps in both
  directions on the spinner's layout box (fails on the old CSS, and on a half-fix at 16px);
  `theIconKeepsEightFromTheLabel` measures the Compose layout (0.0 → 8.0). Verified in chromium,
  firefox and webkit; every Paparazzi golden; the full story audit, 0 of 1,104; the interaction
  checks. The site then deletes `site-button-icon`, `ex-dash-add`, `ex-inbox-prefs`.
- **GAP-31 — status text on greys (P1): fixed by `42fbe70`.** Measured this evening on the surfaces
  the site named: light theme ≥ 6.49:1 on background-25 and ≥ 5.43:1 on `muted` (background/100);
  dark ≥ 7.72:1 and ≥ 6.76:1 (it read 4.29 and 3.59 before).
- **The P1 "React package not tree-shaken" (about 155 KB gzip in the site's bundle):** fixed on the
  per-module branch (§2.2).

### 5.3 Open, by the site's priority

| Priority | Gap                            | Part                                                     | One line                                                                                  |
| -------- | ------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| P0       | GAP-38                         | AdaptiveMapShell sheet                                   | Handle 4px tall, grip 0px wide: three rules use unitless tokens as lengths                |
| P0       | GAP-40                         | MapView, MapOverlay, Navbar                              | Map overlays draw over the sticky header: equal z-index, MapView does not isolate         |
| P1       | GAP-52                         | The provider's preflight                                 | A caller's `border` inside the provider never draws (`scoped-css.cjs`, one selector test) |
| P1       | GAP-55                         | Listbox                                                  | Its column grows to the widest option; nothing truncates                                  |
| P1       | GAP-45                         | Tokens, brand variant 1                                  | Dark 600 is 4.20:1 on the dark page                                                       |
| P1       | GAP-09                         | Button as a link                                         | `buttonVariants` on an anchor keeps its underline                                         |
| P1       | GAP-03                         | ThemeProvider                                            | A dark-mode visitor sees a white page until the scripts run                               |
| P1       | GAP-41                         | Navbar                                                   | No narrow-screen pattern: two rows at 320px                                               |
| P1       | GAP-37, GAP-20                 | SearchBar                                                | Two clear buttons; the field unstyled in WebKit                                           |
| P1       | GAP-42                         | CardTitle                                                | Line height 1.0: wrapped titles touch                                                     |
| P1       | GAP-43                         | Slider, Tabs, Rating, SearchBar, Chip, ToggleButton      | Targets under 44px; the slider thumb is 20 × 20                                           |
| P1       | GAP-39                         | RouteSummary                                             | Its title is always an `h2`                                                               |
| P2       | GAP-24, 29, 34, 36             | DynamicIsland, BottomNavigation, Backdrop, ToastViewport | Always fixed to the viewport                                                              |
| P2       | GAP-17, 28, 30, 32             | AdaptiveMapShell, SearchBar, Sidebar, ChipGroup          | Landmarks and groups that cannot be named or placed                                       |
| P2       | GAP-53                         | AdaptiveMapShell, MapView                                | No edge-to-edge form for rounded screens                                                  |
| P2       | GAP-46, 47, 48                 | Stepper, Sidebar, Tree                                   | No narrow form                                                                            |
| P2       | GAP-50, 51                     | Spinner, Skeleton, Button; announcements                 | Motion ignores reduced motion; no polite live region                                      |
| P2       | GAP-49                         | SearchBar                                                | A caller's `onKeyDown` drops the component's analytics                                    |
| P2       | GAP-44 and the rest            | see DS-HANDOFF.md's table                                | API and structure (GAP-01, 02, 04, 11–14, 16, 18, 19, 21–23, 25–27, 35, 44)               |
| P3       | GAP-05, 06, 07, 08, 10, 15, 33 | new parts, icons, tokens                                 | Additions                                                                                 |
| P3       | GAP-54                         | Tokens (effects, motion)                                 | No glow, gradient, blur scale or ambient duration                                         |

**Start with GAP-38.** It is a class of bug, not one rule: the token CSS variables are unitless
(`--primitives-layout-spacing-100: 8;`), so any rule that uses one as a length without
`calc(var(--…) * 1px)` is invalid and silently dropped. Grep the owned CSS for every such use.

## 6. Found today, with the evidence

- **One file cost every import the whole library** (§2.2): neither Rollup nor esbuild drops unused
  components inside one module (top-level `forwardRef` calls, `displayName` writes).
- **`apps/docs` was public** (§2.3). **`QAConfig.json` was never lost**: the morning's check read
  `apps/PointrPlayground/QAConfig.json`; the app bundles `Sources/App/Resources/QAConfig.json`
  (present since the 19th, moved with the worktree).
- **The commit hook formats every touched file** of its globs; 73 of the rename's targets were off
  format; prettier changes how malformed Markdown fences render and breaks indented code inside MDX
  template literals (§2.3).
- **React's loading spinner was spaced left-to-right only** (a physical `mr-2`). The owned-CSS
  fixture renders inside `dir="rtl"`, so direction-blind tests miss it.
- **Paparazzi cannot render a loading `KozmosButton`**: material3 1.1.2's indeterminate
  `CircularProgressIndicator` throws `NoSuchMethodError` (`KeyframesSpecConfig.at`) against
  animation-core 1.6.0, both from `compose-bom:2024.01.00`; no golden shows one. Whether a device
  crashes too is unverified — the Android playground has never been run. Likely fix: a Compose BOM
  bump, then every golden re-verified and a device run.
- **A spinning icon's bounding box is up to 41% wider mid-turn**; measure layout with the animation
  off. Memory: `layout-gap-measurement-traps`.
- **PR #54 exists** and answers the release checkout problem (§2.4).
- **Local `main` is 8 commits behind `origin/main`** (#52 and #53 merged); #56 contains
  `origin/main`. The main checkout is shared: leave it.

## 7. Open, in order — the to-do

1. **Figma:** Olcay finishes the re-tint pass; the session verifies (§4.2 step 6); Import Foundations;
   readback; he publishes.
2. **#56:** watch CI on `418eb0e`; merge on his word (the bundle check stays red until §2.2).
3. **Per-module PR** (§2.2): rebase onto `main`, open, merge — his word.
4. **Scope PR** (§2.3): push (his word), rebase, open, merge.
5. **#54:** his decision; if yes, rebase onto the renamed `main` and land before the token.
6. **npm:** 2FA; `NPM_TOKEN`; Version Packages; 0.1.0; React Code Connect republish (§3).
7. **The next plugin build** (§4.3), after his pass.
8. **The gap roadmap** (§5.3): P0 GAP-38, GAP-40; then P1 in the site's order.
9. **Compose BOM bump** for the loading spinner, with every golden and a device run (§6).
10. **Legacy docs:** rename and reformat `.ai-skills` and `PROJECT_SCOPE.md` in their own PR,
    reviewing how each renders.
11. **Browser floor:** ask Pointr for its minimum Safari / iOS and Android WebView (§3).
12. **Offered sessions** (chips in the desktop app, each on its own branch after #56 merges):
    `task_5764ffc8` native dark-mode contrast on theme-500 fills; `task_063ad520` native glass
    shadows drawn outside the surface; `task_a6b3124b` native status colours onto their roles.
13. **Carried from the day's handoff §7:** Surface and its axis on five Figma sets; ManoeuvreCard,
    Itinerary and RouteProgressRail as Figma sets (also Code Connect gaps); the 15th–19th Figma
    drift (Tag's and Counter's `emotion`, MapControlButton's axes, the POI panel's anatomy); iOS
    Surface's path in `STATUS.md`; the prototype's rubber band on the sheet; Android on an emulator;
    items F, G and Pass 4 (`docs/claude-code-handoff-2026-09-19.md`).

## 8. Decisions still Olcay's

- Push `claude/npm-scope-kozmos-ds` (and later its PR).
- #54: land the approved release path before the first publish, or keep `changesets/action`.
- The browser floor for `@scope` (with Pointr).
- The icon-source keep's behaviour when a key cannot be read (recommended: keep, with a warning).
- The Compose BOM bump's timing.
- Whether the legacy `.ai-skills` guides are worth keeping at all (many describe plans that never
  happened: `bundlewatch`, `@kozmos/react-native`).

## 9. How to resume

```bash
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && git status -sb && git fetch origin && git log --oneline -5
```

```bash
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-dev" && git worktree list
```

```bash
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && scripts/figma-rest/with-figma-token.sh node scripts/figma-rest/figma-state.mjs && scripts/figma-rest/with-figma-token.sh node scripts/figma-rest/icon-tints.mjs | tail -1
```

```bash
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && gh pr checks 56
```

- Storybook for checks: `python3 -m http.server 6012` serves the pointr worktree's
  `apps/docs/storybook-static` (pid 20760 at 18:27); port 6006 belongs to another worktree — always
  set `STORYBOOK_URL`. Rebuild: `pnpm --filter '@kozmos/react...' build && pnpm --filter @kozmos/docs build-storybook`.
- The full story audit as CI runs it: `STORY_SCOPE=all STORYBOOK_URL=http://127.0.0.1:6012 pnpm test:storybook-audit`
  (the default audits one story per group, 440 checks, not 1,104).
- Built-package suites: `ADAPTIVE_BROWSER=<chromium|firefox|webkit> pnpm test:<adaptive|overlays|select-accessibility|themes|config|browser-compatibility|owned-css|temporal-css>`.
- Android: `cd packages/android && ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew --no-daemon -q verifyPaparazziDebug`.
- The operator's guide for everything else: `docs/kozmos-pointr-operators-guide-2026-09-20.md`.

## 10. Verified this evening

| Change                     | Checks, all green                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Per-module build `fb24774` | analyzer (fails on the old build and without `sideEffects`); tarball install; declarations; doc snippets; classes; `playground-web` build; 8 suites × 3 browsers               |
| Scope rename `ad491c2`     | build; typecheck; lint; unit tests; declarations; doc snippets ×2; install; product consumer; contracts; classes; plugin check; Code Connect parse; changeset status; analyzer |
| GAP-56 `7775c73`           | owned-css × 3 browsers (fails on old CSS and a half-fix); Paparazzi 71/71 (0.0 → 8.0 on the old code); full story audit 0/1,104; interactions                                  |
| #56 at `c5ec97c`           | CI: Web, iOS, Android, Lighthouse, Chromatic build, Storybook Publish (bundle check red as decided)                                                                            |

## 11. Traps met today

- An exact-anchor edit fails on a padded Markdown table cell; match the padding or rebuild the row.
- `git rev-parse --short` takes one revision; `gh pr checks` output is tab-separated.
- The `yaml` package resolves through Vite's dependency tree, not the repository root.
- A Rollup cache from a build without `treeshake.moduleSideEffects` carries "every module has side
  effects" into later builds: every export measured 48.7 KB until the cache was built with the rule.
- Paparazzi records the golden before an assertion fails; re-record after the fix.
- Memories that matter here: `kozmos-session-handoff-pointer`, `layout-gap-measurement-traps`,
  `kozmos-a-green-can-prove-nothing`, `kozmos-verify-before-asserting`,
  `figma-update-resets-nested-overrides`, `kozmos-plugin-may-run-stale-code`,
  `storybook-6006-is-another-worktree`, `bash-cwd-resets-to-main-checkout`.
