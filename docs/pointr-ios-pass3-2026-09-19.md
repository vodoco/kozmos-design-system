# Pointr iOS — Pass 3: a route between two places the visitor names, 19 September 2026

The coding agent, continuing [Astra's handoff](handoff-2026-09-19.md) after
[Pass 2](pointr-ios-pass2-2026-09-19.md). Handoff §10's Pass 3. Branch
`claude/pointr-browse-repairs`, still unpushed, in `/private/tmp/kozmos-browser-compat.uqPMBD`.
No Cloud content was changed. There is no positioning in this milestone — location, motion and
Bluetooth permissions are declined — so a route starts from a place the visitor chooses, and
nothing here calls itself live navigation.

| Commit    | What                                                                            |
| --------- | ------------------------------------------------------------------------------- |
| `afa7bdf` | Routing on the Kozmos routing parts; the SDK asked for the device's language    |
| `5a177df` | The [session handoff](handoff-2026-09-19-pass3.md) this report was written from |

## What PointrKit gives, as measured

Read from the 10.3.0 headers and confirmed on Design-QA before the surfaces were composed.

- **The wayfinding manager** (`Pointr.shared.wayfindingManager`) answers `isReady(for:)` per
  site, tells its delegate `onWayfindingManagerReady(for:)`, and calculates with
  `calculateRoute(fromPosition:toNearestPositionIn:)` — **synchronously**, in 15–77 ms on the
  simulator for both modes together, the first calculation after a launch the slowest. The
  mode is manager-wide: `setCurrentMode(.normal)` or `.accessible` before each calculation,
  and `.normal` put back after.
- **A route** (`PTRRoute`) carries `walkingDistance` in metres, `travelTime` in seconds, its
  `directions` and its `nodes`. Time and distance on every surface come from these; nothing is
  estimated by the host.
- **A direction** (`PTRRouteDirection`) carries the SDK's own worded `message`, a
  `messageType`, `distance`, `duration`, `isTransition`, a `transitionInfo` with `mainType`,
  `subType` and `isAccessible`, and a `position` with its level and coordinate.
- **Drawing** is the SDK's: setting `mapViewController.currentRoute` draws the route, `nil`
  removes it. The host frames it with MapLibre's `cameraThatFitsCoordinateBounds` inside the
  chrome the shell reports, plus a 24pt margin, and follows a step with `showLevel` and
  `setCenter(_:zoomLevel: 19)`.
- **Language.** Left to the Cloud's default, Design-QA answers in **Arabic**: every instruction
  of the first live route did. `PTRParams.preferredLanguage`, in the `language_region` form the
  reference names, is now set from the device locale, and the instructions arrived in English.
  The user manager's device-stored `preferredLanguage` needs a user session and is not used.
  _Corrected 20 September 2026: the Arabic was the iPhone simulator's own first language
  (`AppleLanguages` ar, en-GB), not the Cloud's default — the iPad, asked for no language,
  answered in English. The setting stays, as the app's language rather than the device's; the
  finding for Pointr below is withdrawn. See the
  [closure report](pointr-ios-pass3-closure-2026-09-20.md)._
- **Message types seen live:** 3 Turn Left, 4 Turn Right, 6 Turn Slightly Left, 7 Turn Slightly
  Right, 9 an elevator transition, 11 a corridor or walkway transition, 13 Destination. Every
  transition on the routes tried was `wayfinding-network/custom-transition` with `isAccessible`
  true.

## What the visitor does

1. The card of a selected place has **Go** beside favourite and bookmark; its caption says a
   route starts from a place the visitor chooses.
2. **Go** opens the starting-point picker: "Directions / to _place_", a back chevron, a Kozmos
   search bar ("Choose a starting point") and a `KozmosPOIResultList` of this building's places
   except the destination, filtered by name. The fixture playground needs no such surface — it
   starts from an entrance — so this is the host's own composition of Kozmos parts.
3. Choosing a place opens the **preview**, `KozmosRoutePreviewPanel`: **Quickest** and
   **Step-free**, each with its route's time and distance; "_n_ routes from _origin_"; a spinner
   while calculating; and, when nothing came back, the reason with "Choose another starting
   point". A calculation that found nothing is an option the visitor can see but not choose —
   "No step-free route was found" on it. The quickest option carries "Uses stairs or
   escalators" when the SDK marks one of its transitions not accessible. The SDK draws the
   selected route; the map shows the origin's level and fits the whole route.
4. **Show directions** opens the **directions**: `KozmosRouteSummary` with "Arrive _hh:mm_" and
   "_d_ m · _n_ min left", both summed from the steps still ahead; "Step _i_ of _n_ · to
   _place_"; every step as a `KozmosDirectionStep` — the SDK's words, the step's distance when it
   covers a metre or more, the floor name — with the current one at full opacity; Previous,
   **Next step**, and **Finish** on the last. Each step switches the map to its level if needed
   and centres it at a reading zoom. Moving the map by hand ends the framing, as it does for a
   selected place.
5. **Finish**, the summary's end button, or Back on the preview returns to the card: the route
   comes off the map and the place is framed again. Selecting another place, or closing the
   card, resets routing too.

## Measured, iPhone 17 Pro simulator, iOS 26.5, Terminal B

| Route                                             | Quickest              | Step-free              |
| ------------------------------------------------- | --------------------- | ---------------------- |
| Dunkin' (Second Floor) → Airport Shuttles (First) | 200 m, 213 s, 4 steps | 200 m, 213 s, 10 steps |
| Air Canada (Second Floor) → Airport Shuttles      | 64 m, 184 s, 2 steps  | 64 m, 184 s, 6 steps   |

Every step of the first route, from the app's debug log (type is `PTRDirectionMessageType`'s
raw value):

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

