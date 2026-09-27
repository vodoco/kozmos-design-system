# The navigation parts — manoeuvre card, itinerary, progress rail, 20 September 2026

The coding agent, proceeding on its own recommendation after the
[audit](kozmos-pointr-operators-guide-2026-09-20.md) of the day's work: build the three
navigation parts the [prototype](pointr-prototype-screen-states-2026-09-20.md) has and the design
system lacked, on iOS, React and Android, with tests, stories, docs and examples, then put the
Pointr QA app's directions on them. Branch `claude/pointr-browse-repairs` in
`/private/tmp/kozmos-browser-compat.uqPMBD`, pushed to origin on the evening of the 20th at
Olcay's word (the worktree and its ignored SDK files stay where they are).

| Commit    | What                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------- |
| `3f360e2` | iOS: `KozmosManoeuvreCard`, `KozmosItinerary`, `KozmosRouteProgressRail`; the summary's navigation layout |
| `e3353b7` | Pointr QA app: the directions on the three parts; the flow UI test reads them                             |
| `e43941b` | The summary's navigation layout takes `destination`, not `title` (the web cannot call it `title`)         |
| `bef76c9` | React: the same three parts, the summary's layout, stories, the Examples/Navigation story, docs           |
| `536cdc1` | Android: the same three parts, the summary's overload, Paparazzi goldens                                  |
| `f82f3fe` | The fixture playground's navigation on the parts                                                          |
| `9783145` | The open card has no name of its own (all three platforms); `test:navigation`, the browser check          |
| the last  | This report, the index, the log, the guide                                                                |

## 1. What was built, and the rules each part keeps

**The manoeuvre card** floats over the map during navigation: the arrow, the instruction (two
lines at most), the detail — distance and floor — and a 36 × 5 grab bar. A tap on the
instruction row opens the card into the itinerary in its place; the grab bar closes it. Open, the
card is as tall as its itinerary up to a cap (320 by default), past which the itinerary scrolls:
a long route must not cover the map. The card owns the toggle and what assistive technology hears
of it — closed, one button named "instruction, detail"; open, no name of its own, because the
itinerary inside is the named thing and two landmarks called the same are read twice (axe's
`landmark-unique` said so the first time the parts met a browser). The itinerary it opens into is
the caller's, so the card never decides what a route is made of.

**The itinerary** is the whole route as a list: FROM and its name, every step with its arrow, the
current step semibold in the theme colour, TO and its name. One element per step to assistive
technology, the current one selected (`aria-current="step"` on the web).

**The rail** shows how far along the route the visitor is: a theme dot where it starts, a 34-point
theme disc carrying the current manoeuvre's arrow, a 6-point track, a grey dot where it ends. The
disc runs from just after the start dot to just before the end dot; progress outside 0…1 is
clamped. A `progressbar` with the caller's label ("Step 2 of 4") and the percentage.

**The route summary's navigation layout**, additive: given a `destination`, the name with End in
the danger outline beside it, the time, distance and arrival on one row, the caller's progress —
the rail, in the products — below. The estimate layout is untouched.

**The hosts.** The QA app's top slot shows the card instead of the search bar while navigating;
the sheet holds the navigation summary with the rail over Previous and Next step or Finish; the
step list left the sheet for the card. Progress is by ground covered, so a lift or a level change
— no distance — does not move the disc. The fixture playground and the Storybook
Examples/Navigation story compose the parts the same way.

## 2. Measured

- **iOS**, `KozmosNavigationPartsTests`: the card's spoken label; the rail's arithmetic (10, 256,
  133 for 0, 1 and 0.5 on a 300-wide rail; clamped; a rail too short to travel keeps the disc at
  the start); five renders read in pixels — the disc 34 wide where progress puts it, the card
  showing the itinerary instead of the manoeuvre when open, hugging a 40-point itinerary and
  cutting an 800-point one at 320, one step alone emphasised and between the others, End on the
  destination's row with the stats on one row under it and the progress under those. The rail test
  failed first against the component as written: the rail's stack was centred and every element
  sat a dot to the right — the fix is one alignment. The other three render tests were run once
  against a mutated component each (a card that always opened, an itinerary that emphasised
  nothing, a summary whose End was plain text) and failed there.
- **Web**, `test:navigation` on the Storybook build: the closed card as one button and its silent
  grab bar; opening into the itinerary with exactly one current step and the card no taller than
  the list plus its chrome; the cap and the scroll on the open card; the disc 34 wide at the
  track's middle for 0.5, centred on the rail; End on the heading's row with the stats on one row
  under it and the rail under those; the composition on the shell advancing the rail and the
  current step on Next. Twenty checks — five stories, light and dark, 320 and 1280 — on chromium,
  firefox and webkit, each story through axe on the WCAG tags.
