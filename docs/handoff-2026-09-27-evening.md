# Session handoff — 2026-09-27 evening: the map rows on three platforms, and a review that found eighteen defects

For the next agent session, and for Olcay if he changes things by hand. **This is the door in.**
The morning's [handoff-2026-09-27.md](handoff-2026-09-27.md) keeps the Figma and gate detail whose
rules still stand; [ds-handoff.md](ds-handoff.md) is the long record. Times BST.

## 0. In one screen

| What             | Where                                                            | State                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Repository       | `vodoco/kozmos-design-system`                                    | `main` at `03257881` when written (#113 the last merge)                                                                                                                                                                                                                                                                                                                                                                        |
| Main checkout    | `/Volumes/4TB Depo/development/K/kozmos-design-system-dev`       | shared with other sessions — stage by file                                                                                                                                                                                                                                                                                                                                                                                     |
| CI on `main`     | `node scripts/ci-local.mjs --job web\|ios\|android`              | #100–#103, #106, #107 and #109 ran **web 43/0** locally; #104, #107, #108 and #111 ran **iOS 8/0, Android 7/0** locally, the native ones again **independently** in a second worktree, with each new test read back by name (§9); #105 is docs. All passed GitHub's PR checks before merging. On GitHub, `54a2f777` and `9df17777` passed in full — `9df17777` was **the first GitHub iOS build of #108**, which PRs never get |
| React unit suite | `cd packages/react && npx vitest run`                            | **706 tests, 133 files** with #113 (686 at `69a69fd4`, 646 this morning)                                                                                                                                                                                                                                                                                                                                                       |
| Stories shard    | not in ci-local — see §1                                         | run it yourself for any story you add                                                                                                                                                                                                                                                                                                                                                                                          |
| Bundle budget    | `pnpm tsx scripts/performance/bundle-analyzer.ts`                | **61.97 of 64 KB** on `9df17777` (GitHub's run); the budget was 60 until today; not in ci-local                                                                                                                                                                                                                                                                                                                                |
| Contract parity  | `pnpm contracts:parity:check`                                    | **25 types, 121 fields, 14 enumerations** on main since #107 (23/116/13 this morning)                                                                                                                                                                                                                                                                                                                                          |
| Figma library    | `Yj4O8p6Y9h2Sa9zJVoAiVY`                                         | **2,430 / 2,430 tinted, 0 strays** — Sidebar Update ran at 14:27Z, verified over REST                                                                                                                                                                                                                                                                                                                                          |
| npm              | react 0.4.0, product-contracts 0.3.0, icons 0.3.0                | nothing published; **no changesets since 0.4.0**. React pins its siblings **exactly**, and main's react imports icons and contract fields added since — **a release needs icons and product-contracts changesets too** (§7)                                                                                                                                                                                                    |
| Change list      | `~/Downloads/Kozmos requests from the MAP-474 prototypes (4).md` | (3) with this session's rows moved (§5)                                                                                                                                                                                                                                                                                                                                                                                        |

## 1. Rules in force

The morning handoff's §1 stands (never a token; Update, never Rebuild; never Import Foundations; stage
by file; never delete directories, branches or PRs; examples from Kozmos parts only; the landing page
is out of scope). Added today, each learned the hard way:

- **ci-local is not all of CI.** `--job web` is the "Web Build & Test" job. It does **not** run the
  bundle budget (its own workflow) or the browsers matrix — the **Stories & Interactions** audit of
  every story at 320/1280 px in both themes, the Documentation, POI Reference and Map/Search/Navigation
  shards. A 43/0 local run went red on GitHub twice today (bundle 60.07 > 60; a story overflowing at
  320 px). To cover a story you add:
  ```bash
  pnpm exec turbo run build --filter=@kozmos-ds/react...
  pnpm --filter @kozmos-ds/docs build-storybook
  (cd apps/docs && python3 -m http.server 6121 --bind 127.0.0.1 --directory storybook-static &)
  STORYBOOK_URL=http://127.0.0.1:6121 STORY_SCOPE=all STORY_FILTER='<story-id regex>' node scripts/audit-storybook.mjs
  STORYBOOK_URL=http://127.0.0.1:6121 pnpm -s test:map-sheet   # and test:search-sheet, test:navigation for sheet work
  ```
- **The host picks the font.** This Mac draws SF Pro; CI's runner draws DejaVu Sans, which is wider.
  The story that failed on CI passed here. Check new stories at 320 px with a wide sans substituted
  (`*{font-family:Verdana !important}`) — it reproduced CI's 335 px exactly.
- **Run web ci-local one at a time.** It serves storybook-static on fixed ports and kills whatever
  holds them between steps. `ps -axo pid,command | grep "[s]cripts/ci-local.mjs"` first. iOS and
  Android jobs bind no ports. A worktree without `.env` skips two token steps (41/6): run the whole job
  through `scripts/figma-rest/with-figma-token.sh`.
- **GitHub never builds iOS on a pull request** ("iOS Build: skipping"); it builds on pushes to
  `main`, where newer merges cancel older runs. Verify iOS locally (`ci-local --job ios`, and
  `swift test --filter <Suite>` — or, for the simulator step, its result bundle (§9) — to see your
  tests run by name) before merging native work.
- **Storybook caches pre-bundled workspace packages** (`apps/docs/node_modules/.cache/storybook/*/sb-vite/deps`);
  after rebuilding a package, move that `deps` aside (never delete) and restart.
- **A negative control must fail on an assertion, and you must read its output.** Today's first
  controls proved nothing four times: a test crashing on a missing export; a browser case reading
  `null` before and after and "passing"; a control build that failed (`rm -rf dist && tsc`) so the run
  used the old build; a check measuring a margin mid-transition. Each was redone.

## 2. What merged this session

| PR   | Rows                   | What                                                                                                                                                                                                                                                                                                                                        |
| ---- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #99  | —                      | the morning handoff                                                                                                                                                                                                                                                                                                                         |
| #100 | 77, step-free          | a mark per location mode (`LocationFollowing`, `LocationHeading` — multi-tone symbols from the revamp), `locationRevealOnChange`, `locationLabelPlacement`, `locationIcons`; step-free in the location control's place during a route; bundle budget 60 → 64 KB                                                                             |
| #103 | 59, 60, 61             | AIInputBar: focus-within ring, disabled field, `inputRef`, 44px send. AICompanionPanel: heading + `titleLevel`, a region named by it, focus in on open / back on close (`onOpenAutoFocus`, `onCloseAutoFocus`), 44px close target. `speakerLabel` on AIMessage/UserMessage — plus the WebKit spacing fix and a stories type fix from review |
| #104 | 67, 77 (native)        | iOS/Android: all control labels; `locationState` marks (SF Symbols / Material); reveal-on-change ported; step-free; the marker's label; the stepper's labels; Android's zoom divider no longer stretches                                                                                                                                    |
| #102 | 37 (web)               | `ChipGroup selectionMode="single"` — a Radix radio group; arrow keys move the choice, right to left too                                                                                                                                                                                                                                     |
| #105 | —                      | four docs pages imported icons from `lucide-react`; fixed, and `docs:snippets:check` now refuses it                                                                                                                                                                                                                                         |
| #106 | review fixes           | step-free is keyed apart from the location control (it had reused its node and announced itself); `ms-2`/`text-start`/`me-2` for MapControlButton's label and AIMessage's dots right to left                                                                                                                                                |
| #101 | 70 (web)               | the selected result comes into view: the nearest scroller (the sheet declares itself with `data-kozmos-scroller`), from the first render, the page last                                                                                                                                                                                     |
| #107 | 8                      | `appliedScope` on the search response, web + iOS + Android                                                                                                                                                                                                                                                                                  |
| #108 | 73 (native)            | iOS/Android `panelHeader`: under the grab handle, outside what scrolls, counted in every detent; a drag from it always moves the sheet; the header is read first; right to left in a side panel. `KozmosMapShellPanelHeaderTests` joins the simulator step                                                                                  |
| #109 | 73 (web)               | `panelHeader`; the fitted sheet counts its handle; a header keeps its first control 4 px clear of the handle's target (axe `target-size`)                                                                                                                                                                                                   |
| #111 | 56, 69 (native)        | Skeleton `shape`/`width`/`height` on iOS and Android (unset draws what it always drew); FloorSelector draws `resultCount` on the lists and says it on the level's button; Android gains a `KozmosFloorPresentation` overload; replaced the Skeleton and FloorSelector pages' stale Kotlin implementation copies with usage                  |
| #112 | 73 (docs)              | the sheet's docs page gains a React/SwiftUI/Compose `panelHeader` example — its first platform code; each example compiled against its platform                                                                                                                                                                                             |
| #113 | 69 (web), review fixes | React's FloorSelector says "1 result" and marks only a count above zero; Android's CategoryTile joins its count to its name, so TalkBack still says "Selected"                                                                                                                                                                              |

## 3. Open pull requests

| PR   | Rows         | State            | What it needs              |
| ---- | ------------ | ---------------- | -------------------------- |
| #110 | this handoff | last             | merge after the others     |
| #55  | website      | open since 09-22 | Olcay's; out of this scope |

#108, #109 and #111–#113 merged (§2). **Still in progress in this session** when this was written:
the Skeleton's one grey (decision 10) and the self-hosted visual review that replaces Chromatic
(decision 11) — look for their PRs before starting either. "UI Tests" (Chromatic) never completes on
any PR; ignore it.

## 4. Decisions Olcay made today

1. **GAP-021 is covered** by the unconfirmed list and its section title (row 5) — no per-result caveat. Row 7 → Done.
2. **Vue waits** — "we should do vue support properly; once all clean we'll start this." `@kozmos-ds/vue` stays 0.0.5, private (row 41).
3. **The location control's source** is Pointr's Location Tracking Buttons revamp, Figma `ce7phRJR1sCkH6zT8EMH8I`, page `1:237`.
4. **Step-free replaces the location button** in the same place during wayfinding, looking the same.
5. **The bottom-centre status toast is its own component** ("could be triggered with many things") — not built, no row yet.
6. **Bundle budget 64 KB**, with the measurements in `scripts/performance/bundle-analyzer.ts`.
7. I was cleared to run the Figma Sidebar Update myself; it had already been run (14:27Z).
8. **Changesets: one catch-up PR, then one in every PR.** The re-filed task writes the catch-up
   (react, icons, product-contracts together) and adds a check that asks every PR changing a
   published package for a changeset.
9. **Native Skeleton keeps an unset default shape** — existing iOS/Android loading states do not
   change; React's default stays `line`. A known platform difference, not a defect.
10. **The Skeleton is `background/200` on every surface** (Figma's `#C7CAD1` light, `#2E3138` dark):
    React (`bg-muted`, background-100), Android (background-100) and iOS (background-300) move to it.
11. **No paid Chromatic.** "I don't want to pay 180 monthly for 5000 credits" — Kozmos gets its own
    visual review instead: the Playwright suite `visual.yml` was built for (never switched on: no
    Linux baselines, 69 of 315 stories, May's macOS PNGs), extended to every story in both themes,
    baselines recorded in the Playwright Docker image and reviewed in the PR's own image diff.

## 5. Change list — rows moved

| Row        | Status      | Where it stands                                                              |
| ---------- | ----------- | ---------------------------------------------------------------------------- |
| 7          | Done        | GAP-021 closed by decision                                                   |
| 8          | Done        | `appliedScope` on web, iOS, Android (#107)                                   |
| 37         | In progress | web (#102); iOS, Android, Figma left                                         |
| 56         | Done        | web (#93) + native (#111); Figma's Shape axis was already there              |
| 59, 60, 61 | Done        | web (#103); the AI parts exist only in React — none on iOS, Android or Figma |
| 67         | Done        | web (#92) + native (#104)                                                    |
| 69         | In progress | web (#98, and "1 result" in #113) + native (#111); Figma's set has no marker |
| 70         | In progress | web (#101); the iOS and Android lists do not scroll to the selection         |
| 73         | In progress | web (#109) + native (#108), both merged; docs (#112); Figma left             |
| 77         | In progress | web (#100) + native (#104); Figma left                                       |

Unnumbered, for Olcay to number: the **step-free control**; the **bottom-centre map toast**; **#90's
controls-side change** (closest to row 78 / GAP-079); the review fixes (#105, #106, and #113's
Android category tile).

## 6. Questions for Olcay

1. **Register numbers** for the four unnumbered items in §5.
2. **Row 25**: in the 72 px rail tile, "SDK Configuration" and "User Management" need three lines even
   hyphenated, so the tile grows. Three lines, a wider tile, or smaller text?
3. **Floor stepper wording**: React says "Previous floor" / "Next floor"; iOS and Android "Floor up" /
   "Floor down" (the same buttons — previous is the up chevron). Pick one for all three.
4. **AICompanionPanel takes focus when it mounts** — a product rendering it open at page load sees
   focus move in unless it calls `preventDefault()` in `onOpenAutoFocus`. Intended?
5. **The grab handle's target**: a panel header now keeps 4 px under the 16 px handle (WCAG 2.5.8
   spacing). Panel _content_ that starts with a control, without a header, has always had the same
   16 px clear space. Move existing content down 4 px too, or leave it to the header?
6. **Row 15 (Japanese category names)**: break hints (zero-width spaces) in the taxonomy's Japanese
   translations — measured to work in all three engines — and/or let a tile take a third line
   rather than cut? (§7 has the measurements.)
7. **Chromatic's leftovers**, after decision 11: remove the Chromatic GitHub app or the
   `CHROMATIC_PROJECT_TOKEN` secret (so "UI Tests" stops pending on every PR), and make the new
   visual check required in branch protection once it has proved stable. Both are repository
   settings — yours.

Answered today and moved to §4: changesets (8), the native Skeleton default (9), the Skeleton grey
(10), Chromatic (11).

## 7. Not done, and why

- **No changesets since 0.4.0** — `.changeset/` holds only its config, so `changeset version` would
  bump nothing. Suggested task: "Write changesets for everything since 0.4.0" (re-filed with the
  list below). **Releasing react alone would break it for consumers**: published react 0.4.0 pins
  `"@kozmos-ds/icons": "0.3.0"` and `"@kozmos-ds/product-contracts": "0.3.0"` exactly (pnpm
  rewrites `workspace:*`), and main's react imports `LocationFollowing`/`LocationHeading` (icons,
  #100) and types props with `summary`, `resultCount` and `appliedScope` (contracts #96, #98, #107)
  — none in the pinned versions. Icons and product-contracts need changesets of their own; nothing in
  CI catches this, because inside the monorepo every import resolves to the workspace.
  Behaviour changes the react changeset must name: `controlsPadCamera` defaults to false (#95);
  `aria-current` replaces `aria-pressed` on the current result (#97); a mark per location state,
  and step-free replacing the location control (#100); the selected result scrolls into view by
  default (#101); AICompanionPanel takes focus on mount, is a region, its title an h2 (#103);
  AIMessage/UserMessage prepend English "Assistant said"/"You said" (#103 — products translate
  `speakerLabel`); a fitted sheet is 16 px taller (it counts its handle) (#109); FloorSelector says
  "1 result" (#113).
- **The docs' iOS and Android tabs are not compiled, and many are wrong.** `docs:snippets:check`
  resolves identifiers only; `docs:snippets:compile` compiles React recipes only. Compiling every
  native block against the packages (method in §9) found **72 blocks that copy an old
  implementation instead of showing usage** (61 Kotlin, 11 Swift — stale: the docs' `KozmosBadge`
  lacks `size`, `counter`, `showCounter`), and usage snippets that call APIs that do not exist:
  Swift Card, Dialog, Tooltip (`KozmosColors` members that are not there), FieldWrapper (argument
  order), ScrollArea (call shape), MapOverlay (`SearchBar`, both platforms), Kotlin Combobox and
  Listbox (callback shape). #111 fixed the Skeleton and FloorSelector pages; today's snippets
  (MapControlsGroup, FloorSelector, UserLocationMarker, the sheet in #112) all compile. Suggested
  task: "Fix the docs' iOS and Android snippets" (with the list and the method).
- **135 open Dependabot alerts** on this public repository (6 critical, 58 high). **None reach
  consumers**: `pnpm --filter <package> why <dep> --prod` finds none of the flagged packages in the
  production trees of the four published packages (control: it finds react's `clsx`, and finds
  `vitest` only without `--prod`); the lone production hit in any workspace is postcss in the
  private `apps/playground-vue`. The criticals are tooling: the Vitest UI server (installed 1.6.1,
  fixed in 3.2.6 — a major upgrade), handlebars, basic-ftp, shell-quote (transitive). Suggested task:
  "Triage the 135 Dependabot alerts".
- **Figma parity** for today's rows — MapControlsGroup has no state axis or step-free control; the
  two location symbols are not on the Icons page (the registry is the curated Figma set, and Curated
  Icons → Update orphans tints); ChipGroup single-choice and `panelHeader` have no counterpart;
  FloorSelector's set has no result marker (Figma already paints the Skeleton's chosen grey). React's Skeleton Code
  Connect still maps Shape to `className`. Suggested task: "Bring today's map and chip changes to Figma".
- **Native**: row 37 (single-choice chips), row 70 (scroll to the selection), rows 71, 76, 78. From
  #111: no fractional Skeleton width on iOS (`containerRelativeFrame` is iOS 17; Compose has
  `Modifier.fillMaxWidth(0.6f)`); the iOS marker's VoiceOver hiding is checked by structure, not by
  reading the accessibility tree (SwiftUI's cannot be read in `swift test`); Android still has no
  `collapsible` FloorSelector.
- **Right-to-left**: ~50 physical-direction classes remain in ~30 components; some are deliberate
  (LocationPin, #94). Suggested task: "Sweep React components for physical RTL spacing".
- **Rows 15 and 25** need decisions (§6). For row 15 I measured, and built nothing, because the
  obvious fix is wrong: at the tile's 75.5 px and 11 px (390 px board, 4 columns),
  - **ICU's `Intl.Segmenter` splits the problem word wrongly** — "カスタマーサービス" → カス | タマ | ー |
    サービス, "手荷物預かり所" → 手荷物 | 預 | か | り | 所 — so inserting its word breaks makes new
    mid-word breaks;
  - **`word-break: auto-phrase`** exists only in Chromium, where it changed nothing for these names;
  - **a zero-width space in the name** ("カスタマー\u200Bサービス") breaks as カスタマー / サービス in
    Chromium, Firefox and WebKit with today's CSS;
  - "インフォメーションセンター" needs three lines, so the two-line clamp cuts it — that is the "cut"
    half of GAP-010.
    So row 15 is a data-and-design call: break hints in the taxonomy's Japanese names, and/or a third
    line (or shrinking) for a name with none. Method, to reproduce: in Playwright, a `div` 75.5 px
    wide with `font-size: 11px`, `line-height: 14px`, `text-align: center`, `word-break: keep-all`,
    `overflow-wrap: break-word` and `text-wrap: balance`, `lang="ja"`; read each line from the
    per-character `Range.getClientRects()` tops, in Chromium, Firefox and WebKit.
- **A candidate row**: React's FloorSelector levels are toggle buttons (`aria-pressed`) — the
  pattern row 37 replaced for chips, because a one-of-several choice read as separate toggles. A
  level is one of several too; a radio group (Radix, as `ChipGroup selectionMode="single"`) would be
  announced as one choice, "2 of 5". iOS (`isSelected`) and Android (`selected`) already say it as a
  selection. Not changed: it moves keyboard behaviour (arrow keys, one Tab stop), so it wants a row.
- **Rows 58, 62, 63** (assistant polish) and the P3 dashboard batch (23–32) — not started.
- **Known differences between the platforms' sheets** (deliberate or pre-existing, recorded in #108):
  a drag that starts in a text field in the header moves the sheet on iOS (as Apple Maps does) but
  is left to the field on the web; native side panels add no top padding (the web's has 16); the
  web keeps a header's first control 4 px under the handle (WCAG 2.5.8 — no native equivalent);
  iOS measures a peek anchor in a scrolled list where it has scrolled to, where the web adds the
  scroll back; and when two offered detents resolve to one height, iOS and Android still draw a
  handle (they count the detents offered) where the web does not (it counts distinct heights).
  **The floor marker** (#111): flush in the native 40 square's corner where React's sits 2 px in on
  a 44 px button (on 40 the inset covered the label); Android's level squares now grow with the font
  scale, as iOS's already did. **Skeleton**: native `shape` defaults to unset, React's to `line`
  (decision 9).
- Suggested tasks pending in the app: focus-ring offsets in dark theme; Android sheet easing only
  between detents; Android sheet content overhanging by the handle; iOS shell render tests on CI;
  RTL sweep; changesets; Figma parity; the docs' native snippets; Dependabot.

## 8. Defects the review found (all fixed unless marked)

1. **WebKit ran the hidden speaker label into the message** — `innerText` "You saidWhere…" in WebKit
   only. A space after the span fixes all three engines; a comma does not fix WebKit. (#103)
2. **Step-free reused the location control's DOM node** and announced "Step-free, Off" on arrival. (#106)
3. **MapControlButton's label and AIMessage's dots touched their mark right to left** (`ml-2`, `mr-2`,
   `text-left`), measured 0 px. (#106)
4. **Row 70 treated any clipping box as a scroller** — now only boxes declaring `data-kozmos-scroller`. (#101)
5. **Row 70 never scrolled a list that appeared with a selection** — the pin-opens-results case. (#101)
6. **Row 70 never scrolled a list in the page's own flow.** (#101)
7. **Row 70's story overflowed at 320 px on CI** (DejaVu Sans). (#101)
8. **A small panel header raised the collapsed detent** (anchor rule's 24 % floor) — now a floor. (row 73)
9. **The web's fitted sheet forgot its handle** — 16 px short, where iOS counts the grabber. (row 73)
10. **The header's first control crowded the handle's target** — axe target-size. (row 73)
11. **Four docs pages imported from `lucide-react`.** (#105)
12. **React's FloorSelector said "1 results", and drew and said a negative count** ("-2", "Level 1,
    -2 results"); iOS and Android say "1 result" and mark only a count above zero. (#113)
13. **Android's CategoryTile hid "Selected"**: its count was the tile's state description, which in
    Compose replaces the "Selected" TalkBack would say — a chosen category with results was never
    said to be chosen. Found by #111's agent; the count now joins the name. (#113)
14. **The sheet's docs page had no platform code**, so #108's `panelHeader` was documented nowhere
    on iOS or Android. (#112)
15. **72 of the docs' native tabs are stale implementation copies, and 8 usage snippets do not
    compile** (§7). _Not fixed_ — suggested task.
16. **The Skeleton's grey differs on every surface** (Figma 200, React and Android 100, iOS 300).
    Decided: background/200 everywhere (decision 10), in progress.
17. **A react release would pin icons and contracts that lack what it imports** (§7). _Not fixed_ —
    the changesets task.
18. **An iOS FloorSelector render test had never run on CI** — it needs a simulator, and its suite
    was not in the simulator step. #111 added both Skeleton and FloorSelector suites to it.

## 9. Traps met today, with the evidence

- `textContent` is not what a screen reader hears — measure `innerText` in Chromium, WebKit **and**
  Firefox; WebKit alone differed.
- A transitioned margin moves after a `dir` flip — await `el.getAnimations()` before measuring.
- Two elements of the same type at the same JSX position are one instance to React — key distinct
  controls apart.
- An RTL arrow-key test with two items proves nothing (wrapping); use three and start in the middle.
- Radix radio groups check an item on arrow focus only while the key is held; the Tab stop is the group.
- Deciding the handle from a height that includes the handle can loop — decide it first.
- `mock.contexts` does not exist in this Vitest (use `mock.instances`); jsdom has no
  `document.scrollingElement`; zsh has no `PIPESTATUS`.
- **The simulator step names its classes** (`-only-testing:` in `scripts/check-ios-poi.mjs`), and a
  wrong name runs nothing and passes. ci-local shows only PASS. Read the bundle:
  ```bash
  R=$(ls -dt "$TMPDIR"/kozmos-ios-poi-* | head -1)/TestResults.xcresult
  xcrun xcresulttool get test-results summary --path "$R"   # totals and device
  xcrun xcresulttool get test-results tests --path "$R"     # every test case by name
  ```
  Android's names are in `packages/android/build/test-results/testDebugUnitTest/TEST-*.xml`; a 1 s
  "Test Android Library" means Gradle found the task up to date — check the XMLs post-date the last
  Android commit.
- **A fresh worktree needs `pnpm install`** before `ci-local` (it imports `yaml`), and
  `packages/android/local.properties` (`sdk.dir=…`, git-ignored). A background
  `(a; b; echo done)` reports `echo`'s exit code — record each command's own.
- **In Compose, a `stateDescription` replaces the "Selected"/"Not selected" TalkBack would say.**
  Put a count in the `contentDescription`.
- **Compiling native docs snippets**: extract each `swift={`…`}`/`kotlin={`…`}` and fenced block;
  put Swift in `packages/ios/Tests/KozmosTests/DocSnippets/` (wrap fragments in a `View`, stub the
  product's names) and run `swift build --build-tests`; put Kotlin in
  `packages/android/src/test/java/com/kozmos/docsnippets/` (one package per block) and run
  `./gradlew compileDebugUnitTestKotlin`. Add a bogus argument to prove the build reads the file,
  then remove the files.
- **The Figma token cannot read variables** (403 on `/variables/local` and `/published`). To learn
  what a node binds, read the stored colour with `scripts/figma-rest/bindings.mjs <node>` and the
  importer's painter in `figma/foundations-importer/code.js` (the Skeleton's fill is
  `Colors/background/200`, set through `paintFromVariable`).

## 10. Worktrees and branches

| Worktree                                                      | Branch                                                    | Keep?                                  |
| ------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------- |
| `/Volumes/4TB Depo/development/K/kozmos-design-system-rows`   | `claude/review-fixes-counts` (#113)                       | until #113 merges; reusable after      |
| `/Volumes/4TB Depo/development/K/kozmos-design-system-fixes`  | `claude/handoff-2026-09-27-evening` (#110)                | until #110 merges; reusable for audits |
| `/Volumes/4TB Depo/development/K/kozmos-design-system-verify` | detached at #111's head                                   | reusable for independent native runs   |
| `…-dev/.claude/worktrees/agent-aa4c7fb6466229ce3`             | `claude/ai-companion-a11y` (#103, merged)                 | removable                              |
| `…-dev/.claude/worktrees/agent-a2e1700fae2b449ea`             | `claude/native-map-controls` (#104, merged)               | removable                              |
| `…-dev/.claude/worktrees/agent-acda202df3316e1f4`             | `claude/native-sheet-panel-header` (#108, merged)         | removable                              |
| `…-dev/.claude/worktrees/agent-a885586f381f0bce5`             | `claude/native-skeleton-and-floor-results` (#111, merged) | removable                              |

#112's branch, `claude/sheet-docs-platforms`, has no worktree of its own: to change it,
`git -C <rows> switch claude/sheet-docs-platforms` once #113 has merged.

Removing a worktree is `git worktree remove <path>` once its branch is merged — never `rm -rf` a
project directory. Branches stay (never deleted).

## 11. Making a change yourself — where things live

| Feature                           | Files                                                                                                                                                                                                                        | Verify                                                                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Location control, step-free (web) | `packages/react/src/components/MapControlsGroup/*`, `MapControlButton/*`, `hooks/useRevealOnChange.ts`                                                                                                                       | `cd packages/react && npx vitest run src/components/MapControlsGroup`; `node scripts/check-owned-css.mjs`                    |
| Location symbols                  | `packages/icons/src/owned/icons.ts`, `owned/createSymbolIcon.tsx`                                                                                                                                                            | `pnpm --filter @kozmos-ds/icons build` first — React tests read `dist`                                                       |
| Native map controls               | iOS `packages/ios/Sources/Components/MapControlsGroup/*`, `MapControlButton/*` (`RevealOnChange.swift`); Android `…/components/MapControlsGroup/*`, `MapControlButton/*` (`RevealOnChange.kt`)                               | `cd packages/ios && swift test --filter KozmosMapControlsGroupTests`; `node scripts/ci-local.mjs --job android`              |
| Scroll selected into view         | `POIResultList.tsx` (`scrollerOf`, `revealWithin`); `data-kozmos-scroller` on the sheet content in `AdaptiveMapShell.tsx`                                                                                                    | unit tests; `node scripts/check-adaptive-edge-cases.mjs` with `ADAPTIVE_BROWSER=chromium\|webkit\|firefox`                   |
| Panel header, detents             | `AdaptiveMapShell.tsx` (`measurePeekBottom`, `measureHeaderBottom`, `showsHandle`, `drawsHandle`), `panel-detents.ts` (`headerBottom`)                                                                                       | `panel-detents.test.ts`; adaptive edge cases; Storybook audit `STORY_FILTER=adaptivemapshell`; `test:map-sheet`              |
| Single-choice chips               | `Chip/Chip.tsx` (`ChipGroup` `selectionMode`)                                                                                                                                                                                | `npx vitest run src/components/Chip`                                                                                         |
| Search scope contract             | `packages/product-contracts/src/index.ts`, `packages/ios/Sources/ProductContracts/ProductContracts.swift`, `packages/android/…/contracts/ProductContracts.kt`                                                                | `pnpm contracts:parity:check`; `swift test --filter ProductContractsTests`                                                   |
| AI parts                          | `AIInputBar`, `AICompanionPanel`, `AIMessage`, `UserMessage`; close target in `styles/owned-components.css`                                                                                                                  | their tests                                                                                                                  |
| RTL and owned-CSS checks          | `packages/react/tests/integration/owned-css-host.tsx`, `scripts/check-owned-css.mjs`                                                                                                                                         | `node scripts/check-owned-css.mjs`                                                                                           |
| Docs import guard                 | `scripts/check-doc-snippets.mjs`                                                                                                                                                                                             | `pnpm docs:snippets:check`                                                                                                   |
| Bundle budget                     | `scripts/performance/bundle-analyzer.ts`                                                                                                                                                                                     | `pnpm tsx scripts/performance/bundle-analyzer.ts`                                                                            |
| Panel header (native)             | iOS `packages/ios/Sources/Components/AdaptiveMapShell/AdaptiveMapShell.swift` (`panelHeader:`), `KozmosPanelScrollView.swift`; Android `…/AdaptiveMapShell/AdaptiveMapShell.kt`, `PanelDetents.kt`                           | `swift test --filter KozmosMapPanelDetentTests`; simulator step (`KozmosMapShellPanelHeaderTests`); `ci-local --job android` |
| Skeleton, floor marker (native)   | iOS `…/Components/Skeleton/Skeleton.swift`, `…/FloorSelector/FloorSelector.swift`; Android `…/components/Skeleton/Skeleton.kt`, `…/FloorSelector/FloorSelector.kt`; tests draw through `Tests/KozmosTests/DrawnPixels.swift` | `swift test --filter "KozmosSkeletonTests\|KozmosFloorSelectorTests"`; simulator step; `ci-local --job android` (goldens)    |
| Floor count wording (web)         | `FloorSelector/FloorSelector.tsx` (`markedResultCount`, `resultCountLabel`)                                                                                                                                                  | `npx vitest run src/components/FloorSelector`                                                                                |
| Category tile, TalkBack           | `packages/android/…/CategoryTile/CategoryTile.kt`; the reader `src/test/java/com/kozmos/components/SemanticsReading.kt`                                                                                                      | `./gradlew verifyPaparazziDebug --tests 'com.kozmos.components.categorytile.*'`                                              |
| Docs platform code                | the `PlatformSnippets` block in each `*.mdx`; `scripts/lib/doc-snippets.mjs`                                                                                                                                                 | `pnpm docs:snippets:check`; `pnpm docs:snippets:compile` (React); native by hand (§9)                                        |

## 12. How to resume

```bash
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-dev"
git checkout main && git pull --ff-only && git log --oneline -1   # expect 0124ab98 or later
pnpm install
pnpm exec turbo run build --filter=@kozmos-ds/react...
node scripts/ci-local.mjs --job web                              # expect 43 passed, 0 failed
```

Then §3 (open PRs), §6 (questions), and the suggested tasks in §7.