The steps sum to within a metre and two seconds of the route's own totals, so the directions
header and the preview agree to the rounding.

## Verified

By hand on the device, after the language change:

- The picker lists the building's places without the destination and filters as typed.
- The preview shows both options, Quickest selected, "2 routes from Dunkin'", the route drawn
  on the Second Floor and fitted inside the chrome.
- Show directions opens on step 1 in English; the summary reads "201 m · 4 min left".
- Stepping through the elevator step turns the floor pill from L2 to L1 and re-centres the map
  on the First Floor step; the step rows name the floor.
- Finish returns to the card, the route is gone, the place is framed.
- The quickest option carries no stairs warning, rightly: both routes take the elevator.

Tests: 41 in the app on the iPad Pro 11" simulator — `RoutePresenterTests` (9: the two options
and their warnings, the unavailable option, the message-type table, the under-a-metre rule, the
remaining sums, the formats, the travel estimate, the inaccessible flag), `SDKIntegrationTests`
(20, now with the language helper), `TaxonomyPresenterTests` (12). `pnpm tokens:raw:check` and
`pnpm components:contract:check` pass. The package suites were not re-run: Pass 3 changed no
package source.

Astra's §10 gates for this pass:

| Gate                                               | State                                                                             |
| -------------------------------------------------- | --------------------------------------------------------------------------------- |
| Documented route APIs, explicit origin/destination | Done                                                                              |
| Kozmos route input, preview, summary, instructions | Done; the picker is the host's composition of Kozmos parts                        |
| Calculation, loading, failure, no route            | Calculation live; loading and failure states coded and unit-tested, not seen live |
| Accessibility options                              | Done: both modes, the warning on transitions the SDK does not call accessible     |
| Cancellation                                       | Coded between the two synchronous calls; not exercisable live at these timings    |
| Multi-floor changes                                | Verified live                                                                     |
| Return to POI browsing                             | Verified live                                                                     |
| Time and distance from the actual route            | Done                                                                              |
| Fixture wayfinding not labelled live navigation    | Done; the caption says there is no positioning                                    |

## What the design system lacks

1. **A transition arrow.** `DirectionType` is `straight`, `left`, `right`, `destination`, on
   iOS and on the web alike. An elevator, an escalator, stairs, a corridor, a walkway, a
   building change (types 8–12 and 27) and turning back keep the SDK's words under a straight
   arrow. The host draws no symbol of its own; extending the component with transition kinds,
   and which icon each gets, is a decision for both platforms.
2. **A floor slot on a step.** `KozmosDirectionStep` has instruction, distance and duration;
   the floor name travels in the duration slot ("58 m • Second Floor").
3. **A current-step state.** The directions list dims the other steps to 45 % opacity; the
   component has no selected or current variant, and VoiceOver hears nothing of it.