- **Android**, `KozmosNavigationPartsPaparazziTest`: the closed card; the open card hugging four
  steps with the second emphasised; the rail at 0.5 and 0.84 over the navigation summary; the
  rail's arithmetic and the card's spoken label asserted outright.
- **Live**, the QA app on the iPhone 17 Pro, Dunkin' to Airport Shuttles: the card reads "Take
  Elevator down to First Floor, 58 m · Second Floor", opens into the four steps with the first
  current, closes; at the last step the disc sits at 84 % and the card reads "Destination, 32 m ·
  First Floor". The open card, first drawn, took its whole allowance for five rows — the scroll
  view took all it was offered — which moved the cap into the component, where `.frame(maxHeight:)`
  did the same, so a small `Layout` proposes the cap and takes its child's size.

## 3. Verified

| Check                                                           | Result                                                      |
| --------------------------------------------------------------- | ----------------------------------------------------------- |
| Package, `swift test` on macOS                                  | 81, from 78                                                 |
| Package, iOS 26.5, iPhone 17 Pro, button baselines skipped      | 94, from 86; the class again after the last change, 8       |
| Package, iOS 18.4, iPhone 16, baselines on                      | 96, from 88; the class again after the last change, 8       |
| `node scripts/check-ios-poi.mjs`, CI's simulator step           | 52                                                          |
| QA app unit tests, iPad; the flow UI test, iPhone               | 39; passed, three times, the last on the final code         |
| Fixture playground build                                        | succeeded                                                   |
| React unit tests, lint, build, typecheck (react, docs)          | 507 in 117 files (16 new); clean; ok; ok                    |
| `components:classes:check`, `tokens:raw:check`, contract parity | no new inert class; no new raw value; ok                    |
| `docs:snippets:check`, snippet compile from the tarball         | 343 identifiers ok; ok                                      |
| `test:css-build`, Storybook docs check, Storybook regressions   | ok; 102 pages at two widths; pass                           |
| `test:navigation`, chromium / firefox / webkit                  | 20 of 20 on each                                            |
| Android, `verifyPaparazziDebug`                                 | passed, after each of three changes; three goldens recorded |

Not run: Chromatic; Android on a device or emulator; the Vue wrapper package (private, not
checked for the new parts). Not done: the Figma side — no Figma access this session; the three
parts and the summary's layout are drift to reconcile through the importer, and the manifest will
list them without a Code Connect file until then.

## 4. Change it yourself

