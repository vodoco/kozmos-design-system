# Pointr iOS — Pass 3 closed: the marker, the no-route case, readiness, the iPad, VoiceOver, 20 September 2026

The coding agent, continuing the [handoff after Pass 3](handoff-2026-09-19-pass3.md), its
§11 item 2: the five leftovers Pass 3 recorded for itself. Branch `claude/pointr-browse-repairs`,
still unpushed, in `/private/tmp/kozmos-browser-compat.uqPMBD`. No Cloud content was changed.
Every measurement below is from the real QA app on Design-QA: the iPhone 17 Pro simulator
(iOS 26.5) and, for the first time driven rather than only screenshot, the iPad Pro 11" (M5).

| Commit    | What                                                                                          |
| --------- | --------------------------------------------------------------------------------------------- |
| `65ddd1c` | The not-ready state retries, readiness retries it by itself; the language and readiness logs  |
| `25629b3` | A direction step reads as one element; the summary's icon is silent; the current step is told |
| `cf75072` | The routing flow as a UI test, on any simulator, with the accessibility tree attached         |
| the last  | This report, the corrections, the handoff, the index and the log                              |

## 1. The marker on the current step — identified

Pass 3 saw "a navy marker with a ●›○ glyph" on the elevator step and did not know whose it was.
It is **PointrKit's next-portal marker**: the transition the route reaches next, drawn by the SDK
whenever `currentRoute` is set, at the transition's node in the wayfinding network. Read through
MapLibre's public style API with a temporary probe (deleted before commit) that listed every
style layer whose identifier names a route, a transition, a marker or a portal, and the features
under each on screen:

| Layer                                                  | Kind   | Source                             | What it draws                                                                                                |
| ------------------------------------------------------ | ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `route_default_ptr`                                    | line   | `source_route_ptr`                 | The route on the current level; each polyline feature carries `isCurrent`                                    |
| `route-arrows-layer_ptr`                               | symbol | `route-arrows-source`              | Direction arrows along the line, icon `route-arrow-image`, 6 × 6 px                                          |
| `custom-ptrlayer_symbol_next-portal_ptr_ptr`           | symbol | `source_next-portal_ptr`           | **The marker.** One point feature, `mainType=wayfinding-network`, `subType` the portal's kind, text its name |
| `custom-ptrlayer_symbol_route_segment_markers_ptr_ptr` | symbol | `source_route_segment_markers_ptr` | Icon `ic_segment_marker`, a figure; no feature was on screen in any dump                                     |

The marker's icon is a constant on the layer, chosen per route: `wf-custom-transition` on
Dunkin' → Airport Shuttles, whose every transition is `wayfinding-network/custom-transition` — that
is the ●›○ glyph, a 72pt navy pin; `wf-lift-down` on the routes whose next portal is an
`elevator-node` (Air Canada → Airport Shuttles, and "Sound Environments of New England" → Central
Parking L0 across four floors): three figures in a lift car over a down chevron. Both images were
read out of the style and looked at. `PTRTransitionInfo.iconId` was empty on every transition of
every route calculated; the SDK chooses the icon by the node's subtype, not by that field.

Nothing in the public API addresses it: `PTRMapViewController` has `currentRoute`,
`addMarkers`/`removeMarkers` for the host's own `PTRMapMarker`s and `poisToShow`/`poisToHide`;
`PTRUserInterfaceConfiguration` has `routeColor` and `routeWidth`. Hiding or restyling the marker
would go through MapLibre's style API, which PointrKit does not document as a surface; that is a
decision, not done. The host draws nothing near it; what it needs to know is that a 72pt pin
stands above the next portal while a route is shown. The venue's own transition icons — the black
discs on stairs, escalators and lifts — are `symbol_transition_ptr`, unrelated to the route.

## 2. A live no-route case — no candidate on Design-QA