4. ~~**A route input.** `packages/ios` has `RouteOptionCard`, `RoutePreviewPanel`,
   `RouteSummary` and `DirectionStep`, and no origin or destination input: the picker here is
   the host's. A product that lets visitors choose where a route starts needs one.~~
   _Corrected 20 September: `KozmosRoutingInputGroup` and `KozmosWayfindingCard` with
   `KozmosWayfindingInputRow` exist on iOS, the web and Android — a search for "route" in the
   component names missed "Routing" and "Wayfinding". The QA app's picker should have composed
   them; that is the design-system pass's first item._

## Findings for Pointr, for §9's list

1. ~~**Design-QA's default language is Arabic.** Every instruction arrives in Arabic unless the
   SDK is asked otherwise; nothing in the quick-start says so.~~ _Withdrawn 20 September 2026:
   the simulator's first language was Arabic; PointrKit followed it, as it followed English on
   the iPad. Not a finding for Pointr._
2. **The normal-mode route drops the turns.** 4 steps against the accessible route's 10, and 2
   against 6, on the same paths: only transitions and the destination remain. Whether that is
   the SDK or the venue's wayfinding data is Pointr's to say.
3. **A marker the host did not draw.** After Show directions, a navy marker with a "●>○" glyph
   sat on the elevator step at zoom 19. It is the SDK's; which annotation it is, and whether it
   can be styled or hidden, is unidentified.

## Not done

A live no-route case: origins are limited to the current building, and no unroutable place was
tried — Design-QA's `Do Not Route` CMS key marks the candidates. Go does not wait for
`wayfindingReady`; an early Go shows the not-ready message with "Choose another starting point",
where a retry would be right. The top search bar stays in every phase, bound to the browse query.
Not checked: the three panels on the iPad, Dynamic Type, right-to-left, VoiceOver, dark mode,
iOS 18.4 for this app, real network failure. Keywords in search (F), floor certification (G),
positioning (a later explicit scope), Android: none of it.

## Change it yourself

_Later on 20 September the preview step and its two modes were removed on Olcay's direction
(`6527d7a`); Go opens the picker and the directions follow at once. The rows below that name
the preview, the options or `routePreviewPanel` describe a state that is gone; the operator's
guide (`kozmos-pointr-operators-guide-2026-09-20.md`) has the current map._

| Behaviour                                                                                 | File                                                                              |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Option labels, the warnings, the arrow table, the under-a-metre rule                      | `apps/PointrPlayground/Sources/App/Routing/SDKRoute.swift`: `SDKRoutePresenter`   |
| Distance, duration and arrival formats                                                    | same file: `RouteFormat`                                                          |
| Which modes are calculated; the not-ready and no-route messages; the per-step debug lines | `…/Routing/SDKRouting.swift`: `calculateRoutes`                                   |
| The route's framing margin (24 pt) and a step's zoom (19)                                 | same file: `fitRoute`, `showStep`                                                 |
| Which places can be a starting point                                                      | same file: `originCandidates`                                                     |
| The language the SDK is asked for                                                         | `…/SDKSession.swift`: `SDKLanguage`, `start()`                                    |
| The three panels, their labels, Finish on the last step                                   | `…/SDKMapScreen.swift`: `routeSetupPanel`, `routePreviewPanel`, `directionsPanel` |
| Go on the card                                                                            | `…/SDKPOIAdapter.swift`: `presentation`, `actions`                                |
| Tests                                                                                     | `Tests/RoutePresenterTests.swift`, `Tests/SDKIntegrationTests.swift`              |

Build, launch and test commands are in the [session handoff](handoff-2026-09-19-pass3.md)
§9. The route summary is logged as a `notice` and persists; the per-step lines are `debug` and
do not, so stream them before calculating:

```sh
xcrun simctl spawn 51937B59-CEAE-4BC7-BC34-FEB17E28FAE7 log stream \
  --predicate 'subsystem == "com.kozmos.pointrqa"' --level debug --style compact
```

To add a transition arrow once the design system has one: `directionType(forMessageType:)` is
the only place that decides, and `testTheSDKsMessageTypesMapOntoTheFourArrows` is the table to
extend.

## Decisions for Olcay

The five from Passes 1 and 2 stand (gallery crop, zoom buttons on phones, the `.panel` border,
the 320pt/AX5 exception, pushing and moving the SDK files). Pass 3 adds three: whether
`DirectionType` grows transition kinds on both platforms; what the top search bar does during
routing; whether Go waits for wayfinding readiness, and what the not-ready state offers.
