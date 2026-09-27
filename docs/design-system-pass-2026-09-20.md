# Design system pass — the card's header, the level switcher, folded phones, 20 September 2026

The coding agent, on Olcay's redirection after the [closure of Pass 3](pointr-ios-pass3-closure-2026-09-20.md):
"focus on the design system, and on what is missing, not on making the app most functional",
with three examples — the level switcher could be better, the name and the buttons should be a
single row, a long POI title should take two or at most three lines — and, added on the way, new
folded phones. The Pointr QA app is the place these parts are seen; the changes are the design
system's, on every platform that has the part. Branch `claude/pointr-browse-repairs`, unpushed,
in `/private/tmp/kozmos-browser-compat.uqPMBD`. Handoff items F and G and Pass 4 wait.

| Commit    | What                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------- |
| `77b2ae7` | The card's name and quick buttons share one row; the name wraps to three lines — iOS, web, Android |
| `04ca91a` | The open level switcher names every level (iOS)                                                    |
| `400e097` | The routing UI test waits for the lazy step rows                                                   |
| `bd4d3c8` | The open list is opaque, after the live look                                                       |
| the last  | This report, the two component docs, the index and the log                                         |

## 1. The card's header: one row, a name of up to three lines

**What each platform did.** iOS and the web both used a "fits or stacks" rule — `ViewThatFits`
in SwiftUI, `flex-wrap: wrap` in CSS — so a name that fit sat beside the favourite, save and
close buttons, and a name that did not pushed them under it, with no limit on its lines. Android
kept one row and cut the name to **one** line with an ellipsis. Three platforms, three
behaviours, and no fixture with a name long enough to show any of them: the web's Long Content
example had one, inline in its story, and nothing measured its header.

**The rule now, on all three.** The name and the quick buttons share one row whatever the
name's length, top-aligned; the name wraps beside them to three lines at most, then truncates;
the action strip below is unchanged. On iOS the `ViewThatFits` is a fixed top-aligned `HStack`
and the name has `lineLimit(3)`; on the web `.kozmos-poi-header` no longer wraps, the identity
and the actions align to the start, and `.kozmos-poi-title` is a three-line clamp; on Android
the name's `maxLines` is three. The long name is now a shared fixture, `longContentPOI` and
`longContentDetails`, used by the Storybook story and carried into the native playground by the
generator as a seventh example, "Long content".

**Measured.**

- iOS, `testALongNameWrapsBesideTheQuickButtonsAndStopsAtThreeLines`: the card rendered at
  320pt with a short, a long (80 characters) and an endless (240 characters) name, the pressed
  favourite button found by its theme fill and the name by its dark text. The buttons' top edge
  is the same in all three renders; the short name is one line, the long one three, the endless
  one no taller than the long one. Against the old component the buttons moved down and the
  name ran on; the test failed there first.
- Web, the browser suite's `long-content` example at 320, 568 and 1280 pixels, light and dark:
  the quick buttons' top within a pixel of the name's top and to its side, the name at most
  three 28-pixel lines, wrapping at 320. On the old stylesheet all six cases failed — at 320 the
  name took four lines and the buttons sat 140 pixels down, under it; at 568 and 1280 the buttons
  were vertically centred beside a six-line name. On the new one all 66 checks of the suite
  pass, on chromium, firefox and webkit.
- Android, `KozmosPOIDetailPanelPaparazziTest`: a recorded golden at 320dp — the name on three
  lines with an ellipsis beside the close button, top-aligned.
- Live, the QA app on the iPhone: "American Airlines Admirals Lounge" on two lines beside the
  three buttons, the location and the actions below, as in the fixture playground's rule.

## 2. The level switcher: the open list names every level

The collapsible variant — the one the map corner needs, and iOS alone has — showed "L1" and
"L2" above the pill when opened: the short labels a visitor could already read off the pill,
and nothing else. Each row of the open list now carries the level's short label in its square
with the level's name beside it, the current one filled and its name semibold; a venue whose
labels are its names shows the squares alone. The list grows away from the map's edge the pill
sits at, trailing-aligned, mirrored in right-to-left. A test-only initializer starts the list
open; `testTheOpenCollapsibleListNamesEveryLevel` renders it and measures that what is drawn
above the pill is wider than a column of squares and anchored to the pill's trailing edge —
against the old component the list was a 52pt column, and the test failed there first.

Live, on the iPhone, Terminal B: the pill opens into "L1 First Floor", filled, and "L2 Second
Floor", the list's right edge on the pill's. The wider list covers the zoom cluster to its
left while it is open, and at the closed control's 90 % opacity the plus and minus showed
through its rows; the open list is opaque now. That it can only be closed by choosing a level
matters more with the zoom buttons under it — the first of the leftovers below.

Chosen not to do now, and still true of the component: the list closes only when a level is
chosen — tapping outside or the pill again does nothing; it does not scroll, so a building with
more levels than the map has height would run off it; the closed pill gives no hint that it
opens; and React and Compose have no collapsible variant, so a web or Android host cannot park
the selector in a corner the same way.

## 3. Folded phones

Olcay's choice was the iPhone Fold first, checked before anything was promised. Checked:
Xcode 26.6 has no folding device type in its simulator, no runtime beyond iOS 26.5, and no
symbol containing fold, hinge or posture anywhere in UIKit's headers or SwiftUI's module
interface. Nothing can be built against the device's own API from here, and nothing about that
API is known to this session.