The `Do Not Route` CMS key was the candidate. Measured over every place the SDK returns for the
site, 1,196 across 12 buildings: 38 carry the key, and **every one of them carries the string
`"false"`**. They are the kerbside transport places — Terminal A 10, Terminal B 5 (Courtesy Bus,
Logan Express, Rental Car Center & Blue Line, Scheduled Bus, Silver Line), Terminal C 8, Terminal
E 12, Rental Car Center 3 — and none is marked not to be routed. So there is no place on Design-QA
that the key excludes, and the no-route state cannot be produced from it.

Tried instead: Silver Line, one of Terminal B's five places carrying the key, as the destination
from Dunkin'. The SDK routed it — 213 m, 226 s, 4 steps quickest and 11 step-free — so the
kerbside places the key marks are on the network. No place on Design-QA is known to be
unroutable, and the no-route state was not seen live.

The state stays covered by `testAMissingRouteIsAnUnavailableOption` and, for its recovery, by the
new `testTheNotReadyStateOffersARetryAndNoRouteAnotherStartingPoint`. For Pointr's list: a CMS
boolean arrives as the string `"false"`, and a venue that wants the key honoured has 38 places
saying no.

## 3. Readiness — measured, and the wrong recovery replaced

`wayfindingReady` was tracked and Go never waited for it, so an early Go would show the not-ready
message with "Choose another starting point", the wrong recovery. Measured on every launch of this
session (the app now logs both moments):

| Launch           | Building loaded, ms after start | Wayfinding ready, ms after start | Gap        |
| ---------------- | ------------------------------- | -------------------------------- | ---------- |
| iPhone, cold     | 1,084 (not ready)               | 1,323                            | 239 ms     |
| iPhone, six more | 141–174 (not ready)             | 399–486                          | 240–330 ms |
| iPad, cold       | 1,736 (not ready)               | 2,000                            | 264 ms     |

The place list itself waits for the data manager's readiness, which comes later still, so a
visitor cannot have selected a place, let alone pressed Go, inside that window; the not-ready
message is reachable in code and not in practice. The recovery is fixed anyway: the not-ready
state now offers **Try again**, which repeats the same request (`retryRouteCalculation`), and
readiness arriving while that message shows repeats it by itself; no route keeps "Choose another
starting point". The rule is a pure function, `SDKRoutePresenter.recovery(for:)` and
`retriesOnReadiness(phase:status:)`, with two tests. Go stays enabled: decision 8 in the handoff
is Olcay's, and it now has numbers.

## 4. The three panels on the iPad — driven, and captured

The desktop tooling cannot drive the iPad (no device grant), so the flow is now an XCUITest,
`apps/PointrPlayground/UITests/RoutingFlowUITests.swift`, scheme `KozmosPointrQAUI`, which needs
no grant: it launches the app, waits for the places, selects a destination, presses Go, chooses a
starting point, waits for the preview, shows the directions, steps to the end and finishes,
attaching a screenshot and the accessibility tree of each panel to its result bundle. On the iPad
Pro 11" the three panels float beside the map as Pass 1's shell laid them out: the picker with
its search field and the building's places (305 of Terminal B's 306, the destination left out);
the preview with Quickest selected, "2 routes from Air Canada", 4 min and 64 m, the route drawn
and the lift marker beside the Elevator; the directions with "Arrive 00:22" in the iPad's 24-hour
locale, "64 m · 4 min left", "Step 1 of 2 · to Airport Shuttles", the two steps, Previous and Next
step. Export the pictures with:

```sh
xcrun xcresulttool export attachments --path <result bundle>.xcresult --output-path <dir>
```

Seen on the way, not changed: the second option card is cut at the panel's edge and scrolls, on
the iPad as on the phone — `KozmosRoutePreviewPanel` lays 208pt cards in a horizontal scroll —
which is a design question for the component; the picker's rows show an index badge and an
initial-letter avatar, the result card's design; and the iPad opened on Terminal B this time.

## 5. VoiceOver over the directions — what it got, what it gets now

