# Operator's guide — the Kozmos design system through the Pointr QA app, 20 September 2026

Everything needed to change, run, measure and check the work of 19–20 September without the
session that did it. Written by Claude Code at Olcay's request; every command below was run in
this worktree on this Mac. The reports it summarises: the Pointr passes
([1](pointr-ios-pass1-2026-09-19.md), [2](pointr-ios-pass2-2026-09-19.md),
[3](pointr-ios-pass3-2026-09-19.md), [3's closure](pointr-ios-pass3-closure-2026-09-20.md)), the
[design-system pass](design-system-pass-2026-09-20.md), the
[prototype's screen states](pointr-prototype-screen-states-2026-09-20.md), and the
[Pointr handoff](claude-code-handoff-2026-09-19-pass3.md) with its update notes.

## 1. Where everything is

| What                                                      | Where                                                                                                                                                                                                                                  |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The worktree with all of the work                         | `/Volumes/4TB Depo/development/K/kozmos-design-system-pointr`, branch `claude/pointr-browse-repairs`, pushed (PR #56); off `/private/tmp` since the 22nd                                                                               |
| The main checkout                                         | `/Volumes/4TB Depo/development/K/kozmos-design-system-dev` on `main`, holds none of it; one untracked pointer file, `docs/claude-code-handoff-2026-09-19.md`                                                                           |
| The QA app (real PointrKit, Design-QA Cloud)              | `apps/PointrPlayground` — `Sources/App`, `Tests`, `UITests`, `Tools`, `project.yml`                                                                                                                                                    |
| Ignored, unrecoverable from Git, **only in the worktree** | `apps/PointrPlayground/.local/` (PointrKit 10.3.0, MapLibre 6.27 xcframeworks, `Info.plist`), `apps/PointrPlayground/Sources/App/Resources/QAConfig.json` (mode 0600, never print or commit), the generated `KozmosPointrQA.xcodeproj` |
| The design system                                         | `packages/react`, `packages/ios` (SwiftUI package `Kozmos`), `packages/android` (Compose), `packages/tokens` (DTCG sources in `src/tokens-light.json` and `tokens-dark.json`), `packages/product-contracts`                            |
| The native fixture app                                    | `apps/Playground.swiftpm` (its POI examples are generated from the React fixtures; never hand-edit `Sources/App/Model/POIExampleData.swift`)                                                                                           |
| Storybook                                                 | `apps/docs`; the static build in `apps/docs/storybook-static` (ignored)                                                                                                                                                                |
| The product reference                                     | `https://agentic-search-zeta.vercel.app` (Mobile SDK and WebSDK tabs); the older Figma file `Pointr Maps - Express` (`BwtG2COVRqUWGPrIvP4jxr`) is superseded                                                                           |

The worktree moved off `/private/tmp`, which macOS clears, on the 22nd, and `.local/` and
`QAConfig.json` moved with it. They are still only in the worktree: before any machine change,
copy them somewhere safe. Decision 5 (push, and move those files) is answered (§7).

## 2. Git rules that held

Stage by file, never `git add -A` or a directory (parallel sessions leave work in the tree);
never a bare `git stash`; commit messages end with `Co-Authored-By: Claude Fable 5.1
<noreply@anthropic.com>`; `lint-staged` runs prettier on staged `md/yml/json` and eslint +
prettier on `ts/tsx/js/jsx`, so a docs commit may reflow tables — that is expected. Nothing is
pushed without an explicit ask.

## 3. Simulators and the QA app

| Device                      | UDID                                   | Used for                                                                                    |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| iPhone 17 Pro, iOS 26.5     | `51937B59-CEAE-4BC7-BC34-FEB17E28FAE7` | live runs, the UI test; **its first language is Arabic** (`ar_SA`; the app runs as `en_SA`) |
| iPad Pro 11" (M5), iOS 26.5 | `1CB35135-48B2-407B-8515-C8C6EFC1D963` | unit tests, the UI test on a regular width; `en_GB`                                         |
| iPhone 16, iOS 18.4         | by name                                | the package's button baselines                                                              |

Re-discover with `xcrun simctl list devices available`. Check a simulator's language before
blaming a backend for the language it answers in:
`xcrun simctl spawn <udid> defaults read -g AppleLanguages`.

Regenerate the project after any `project.yml` change (it is ignored):

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr/apps/PointrPlayground" && xcodegen generate
```

Build, install, launch:

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr/apps/PointrPlayground" && xcodebuild -project KozmosPointrQA.xcodeproj -scheme KozmosPointrQA -destination "platform=iOS Simulator,id=51937B59-CEAE-4BC7-BC34-FEB17E28FAE7" -derivedDataPath /private/tmp/kozmos-pointr-qa-xcode CODE_SIGNING_ALLOWED=NO build && xcrun simctl install 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 /private/tmp/kozmos-pointr-qa-xcode/Build/Products/Debug-iphonesimulator/KozmosPointrQA.app && xcrun simctl launch --terminate-running-process 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 com.kozmos.pointrqa
```

Unit tests (the iPad, so a live run on the iPhone is not disturbed):

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr/apps/PointrPlayground" && xcodebuild -project KozmosPointrQA.xcodeproj -scheme KozmosPointrQA -destination "platform=iOS Simulator,id=1CB35135-48B2-407B-8515-C8C6EFC1D963" -derivedDataPath /private/tmp/kozmos-pointr-qa-xcode CODE_SIGNING_ALLOWED=NO test 2>&1 | grep -E "Executed [0-9]+ tests|TEST (SUCCEEDED|FAILED)|error:"
```

The routing flow as a UI test (any simulator, no device grant needed; live against Design-QA;
not in CI). Environment is **exported before** the command — a `KEY=value` after `xcodebuild`
is a build setting, not environment:

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr/apps/PointrPlayground" && TEST_RUNNER_KOZMOS_QA_DESTINATION="Airport Shuttles" TEST_RUNNER_KOZMOS_QA_ORIGIN="Dunkin" xcodebuild -project KozmosPointrQA.xcodeproj -scheme KozmosPointrQAUI -destination "platform=iOS Simulator,id=51937B59-CEAE-4BC7-BC34-FEB17E28FAE7" -derivedDataPath /private/tmp/kozmos-pointr-qa-xcode -resultBundlePath /private/tmp/kozmos-pointr-ui.xcresult CODE_SIGNING_ALLOWED=NO test 2>&1 | grep -E "QA-FLOW|Test Case .* (passed|failed)|TEST (SUCCEEDED|FAILED)"
```

**Adding a colour token, end to end.** Edit `packages/tokens/src/tokens.json`, `tokens-light.json`
and `tokens-dark.json` alike (a DTCG group: `{"$value": "#F9AC17", "$type": "color", "$description":
"…"}`), then:

```bash
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && pnpm tokens:build && pnpm tokens:native:copy && pnpm tokens:copies:check && pnpm tokens:theme:check && pnpm tokens:contrast:check && pnpm tokens:raw:check && pnpm tokens:motion:check
```

The web reads `packages/tokens/dist/css/variables-*.css` at build; nothing to copy. A group named
`OnFill` becomes `semanticsCategoryOnfillRed` in Swift and Kotlin (one capital) and
`--semantics-category-on-fill-red` in CSS. A fill/ink pair goes into `scripts/check-token-contrast.mjs`'s
`contract.pairs` so the check holds it (the eight category pairs are there).

**Measuring the SDK's sprite colours.** The sandbox has no network; the browser pane does. Open
`https://mapscdn.pointr.tech/sprite/10.12.0/light/sprite@2x.json` there and run, in its page:

```js
const json = await (await fetch(location.href)).json();
const bmp = await createImageBitmap(
  await (await fetch(location.href.replace(".json", ".png"))).blob(),
);
const c = Object.assign(document.createElement("canvas"), {
  width: bmp.width,
  height: bmp.height,
});
const ctx = c.getContext("2d");
ctx.drawImage(bmp, 0, 0);
const s = json["gates-section"],
  d = ctx.getImageData(s.x, s.y, s.width, s.height).data,
  counts = {};
for (let i = 0; i < d.length; i += 4)
  if (d[i + 3] > 250) {
    const k = ((d[i] << 16) | (d[i + 1] << 8) | d[i + 2])
      .toString(16)
      .padStart(6, "0");
    counts[k] = (counts[k] || 0) + 1;
  }
Object.entries(counts).sort((a, b) => b[1] - a[1])[0]; // the sprite's dominant opaque colour
```

The `-section` sprites carry the quick-access palette; the per-type bubbles (`boarding-gate`,
`restroom`, …) carry another. The dark theme's sprites are the same colours.

The venue's own words — every distinct tag and keyword its places carry, the material a
companion could filter on — are logged once per load as `QA-DATA` lines (the session's
`countTiles()`); read them from the simulator after any launch:

```bash
xcrun simctl spawn 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 log show --predicate 'subsystem == "com.kozmos.pointrqa"' --last 20m --style compact | grep QA-DATA
```

| Knob (prefix `TEST_RUNNER_`) | Effect                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `KOZMOS_QA_DESTINATION`      | the place to select (label prefix); otherwise the first place listed                                                         |
| `KOZMOS_QA_ORIGIN`           | the starting point (label prefix); otherwise the first candidate                                                             |
| `KOZMOS_QA_BUILDING_POIS`    | e.g. `306`: wait for that place count, relaunching up to three times (the building the map opens on varies between launches) |
| `KOZMOS_QA_EXPECT_NO_ROUTE`  | assert the no-route state in the picker instead of the directions                                                            |

Its screenshots and accessibility trees come out of the result bundle:

```sh
xcrun xcresulttool export attachments --path /private/tmp/kozmos-pointr-ui.xcresult --output-path /private/tmp/kozmos-pointr-ui-attachments
```

Afterwards remove the runner it leaves on the simulator, or it can be tapped on the home
screen and crashes for want of xcodebuild's libraries:

```sh
xcrun simctl uninstall 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 com.kozmos.pointrqa.uitests.xctrunner
```

Logs: `notice` lines persist, `debug` lines (the per-step route lines) do not, so stream before
reproducing. Subsystem `com.kozmos.pointrqa`, category `poi`.

```sh
xcrun simctl spawn 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 log show --predicate 'subsystem == "com.kozmos.pointrqa"' --last 30m --style compact
```

```sh
xcrun simctl spawn 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 log stream --predicate 'subsystem == "com.kozmos.pointrqa"' --level debug --style compact
```

What the app logs: the language it asked the SDK for and the device's languages; when
wayfinding readiness was known (ms after start); each route (`route A → B: d m, t s, n steps;
ms`) and each step at debug level; a selected place's data diagnostics.

Screenshots of any booted simulator, granted or not:
`xcrun simctl io <udid> screenshot out.png` (3× on the iPhone 17 Pro, 2× on the iPad). The
desktop simulator tool takes device points (402 × 874 on the 17 Pro), not pixels.

## 4. The design-system gates

After a change under `packages/ios`:

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr/packages/ios" && swift test
```

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr/packages/ios" && xcodebuild -scheme Kozmos -destination "platform=iOS Simulator,id=51937B59-CEAE-4BC7-BC34-FEB17E28FAE7" -derivedDataPath /tmp/kozmos-ios-poi-tests CODE_SIGNING_ALLOWED=NO -skip-testing:KozmosTests/KozmosButtonImageSnapshotTests test 2>&1 | grep -E "Executed [0-9]+ tests|TEST (SUCCEEDED|FAILED)|error:"
```

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr/packages/ios" && xcodebuild -scheme Kozmos -destination "platform=iOS Simulator,name=iPhone 16,OS=18.4" -derivedDataPath /tmp/kozmos-ios-poi-tests CODE_SIGNING_ALLOWED=NO test 2>&1 | grep -E "Executed [0-9]+ tests|TEST (SUCCEEDED|FAILED)|error:"
```

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && node scripts/check-ios-poi.mjs
```

The button image baselines are pinned on iOS 18.4 and skipped on 26.5; never re-record them to
make a difference go away. `swift test` on macOS skips everything under `#if os(iOS)`, which is
where the render tests live — a macOS green says nothing about them.

After a change under `packages/react` or its styles (build first; the browser suites read the
built package and a built Storybook):

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && pnpm --filter '@kozmos/react...' build && pnpm --filter @kozmos/docs build-storybook
```

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && python3 -m http.server 6012 --bind 127.0.0.1 --directory apps/docs/storybook-static
```

Then, in another terminal, each of these on chromium (default), firefox and webkit
(`ADAPTIVE_BROWSER=firefox`, `ADAPTIVE_BROWSER=webkit`):

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && STORYBOOK_URL=http://127.0.0.1:6012 pnpm test:poi-details
```

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && STORYBOOK_URL=http://127.0.0.1:6012 pnpm test:owned-css
```

And without Storybook: `pnpm --filter @kozmos/react test`, `pnpm --filter @kozmos/react lint`,
`pnpm test:css-build`, `pnpm components:contract:check`, `pnpm docs:snippets:check`,
`pnpm --filter @kozmos/docs typecheck`, `pnpm tokens:raw:check`. `pnpm test:poi-gallery` when
the gallery changes. Results and screenshots land in `test-results/`; read the current JSON, not
an old `*-failed.png`.

After a change to the shared POI fixtures (`packages/react/src/components/POIDetailPanel/POIDetailPanel.fixtures.ts`):

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && node --import tsx scripts/sync-ios-poi-examples.mjs --write && node --import tsx scripts/sync-ios-poi-examples.mjs
```

The examples that reach the native playground are named in that script (`names`, plus the
two pushed by hand). Then build the playground:

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr/apps/Playground.swiftpm" && xcodebuild -scheme Playground -destination "platform=iOS Simulator,name=iPhone 17 Pro,OS=26.5" -derivedDataPath /tmp/kozmos-ios-poi-build CODE_SIGNING_ALLOWED=NO build 2>&1 | grep -E "BUILD (SUCCEEDED|FAILED)|error:"
```

After a change under `packages/android` (JDK 21 and the SDK at `~/Library/Android/sdk` are on
this Mac; no `local.properties`, so pass the SDK in the environment):

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr/packages/android" && ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew --no-daemon -q verifyPaparazziDebug
```

Re-record a golden only for an intended change:
`ANDROID_HOME="$HOME/Library/Android/sdk" ./gradlew --no-daemon -q recordPaparazziDebug --tests "*NameOfTest*"`.
Goldens are recorded on macOS and verified on CI's Linux; a red on an unchanged render is that
mismatch, not a regression.

Tokens: edit `packages/tokens/src/tokens-light.json` and its twin `tokens-dark.json`, then
`pnpm tokens:build && pnpm figma:foundations && pnpm tokens:radius:check`; the change reaches
Figma only through the importer plugin (`docs/style-playbook.md`, the Figma loop). Never
"Rebuild" a component in the plugin: it changes the node id Code Connect pins. `pnpm
figma:verify` from the terminal beats the in-plugin audit for drift.

The navigation parts — the manoeuvre card, the itinerary, the rail, the summary's navigation
layout — have their own browser check on the same served build
([navigation-parts-2026-09-20.md](navigation-parts-2026-09-20.md) §4), twenty checks on each
engine:

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && STORYBOOK_URL=http://127.0.0.1:6012 pnpm test:navigation
```

The map shell's bottom sheet — its three detents, a drag anywhere on it, the scroll handoff, the
handle, the anchored peek — is driven on the same served build, as the prototype was
([initial-sheet-2026-09-20.md](initial-sheet-2026-09-20.md) §4; chromium adds a touch scenario):

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && STORYBOOK_URL=http://127.0.0.1:6012 pnpm test:map-sheet
```

The search sheet's parts on the web — the tiles' shared top edge, the AI search button's 48
footprint and 66 ring, the ring's turn and its rest under reduced motion — on the same build:

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && STORYBOOK_URL=http://127.0.0.1:6012 pnpm test:search-sheet
```

The motion tokens — three durations, two easings — and their native files, the shells' snaps and
the parts' entrances on them; and the quick-access search words derived from the taxonomy:

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && pnpm tokens:motion:check
```

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && node scripts/sync-ios-quick-access.mjs
```

(`--fetch` re-reads the pinned taxonomy and rewrites the vendored terms; `--write` rewrites the
Swift literal.)

The prototype itself can be re-driven and re-measured at any time:

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && node scripts/measure-prototype-sheet.cjs /tmp/prototype-sheet
```

The glass surface role has a parity check of its own, and the owned-CSS suite above measures it
in both themes ([glass-surface-2026-09-20.md](glass-surface-2026-09-20.md)):

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && pnpm tokens:glass:check
```

The Figma importer's painters are measured without Figma
([figma-drift-2026-09-21.md](figma-drift-2026-09-21.md) §2): a stand-in for the Plugin API runs
each painter and asserts the contract's numbers and the variable bindings. After any change under
`figma/foundations-importer/`:

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && pnpm figma:painters:check && pnpm figma:plugin:check && pnpm components:contract:check
```

The live file is read over REST with the main checkout's token, exported and never printed
(the worktree has no `.env`):

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && FIGMA_ACCESS_TOKEN="$(grep '^FIGMA_ACCESS_TOKEN=' "/Volumes/4TB Depo/development/K/kozmos-design-system-dev/.env" | cut -d= -f2- | tr -d '"')" node scripts/verify-figma-library.mjs
```

The same export runs `pnpm figma:publish:linked:dry`, `figma:publish:ios:linked:dry` and
`figma:publish:android:linked:dry`; a property "does not exist on the Figma component" until the
importer has been run for that set. The plugin's commit hook re-stamps `code.js`; commit it by
name, never a directory.

The publishes themselves (`figma:publish:linked`, `figma:publish:ios:linked`,
`figma:publish:android:linked`) take the same export and send each platform's whole linked set,
so run them only from a clean, pushed branch that holds every mapping `main` has, or from `main`
after the merge; the 21st's rounds are in [figma-drift-2026-09-21.md](figma-drift-2026-09-21.md)
§9. The linked configs are lists: a new `.figma.*` file goes into its platform's
`figma.linked.config.json` by name, beside its source file, and `pnpm components:contract:check`
fails on one left out. Then read Dev Mode back, with Figma desktop open on the Core Library and
its Dev Mode MCP server on (Preferences):

```sh
cd "/Volumes/4TB Depo/development/K/kozmos-design-system-pointr" && pnpm figma:connect:readback
```

It asks the server, read-only, for every linked node on React, SwiftUI and Compose, and fails on
a node that shows nothing or a snippet whose import a consumer cannot use
(`-- --label SwiftUI --node 1933:9257` narrows it). Keep Figma in front while it runs. Each call
counts against Figma's daily limit for your account's Dev Mode server, which any other use of the
server shares; a full pass is 285 calls.

Which build ran is the first thing to read. The panel's header shows it ("Build …"), and an
Audit Library report carries it as `pluginBuild`; a report without it came from a build before
`50ba616`. Update All Core resumes by build stamp, so after any plugin change it starts again at
Link: update the sets the change touched, one at a time, instead
([figma-drift-2026-09-21.md](figma-drift-2026-09-21.md) §9 lists them for `1001317b6546`).
The painter check also refuses the layout sizing Figma refuses and counts the nodes a lookup
visits, so a painter that asks for HUG on an icon, FILL before an append, or a whole-file search
per variant fails there first.

## 5. Where each behaviour lives

The QA app (`apps/PointrPlayground/Sources/App`):

| Behaviour                                                                                                                       | File and place                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDK start, the language asked for, readiness logs, selection, camera padding, level callbacks                                   | `SDKSession.swift`: `start()`, `SDKLanguage`, `loadBuilding`, `select`, `frame`, `setChromeInsets`, `applyCameraPadding`                                                                                          |
| Routing flow: Go → picker → one calculation → directions; retry; the not-ready and no-route messages                            | `Routing/SDKRouting.swift`: `startRouteSetup`, `chooseOrigin`, `calculateRoute`, `retryRouteCalculation`, `showDirections`, `showStep`, `endRoute`, `resetRouting`; readiness retry in `onWayfindingManagerReady` |
| Route values, the arrow table, the under-a-metre rule, what a failure offers                                                    | `Routing/SDKRoute.swift`: `SDKRoute`, `RouteFormat`, `SDKRoutePresenter` (`directionType`, `distanceLabel`, `recovery`, `retriesOnReadiness`)                                                                     |
| The panels: browse (card / list), the picker with its status row, the directions with the current step's trait and announcement | `SDKMapScreen.swift`: `browsePanel`, `routeSetupPanel`, `routeStatusRow`, `directionsPanel`                                                                                                                       |
| Controls placement, what drops when space runs out                                                                              | `SDKMapScreen.swift`: `controls(_:zoom:)`                                                                                                                                                                         |
| The card's data: taxonomy, contacts, hours, description; artwork rule                                                           | `SDKPOIAdapter.swift`; `Taxonomy/TaxonomyPresenter.swift`; the pinned projection `Model/TaxonomyProjection.swift` (generated by `scripts/sync-ios-taxonomy.mjs`)                                                  |
| The pin reserve (96pt)                                                                                                          | `SDKCameraPadding.swift`                                                                                                                                                                                          |
| Map policy: every default Pointr control off                                                                                    | `SDKSession.swift`: `SDKMapPolicy`                                                                                                                                                                                |

The design system (`packages/ios/Sources/Components`, with the React and Compose twins beside
them under `packages/react/src/components` and `packages/android/src/main/java/com/kozmos/components`):

| Behaviour                                                                                                    | iOS                                                                                                                 | Web                                                                                                                            | Android                                                             |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Card header: name and quick buttons on one row, name ≤ 3 lines                                               | `POIDetailPanel/POIDetailPanel.swift`: `header`, `identity`                                                         | `styles/owned-poi-detail.css`: `.kozmos-poi-header`, `.kozmos-poi-identity`, `.kozmos-poi-title`, `.kozmos-poi-header-actions` | `POIDetailPanel/POIDetailPanel.kt`: `Header`, `maxLines`            |
| Direction step reads as one element, arrow silent                                                            | `DirectionStep/DirectionStep.swift`: `accessibilityDescription`                                                     | (icon has no title; rows are plain)                                                                                            | —                                                                   |
| Route summary's icon silent                                                                                  | `RouteSummary/RouteSummary.swift`                                                                                   | —                                                                                                                              | —                                                                   |
| The manoeuvre card, its cap, what it reads                                                                   | `ManoeuvreCard/ManoeuvreCard.swift`: `KozmosCappedHeightLayout`, `accessibilityDescription`                         | `ManoeuvreCard/ManoeuvreCard.tsx`: `manoeuvreDescription`                                                                      | `ManoeuvreCard/ManoeuvreCard.kt`                                    |
| The itinerary's rows, the current one emphasised                                                             | `Itinerary/Itinerary.swift`                                                                                         | `Itinerary/Itinerary.tsx`                                                                                                      | `Itinerary/Itinerary.kt`                                            |
| The rail's geometry and the disc's travel                                                                    | `RouteProgressRail/RouteProgressRail.swift`: `discLeading`                                                          | `RouteProgressRail/RouteProgressRail.tsx`: `ROUTE_PROGRESS_RAIL`, `discLeading`                                                | `RouteProgressRail/RouteProgressRail.kt`: `…Geometry`               |
| The summary's navigation layout (destination, End, stats, progress)                                          | `RouteSummary/RouteSummary.swift`: `init(destination:…)`                                                            | `RouteSummary/RouteSummary.tsx`: `RouteSummaryNavigation`                                                                      | `RouteSummary/RouteSummary.kt`: the `destination` overload          |
| The QA app's directions on those parts; the flow test's reading of them                                      | `apps/PointrPlayground/…/SDKMapScreen.swift`: `topBar`, `directionsPanel`; `RoutingFlowUITests.swift`               | the Examples/Navigation story                                                                                                  | —                                                                   |
| The surface style — solid by default, glass on request; the tint, the edge, the off switch                   | `KozmosSurface.swift`: `KozmosSurfaceStyle`, `kozmosSurface(_:style:)`; the token in `KozmosEffects.swift`          | `styles/owned-components.css`: `.kozmos-surface-solid`, `.kozmos-surface-glass`; `Surface/`; `context/design-config.ts`        | `Surface/Surface.kt`: `KozmosSurfaceStyle`, `KozmosSurfaceDefaults` |
| The shell's sheet fitted to its content, and its surface                                                     | `AdaptiveMapShell.swift`: `.content`, `detentHeight`, `panelSurface`                                                | `AdaptiveMapShell.tsx`: `panelSizing`, `panelSurface`                                                                          | `AdaptiveMapShell.kt`: `panelSurface`                               |
| The Button's and IconButton's glass variant (the glass surface)                                              | `Button/Button.swift`: `kozmosButtonSurface`; `IconButton/IconButton.swift`                                         | `styles/owned-components.css`: `.kozmos-button-glass`                                                                          | `Button/Button.kt`, `IconButton/IconButton.kt`                      |
| The directions for transitions — lift, escalator, stairs, level, walkway, turn back — and the SDK's mapping  | `DirectionStep/DirectionStep.swift`: `DirectionType`; the QA app's `SDKRoute.swift`: `directionType`, `levelChange` | `DirectionStep/DirectionStep.tsx`: `DirectionType`, `DIRECTION_ICONS`                                                          | `DirectionStep/DirectionStep.kt`: `icon()`                          |
| The search sheet's parts — the tile, the row and its current-floor dot, the field, the marker, the AI search | `CategoryTile`, `POIResultCard` (`currentFloorId`), `SearchBar`, `UserLocationMarker`, `AISearchButton` dirs        | the same dirs; the ring in `styles/owned-components.css`                                                                       | the same dirs                                                       |
| Collapsible level switcher: named rows, trailing-aligned, opaque; the pill hidden from VoiceOver while open  | `FloorSelector/FloorSelector.swift`: `expandedList`, `namedFloorButton`, the `expanded:` test initializer           | no collapsible variant                                                                                                         | no collapsible variant                                              |
| Search bar: magnifier silent, clear button labelled                                                          | `SearchBar/SearchBar.swift`                                                                                         | `SearchBar/SearchBar.tsx` (already)                                                                                            | `SearchBar/SearchBar.kt` (already, "Clear")                         |
| The long-name fixture                                                                                        | `apps/Playground.swiftpm/…/POIExampleData.swift` (generated)                                                        | `POIDetailPanel/POIDetailPanel.fixtures.ts`: `longContentPOI`, `longContentDetails`; the `LongContent` story                   | —                                                                   |

Tests for the above: `packages/ios/Tests/KozmosTests/KozmosPOIDetailTests.swift` (the measured
header test, the render matrix, the fixture decoding), `KozmosFloorSelectorTests.swift`,
`KozmosDirectionStepTests.swift`, `RenderedPixels.swift` (render a view, find pixels of a colour,
keep the image); `scripts/check-poi-detail-examples.mjs` (the `long-content` block);
`packages/android/src/test/java/com/kozmos/components/poidetailpanel/KozmosPOIDetailPanelPaparazziTest.kt`
and its golden under `src/test/snapshots/images/`; `apps/PointrPlayground/Tests/*` and
`UITests/RoutingFlowUITests.swift`; the sheet's rules in
`packages/ios/Sources/Components/AdaptiveMapShell/KozmosPanelScrollView.swift`,
`packages/react/src/components/AdaptiveMapShell/panel-detents.ts` and
`packages/android/.../AdaptiveMapShell/PanelDetents.kt`, each with its tests, and
`scripts/check-map-sheet.mjs`; the QA app's tiles in `Sources/App/Model/QuickAccess.swift` with
`Tests/QuickAccessTests.swift` and `UITests/BrowseSheetUITests.swift`; the motion tokens in
`packages/tokens/src/tokens*.json` (`Semantics.Motion.duration`, `.easing`), emitted by
`build.mjs` as `KozmosMotion.swift` / `.kt` and CSS variables, with `KozmosTransitions.swift`,
`Motion/Transitions.kt` and the `pop` / `reveal` / `crossfade` rules in `owned-components.css`;
the category field in `CategoryField/` on each platform; the quick-access words in
`scripts/sync-ios-quick-access.mjs`, `Resources/QuickAccess/aviation-terms-10.12.0.json` and
`Model/QuickAccessTerms.swift`.

## 6. Measuring, not eyeballing

- **A rendered SwiftUI view, in points.** `RenderedPixels.render(view, size:)` then
  `boundingBox(in:where:)` with `isTheme`, `isDarkText` or `isInk`; attach `pixels.image`.
  Run a new test against the unfixed code first (`git show HEAD:<file> > <file>`, run, put the
  fixed file back); a green that names nothing proves nothing — check `Executed N tests`.
- **A simulator screenshot.** `apps/PointrPlayground/Tools/measure-selected-pin.py` and
  `measure-gallery-tile.py` (Pillow; `python3 -m pip install pillow`), edge-exclusive, on a
  `simctl io` screenshot.
- **What VoiceOver gets.** XCUITest's tree (`element.debugDescription`, attached by the UI test)
  shows labels, values and the selected trait, but it also lists elements SwiftUI hides or
  ignores, so absence cannot be asserted there; a hosted view's UIKit accessibility API reaches no
  SwiftUI element in a unit test. The desktop simulator tool's `inspect` was unavailable.
- **A web page or prototype.** Read the DOM in the built-in browser, not the picture. The
  snippet that measured the prototype, to paste into the browser's JavaScript tool: find the
  frame (the element around the "9:41" text wider than 250 and taller than 500), then for every
  descendant with text, an `aria-label`, a button or a surface (a background with a radius or a
  shadow) print tag, label, position and size relative to the frame, `fontSize/fontWeight`,
  family, `color`, `backgroundColor`, `borderRadius`, `border`. Headless, with the repo's
  Playwright: `NODE_PATH="/Volumes/4TB Depo/development/K/kozmos-design-system-pointr/node_modules" node script.cjs`
  (`require` resolves from the script's directory, not the working directory); wait for `load`,
  click the tab you need, then `page.screenshot({ clip })` around the frame.
- **The SDK's map layers.** MapLibre's public style API: `mapLibreView.style?.layers`, a
  layer's `sourceIdentifier`, `predicate`, `iconImageName`, and `visibleFeatures(in:styleLayerIdentifiers:)`
  for the features under a layer; `style.image(forName:)` to save an icon. That is how the
  next-portal marker was identified. Never traverse the SDK's private UIKit subviews.

## 7. Decisions and where they stand

| #   | Decision                                                                                                                      | State                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–5 | Gallery crop; zoom buttons on phones; the `.panel` border; the 320pt/AX5 metadata exception; pushing and moving the SDK files | open since Pass 1                                                                                                                             |
| 6   | Transition arrows in `DirectionType`                                                                                          | open; still needed by the directions list                                                                                                     |
| 7   | The top search bar during routing                                                                                             | open; the prototype replaces it with the instruction card during navigation                                                                   |
| 8   | Go waiting for readiness                                                                                                      | open, with numbers: readiness 240–330 ms after the building loads; the not-ready state retries                                                |
| 9   | Hiding or restyling the SDK's next-portal marker through MapLibre's style API                                                 | open                                                                                                                                          |
| 10  | The preview's 208pt option cards                                                                                              | moot: no preview step                                                                                                                         |
| 11  | The level switcher's dismissal, scrolling, a chevron hint (the prototype has the chevron)                                     | open                                                                                                                                          |
| 12  | Folded phones: bring the web shell's hinge model to iOS and Compose ahead of the SDKs                                         | open; Xcode 26.6 has no iPhone Fold                                                                                                           |
| 13  | Android parity: the action strip wraps, the location line truncates                                                           | open                                                                                                                                          |
| 14  | The open level list: names beside labels (built) or the prototype's labels-only column                                        | open; the picture of both was sent                                                                                                            |
| —   | The card's quick buttons                                                                                                      | **ruled: 16px squares stay**                                                                                                                  |
| —   | Fonts                                                                                                                         | **ruled: system fonts per platform**; already the code's state; Readex Pro remains only in the unused `Brand` token and the Figma text styles |
| —   | Wayfinding modes and the preview                                                                                              | **ruled: none yet**; Go starts at once with a position, asks for a starting point without one; the QA app follows                             |

_Later on the 20th, evening, Olcay ruled on the navigation stage's six
([navigation-parts-2026-09-20.md](navigation-parts-2026-09-20.md) §5): the rail keeps the
prototype's numbers; a glass surface role is built now on all three platforms (the handoff's
§5.13) and the card and the summary take it; a compact detent in the shell; each platform's own
icon set for the transition arrows; the button-height decision withdrawn (44 on every platform by contract); the level list keeps its
names beside the labels, as built. He also had the branch pushed — decision 5 above is answered
as far as the commits go; the ignored SDK files still live only in the worktree. Next: the glass
role, the transition arrows, the search sheet; F, G and Pass 4 after. Later that night, on the
glass stage's decisions: the default is solid and glass an option, built as a surface style on
all three platforms; the shell's sheet takes the surface style with the compact detent; the
Button's glass variant moves onto the token ([glass-surface-2026-09-20.md](glass-surface-2026-09-20.md) §6)._

_On the 21st, evening, Olcay ruled on the sheet stage's four: the Figma drift is the first open
item; the personal tiles leave the grid while empty, as built; the icon button's large size
stays 48; the iPhone 17 Pro simulator is reset to English (`AppleLanguages (en-GB)`,
`AppleLocale en_GB`, read back). The AI companion's decisions (§7 of the handoff) stay open._

_From the second audit in Figma (14:58 on the 21st), ruled by Olcay the same night, all four as
recommended ([figma-drift-2026-09-21.md](figma-drift-2026-09-21.md) §9, `ce6e807`):
CategoryField's name and clear in `Colors/foreground/0`; the off-floor pin number in
`Colors/foreground/0` on the white disc; the category icons decorative, hidden from assistive
technology and reported by the Figma audit as advisories; React's pin solid, hollow off the
floor. The CategoryField clear became a 32 circle in a 44 target, as the search bar's (`701f919`).
Code Connect was published on his word the same night, on all three platforms
([figma-drift-2026-09-21.md](figma-drift-2026-09-21.md) §9)._

_On the 22nd, at 17:00, Olcay ruled on two: splitting the React bundle is its own PR after #56,
which merges with `analyze-bundle` knowingly red; and the worktree moved off `/private/tmp` to
`/Volumes/4TB Depo/development/K/kozmos-design-system-pointr`. The old copy's `.git` is renamed
and it is his to delete, after he re-imports the Figma plugin from the new path. The rest went
as recommended ([claude-code-handoff-2026-09-22.md](claude-code-handoff-2026-09-22.md) §0a)._

## 8. What the design system still lacks, from the prototype

The collapsible level
switcher on web and Android; an in-surface status message; a floor slot and a current-step state
on a direction step. Measured geometry for each is in the prototype report. The transition
arrows were built on the 20th, night — [transition-arrows-2026-09-20.md](transition-arrows-2026-09-20.md);
the AI search button and the marker's halo, and the tile, row and field on the prototype's
geometry, in [search-sheet-2026-09-20.md](search-sheet-2026-09-20.md). The manoeuvre card, the route progress rail and the itinerary list were built on the
20th on all three platforms — [navigation-parts-2026-09-20.md](navigation-parts-2026-09-20.md),
with its own six decisions. Late on the 20th the initial sheet was driven
([pointr-prototype-initial-sheet-2026-09-20.md](pointr-prototype-initial-sheet-2026-09-20.md)) and
built ([initial-sheet-2026-09-20.md](initial-sheet-2026-09-20.md)): the three shells' detents,
drag and anchored peek, and the QA app's sheet on the taxonomy's tiles.

## 9. Traps met, for the next reader

_Added on the 21st, evening, from the Figma drift
([figma-drift-2026-09-21.md](figma-drift-2026-09-21.md) §6):_

- A read that strips blank lines is not the file: exact-match patch anchors taken from it fail.
  Print the region verbatim with `sed -n`, or splice by index between two unique markers.
- The contract check compares the first `ring.layoutPositioning = "ABSOLUTE"` with the first
  `target.appendChild(ring);`; a painter variable named `ring` earlier in `code.js` breaks it.
- Code Connect's React parser takes literals in `figma.enum`; a helper call is an "Unknown
  intrinsic". The Swift and Kotlin parsers accept expressions.
- `pnpm figma:verify` reads expected axes from the plugin's `const X = [...]` arrays and its
  `expectedVariantAxesForComponentSetName` table; a new axis needs both, and a new set needs its
  name in `COMPONENT_PAGE_LAYOUT_SECTIONS`.
- A painter that instances a curated icon needs the icon on the Icons page: add it to
  `packages/icons/src/registry.ts` and `KOSMOS_ICON_DEFINITIONS` (component key from
  `docs/figma-pointr-icon-catalog.json`), then run Curated Icons → Update before the set.
  The plugin's definitions are generated from the registry (the audit of the 21st found the
  two had drifted by thirteen); `pnpm components:contract:check` holds both to the catalog.
  A taxonomy quick-access symbol has no catalog entry: name its published SVG in
  `scripts/build-taxonomy-icons.mjs`, run `node scripts/build-taxonomy-icons.mjs --fetch`
  (it vendors the SVG under `packages/icons/src/taxonomy/svg` and writes both the React
  component and the importer's `TAXONOMY_ICON_SVGS`), then add its registry and
  `KOSMOS_ICON_DEFINITIONS` entries with `source: "taxonomy"`. `pnpm icons:taxonomy:check`
  (which contract parity runs too) holds the outputs to the SVGs.
- A helper that falls back to the library's default icon paints a magnifier where a close
  belongs: `productSdkIconInstance` falls back only when told (`fallbackToDefault`, the tile's
  and the field's data slots); a symbol's caller draws its typed glyph instead.
- An icon instance's plugin data is a label, not its paint: the Button family's icons read the
  right token and were plain black, and an Update that trusted the label skipped them. The
  re-tint is decided by the paint now (`iconSlotPaintIsExpected`); read a paint over REST
  before believing a label.
- An unbound paint that equals a token's light value is not the token: it stays that colour in
  Dark. The Secondary, Glass, Outline and Ghost icons were unbound black and read 1.0 to 1.61 on
  dark surfaces; the fallback now counts only when the variable is missing from the file.
- A search of `figma.root.children` in order walks the whole Components page (27,459 nodes in
  the live file) before Icons; the Tree block's 1,044 icon lookups stalled Update All Core. Read
  the page a component lives on first.
- A strength laid on a bound paint is not to be relied on: over REST the live file kept
  CategoryField's 0.12 and lost CategoryTile's and DirectionStep's, from the same helper, so a
  wash's strength lives on layer opacity and the audit composites those layers. A token's own
  alpha is another matter: it rides on the paint and shows (Overlay/Scrim at 0.502 draws
  128/255), while the variable's alpha does not; binding a translucent token at 1 drew Button's
  Glass opaque on `ed50a03a1912`.
- HUG takes an auto-layout frame or text; FILL takes a child of an auto-layout frame, so set it
  after the append. A refusal is recorded in the run log, not thrown.
- zsh does not split an unquoted `$VAR` into words; pass a list through `xargs`.
- Paparazzi's own window is dark. A translucent part (the category field's wash) snapshotted with
  no surface under it renders on that dark window, which hid that its light-mode text was not
  meant for it; draw such a part on its host's surface, and snapshot Dark with
  `LocalKozmosUseDarkTokens provides true`.
- In a Compose `Row`, a child weighted with `fill = false` beside a weighted `Spacer` does not
  hand its unused share to the spacer: the space is left at the row's end. CategoryField's clear
  floated inward so; put the shrinking content in an inner `Row` with `Modifier.weight(1f)`.
- `assertOccurrenceCount` in the contract check calls `String.match`, which turns a string
  pattern into a regular expression (`(icon)` becomes a group); pass a global `RegExp`.

_Added on the 21st, from the sheet stage:_

- A SwiftUI `safeAreaInset` on content inside a content-fitted layout takes the whole proposal:
  the fitted sheet grew to its cap. Fitted content never scrolls, so its safe areas are plain
  padding; the explicit-height sheet keeps the inset (a scroll view inside runs under it).
- A SwiftUI `simultaneousGesture` drag moves a sheet but cannot stop the button under the
  travelling finger from firing on release, and `.disabled` toggled mid-touch cancels the drag
  itself. A UIKit pan recogniser on the hosting view can both fail on a rule and cancel the
  button's touches (`KozmosSheetPanCatcher`).
- XCUITest's `press(thenDragTo:)` from a resting tile's centre lands in the home indicator's band
  and becomes the system's swipe; drag from the tile's square, above it.
- The owned-CSS build prefixes keyframe names with `kozmos-`; name them without it in the source.
- Measure a turning element by `offsetWidth`, not its rotated client rect.
- A Compose `onGloballyPositioned` state is a frame late and Paparazzi draws one frame; an
  alignment line read in the parent's own measure pass is not.
- The prototype's AI ring was first read as 66 wide from a scaled element; the DOM's `inset`
  and a 4x pixel scan gave the truth (a 2.5 band on a 48 circle). Measure twice.
- `.ignoresSafeArea()` with no argument also ignores the keyboard's region: the sheet stayed
  under the keyboard and the routing flow's origin row could not be tapped. `.ignoresSafeArea(.container)`
  runs the map to the edges and still lets the sheet rise above the keyboard.
- A SwiftUI `.animation(value:)` keyed on the sheet's height also eases a measurement into place —
  the anchored peek arriving after the first layout — and a render test sees a mid-motion frame
  (the peek tests read 103 for 136). Key it on the detent, which a measurement never changes.
- `RenderedPixels.render` centres a view shorter than its canvas: a tile rendered in a 140-tall
  canvas sat 8 lower than its padding said, and the counter's "overhang" read 0.7. Pin the view to
  the top with a trailing `Spacer` and the geometry is the padding's.
- A Kotlin composable's trailing lambda binds to the LAST parameter: a `tint` added after `icon`
  broke every `KozmosCategoryTile(...) { Icon(...) }` call with "too many arguments". New
  parameters go before the trailing content lambda.
- A multi-file Python patch that asserts halfway leaves the earlier files written and the later
  ones untouched, and a test run afterwards can be green for the wrong reason (the pin's tint
  test was never in the file that ran). Read each patch's own print, and grep the test's name in
  the log before calling it green.
- The 32 pin's fill measures 28 on every platform: its 2 white stroke is drawn inside the
  diameter. Expect 28 when measuring a pin by its colour.
- The SDK's map draws its own markers only: `PTRMapMarker` views through `addMarkers` (a hosted
  SwiftUI pin, then a rendered image view, before and after a level switch, one reuse
  identifier each) drew nothing, and a `PTRPoiMapStyle` image through `updatePoiStyles` drew the
  SDK's icon. The restyle also paints the place's polygon fill black — a style with nothing set is an unset
  fill — which a room shows and a gate does not. Do not restyle: `poisToShow` alone gives the
  SDK's own icon markers for the category's places and touches no fill.
- `pois(for: building)` is the loaded building's places, delivered in steps; `pois(for:
building.site)` is the whole site's (1196 at Boston Logan). Search and the tiles count the
  site.
- A fill needs its ink. `primitivesColorsBackground0` is white in light and black in dark; on a
  colour that does not change with the mode it is the wrong ink half the time, and white fails
  4.5:1 on four of the taxonomy's eight colours anyway. Pass `KozmosInkedFill` / `onFill` with any
  fill, from the `Semantics.Category.OnFill` tokens.
- A blind edit of a Kotlin signature that contains a function type (`onClose: (() -> Unit)?`)
  finds the wrong `)`. Read the signature, then edit it by its exact text.

- The iPhone 17 Pro simulator speaks Arabic first; `defaults read -g AppleLanguages` before
  concluding anything about a backend's language.
- A `$T` shell variable holding two `-only-testing` arguments passes as one; xcodebuild ran 0
  tests and said SUCCEEDED. Write arguments out.
- The building the map opens on varies between launches, and the count label lags behind the
  list; the UI test's `KOZMOS_QA_BUILDING_POIS` waits for the one you want.
- `Logger.debug` lines are not in `log show`; stream them.
- MapLibre's `contentInset` setter re-centres and cancels a `focusPoi` flight.
- `EmptyView` is no `ViewThatFits` child; use a zero-sized `Color.clear`.
- Edits to `.github/workflows/*` trip a security hook in the tool; apply with a script.
- zsh: a pipe followed by a heredoc concatenates; `echo ===` fails; quote `--include='*.swift'`.
- The XCUITest runner stays installed after a run and crashes if launched by hand.
- Prettier reflows Markdown tables on commit; the committed file is the source of truth.
- The Code Connect linked configs are lists, not globs: a mapping left off is never validated
  or published, and the dry run still says every file is valid. Backdrop and React's Icon were
  off from the start; `components:contract:check` now refuses it.
- `figma connect publish` reports what it sent, not what Dev Mode shows. Read it back with
  `pnpm figma:connect:readback`.
- Figma's Dev Mode MCP server answered no tool call for an hour and a half while Figma sat in
  the background (the handshake still worked), and at once when Figma was brought to the front.
  The readback times each call out after 90 s and stops after eight in a row.
- The Dev Mode server has a daily limit per account: some 500 calls into the 21st it answered
  "Rate limit exceeded, please try again tomorrow". The readback stops at the first refusal.
- The worktree's publish and verify scripts look for `.env` above the worktree and find none;
  export only `FIGMA_ACCESS_TOKEN` from the main checkout's, never print it.

_Added on the 21st, from the audit of 20:38:_

- An audit reads the file as it is: two of the run's nineteen sets had been updated. Read
  `pnpm figma:verify`'s build coverage before reading a warning as the code's.
- A render is the truth: DirectionStep's 1.00 was a glyph not drawn, and the Selected
  CategoryTile's 1.92 an icon not drawn, measured on the fill under the one that shows. The
  audit now reads every fill a node stacks.
- A list of the sets a rule applies to falls behind the painters: the typography rule held 43
  of the 80 sets with text. The audit's variant parsers run in a chain whose Label parser claims
  any `State=Default` name, so a branch on a later parser's field can be dead; the Glass skip
  was.
- A check that throws on an old build hides everything after it: report a missing node as a
  failure and go on.

_Added on the 21st, from Apply Text Styles at 21:36:_

- A warning's remedy is part of the warning. Surfacing FileUpload's unstyled labels put the
  panel's next step on Apply Text Styles, which restyled the whole library: 4,957 texts lost
  their size and leading variables and 656 went from 12/16 to 14/20. Read what a new warning
  tells the reader to run, and what that does, before shipping it.
- A literal written to a field bound to a variable drops the binding in Figma. Bind after you
  write, as the painters do.
- An accidental bulk change in the file is undone from its version history; an Update redraws
  one set, and the two update sequences redraw them all.

_Added on the 21st, from Update All Core at 22:32:_

- The panel is not where a run is: it froze on NavigationItem while the file had reached
  SearchBar. Read the sets' stamps over REST. Since `b1d7702` a long set reports each variant
  and phase and yields, so the panel moves and the file saves as it goes.
- Do not press a bulk button twice: a second press used to start a second run alongside the
  first. The panel disables them while busy now, and the plugin refuses a second run.
- A new build restarts Update All Core from Link; update what is left one set at a time.

_Added on the 22nd, from the audit of 06:58 and its REST read-back:_

- Figma decides how a text's sizing, truncation and line limit combine, and no document says
  so. Truncate first, then HUG vertically, then set `maxLines`, and read the three back: set
  the other way round, CategoryTile's label became a fixed one-line box, and the try around it
  said nothing. `clampTextLines` does it that way.
- An Update draws a set's layers anew under new ids, and an override made inside a nested
  instance of that set reads its default again. Update a set after the sets it writes inside
  (`SETS_THAT_OVERRIDE_INSIDE`); a single Update names what to update next.
- Compare two REST snapshots by layer path: ids change on every Update. A text's bound font size
  and line height come back as arrays of aliases.
- `pnpm figma:painters:check` runs `code.js` in Node's `vm`, which accepts spread syntax;
  Figma's sandbox does not. Run `pnpm figma:plugin:check` too.
- Every auto-layout frame the plugin draws lays its stroke out (`strokesIncludedInLayout` is the
  runtime's default). Leave the stroke room when fitting content to a fixed size.
- A build stamp older than the plugin marks a gap, not a difference. Replay both builds'
  painters in the harness before asking for an Update: the Tree block's drawing from the 14th
  is today's.

_Added on the 22nd, from the three decisions:_

- The runtime never lets an auto-layout frame be smaller than its padding and laid-out stroke:
  it grows the frame the moment they outgrow it, and never shrinks a fixed frame back when the
  padding falls. Give a frame its final padding before its stroke, or start it with none, and
  read its size back. The harness models this; a frame larger than drawn fails the painter
  check.
- Curated Icons → Update keeps each icon's source layer while it is still right, because every
  icon tint in the file is an override keyed through that layer's id. Its result says
  `sourcesKept`; fewer than the icons already on the page means tints were lost, and the
  warning names the icons and the sets to update.
- A taxonomy symbol is filled, and a slot's tint is a stroke override on a Pointr outline. The
  sets whose painter tints fills (CategoryTile, CategoryField) offer the symbols; no other set
  does. A symbol swapped in by hand arrives black: fill its shape with the accent.
- CI runs `pnpm tokens:radius:nesting --strict` against the live file. A Figma change is judged
  by it after the run in Figma: a drawn frame inside another's corner must be concentric with it,
  or be a pill.

_Added on the 22nd, from the edge sweep:_

- `pnpm tokens:border:check` reads every edge a native component draws, across line breaks
  (`scripts/lib/native-edges.mjs`), and the web's sources. An edge is a `Semantics.Border` role
  — on Compose read through `KozmosThemeTokens` — or a mark in `NATIVE_MARKS_ALLOWED` that
  names its one primitive and why. A different primitive in the same component still fails.
- Compose's `KozmosColors` hold the light values only; anything that should follow the theme
  reads `KozmosThemeTokens` — generated since the open ones below, for every colour.
  `KozmosSurfaceDefaults` is `@Composable` for that reason; its `tint(style, background)`
  overload is the rule without the theme, for a test.
- A bare React `border` draws `--semantics-border-subtle` (`borderColor.DEFAULT` in the
  Tailwind config). Before, it was Tailwind's gray-200 in both themes, from the scoped reset.
- A React component test must wrap the component in `ThemeProvider`: the package's CSS applies
  only under `data-kozmos-root`, and without it the page lays out a grid as a list.
- Compose's Paparazzi goldens cover few of the swept components (Dialog's, Popover's, Menu's and
  Toast's tests are content models); `KozmosEdgeRolesPaparazziTest` draws the ones whose change
  was more than a colour.

_Added on the 22nd, from the open ones:_

- Compose reads every colour through `KozmosThemeTokens`, which `pnpm tokens:build` generates
  for all 453 colours of both palettes (`packages/tokens/build.mjs`, `android-compose/themed`),
  with each token's `$description` as its doc comment. `KozmosColors` and `KozmosColorsDark`
  are one theme each, for tests. `KozmosThemeTokens.isDark` is the theme decision, for what one
  colour cannot carry (the routing field's wash is black at 5 % light, white at 10 % dark).
  `pnpm tokens:theme:check` holds all of it, and the island's and the scrims' scoping.
- After `pnpm tokens:build`, `pnpm tokens:native:copy` copies every native output over the
  packages' copies, walked from the build; `pnpm tokens:copies:check` fails while any differs,
  and CI runs it. Hand-kept copy lists left both `colors.xml` behind from the 18th and
  `KozmosDesignTokens.kt` from the 21st.
- The Swift palette's parser reads `#RGB`, `#RRGGBB` and `#AARRGGBB`, alpha first. The build
  converts CSS's `#RRGGBBAA` and `rgba()` to that and throws on a value it cannot write.
- `.preferredColorScheme` sets the scheme of the whole window (SwiftUI applies it to the hosting
  controller). Scope a subtree with `.environment(\.colorScheme, …)`; only the theme provider
  may set the window's. Compose's equivalent is `LocalKozmosUseDarkTokens provides …`.
- A translucent fill over a platform shadow shows the shadow through it on both natives; CSS
  draws a box shadow outside the box only. Where the surface beneath is known, use the opaque
  step it composites to (the wayfinding field: background/50). Glass is the open task.
- A React field with `transition-all` animates its focus ring in over 300 ms: assert it with
  Playwright's `toHaveCSS`, which retries, not a one-off `getComputedStyle`.
- WebKit before Safari 26.4 applies no `@scope` rule to inputs, so a utility that overrides the
  input recipe (`h-10`, `border-none`, `bg-muted/50`) is lost there
  (`docs/browser-compatibility-2026-09-17.md`). `WayfindingInputRow.spec.tsx` pins it with
  `test.fail` on WebKit, which turns red once the engine is fixed.
- Every shell call starts in the main checkout, whatever the last one `cd`ed to: give worktree
  paths absolutely.

_Added on the 22nd, from the five decisions:_

- A washed field on the natives is `KozmosWashedField` (internal, `Input/WashedField.*`): React's
  `bg-black/5 dark:bg-white/10 border-transparent` recipe, single-line at 40 or a text area from 80.
  Use it where React washes a field; the outlined `KozmosInput` / `KozmosTextarea` elsewhere.
- A subtree with its own theme: React nests `<ThemeProvider theme="dark">` (its root is
  `display: contents`); SwiftUI `.environment(\.colorScheme, .dark)`; Compose
  `LocalKozmosUseDarkTokens provides true`; Figma `applyKozmosDarkMode(node, stats)` in the
  importer, which sets the Dark mode of every "Kozmos …" collection on the node.
- Over REST, a bound paint in the Core library renders its stored colour, not its variable's
  (the painter's fallback): read `boundVariables` ids for what a node is bound to, and check the
  variable itself in Figma. The token has no variables scope for `/variables/local` (403).
- The painter check's harness takes `createFigmaMock({ pages, collections })`, and mock nodes keep
  `explicitVariableModes`, so a painter's variable modes can be asserted.
- The branch's CI (PR #56) runs Linux Paparazzi at zero tolerance: a golden recorded on macOS can
  fail there alone. The job uploads `build/paparazzi/failures` as `paparazzi-failures`, and
  Gradle prints the difference (`7dec6c0`). Read the pixels before touching a tolerance: when
  only a few pixels are more than two levels off (OffByTwo counts nothing else), the class may
  take `CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE` (0.0001 %, calibrated in its KDoc); anything
  larger is a real difference.

_Added on the 22nd, from the handoff's checks (`docs/claude-code-handoff-2026-09-22.md` §9):_

- A Curated Icons → Update that draws an icon's source again orphans every tint laid through it,
  in every set but the four it repaints (Button, IconButton, FloatingActionButton, Badge); at
  09:47:15Z on the 22nd that was 2,325 icons in 52 sets. No audit, `figma:verify` or CI step reads
  icon paints: `scripts/figma-rest/icon-tints.mjs` does, and exits 1 while any is untinted. Read
  the file's `lastModified` before trusting any baseline recorded from it.
- A failing CI step skips every step after it, so a branch "one ruling from green" can hide more
  reds. Run the later `run:` blocks locally with `bash -e`; on the 22nd one of them was red.
- `STATUS.md` is generated by `scripts/skills/check-completion.ts` from the three platforms'
  component folders, and CI's governance step fails while it is stale: after adding a component
  folder, run it with `--write`. A folder that holds no component (Compose's `Motion`) is listed
  in `NON_COMPONENT_DIRECTORIES`.
- Port 6006 may belong to another worktree's Storybook: on the 22nd, one from
  `/private/tmp/kozmos-owned-css-verify.dV1etM`, running since the 18th. Eight check scripts
  default `STORYBOOK_URL` to 6006, so set it every time, to the server this worktree built.
- CI's Linux draws text in DejaVu Sans, as wide as Verdana and wider than SF; the story audit
  fails a 320 page whose document is wider than the window. Hold narrow rows in Verdana
  (`NarrowRows.spec.tsx`). A turning element's layout box is its rotated square (a 48 square at
  45° is 68 wide): clip it at its owner.
- Chromatic's "Build passed. Welcome to Chromatic! … continue setup" means the project has no
  accepted baselines; its UI Tests check stays pending until they are accepted.
- This machine's `gh` has no `--json` on `gh pr checks`: the fourth tab-separated column is the
  job's URL; read a job with `gh api repos/vodoco/kozmos-design-system-/actions/jobs/<id>` and its
  log with `…/logs`. macOS has no `timeout`.