| Behaviour                                | iOS                                                                                                 | Web                                                                                           | Android                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| The card's cap and how it hugs           | `ManoeuvreCard/ManoeuvreCard.swift`: `maxItineraryHeight`, `KozmosCappedHeightLayout`               | `ManoeuvreCard/ManoeuvreCard.tsx`: `maxItineraryHeight`, `.kozmos-manoeuvre-itinerary`        | `ManoeuvreCard/ManoeuvreCard.kt`: `maxItineraryHeight`, `heightIn`           |
| What the closed card reads               | `KozmosManoeuvreCard.accessibilityDescription`                                                      | `manoeuvreDescription`                                                                        | `manoeuvreDescription`                                                       |
| The card's names                         | `manoeuvreLabel`, `expandLabel`, `collapseLabel`                                                    | the same props                                                                                | the same parameters                                                          |
| The rail's geometry                      | `RouteProgressRail/RouteProgressRail.swift`: `dot`, `disc`, `track`, `discLeading`                  | `RouteProgressRail/RouteProgressRail.tsx`: `ROUTE_PROGRESS_RAIL`, `discLeading`               | `RouteProgressRail/RouteProgressRail.kt`: `KozmosRouteProgressRailGeometry`  |
| The itinerary's rows and endpoint labels | `Itinerary/Itinerary.swift`: `row`, `endpoint`                                                      | `Itinerary/Itinerary.tsx`                                                                     | `Itinerary/Itinerary.kt`: `StepRow`, `Endpoint`                              |
| The summary's navigation layout          | `RouteSummary/RouteSummary.swift`: `init(destination:…)`, `navigation(destination:)`                | `RouteSummary/RouteSummary.tsx`: `RouteSummaryNavigationProps`, `RouteSummaryNavigation`      | `RouteSummary/RouteSummary.kt`: the `destination` overload                   |
| The arrows                               | `DirectionStep/DirectionStep.swift`: `DirectionType.iconName`                                       | `DirectionStep/DirectionStep.tsx`: `DIRECTION_ICONS`, `DirectionIcon`                         | `DirectionStep/DirectionStep.kt`: `DirectionType.icon()`                     |
| The QA app's directions                  | `apps/PointrPlayground/Sources/App/SDKMapScreen.swift`: `topBar`, `directionsPanel`                 | —                                                                                             | —                                                                            |
| The flow UI test's reading of them       | `apps/PointrPlayground/UITests/RoutingFlowUITests.swift`: `assertDirectionsAreReadable`             | —                                                                                             | —                                                                            |
| The fixture playground                   | `apps/Playground.swiftpm/…/WayfindingScreen.swift`: `topBarLayer`, `sheetHeader`, `navigationPanel` | `ManoeuvreCard/NavigationExamples.stories.tsx`                                                | —                                                                            |
| Progress by ground covered               | the hosts above (a policy, not the rail's)                                                          | the example story                                                                             | —                                                                            |
| Tests                                    | `Tests/KozmosTests/KozmosNavigationPartsTests.swift`                                                | each part's `.test.tsx`; `scripts/check-navigation-examples.mjs` (`pnpm test:navigation`)     | `test/…/navigation/KozmosNavigationPartsPaparazziTest.kt`, its three goldens |
| Docs                                     | in the React MDX of each part (SwiftUI and Compose snippets, checked against the sources)           | `ManoeuvreCard.mdx`, `Itinerary.mdx`, `RouteProgressRail.mdx`, `RouteSummary.mdx` §Navigation | the same                                                                     |

The browser check runs against a served Storybook build, as the POI suite does:

```bash
cd /private/tmp/kozmos-browser-compat.uqPMBD && pnpm --filter '@kozmos/react...' build && pnpm --filter @kozmos/docs build-storybook
```

```bash
cd /private/tmp/kozmos-browser-compat.uqPMBD && python3 -m http.server 6012 --bind 127.0.0.1 --directory apps/docs/storybook-static
```

```bash
cd /private/tmp/kozmos-browser-compat.uqPMBD && STORYBOOK_URL=http://127.0.0.1:6012 pnpm test:navigation
```

## 5. Decisions for Olcay

1. **The rail's geometry** — 10-point dots, a 34-point disc, a 6-point track — is the prototype's,
   measured, not a token: the nearest sizes are 32 and 40. Keep the prototype's numbers as the
   part's own, or tokenise.
2. ~~**The card over the map is white at 90 %**, as the prototype's; on the QA app the map's labels
   show through it. Keep, or opaque like the open level list.~~ Answered and built: the glass
   surface role, [glass-surface-2026-09-20.md](glass-surface-2026-09-20.md).
3. **The QA app's sheet while navigating** stays at the medium detent, so a third of it is empty
   under the buttons; the prototype's navigation sheet is compact. A `.fraction` detent the shell
   already has, or a compact detent — the shell's decision, not the app's.
4. ~~**Transition arrows** are still the recorded gap: "Take Elevator down to First Floor" carries a
   straight arrow on the card, the rail and the itinerary alike. The icon set for lift, escalator
   and stairs is a design decision before any platform draws one.~~ Answered and built:
   [transition-arrows-2026-09-20.md](transition-arrows-2026-09-20.md).
5. ~~**End on Android** is the button's `Sm` size, which the Compose button still draws 44 tall;
   the web and iOS draw a shorter pill.~~ Withdrawn: every platform draws every button size 44
   tall, by the component contract (`component-contracts.json`, `button.sizes`), and the web's
   `sm` is `h-11` as well. The iOS pill only looked shorter beside the title. Nothing to fix.
6. **The open level list's form** (names beside labels, or the prototype's labels-only column) is
   still open from the [design system pass](design-system-pass-2026-09-20.md).

_Answered by Olcay the same evening:_ **1** the rail keeps the prototype's numbers; **2** a
**glass surface role** is built now on all three platforms — the handoff's ruling §5.13, from
`Semantics.Effect.glass` — and the card and the summary take it, the three map cards after;
**3** a compact detent in the shell; **4** each platform's own icon set for the transition
arrows; **5** withdrawn — the button is 44 tall on every platform by contract, nothing to fix; **6** the open level list keeps its names
beside the labels, as built. The order of the stages: the glass role, the transition arrows,
then the prototype's search sheet.