What the accessibility tree held before, read by the UI test on the unfixed code (Run A, the
Terminal B route): each step flattened into three elements — an `Image` reading **"Up"** (the
straight arrow's own symbol description) or **"Remove Map Pin"** (the destination's), the
instruction, and "58 m • Second Floor" — nothing telling the current step from the dimmed ones,
and the summary's transport icon an unlabelled image. The assertion written for it failed first:
`decorative images read out: ["Up", "Up", "Up", "Remove Map Pin"]`.

Fixed, in the package and the host:

- `KozmosDirectionStep` is one element, labelled "instruction, distance, duration" —
  "Take Elevator down to First Floor, 58 m, Second Floor" — with the arrow hidden: it says nothing
  the instruction does not. The label is `accessibilityDescription(instruction:distance:duration:)`,
  tested on its own.
- `KozmosRouteSummary` hides its transport icon; the words beside it carry the meaning.
- The host adds the selected trait to the current step, and posts an announcement when Next or
  Previous changes it — "Step 2 of 4. Take Corridor to Garage B, 41 m, First Floor" — because
  VoiceOver's focus stays on the button.

What proves it, and what cannot. The UI test asserts that exactly one step carries the selected
trait and that it reads as one combined element. It does **not** assert the arrow's silence,
because XCUITest's snapshot lists what SwiftUI hides or ignores — the route option card's hidden
`clock` icon and the result card's ignored children are in every tree it wrote — so absence there
proves nothing. An in-process walk of a hosted view through UIKit's accessibility protocol reaches
no SwiftUI element at all (the hosting view has no subviews and no accessibility elements), so
that test was tried and dropped. The silence rests on `.accessibilityHidden(true)` and
`.accessibilityElement(children: .ignore)`, SwiftUI's documented behaviour; a VoiceOver session by
ear, on a device, is still owed and belongs to Pass 4.

Still the design system's, unchanged: a current-step state (the host dims and marks; the
component has no variant), a floor slot on a step, the transition arrows. New and minor: the
search bar's magnifying glass reads "Search" before the field, as an audible symbol.

## 6. Also found

1. **Pass 3's language finding was wrong, and is withdrawn.** The iPhone 17 Pro simulator's
   first language is Arabic (`AppleLocale ar_SA`, `AppleLanguages` ar, en-GB); the QA app, not
   localised to Arabic, runs as `en_SA`, so nothing on its screens showed it. Asked for no language
   on the iPad (`en_GB`), PointrKit answered in English. So before Pass 3's change the SDK
   followed the device's first language, and Design-QA has no Arabic default. The
   `preferredLanguage` setting stays — it asks for the language the app runs in — and the app now
   logs what it asked for and what the device speaks. Corrected in the Pass 3 report, the handoff,
   Astra's handoff, the index and the log.
2. **The building at launch is not stable.** The same iPhone opened on Central Parking (210
   places) on every launch of this session where Pass 3 had seen Terminal B (306); the switch to
   Terminal B came a moment later, after the first search, while the count label still said 210.
   The UI test names the count it wants and waits for it. Evidence for handoff item G, not fixed
   here.
3. **Two places named "Airport Shuttles"** on Terminal B's First Floor: the picker, with the
   destination excluded by identifier, still lists one. A picker by name cannot tell them apart.
4. **"Dunkin' "** carries a trailing space in its name.

## 7. The UI test

`xcodebuild -project KozmosPointrQA.xcodeproj -scheme KozmosPointrQAUI -destination "platform=iOS Simulator,id=<udid>" -derivedDataPath /private/tmp/kozmos-pointr-qa-xcode -resultBundlePath <path>.xcresult CODE_SIGNING_ALLOWED=NO test`,
from `apps/PointrPlayground`. Environment, exported before the command (a `KEY=value` argument to
xcodebuild is a build setting, not environment): `TEST_RUNNER_KOZMOS_QA_DESTINATION` and
`TEST_RUNNER_KOZMOS_QA_ORIGIN` name the places, otherwise the first of the building the map opened
on; `TEST_RUNNER_KOZMOS_QA_BUILDING_POIS` waits for that place count, relaunching up to three
times; `TEST_RUNNER_KOZMOS_QA_EXPECT_NO_ROUTE=1` asserts the no-route state instead of the
directions. It is live against Design-QA and needs the ignored SDK files, like the app, so it is
not in CI. Its `print` lines start with `QA-FLOW`; the trees with `AXTREE-BEGIN`.

