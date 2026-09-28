# Session handoff — 2026-09-27 night: where everything stands

> **Superseded as the door in by [handoff-2026-09-28.md](handoff-2026-09-28.md)** (the audit, the
> merge queue, iOS on pull requests, 0.5.0 prepared). This one keeps decisions 1–23 and the evidence.

**Read this first in a new chat.** It is self-contained: scope, how Olcay works, current state, what
is in flight with the exact next steps, decisions, open questions, the queue of tasks, the systems
built today, where things live, and the traps. The evening handoff,
[handoff-2026-09-27-evening.md](handoff-2026-09-27-evening.md), keeps the evidence and history (its
§8 lists the eighteen defects the review found); the morning one,
[handoff-2026-09-27.md](handoff-2026-09-27.md), keeps the Figma repair detail. Times BST.

## 0. In one screen

| What              | Where / how                                                         | State                                                                                                                   |
| ----------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Repository        | `vodoco/kozmos-design-system` (**public**)                          | `main` at `ad570f63` (#123) when written                                                                                |
| Main checkout     | `/Volumes/4TB Depo/development/K/kozmos-design-system-dev`          | shared with other sessions — stage by file, never `git add -A`                                                          |
| Open PRs (mine)   | #124 (changesets, auto-merge on); #118–#123 merged                  | §3; the agents' floor-label and MapOverlay PRs follow                                                                   |
| Open PRs (others) | #55 website (the site session's, `claude/kozmos-site`)              | **conflicts with `main`**; once main is merged in, all 18 required checks must pass                                     |
| Required checks   | branch protection on `main`                                         | **all 18 PR checks** (decision 13), GitHub Actions only; auto-merge allowed. Chromatic's workflow **disabled**          |
| Visual review     | `pnpm test:visual` (Docker) · CI "Visual Review"                    | every story × light/dark (632 drawings), `tests/visual/baselines`                                                       |
| CI on `main`      | GitHub; `node scripts/ci-local.mjs --job web\|ios\|android` locally | green through #120 (`407d59df`, iOS included); #119 and #121 are docs, which CI skips on `main`                         |
| React unit suite  | `cd packages/react && npx vitest run`                               | 714 on `main` after #120, measured (706 at #113)                                                                        |
| Bundle budget     | `pnpm tsx scripts/performance/bundle-analyzer.ts`                   | 61.97 of 64 KB (CI, `9df17777`)                                                                                         |
| Contract parity   | `pnpm contracts:parity:check`                                       | 25 types, 121 fields, 14 enumerations                                                                                   |
| npm               | react 0.4.0, icons 0.3.0, product-contracts 0.3.0, tokens 0.1.0     | nothing published since; changesets for everything since 0.4.0 → react 0.5.0, icons 0.4.0, product-contracts 0.4.0 (§8) |
| Change list       | `~/Downloads/Kozmos requests from the MAP-474 prototypes (5).md`    | rows 1–82 (23:23 export). Row 82 (GAP-083) is done but still says To do there; rows 79–81 are decision 23               |
| Figma library     | `Yj4O8p6Y9h2Sa9zJVoAiVY`                                            | 2,430 / 2,430 icons tinted (morning); today's rows not yet in Figma (task)                                              |

## 1. Scope, and how Olcay works

**Scope.** The Kozmos design system (React, iOS SwiftUI, Android Compose, tokens, icons, product
contracts, a Figma importer plugin, Storybook docs). The work is the change list of requests found
while prototyping MAP-474 (Pointr's agentic search): each row is built on all three platforms, reviewed
adversarially, verified, merged. Vue (`@kozmos-ds/vue`, private 0.0.5) waits — "we should do vue
support properly; once all clean we'll start this." The website (apps/site, #55) and the landing page
are out of scope.

**How Olcay works with me** (Olcay's words and standing instructions):

- "Ask questions if you need my answers; apart from that, do instead of waiting for me — obviously
  if not breaking anything." Merging my own green, verified PRs is authorised. Olcay answers questions
  through the question tool, with a recommended option first.
- "No hacks, no cheats — do it properly." Olcay expects an adversarial self-audit before "done",
  and measured evidence, not claims.
- The repo settings were done through me, on Olcay's request (§4, decision 12).
- **Never**: handle a token or API key (Figma reads go through
  `scripts/figma-rest/with-figma-token.sh`, which never prints it); delete a secret, a branch, a PR
  or a project directory (permanent deletion is refused even when asked — say so and leave it to Olcay);
  `git add -A` or a directory; a bare `git stash`; Rebuild in the Figma plugin (Update only); press
  "Import Foundations".
- Examples are built from Kozmos parts only; gaps are reported, not worked around.

**How I verify** (every PR):

- New tests are written first and run against the unfixed code: they must fail **on an assertion**,
  and I read the output. A green that could not have failed proves nothing.
- `ci-local --job web` is only CI's "Web Build & Test". The bundle budget, the browser shards
  (Stories & Interactions at 320/1280 in both themes, Documentation, POI Reference, Map/Search/
  Navigation) and now Visual Review run only on GitHub — run the relevant ones yourself (commands in
  the evening handoff §1). Only one session at a time may run `ci-local --job web` (fixed ports).
- Native work: GitHub never builds iOS on a PR. Run `ci-local --job ios|android` in a **separate
  worktree**, and prove the new tests ran **by name**: the simulator step's result bundle
  (`xcrun xcresulttool get test-results tests --path <dir>/TestResults.xcresult`; the script prints
  `Results: <dir>`), Android's `packages/android/build/test-results/testDebugUnitTest/TEST-*.xml`.
- Background agents did the native halves today (#104, #108, #111, #116, #117); I review their
  diffs and re-run their CI independently before merging.

## 2. What merged today

| PR   | Rows / topic     | What                                                                                                                   |
| ---- | ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| #99  | —                | the morning handoff                                                                                                    |
| #100 | 77, step-free    | a mark per location mode; step-free replaces the location control on a route; bundle budget 60 → 64 KB                 |
| #101 | 70 (web)         | the selected result comes into view (`data-kozmos-scroller`)                                                           |
| #102 | 37 (web)         | `ChipGroup selectionMode="single"`, a Radix radio group                                                                |
| #103 | 59, 60, 61       | the AI parts: named, focusable, told apart                                                                             |
| #104 | 67, 77 (native)  | iOS/Android map controls: labels, location marks, step-free                                                            |
| #105 | —                | docs icons from `@kozmos-ds/icons`, not lucide-react                                                                   |
| #106 | review fixes     | step-free keyed apart; logical spacing right to left                                                                   |
| #107 | 8                | `appliedScope` on the search response, three platforms                                                                 |
| #108 | 73 (native)      | iOS/Android `panelHeader`                                                                                              |
| #109 | 73 (web)         | `panelHeader`; the fitted sheet counts its handle; 4px under the handle for WCAG 2.5.8                                 |
| #110 | —                | the evening handoff                                                                                                    |
| #111 | 56, 69 (native)  | native Skeleton shape/size; floor result markers                                                                       |
| #112 | 73 (docs)        | the sheet's docs page gains React/SwiftUI/Compose examples                                                             |
| #113 | 69, review fixes | React says "1 result"; Android's category tile keeps "Selected"                                                        |
| #114 | Skeleton grey    | `background/200` on every platform (decision 10); Android's shimmer became iOS's sheen                                 |
| #115 | visual review    | Kozmos's own visual review replaces Chromatic (decision 11) — §7                                                       |
| #116 | 82 (native)      | GAP-083 on iOS/Android: the shell publishes its top space and the grip's clearance                                     |
| #117 | 82 (native)      | …only the surfaceless `sheet` card tops up; bordered `panel`/`inline` keep their 16                                    |
| #118 | visual review    | a record run redraws only the drawings that fail, then prunes baselines of stories that went                           |
| #120 | 82 (web)         | GAP-083 on the web: the shell's two custom properties; the hosted `sheet` card tops up to them; first per-PR changeset |
| #119 | —                | this handoff                                                                                                           |
| #121 | decision 13      | every PR check required; CONTRIBUTING names them; this handoff's final state                                           |
| #122 | decisions 14–20  | Olcay's answers to the open questions                                                                                  |
| #123 | decisions 21–23  | voice (SearchBar no, AI chat product-gated), rows 79–81                                                                |
| #124 | changesets       | the catch-up since 0.4.0, and `changeset-required.mjs` in every PR                                                     |

## 3. In flight — nothing

Everything this session started has merged: #118 (`d6d17cc1`), #120 (`407d59df`, GAP-083 web, with
`.changeset/panel-inset-contract.md`) and #119 (this handoff, `be350c0a`); then all 18 PR checks
were made required (decision 13, #121 — the first PR auto-merge landed, 19 seconds after its last
check). #120's record run changed exactly its four drawings, measured from their pixels: the new
`SheetWithPlaceDetails` story at 21 / 17 under the grip, and the on-map example from 34 / 18 (a
bordered card nested in the side panel, a double top edge) to 17 / 17. #120's description lists its
full verification.

Start at §5 (ask Olcay what is still open), then the queue in §6. Optionally re-number: GAP-083 is
row 82 in the MAP-474 session's list, not in `(4).md`.

**GAP-083, the numbers** (close button from the hosted panel's top / side):

| Case                                | Before  | After                                  |
| ----------------------------------- | ------- | -------------------------------------- |
| Sheet with a grip                   | 33 / 17 | **21 / 17** (4px keeps the grip clear) |
| Side panel, and right to left       | 33 / 17 | **17 / 17**                            |
| Single-detent sheet (no grip)       | 17 / 17 | 17 / 17                                |
| Under a `panelHeader`               | —       | the card keeps its 16                  |
| Bordered `panel` / `inline` card    | —       | keeps its 16 inside its own border     |
| iOS / Android, sheet with a grabber | 32 / 16 | **20 / 16**                            |

## 4. Decisions Olcay made today

1. GAP-021 is covered (row 7 Done).
2. Vue waits.
3. The location control's source is Pointr's Location Tracking Buttons revamp (Figma
   `ce7phRJR1sCkH6zT8EMH8I`, page `1:237`).
4. Step-free replaces the location button during wayfinding.
5. The bottom-centre status toast is its own component (not built).
6. Bundle budget 64 KB.
7. I could run the Figma Sidebar Update (already run).
8. **Changesets: one catch-up PR, then one in every PR** (a check to enforce it is in the task).
9. **Native Skeleton keeps an unset default shape.**
10. **The Skeleton is `background/200` everywhere** (done, #114).
11. **No paid Chromatic** — Kozmos's own visual review (done, #115).
12. **Repository settings done by `gh`:** "Visual Review" required on `main` (GitHub Actions only;
    everything else unchanged); Chromatic's workflow disabled (`gh workflow enable 279749689` undoes
    it); `CHROMATIC_PROJECT_TOKEN` kept (deleting a secret is Olcay's to do).
13. **All 18 PR checks are required** (late on 2026-09-27, replacing "Visual Review only"), so
    auto-merge — now allowed on the repository — waits for all of them: CI's `Web Build & Test`,
    `Core Pipeline & POI Gallery`, `Android Build` and twelve browser shards, `analyze-bundle`,
    `lighthouse` and `Visual Review`, each pinned to GitHub Actions (app 15368). All run on every
    pull request into `main`, docs-only ones too (#119 and #120 got the same 18); iOS builds only on
    `main`, so it is not required. Undo: PATCH `…/branches/main/protection/required_status_checks`
    with `{"strict": false, "checks": [{"context": "Visual Review", "app_id": 15368}]}`.

Olcay's answers to the open questions, the same night (each is a task in §6 unless it is Olcay's):

14. **Every part at the top of the shell's panel keeps the grip's 4px**, not only the panel header
    and the details card: it reads `--kozmos-panel-clearance-top` (iOS `kozmosPanelClearanceTop`,
    Android `LocalKozmosPanelClearanceTop`), so no first control sits in the grip's 24px circle.
    The browse panel is first.
15. **The floor stepper says "Floor up" / "Floor down"** on all three platforms; React changes from
    "Previous floor" / "Next floor" (previous is the up chevron).
16. **AICompanionPanel takes focus only when the user opens it**, not when it mounts already open.
17. **Rail tile labels (row 25): one smaller size for every tile** — "smaller font but for all of
    them. Not some small some large." Measure the largest size at which "SDK Configuration" and
    "User Management" fit two lines in the 72px tile, and show Olcay before changing it.
18. **Row 15, Japanese names: break hints only** — zero-width spaces in the taxonomy's Japanese
    names (a data request to the taxonomy's owners). Kozmos keeps its two-line clamp; a name that
    still needs three lines stays cut.
19. **Chromatic's leftovers:** Olcay removes the `CHROMATIC_PROJECT_TOKEN` secret and the Chromatic
    GitHub app.
20. **Register numbers:** Olcay numbers the unnumbered items (the step-free control, the
    bottom-centre map toast, #90's controls-side change, the review fixes) in the list.

Later the same night, with the fresh export (`(5).md`, 23:23):

21. **Kozmos doesn't build what the platform already gives** — "we don't have to do everything
    here." Row 34 (a microphone in the SearchBar) is **won't do**: voice typing uses the keyboard's
    own microphone on the web, iOS and Android; Kozmos adds nothing and must not block it.
22. **The AI chat gets a microphone for a spoken conversation** (the assistant answers aloud),
    **off unless the product turns it on**, per platform and per app: the product supplies the voice
    model and connection. App Clips have no voice model, so PointrExpress (an App Clip) never shows
    it. Kozmos draws the button and its states (listening, speaking, stopped, unavailable) and
    announces them. `@kozmos-ds/icons` already has `Microphone01`/`Microphone02`/`MicrophoneOff01`
    (since 0.3.0). The AI parts exist only in React today.
23. **Rows 79–81 are Kozmos work, all three**: 79 (GAP-080) FloorSelector's collapsed, SDK-style
    level switcher; 80 (GAP-081) AdaptiveMapShell's bottom-corner controls above the sheet,
    counted in the collision insets; 81 (GAP-082) MapOverlay stops clipping its controls' shadows.

## 5. Questions still open for Olcay

None: all were answered the same night (decisions 14–23). Olcay marks row 82 (GAP-083) Done in the
list and numbers the unnumbered items (decision 20).

## 6. The queue: suggested tasks (chips in the app), in order

| When                          | Task                                                     | Note                                                                                   |
| ----------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| now                           | Triage the 135 Dependabot alerts                         | none reach consumers; the only task touching the lockfile                              |
| now                           | Fix the docs' iOS and Android snippets                   | 72 native tabs are stale implementation copies; 8 don't compile                        |
| now, one after the other      | Android sheet: content overhangs; easing                 | same file                                                                              |
| now                           | Keep the grip's 4px above every hosted panel part        | decision 14; the browse panel first                                                    |
| now                           | Floor stepper: "Floor up" / "Floor down" in React        | decision 15; docs and tests say the new names                                          |
| now                           | AICompanionPanel: focus in only when opened              | decision 16                                                                            |
| now, then ask Olcay           | Rail tile: one smaller label size                        | decision 17; measure first, change after Olcay sees it                                 |
| any time                      | Japanese break-hint request for the taxonomy             | decision 18; list the names that need hints, measured in the tile                      |
| now                           | MapOverlay: stop clipping the controls' shadows (row 81) | decision 23; P3, small                                                                 |
| now                           | AdaptiveMapShell: bottom-corner controls (row 80)        | decision 23; P2; collision insets (GAP-079's band model)                               |
| after the floor labels        | FloorSelector: collapsed level switcher (row 79)         | decision 23; P2; uses "Floor up"/"Floor down"                                          |
| now                           | AI chat: a microphone for a spoken conversation          | decision 22; off unless the product turns it on; never in App Clips                    |
| any time                      | Android: favourite and save in the details header        | parity gap found today                                                                 |
| any time, one after the other | Focus-ring offsets in dark theme; RTL sweep              | visual changes — Visual Review shows them now                                          |
| with Olcay                    | Bring today's map and chip changes to Figma              | Olcay runs the plugin                                                                  |
| check first                   | Run the iOS shell render tests on CI                     | mostly covered by #108/#111/#116                                                       |
| any time                      | Fix CONTRIBUTING's stale merge and release steps         | it says squash-merge and a Changesets release PR; the repo merges and releases by hand |

Any task that changes how a story looks must record baselines (§7) or its PR stays red.

## 7. Systems built today

**Visual review (#115, #118).** `tests/visual/stories.visual.ts`, `playwright.visual.config.ts`,
`scripts/visual/{serve-storybook,docker,summary,prune-baselines}`, `.github/workflows/visual.yml`,
`docs/visual-review.md`.

- Every story in `apps/docs/storybook-static/index.json` (opt out: tag `no-visual`), light and dark,
  Chromium in `mcr.microsoft.com/playwright:v1.58.2-noble`, cropped to what paints; outside requests
  refused (Google Fonts too); remote photos → a grey pixel; Pointr's taxonomy symbols → a circle, and
  their slots **masked**; map canvases masked; clock fixed, `Math.random` seeded, reduced motion.
- **`threshold: 0.02`** — calibrated: the default 0.2 passed a whole token step (the Skeleton's
  #E3E4E8→#C7CAD1, delta 351 < 1,409); 0 failed on ±1 anti-aliasing noise. Proved by a control
  commit that failed exactly the two Skeleton drawings and nothing else. Don't loosen it or unmask
  without re-running such a control.
- **Accepting a change:** `pnpm test:visual:update` (Docker must run — its engine was not answering
  today) or Actions → _Visual Regression_ → Run workflow on the branch with **record** (commits the
  baselines; a workflow's push starts no checks, so push again). Never record on a bare Mac.

**Panel inset contract (GAP-083).** The map shell tells its panel content what it leaves above it:
web `--kozmos-panel-inset-top` (grip row / `1rem` side panel / `0px` with no grip or under a header)
and `--kozmos-panel-clearance-top` (4px under a grip, else `0px`), on `[data-kozmos-scroller]`; iOS
environment `kozmosPanelInsetTop`/`kozmosPanelClearanceTop`; Android `LocalKozmosPanelInsetTop`/
`LocalKozmosPanelClearanceTop` (native side panels leave 0). A **surfaceless** hosted part pads its top
`max(clearance, 16 − inset)`; a bordered card keeps its padding inside its border. Host
`POIDetailPanel` with `presentation="sheet"` in the shell's sheet and side panel alike.

**Android pixel tests.** `packages/android/src/test/java/com/kozmos/components/DrawnPixels.kt` keeps
Paparazzi's frame (read by reflection). Frames arrive **scaled** (1080×1920 → 562×1000): sample from
the frame's own size.

## 8. Facts a release or a review must not miss

- **Every PR that changes what a published package ships carries a changeset naming it** (an empty
  one, `pnpm changeset --empty`, when it needs no release); CI's "Web Build & Test" enforces it with
  `scripts/release/changeset-required.mjs`. The catch-up for everything since 0.4.0 is in: a release
  now would be react 0.5.0, icons 0.4.0 and product-contracts 0.4.0, and the packed react pins
  exactly those (proved with a throwaway `changeset version` and `pnpm pack`).
- **Published react pins its siblings exactly** (`workspace:*` → `"@kozmos-ds/icons": "0.3.0"`).
  Main's react imports `LocationFollowing`/`LocationHeading` (icons, #100) and types with
  `summary`/`resultCount`/`appliedScope` (contracts) — none in the pinned versions. A release needs
  icons and product-contracts changesets too; the changesets task lists every behaviour change.
- **135 Dependabot alerts**; none in the four published packages' production trees (checked with
  `pnpm why --prod`, control-verified); criticals are tooling (Vitest UI 1.6.1 → 3.2.6).
- **The docs' native tabs are not compiled**: 61 Kotlin and 11 Swift blocks are old implementation
  copies; 8 usage snippets call APIs that do not exist. Compile any native snippet you write (method
  in the evening handoff §9).
- **Platform differences kept on purpose**: native side panels leave no top space; web counts
  distinct detent heights for its grip, iOS counts detents offered; React's Skeleton defaults to a
  line, native to unset; the floor marker sits flush natively, 2px in on the web.

## 9. Worktrees and branches

| Worktree                                                      | Branch                                          | Keep?                                 |
| ------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| `/Volumes/4TB Depo/development/K/kozmos-design-system-fixes`  | `claude/poi-detail-hosted-inset` (#120, merged) | reusable                              |
| `/Volumes/4TB Depo/development/K/kozmos-design-system-rows`   | `claude/visual-record-changed` (#118, merged)   | reusable                              |
| `/Volumes/4TB Depo/development/K/kozmos-design-system-verify` | `claude/required-checks` (decision 13's docs)   | reusable for independent native runs  |
| `…-dev/.claude/worktrees/agent-*`                             | merged agent branches                           | ask Olcay; `git worktree remove` only |

Never `rm -rf` a worktree; branches stay. Each worktree needs `pnpm install` once, and
`packages/android/local.properties` with `sdk.dir=/Users/olcaykurtulus/Library/Android/sdk`.

## 10. Traps worth remembering

- A background `(a; b; echo)` reports `echo`'s exit code; record each step's own.
- A fresh worktree needs `pnpm install` before `ci-local` (it imports `yaml`).
- `-only-testing` with a wrong class runs nothing and passes — read the result bundle.
- In Compose a `stateDescription` replaces TalkBack's "Selected".
- zsh: no `PIPESTATUS`, unquoted `--include=*.ts` globs abort, `$VAR` does not word-split.
- `gh pr edit` fails silently here — `gh api -X PATCH …/pulls/<n> -F body=@file`, then read back.
- The Figma token cannot read variables (403); read bindings with `scripts/figma-rest/bindings.mjs`
  and the importer's painter source.
- A required check blocks branches that predate it; a bot commit (GITHUB_TOKEN) starts no checks, so
  after a record run all 18 are missing until you push again.
- A pull request retargeted to `main` from another base has no `analyze-bundle` or `lighthouse` run
  (both run only for pull requests into `main`) until a push, or a close and reopen.
- **Required checks are matched by name.** Renaming a CI job or a browser shard (`name:` or
  `matrix.shard.name`) leaves the old name required and never reported, so every PR blocks: update
  branch protection in the same change (`gh api -X PATCH …/branches/main/protection/required_status_checks`
  with the full list, `app_id` 15368), and add any new always-running check to it.
- A Dependabot PR that bumps a published package's runtime `dependencies` fails "Web Build & Test"
  until it carries a changeset (`dependencies` is consumer-facing): push a patch changeset to its
  branch. Dev-dependency bumps need none.
- `npx changeset status` prints `/bin/sh: /Volumes/4TB: No such file or directory` (the space in the
  path) and still runs; `--since=origin/main` counts only committed changesets.

## 11. How to resume

```bash
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-dev"
git checkout main && git pull --ff-only && git log --oneline -1   # expect ad570f63 or later
gh pr list --repo vodoco/kozmos-design-system --state open         # #55, and anything newer
pnpm install && pnpm exec turbo run build --filter=@kozmos-ds/react...
```

Then §5 (ask Olcay what is still open), then the queue in §6.

**Memory** (auto-loaded through `MEMORY.md`) holds the traps as one-fact notes. Today's:
`kozmos-visual-review`, `kozmos-panel-inset-contract`, `paparazzi-frames-are-scaled`,
`kozmos-react-pins-siblings-exactly`, `kozmos-native-docs-snippets-uncompiled`,
`ios-sim-tests-prove-by-xcresult`, `kozmos-session-handoff-pointer` (names this file).
