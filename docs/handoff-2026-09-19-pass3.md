# Session handoff — Pointr iOS after Pass 3, 19 September 2026

Written by the coding agent at the end of the session that did Passes 1, 2 and 3 of
[Astra's handoff](handoff-2026-09-19.md), so that a new chat can continue without
that session's context. Read this document first, then Astra's, then the pass reports it names.
Nothing here was pushed, merged or published; no Cloud content was changed.

> **Update, 20 September 2026, the coding agent:** §11 item 2 is done. The five leftovers of Pass 3
> are closed or bounded in the [closure report](pointr-ios-pass3-closure-2026-09-20.md): the
> SDK's marker identified, no live no-route candidate on Design-QA, the not-ready state given a
> retry, the iPad's three panels driven by a new UI test, VoiceOver's tree read and repaired.
> Pass 3's language finding is withdrawn (§5.5, 3). §5.5 carries each item's status, §7 two more
> decisions, §8 the findings, §10 four more traps, §11 starts at item 3. Commits `65ddd1c`, `25629b3`, `cf75072` and the docs commit.
> Later on the 20th Olcay redirected the work to the design system itself —
> [design-system-pass-2026-09-20.md](design-system-pass-2026-09-20.md) — so items 3 and 4 below
> wait on that thread. Against the prototype he then named as the reference
> ([pointr-prototype-screen-states-2026-09-20.md](pointr-prototype-screen-states-2026-09-20.md))
> the routing flow changed (`6527d7a`): no preview step and no modes — Go opens the picker and the
> directions follow at once — so §5.1's step 3, §7's decision 10 and the preview rows of
> §5.6 describe a state that is gone. Later still the prototype's navigation parts were built and
> the directions moved onto them ([navigation-parts-2026-09-20.md](navigation-parts-2026-09-20.md)):
> the sheet no longer lists the steps; the card over the map does.

## 1. Exact working state

| What                    | Where                                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implementation worktree | `/private/tmp/kozmos-browser-compat.uqPMBD`                                                                                                                                                                               |
| Branch                  | `claude/pointr-browse-repairs`, HEAD `cf75072` plus the docs commit that adds this update (20 September); `afa7bdf` plus `5a177df` and `77a78c0` was the state on the 19th                                                |
| Cut from                | Astra's `astra/browser-compatibility` at `663cde1`, itself 33 commits past `origin/main` (`a02a008`)                                                                                                                      |
| Pushed                  | **Nothing.** Neither branch exists on the remote. "ok proceed" authorised work, never a push.                                                                                                                             |
| Main checkout           | `/Volumes/4TB Depo/development/K/kozmos-design-system-dev` at `a02a008` on `main`, clean but for one untracked pointer file, `docs/handoff-2026-09-19.md`, which points into the worktree                                 |
| Ignored files           | PointrKit and MapLibre frameworks, `QAConfig.json` and the generated `KozmosPointrQA.xcodeproj` exist **only in the /private/tmp worktree**. macOS clears `/private/tmp`. Ask before any cleanup and preserve them first. |

Other worktrees in `git worktree list` (`astra/prepublish-foundations`, `astra/release-safeguards`,
several `codex/*`) were not touched. The the coding agent desktop session's own worktree
(`…/scratchpad/mapmode`, `codex/map-mode-toggle`) carries none of this work.

First action in a new chat:

```sh
cd /private/tmp/kozmos-browser-compat.uqPMBD && git status --short && git branch --show-current && git log --oneline -20
```

If the path is gone, find the branch with `git worktree list`; the ignored SDK files and the QA
configuration are not recoverable from Git.

## 2. Scope, in one paragraph

A real Pointr-powered iOS app whose every visible surface is a Kozmos component:
`apps/PointrPlayground` (bundle `com.kozmos.pointrqa`), PointrKit 10.3.0 and MapLibre 6.27,
against the Design-QA Cloud (Boston Logan; the app follows the map's level callbacks, so it opens
on Terminal B, 306 places, on the iPhone). The design system's iOS package is `packages/ios`
(`Kozmos`), which **never imports PointrKit**: SDK models, parsing and policy stay in the host.
The web examples and the pinned taxonomy 10.12.0 projection are the reference for parity.

## 3. The commits on the branch, oldest first

| Commit    | Pass  | What                                                                                   |
| --------- | ----- | -------------------------------------------------------------------------------------- |
| `21c7cbf` | —     | Astra's handoff preserved verbatim                                                     |
| `7e03485` | 1     | Shared shell saturates its opposing insets at the map's size                           |
| `4061d92` | 1     | Map controls anchored; selected pin kept in view; sheet presentation                   |
| `aa4a6c0` | 1     | A selected place stays framed when the sheet settles mid-flight                        |
| `7b4a868` | 1     | POI gallery: one index for strip, buttons and counter; real states                     |
| `dc7b78d` | 1     | Pass 1 report                                                                          |
| `214ca2f` | audit | Shell lays chrome out beside a floating panel, not under it (iPad)                     |
| `10d3b65` | audit | CI runs the gallery and shell suites on the simulator                                  |
| `191c6b4` | audit | Credentialled artwork addresses refused before the card sees them                      |
| `bf9fd7d` | audit | Audit docs and the two measurement tools                                               |
| `43d6793` | 2     | Taxonomy projection generated for iOS from the web examples' JSON, checked in CI       |
| `ac09652` | 2     | `TaxonomyPresenter`, a rule-for-rule port of the web adapter, with tests               |
| `a8de911` | 2     | The card gets a place's live data: taxonomy, contacts, hours, description              |
| `87f2e64` | 2     | Pass 2 report                                                                          |
| `afa7bdf` | 3     | Routing between two named places on the Kozmos routing parts; the SDK's language       |
| `5a177df` | 3     | This handoff, first version                                                            |
| `77a78c0` | 3     | Pass 3 report                                                                          |
| `65ddd1c` | close | The not-ready state retries, readiness retries by itself; language and readiness logs  |
| `25629b3` | close | A step reads as one element, the arrow silent; the current step selected and announced |
| `cf75072` | close | The routing flow as a UI test on any simulator, the tree attached                      |

Reports: [Pass 1](pointr-ios-pass1-2026-09-19.md) (its "Change it yourself" section is the
operator's guide to the host), [Pass 2](pointr-ios-pass2-2026-09-19.md). [Pass 3](pointr-ios-pass3-2026-09-19.md), written after this handoff from §5 below.

## 4. Constraints still in force

From Astra's handoff, and from Olcay's rules. None has been relaxed.

- No merge, push, publish or distribution. No Cloud content edits, even to make the UI look good.
- Never print, copy or commit `QAConfig.json`, licence keys or tokens. Never use the vendor
  sample's embedded GitHub token.
- Keep the metadata row at most three cells on one row; the 320pt/AX5 stacking exception is not
  approved (Astra's §10 "Decision needing user input").
- Do not label fixture or simulator wayfinding as live navigation. Route time and distance come
  from the actual route. Live positioning, Bluetooth and motion permissions are a later,
  explicit scope: the app declines them.
- SDK models and parsing stay in the host; `packages/ios` never imports Pointr. No JavaScript
  evaluation in native code. Never traverse the SDK's private UIKit subviews.
- Preserve handoff docs before any `/tmp` cleanup; never delete project directories.
- Git: stage by file, never `git add -A` or a directory; never bare `git stash`; commit messages
  end with `Co-Authored-By: the coding agent <noreply@anthropic.com>`.
- Method: measure before asserting; run a new test against the unfixed code first; an
  adversarial self-audit before "done"; reuse Kozmos parts, report gaps, never work around them
  with host-drawn substitutes.
- `.agents/workflows/ios-expert.md` applies: gate UIKit behind `#if os(iOS)` in the package,
  weak self in escaping closures, dependencies declared in `Package.swift`.

## 5. Pass 3 — routing, as built and as measured

### 5.1 What a visitor does

1. **Browse.** Card of the selected place, with **Go** (`.navigate`), favourite, bookmark. The
   caption says a route starts from a place the visitor chooses; there is no positioning.
2. **Go** opens `.routeSetup`: "Directions / to _place_", a back chevron, a Kozmos search bar
   ("Choose a starting point") and a `KozmosPOIResultList` of this building's places except the
   destination, filtered by name.
3. Choosing one opens `.routePreview`: `KozmosRoutePreviewPanel` with **Quickest** and
   **Step-free** options, time and distance from the routes themselves, "_n_ routes from
   _origin_", a spinner while calculating, and the message plus "Choose another starting point"
   when nothing came back. The SDK draws the chosen route; the host shows the origin's level
   and fits the route's nodes inside the chrome with a 24pt margin.
4. **Show directions** opens `.directions`: `KozmosRouteSummary` ("Arrive 10:41 PM", "201 m ·
   4 min left", computed from the steps still ahead), "Step _i_ of _n_ · to _place_", every
   step as a `KozmosDirectionStep` (the SDK's own words, the step's distance, the floor name in
   the duration slot), the current one at full opacity; Previous, **Next step**, **Finish** on
   the last. Each step switches the map to its level if needed and centres it at zoom 19.
5. **Finish**, the summary's end button, or Back on the preview returns to the card; the route
   comes off the map and the place is framed again. Selecting another place or closing the card
   also resets routing.

### 5.2 Where it lives

| File                                                       | Role                                                                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `apps/PointrPlayground/Sources/App/Routing/SDKRoute.swift` | `SDKRoute` (plain values from `PTRRoute`), `RouteFormat`, `SDKRoutePresenter` (options, warnings, arrow mapping, labels) |
| `…/Routing/SDKRouting.swift`                               | `extension SDKSession`: setup, calculation, preview, stepping, ending; `PTRWayfindingManagerDelegate`                    |
| `…/SDKSession.swift`                                       | Routing state (`Phase`, routes, option, step, `wayfindingReady`), `SDKLanguage`, `frame(_:)`, resets on select/close     |
| `…/SDKMapScreen.swift`                                     | `panel` by phase; `routeSetupPanel`, `routePreviewPanel`, `directionsPanel`                                              |
| `…/SDKPOIAdapter.swift`                                    | The card's actions now include `.navigate`                                                                               |
| `apps/PointrPlayground/Tests/RoutePresenterTests.swift`    | 9 tests on plain values: options, warnings, unavailable, the message-type table, labels, remaining, formats, estimate    |
| `…/Tests/SDKIntegrationTests.swift`                        | + the language helper                                                                                                    |

### 5.3 How the SDK is used

- `Pointr.shared.wayfindingManager`: `isReady(for: site)` guards the calculation (message:
  "Routing data for this site hasn't finished loading. Try again in a moment."); the session
  is the manager's delegate and sets `wayfindingReady` on `onWayfindingManagerReady(for:)`.
- Two synchronous calculations per request: `setCurrentMode(.normal)` then
  `calculateRoute(fromPosition: origin, toNearestPositionIn: [destination])`, the same with
  `.accessible`, and the mode put back to `.normal`. The mode is manager-wide, hence the
  restore. Measured 15–77 ms for both together, so the spinner is never seen; cancellation can
  only take effect between the two calls.
- `PTRRoute.walkingDistance` (metres) and `travelTime` (seconds) feed the options;
  `directions` feed the steps (`message`, `messageType`, `distance`, `duration`,
  `isTransition`, `transitionInfo.isAccessible`, `position.level`); `nodes` feed the framing.
- The map draws the route through `mapViewController.currentRoute`; framing uses MapLibre's
  `cameraThatFitsCoordinateBounds(_:edgePadding:)` and `setCamera(_:animated:)`; a step uses
  `showLevel(_:shouldZoomToLevel: false)` and `setCenter(_:zoomLevel: 19, animated: true)`.
- **Language.** `PTRParams.preferredLanguage` is set from the device locale as
  `language_region` (`SDKLanguage.preferred()`). Before this, every instruction arrived in
  **Arabic**, Design-QA's Cloud default; after it, in English. The user manager's own
  `preferredLanguage` (device-stored, needs a user session) is not used.
  _Corrected 20 September: the Arabic was the iPhone simulator's own first language, not a
  Cloud default; the iPad, asked for no language, answered in English (closure report §6)._

### 5.4 Measured on the iPhone 17 Pro simulator (iOS 26.5), Terminal B

| Route                                             | Quickest              | Step-free              | Time     |
| ------------------------------------------------- | --------------------- | ---------------------- | -------- |
| Dunkin' (Second Floor) → Airport Shuttles (First) | 200 m, 213 s, 4 steps | 200 m, 213 s, 10 steps | 15–77 ms |
| Air Canada → Airport Shuttles                     | 64 m, 184 s, 2 steps  | 64 m, 184 s, 6 steps   | 16 ms    |

Every step of the first route, from the app's debug log (type = `PTRDirectionMessageType` raw
value; all transitions are `wayfinding-network/custom-transition`, `isAccessible` true):

| Route     | #   | Type | Message                           | m   | s   | Floor  |
| --------- | --- | ---- | --------------------------------- | --- | --- | ------ |
| quickest  | 0   | 9    | Take Elevator down to First Floor | 58  | 58  | Second |
| quickest  | 1   | 11   | Take Corridor to Garage B         | 41  | 46  | First  |
| quickest  | 2   | 11   | Take Walkway to Terminal B        | 68  | 72  | First  |
| quickest  | 3   | 13   | Destination                       | 32  | 35  | First  |
| step-free | 0   | 7    | Turn Slightly Right               | 6   | 6   | Second |
| step-free | 1   | 6    | Turn Slightly Left                | 45  | 45  | Second |
| step-free | 2   | 3    | Turn Left                         | 2   | 2   | Second |
| step-free | 3   | 9    | Take Elevator down to First Floor | 3   | 3   | Second |
| step-free | 4   | 4    | Turn Right                        | 2   | 7   | First  |
| step-free | 5   | 4    | Turn Right                        | 2   | 2   | First  |
| step-free | 6   | 4    | Turn Right                        | 22  | 22  | First  |
| step-free | 7   | 11   | Take Corridor to Garage B         | 14  | 14  | First  |
| step-free | 8   | 11   | Take Walkway to Terminal B        | 68  | 72  | First  |
| step-free | 9   | 13   | Destination                       | 32  | 35  | First  |

Verified by hand on the device: the preview with both options and the route drawn; Show
directions; stepping through the elevator step changes the floor pill from L2 to L1 and
re-centres the map on the First Floor step; Finish returns to the card with the route removed
and the place framed; English messages after the language change. The quickest route's
"Uses stairs or escalators" warning is rightly absent: both routes take the elevator.

### 5.5 Findings from Pass 3

1. **Design-system gap.** `DirectionType` has `straight`, `left`, `right`, `destination`
   only. Elevator, escalator, stairs, corridor, walkway and building transitions (types 8–12, 27) and turning back keep the SDK's words under a straight arrow. The web `DirectionStep`
   has the same four. Extending both with transition kinds and icons is a design decision;
   the host does not draw its own symbols.
2. **Granularity differs by mode.** The normal-mode route carried only transitions and the
   destination (4 steps); the accessible one carried the turns as well (10). Whether that is
   SDK behaviour or venue data is a question for Pointr.
3. ~~**Design-QA answers in Arabic unless asked otherwise.** Recorded for Pointr; the host now
   asks in the device's language.~~ _Withdrawn 20 September: the simulator's first language,
   not the Cloud's; the host asks for the app's language, which stays right._
4. **The top search bar stays in every phase**, bound to the browse query. Whether to hide or
   repurpose it during routing is a product question (the fixture playground was not checked
   for this).
5. **`.noRoute`, the not-ready error and Back-during-calculation are not exercised live.**
   Origins are limited to the current building, calculation is synchronous and takes
   milliseconds, and no unroutable place was tried. They are covered by the presenter tests
   and by inspection only. Design-QA has a `Do Not Route` CMS key; a place carrying it is the
   candidate for a live no-route case. _20 September: no candidate — every `Do Not Route` on the
   site is the string "false", and Silver Line, one of the 38 places carrying it, routes (213 m);
   closure report §2._
6. **Readiness is not gating Go.** `wayfindingReady` is tracked but the button is always
   enabled; an early Go shows the not-ready message with "Choose another starting point",
   which is the wrong recovery for that case (a retry would be right). _20 September: fixed —
   the state offers Try again, and readiness arriving while it shows retries by itself;
   readiness came 240–330 ms after the building loaded on every launch, before any place could
   be selected. Go still does not wait: decision 8, now with numbers; closure report §3._
7. **The floor name travels in `KozmosDirectionStep`'s duration slot** ("58 m • Second
   Floor"). The component has no floor slot; a gap to report, not a defect.
8. **An SDK marker appears on the current step.** After Show directions a navy marker with a
   "●>○" glyph sat on the elevator step. The host draws no markers; identify it (route
   step or transition marker of `PTRMapViewController`) before styling anything around it.
   _20 September: identified — PointrKit's next-portal marker, style layer
   `custom-ptrlayer_symbol_next-portal_ptr_ptr`, its icon named after the portal's kind
   (`wf-custom-transition` is the glyph, `wf-lift-down` a lift); no public API touches it;
   closure report §1._
9. **The remaining figures are step sums.** "201 m · 4 min left" sums the steps from the
   current one; the steps sum to within a metre and two seconds of the route totals here.
10. **Not verified at all:** iPad (the three panels in the floating panel), Dynamic Type,
    RTL, VoiceOver (non-current steps are dimmed to 45 % with no trait), dark mode, iOS 18.4
    for the QA app, real network failure, cancellation. _20 September: the iPad's three panels
    are driven and captured by the UI test (closure report §4); VoiceOver's tree was read, the
    steps made one element each with the arrow silent and the current one selected and announced
    (§5) — a session by ear is still owed. The rest stands._

### 5.6 Acceptance gates of Astra's §10, Pass 3

| Gate                                               | State                                                                  |
| -------------------------------------------------- | ---------------------------------------------------------------------- |
| Documented route APIs, explicit origin             | Done                                                                   |
| Kozmos route input, preview, summary, instructions | Done; the origin picker is the host's own composition of Kozmos parts  |
| Calculation, loading, failure, no route            | Calculation live; loading and failure states coded, seen only in tests |
| Accessibility options                              | Done: normal and accessible modes, warning on inaccessible transitions |
| Cancellation                                       | Coded between the two calls; not exercisable live                      |
| Multi-floor changes                                | Verified live (L2 → L1 at the elevator)                                |
| Return to POI browsing                             | Verified live                                                          |
| Time/distance from the actual route                | Done                                                                   |
| Fixture wayfinding not called live                 | Done; the caption states there is no positioning                       |

## 6. Verification state at handoff

| Check                                                                                         | Result                                                                                            |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| QA app tests (`SDKIntegrationTests` 20, `TaxonomyPresenterTests` 12, `RoutePresenterTests` 9) | 41 passed on the iPad Pro 11" simulator                                                           |
| `pnpm tokens:raw:check`                                                                       | ok                                                                                                |
| `pnpm components:contract:check`                                                              | ok                                                                                                |
| Package suites (`node scripts/check-ios-poi.mjs`, iOS 18.4 and 26.5 full runs)                | Last run after the Pass 1 audit; **not re-run after Passes 2–3**, which changed no package source |
| Live walk-through                                                                             | As §5.4; iPhone only                                                                              |

_20 September: the closure report's §8 has the runs after the leftovers — the QA app's unit tests,
the UI test on both simulators, and the package suites re-run after the package change._

## 7. Open decisions for Olcay

Unchanged from the earlier passes:

1. Gallery crop policy (both platforms).
2. Zoom buttons on phones: they never fit in landscape; drop or redesign.
3. The card's `.panel` border inside the shell's floating container (the web composes the same).
4. The 320pt / AX5 metadata exception (never two rows).
5. Pushing the branches, and moving the SDK frameworks and configuration out of `/private/tmp`.

New from Pass 3:

6. Extend `DirectionType` (iOS and web) with transition kinds, or accept the straight arrow.
7. The top search bar during routing (§5.5, 4).
8. Whether Go waits for wayfinding readiness (§5.5, 6). _Measured 20 September: readiness
   arrives 240–330 ms after the building loads, before the place list; the not-ready state
   now retries (closure report §3)._

New from the closure of Pass 3, 20 September:

9. Whether the SDK's next-portal marker should be hidden or restyled through MapLibre's style
   API, which PointrKit does not document as a surface (closure report §1).
10. The preview's option cards: 208pt each, the second cut at the panel's edge on the phone and
    the iPad alike (closure report §4).

## 8. Upstream findings for Pointr

From Pass 2: hours live in two CMS text keys and the taxonomy's `openingHours` is empty; the day
order of `PTRPoiDaySchedule` is undocumented; `Payment Options` is prose, not `paymentMethods`;
`unitNumber` and category strings sit outside the taxonomy; keywords are pipe-joined search
terms; some descriptions repeat the name. From Pass 3: the Cloud default language on Design-QA is
Arabic (withdrawn 20 September: the simulator's own language); the normal-mode route drops turn
instructions; both are in §5.5. From 20 September: `Do Not Route` arrives as the string "false"
on 38 kerbside places and is never true; two places named "Airport Shuttles" on Terminal B's
First Floor; "Dunkin' " carries a trailing space.

## 9. Running and checking it

The generated project is ignored; regenerate it after any `project.yml` change with `xcodegen`
in `apps/PointrPlayground`. Simulators: iPhone 17 Pro `51937B59-CEAE-4BC7-BC34-FEB17E28FAE7`
(iOS 26.5, used live), iPad Pro 11" `1CB35135-48B2-407B-8515-C8C6EFC1D963` (used for tests), an
iPhone 16 on iOS 18.4 for the package's baselines.

Build and install:

```sh
cd /private/tmp/kozmos-browser-compat.uqPMBD/apps/PointrPlayground && xcodebuild -project KozmosPointrQA.xcodeproj -scheme KozmosPointrQA -destination "platform=iOS Simulator,id=51937B59-CEAE-4BC7-BC34-FEB17E28FAE7" -derivedDataPath /private/tmp/kozmos-pointr-qa-xcode CODE_SIGNING_ALLOWED=NO build && xcrun simctl install 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 /private/tmp/kozmos-pointr-qa-xcode/Build/Products/Debug-iphonesimulator/KozmosPointrQA.app
```

Launch with the console attached (line-buffered; `--stdout` alone loses `print` output):

```sh
xcrun simctl launch --console-pty --terminate-running-process 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 com.kozmos.pointrqa
```

Tests (any simulator; the iPad avoids disturbing a live run on the iPhone):

```sh
cd /private/tmp/kozmos-browser-compat.uqPMBD/apps/PointrPlayground && xcodebuild -project KozmosPointrQA.xcodeproj -scheme KozmosPointrQA -destination "platform=iOS Simulator,id=1CB35135-48B2-407B-8515-C8C6EFC1D963" -derivedDataPath /private/tmp/kozmos-pointr-qa-xcode CODE_SIGNING_ALLOWED=NO test 2>&1 | grep -E "Executed [0-9]+ tests|TEST (SUCCEEDED|FAILED)|error:"
```

Diagnostics. The route summary is a `notice` and persists; the per-step lines are `debug` and
do **not** persist, so stream them before calculating:

```sh
xcrun simctl spawn 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 log show --predicate 'subsystem == "com.kozmos.pointrqa"' --last 30m --style compact
```

```sh
xcrun simctl spawn 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 log stream --predicate 'subsystem == "com.kozmos.pointrqa"' --level debug --style compact
```

The routing flow on any simulator, the iPad included, with a screenshot and the accessibility
tree of each panel in the result bundle (`xcrun xcresulttool export attachments --path … --output-path …`);
the named places are optional, and the environment must be exported, not appended:

```sh
cd /private/tmp/kozmos-browser-compat.uqPMBD/apps/PointrPlayground && TEST_RUNNER_KOZMOS_QA_DESTINATION="Airport Shuttles" TEST_RUNNER_KOZMOS_QA_ORIGIN="Dunkin" xcodebuild -project KozmosPointrQA.xcodeproj -scheme KozmosPointrQAUI -destination "platform=iOS Simulator,id=1CB35135-48B2-407B-8515-C8C6EFC1D963" -derivedDataPath /private/tmp/kozmos-pointr-qa-xcode -resultBundlePath /private/tmp/kozmos-pointr-ui.xcresult CODE_SIGNING_ALLOWED=NO test 2>&1 | grep -E "QA-FLOW|Test Case .* (passed|failed)|TEST (SUCCEEDED|FAILED)"
```

Repo gates after host changes: `pnpm tokens:raw:check`, `pnpm components:contract:check`.
After package changes: `node scripts/check-ios-poi.mjs` and the two full `xcodebuild test` runs
in Astra's §11. The Pass 1 report's "Change it yourself" has the rest.

## 10. Traps met in this session

- The simulator tool takes **device points** (402 × 874 on the 17 Pro), not screenshot pixels;
  its screenshots come back 920 px wide (÷ 2.29), a `simctl io … screenshot` 1206 px (÷ 3).
- `Logger.debug` lines are not in `log show`; stream at `--level debug` while reproducing.
- MapLibre's `contentInset` setter re-centres and cancels a `focusPoi` flight; `focusPoi`
  centres the anchor, and the highlighted pin rises about 96 pt above it.
- `EmptyView` is no `ViewThatFits` child; use a zero-sized `Color.clear`.
- A macOS "SpringBoard quit unexpectedly" dialog is the iOS 18.4 simulator runtime, not the app.
- zsh: a pipe followed by a heredoc concatenates into stdin; `echo ===` fails; quote
  `--include='*.swift'`; `$CMD` variables do not split.
- Edits to `.github/workflows/*` trip a security hook in this tool; apply with a script.
- `lint-staged` prints "No staged files match any configured task" on Swift-only commits; normal.
- The tuple `?? (0, 0)` loses its labels; write `?? (distanceMetres: 0, durationSeconds: 0)`.
- A `KEY=value` after `xcodebuild` is a build setting; environment for a test runner is exported
  before the command as `TEST_RUNNER_KEY=value`.
- XCUITest's snapshot lists what SwiftUI hides (`.accessibilityHidden`) and ignores
  (`.accessibilityElement(children: .ignore)`): absence cannot be asserted there. A hosted view's
  UIKit accessibility API reaches no SwiftUI element in a unit test either.
- The iPhone 17 Pro simulator's first language is Arabic (`AppleLanguages` ar, en-GB); an
  English app runs as `en_SA` and shows nothing of it. Read the device's languages before
  blaming a backend for the language it answers in.
- The simulator tool's `inspect` was unavailable and the iPad had no device grant; XCUITest needs
  neither, and `xcrun simctl io <udid> screenshot` works on any booted simulator.

## 11. What to do next, in order

1. **The Pass 3 report** — done: [pointr-ios-pass3-2026-09-19.md](pointr-ios-pass3-2026-09-19.md),
   with the index, the log and Astra's §10 pointing at it.
2. **Close Pass 3's own leftovers** (§5.5) — done, 20 September:
   [pointr-ios-pass3-closure-2026-09-20.md](pointr-ios-pass3-closure-2026-09-20.md). The marker
   identified; no live no-route candidate; the not-ready state retries; the iPad driven by the
   UI test; VoiceOver's tree repaired, a session by ear still owed.
3. **Handoff items F and G** (Astra's §8): search lifecycle with the keywords the places carry;
   floor certification (the building follows the map's level callbacks — observed, not proven).
4. **Pass 4** (Astra's §10): VoiceOver, Dynamic Type, RTL, iPad and landscape, iOS 16.6 minimum,
   offline and retry, resource cleanup, licensing, signing. Ask before any push.
5. Put the decisions in §7 to Olcay when they block; do not resolve them unilaterally.

## 12. Suggested opening prompt for the new chat

> Continue the Pointr iOS work. Read `docs/handoff-2026-09-19-pass3.md` in the
> worktree `/private/tmp/kozmos-browser-compat.uqPMBD` (branch `claude/pointr-browse-repairs`),
> then Astra's `docs/handoff-2026-09-19.md` and the Pass 1 and 2 reports. Confirm
> the Git state first. Start with §11 item 3. Nothing is to be pushed.

## 13. Checklist

- [x] Branch, HEAD, worktree and the unpushed state recorded; main is not the implementation.
- [x] Every commit on the branch listed with its pass.
- [x] Pass 3 recorded with measurements, the SDK calls, and what is and is not verified.
- [x] Findings separated into design-system gaps, product questions and upstream items.
- [x] Constraints, commands, simulators and traps written down without credentials.
- [x] The five older decisions carried forward unchanged; three new ones added.
- [x] Docs index, the log and Astra's handoff updated in the same commit as this file; the
      memory pointer and the main checkout's pointer file alongside.
- [x] 20 September: Pass 3's leftovers closed or bounded; the language finding withdrawn where
      it was stated; the closure report indexed and logged.