What the design system has today: the React shell's layout model takes hinge-free
`usableRegions` from the host, keeps the map above the panel across a horizontal hinge
(tabletop), keeps the panel to one side across a vertical one, never straddles a hinge, and the
browser suite exercises vertical-hinge, right-to-left-hinge and tabletop hosts. The iOS and
Compose shells decide by width class alone and know nothing of regions; no suite on any
platform renders the folded outer screen's narrow width or the unfolded near-square inner one;
nothing has run on a device.

Recommended, for Olcay's decision: bring the web's model to the iOS shell now — `usableRegions`
and the two hinge rules, tested at the sizes the device is expected to have — so that when the
SDK arrives the host only has to feed the regions; the same for Compose, where Jetpack
WindowManager's folding feature exists today and an emulator can be folded. Not started.

## 4. Also seen, for the list of what the design system lacks

_Later the same day the prototype's three navigation parts — the manoeuvre card, the itinerary,
the progress rail — were built on all three platforms:
[navigation-parts-2026-09-20.md](navigation-parts-2026-09-20.md)._

- Android's action strip is a `FlowRow` that wraps into rows; iOS and the web scroll it in one
  row. Android's location line truncates to one line; iOS and the web wrap it.
- The search bar's magnifying glass reads "Search" to VoiceOver before the field.
- Unchanged from Pass 3: no transition arrow in `DirectionType`, no floor slot and no
  current-step state on a direction step, the preview's 208pt option cards cut at the panel's
  edge, the `.panel`
  border inside a floating container, the zoom buttons on phones. Pass 3's "no route input"
  is withdrawn: `RoutingInputGroup` and `WayfindingCard` with its input row exist on all three
  platforms, and the QA app's picker should have composed them.
- The Figma side of these parts was not touched: no Figma access in this session. The header
  rule and the switcher's open list are drift to reconcile through the importer plugin.

## 5. Verified

| Check                                                      | Result                                                                                                                      |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| iOS render tests, unfixed components                       | both new tests failed: the buttons moved and the name ran on; the open list was a 52pt column                               |
| Package, iOS 26.5, iPhone 17 Pro, button baselines skipped | 86, from 84                                                                                                                 |
| Package, iOS 18.4, iPhone 16, baselines on                 | 88, from 86                                                                                                                 |
| Package, `swift test` on macOS                             | 78, unchanged: the new tests render on iOS                                                                                  |
| `node scripts/check-ios-poi.mjs`, CI's simulator step      | 52, from 51                                                                                                                 |
| QA app unit tests, iPad; its routing UI test, iPhone       | 43; passed, with the wait for the lazy rows (39 after `6527d7a` removed the preview's presenter and its tests, still green) |
| Playground build with the seventh example                  | succeeded; the fixture freshness check passes                                                                               |
| Browser suite `test:poi-details`, old stylesheet           | 6 of 66 failed, all six the long-content header                                                                             |
| The same, new stylesheet, chromium, firefox, webkit        | 66 of 66 on each                                                                                                            |
| React unit tests, lint, `test:css-build`, contract parity  | 494 tests in 114 files; ok; ok; ok                                                                                          |
| `docs:snippets:check`, docs typecheck, `tokens:raw:check`  | 327 identifiers ok; ok; ok                                                                                                  |
| Android, `verifyPaparazziDebug`                            | passed with the recorded golden; the button golden unchanged                                                                |
| Live, iPhone 17 Pro                                        | the long-name card; the open list with names, then opaque                                                                   |

Not run: Chromatic, the owned-CSS and gallery browser suites (no shared CSS beyond the card's
header changed), Android on a device or emulator. Not done: the Figma side of both parts.

## 6. Change it yourself

| Behaviour                                           | File                                                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| The header row and the name's line limit, iOS       | `packages/ios/Sources/Components/POIDetailPanel/POIDetailPanel.swift`: `header`, `identity`                                    |
| The same, web                                       | `packages/react/src/styles/owned-poi-detail.css`: `.kozmos-poi-header`, `.kozmos-poi-title`                                    |
| The same, Android                                   | `packages/android/src/main/java/com/kozmos/components/POIDetailPanel/POIDetailPanel.kt`: `Header`                              |
| The long-name fixture, and which examples reach iOS | `packages/react/src/components/POIDetailPanel/POIDetailPanel.fixtures.ts`; `scripts/sync-ios-poi-examples.mjs`                 |
| The open list's rows                                | `packages/ios/Sources/Components/FloorSelector/FloorSelector.swift`: `namedFloorButton`, `expandedList`                        |
| Measured render tests, and the pixel helper         | `packages/ios/Tests/KozmosTests/KozmosPOIDetailTests.swift`, `KozmosFloorSelectorTests.swift`, `RenderedPixels.swift`          |
| The web header check                                | `scripts/check-poi-detail-examples.mjs`, the `long-content` block                                                              |
| The Android golden                                  | `packages/android/src/test/snapshots/images/…POIDetailPanelPaparazziTest…png`; re-record with `./gradlew recordPaparazziDebug` |

## 7. Decisions for Olcay

_Later the same day, against the prototype Olcay named as the reference
([pointr-prototype-screen-states-2026-09-20.md](pointr-prototype-screen-states-2026-09-20.md)):
the card's quick buttons keep their 16px corners; system fonts on each platform, Readex Pro being
the old font; no wayfinding modes and no preview step — Go starts at once with a position and
asks for a starting point without one, which the QA app now does; the open level list's form is
still his to choose._

1. The switcher's remaining improvements (§2): dismissal, scrolling, a hint on the pill, and the
   collapsible variant on the web and Android.
   _The list's form is ruled, the same evening: names beside the labels, as built._
2. Folded phones (§3): build the web's hinge model into the iOS and Compose shells now, ahead of
   the device SDKs, or wait.
3. Android parity (§4): the wrapping action strip and the truncating location line.