## 8. Verified

| Check                                                                | Result                                                                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| QA app unit tests, iPad Pro 11" (iOS 26.5)                           | 43 passed: `RoutePresenterTests` 11, `TaxonomyPresenterTests` 12, `SDKIntegrationTests` 20              |
| UI test, iPhone 17 Pro, Dunkin' → Airport Shuttles, probe-free build | passed in 26 s; 4 steps; the current step reads "Take Elevator down to First Floor, 58 m, Second Floor" |
| UI test, iPad Pro 11", Air Canada → Airport Shuttles                 | passed in 22 s; 2 steps; the three floating panels captured                                             |
| The same assertion on the unfixed step component                     | failed first: "Up", "Up", "Up", "Remove Map Pin"                                                        |
| Package, `swift test` on macOS                                       | 78, from 76                                                                                             |
| Package, iOS 18.4, iPhone 16, button baselines on                    | 86, from 84                                                                                             |
| Package, iOS 26.5, iPhone 17 Pro, baselines skipped                  | 84, from 82                                                                                             |
| `node scripts/check-ios-poi.mjs`, CI's simulator step                | 51, unchanged: it runs the gallery and shell suites                                                     |
| `pnpm tokens:raw:check`, `pnpm components:contract:check`            | ok                                                                                                      |
| The probes                                                           | Deleted before the commits; nothing under the app's sources names them                                  |

Not run: Chromatic, the web suites (no React source changed), Android. Not seen: a live
no-route; VoiceOver by ear.

## 9. Not done

A live no-route case (no candidate; §2). A VoiceOver session by ear. Gating Go on readiness
(decision 8). Hiding or restyling the SDK's next-portal marker. The top search bar during routing.
Item F, item G (its evidence grew; §6), Pass 4, Android.

## 10. Change it yourself

_Later on 20 September the preview step was removed on Olcay's direction (`6527d7a`): the
recovery now lives in the picker's `routeStatusRow` in `SDKMapScreen.swift`, and the rows below
that name the preview describe a state that is gone. The operator's guide has the current map._

| Behaviour                                                 | File                                                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Which failure gets which recovery; when readiness retries | `apps/PointrPlayground/Sources/App/Routing/SDKRoute.swift`: `recovery`, `retriesOnReadiness`       |
| The retry itself; the readiness log                       | `…/Routing/SDKRouting.swift`: `retryRouteCalculation`, `onWayfindingManagerReady`                  |
| The recovery button                                       | `…/SDKMapScreen.swift`: `routePreviewPanel`                                                        |
| The current step's trait; the announcement                | same file: `directionsPanel`                                                                       |
| The language asked for, and the log of it                 | `…/SDKSession.swift`: `SDKLanguage`, `start()`                                                     |
| What a step reads as                                      | `packages/ios/Sources/Components/DirectionStep/DirectionStep.swift`                                |
| The summary's silent icon                                 | `packages/ios/Sources/Components/RouteSummary/RouteSummary.swift`                                  |
| The flow test and its knobs                               | `apps/PointrPlayground/UITests/RoutingFlowUITests.swift`, `project.yml`                            |
| Tests                                                     | `Tests/RoutePresenterTests.swift`, `packages/ios/Tests/KozmosTests/KozmosDirectionStepTests.swift` |

## 11. Decisions for Olcay

The eight in the handoff stand; 8 (Go and readiness) now has §3's numbers behind it. Two more:

9. Whether the SDK's next-portal marker should be hidden or restyled through MapLibre's style
   API, which PointrKit does not document as a surface (§1).
10. The preview's option cards: 208pt each, the second cut at the panel's edge on both devices (§4).
