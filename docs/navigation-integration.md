# Navigation component integration

Use this guide to configure, extend and verify Kozmos navigation presentation on React,
SwiftUI and Compose. The component source and offline examples do not implement routing,
map rendering or arrival detection. Read each component's Storybook API page for complete
signatures.

## What to use

| Need                           | Component or reference             | Key configuration                                                                                            |
| ------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Current instruction at the top | ManoeuvreCard                      | Theme appearance is the default; select background appearance for neutral solid/glass surfaces               |
| Expanded directions            | Itinerary and DirectionStep        | Ordered localized instruction parts, exactly one current step, optional distance/duration labels             |
| Direction symbols              | DirectionKind and DirectionIcon    | Explicit walking, physical turns, destination, transport up/down, ramp, enter/exit and same-level transition |
| Active journey bottom content  | RouteSummary and RouteProgressRail | Hosted presentation avoids a nested card; missing estimates stay absent; unknown progress stays unknown      |
| Completed journey              | ArrivalPanel                       | Destination, optional actual metrics, controlled Done callback and pending state                             |
| Resolved origin or destination | RouteLocationField                 | Query and resolved entity identity are separate; localized statuses and clear/map actions                    |
| Setup or map confirmation      | RouteSetupPanel                    | Host-validated ready flag, pending state, Continue/close callbacks, content slot                             |
| Route alternatives             | RoutePreviewPanel                  | Unique stable route IDs, exactly one selected available route before Continue                                |
| Recovery                       | Dialog or EmptyState               | Host-supplied reason, safe actions and focus restoration; localized web Dialog closeLabel                    |

Native names use the `Kozmos` prefix. The Swift and Kotlin `DirectionType` names remain
source aliases of `KozmosDirectionKind`; web `DirectionType` aliases `DirectionKind` from
`@kozmos-ds/product-contracts`. Native consumers must rebuild and update exhaustive switches
for the added cases. This does not promise binary compatibility with an old compiled enum.

## Defaults and migration

ManoeuvreCard now uses a contrast-paired theme fill, not the former neutral surface.
Set `appearance="background"` on React, `.background` on SwiftUI, or
`KozmosManoeuvreAppearance.Background` on Compose to retain neutral surface behavior.
The surface setting applies to background appearance; theme appearance remains opaque.
Do not apply translucent white text or a generic blue override to arbitrary customer themes.

ArrivalPanel and RouteSetupPanel default to hosted content; RouteSummary retains standalone
as its compatibility default. A host sheet owns its padding, safe areas and keyboard offset.
Choose one owner for those insets and provide scrolling for enlarged text. Done and End are
different callbacks: End stops active navigation, while Done acknowledges confirmed arrival.

Missing metrics are omitted. A supplied localized `0 min` remains valid. Estimated remaining
distance/time belong to the active route; actual completed totals belong to confirmed arrival
and must never be copied from estimates. Components do not calculate, localize or infer totals.

The rail accepts normalized progress; null/nil means unknown. Legacy step-disc calls
clamp numbers for drawing. Active-leg calls instead treat invalid or out-of-section
positions as unknown; neither mode infers arrival. Waypoints have stable IDs and
normalized positions. Invalid or ambiguous IDs/positions are omitted. Coincident descriptions
remain accessible while overlapping visual markers are thinned. Extremely narrow tracks omit
transition glyphs rather than overlap them. Replace route progress and waypoint data together on reroute.

### Active-leg route rail

Supply `activeLeg` (normalized start/end on the route's cumulative distance basis) to opt into
the route display. `positionMode="static"` colours only the selected section, without a dot or
percentage. `positionMode="live"` (default) colours journey start to the supplied blue dot;
the accumulated fill never resets at transitions. `appearance="theme"` is the default;
`"gradient"` runs theme-to-success across that coloured portion and grows with live progress.
Unavailable live position is not static selection and paints no distance. Future legs stay neutral.
The SDK composes the shared
`ProgressTrack` and `UserLocationMarker`; it does not calculate route geometry or location.

Keep the active leg host-controlled: reaching an elevator does not automatically advance it.
Supply `activeWaypointId` when multiple transitions share the same position. Null, nonfinite
or out-of-leg positions are unknown, not 0%. Update the leg, position and waypoints together
on reroute and reject old route IDs. Hosts should allocate at least 24 units of rail width,
and offer the full itinerary for dense transitions. Existing callers without `activeLeg`
retain the legacy step-disc presentation.

`motion="directional"` opts into Core-owned rounded dash flow: over the selected static
section, or on the neutral section ahead of the dot up to the next transition. It never
simulates movement or runs into later sections. At the section end it stops until the host
confirms the next section. Set `motion="none"` for suspended guidance, unreliable location,
arrival or the user's motion preference. Reduced motion keeps a static cue; background views
stop animation clocks. Provide a user-accessible pause/preference control. The guidance fixture
includes Core toggles for live/static positioning and motion; these are not SDK positioning controls.
On web, both the OS preference and `DesignConfigProvider`'s reduced-motion setting
stop the flow. Forced-colour mode uses system Highlight/GrayText instead of a gradient;
the optional decorative dashes are omitted, but supplied distance and location remain.
The journey reducer validates a sample against its newly supplied section (or the
current section if omitted). Invalid samples become unknown, never a clamped 0%/100%.

For local changes, start with `Progress/Progress` (generic track),
`UserLocationMarker/UserLocationMarker` (compact dot) and `RouteProgressRail` (SDK composition)
under each platform's components directory. `Examples/Navigation/Guidance` provides separate
fixture controls for walking within a leg and confirming the next step. Those controls are
not production navigation UI. Run `pnpm test:route-track` against a fresh Storybook build
(`STORYBOOK_URL` selects the server), and `pnpm test:storybook-catalogue` before moving stories.

## Host lifecycle

1. Keep a resolved entity ID separate from the user's query. Typing alone cannot enable Continue.
   Clear both on explicit clear; retain the old confirmed point while a map candidate is unconfirmed.
2. Give search and calculation requests identities. Cancel or invalidate them after editing,
   clearing, closing setup or starting a newer request. Ignore responses from old identities.
3. Continue only with valid confirmed points and an available selected route. Reject ambiguous
   selections instead of choosing the first. Keep step-free intent when a route is unavailable.
4. Associate progress and arrival events with the current route. A complete progress fraction is
   not sufficient arrival evidence. Stop handling events after cancellation or Done.
5. On confirmed arrival, show ArrivalPanel with only supplied actual totals. Make Done idempotent,
   leave navigation and return to the map with the destination selected in the host.
6. Keep one announcement owner. Restore focus after dismissal, focus the origin after Edit origin,
   and expose a browse target after Done. Validate these transitions with real assistive technology.

The controlled example implements these rules with fixture events and no network/SDK.
RouteLocationField can emit a query callback during selection as well as the resolved option;
cross-platform callback order is not promised. Request only while the field is unresolved.
Automatic field analytics omit query/location IDs, but the host still owns consent and logging.

For SDK/server search, set RouteLocationField `filterMode="host"` (SwiftUI `.host`,
Compose `KozmosRouteLocationFilterMode.Host`). Results retain their supplied ranking and
synonym matches; the default local mode preserves existing substring filtering. Neither mode
accepts ambiguous IDs or stale suggestions in a non-ready state. The controlled journey also
demonstrates explicit focus restoration after selecting/clearing either endpoint, including
transitions that remain in setup; ordinary query updates do not move focus.

For selected endpoints, `onEdit` makes the centered Core text action read “Change”
(`changeLabel` localizes it) on React, SwiftUI and Compose. Without `onEdit`, the
action remains a text clear action invoking `onClear`; it is not relabelled Change
while still destroying the selected identity. The host retains its original place
while displaying an unresolved draft, and restores it through `onCancelEdit`
(`cancelEditLabel`). These callbacks never automatically change the host's state.
Native map/current-position choices now use Core Combobox's `KozmosPickerAction`
commands inside the unresolved picker. Existing callbacks remain compatible, but
the map action is no longer below the selected endpoint. Open Change/Clear, then
open the picker. Supply `currentPosition` only for a host-validated usable fix;
`currentPositionLabel` localizes its command. Core requests closure before activation
and leaves query/value unchanged; current-position selection calls `onSelect` with
the exact supplied object. Hosts still own map focus and revalidation at activation.
Do not pass synthetic locations to simulate commands. See the Combobox platform docs
for optional controlled expansion and the preserved Compose overloads.

Recovery distinguishes no route, unavailable step-free route, unavailable position, offline and
transient errors. Retry is only useful when the host can retry; otherwise offer point editing
or return to map. Never replace a requested accessible route with stairs. Show only safe diagnostic
codes, not raw queries, private location data or transport errors. Native inline recovery fixtures
do not certify native modal focus trapping or restoration.

## Source map for changes

| Change                            | Edit here                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Web component layout and behavior | `packages/react/src/components/{ManoeuvreCard,Itinerary,DirectionStep,RouteSummary,RouteProgressRail,ArrivalPanel,RouteLocationField,RouteSetupPanel,RoutePreviewPanel}`                                                 |
| SwiftUI equivalents               | `packages/ios/Sources/Components/` under the same component names; `Sources/Utilities/DirectionGlyph.swift` for the shared drawing view                                                                                  |
| Compose equivalents               | `packages/android/src/main/java/com/kozmos/components/` under the same component names                                                                                                                                   |
| Shared semantic values            | `packages/product-contracts/src/index.ts`, Swift `Sources/ProductContracts/ProductContracts.swift`, Kotlin `contracts/ProductContracts.kt`                                                                               |
| Wayfinding artwork (Express)      | `packages/icons/src/owned/navigation-glyphs.json`; run the generator below, never hand-edit generated files                                                                                                              |
| Guidance roles and layout CSS     | `packages/react/src/index.css`, `src/styles/owned-components.css` and the existing surface/guidance utilities on native; use tokens, not customer-specific literals                                                      |
| Controlled example and reducer    | `apps/docs/stories/examples/NavigationJourney.stories.tsx`, `navigationJourney.ts`, `navigationJourney.test.ts`                                                                                                          |
| Native composition examples       | `packages/ios/UITestHost/App/InteractionHost.swift` (`navigation-journey`), Android `KozmosJourneyCompositionTest.kt`                                                                                                    |
| Browser checks                    | `scripts/check-navigation-actions.mjs`, `check-navigation-examples.mjs`, `check-navigation-glyphs.mjs`, `check-routing-targets.mjs`, `check-route-location.mjs`, `check-route-setup.mjs`, `check-navigation-journey.mjs` |
| API examples and guidance         | Component `.mdx` and `.stories.tsx`; generated API cards under `docs/claude-design/` come from `pnpm skills:build`                                                                                                       |

The wayfinding glyphs are Pointr's own artwork from the Pointr Maps - Express design (Figma
`BwtG2COVRqUWGPrIvP4jxr`, section `29853:51378`), each the 48px master scaled to the 24 grid and
filled; `navigation-glyphs.json` names each one's Figma node, and its Exit departs from the file
as its note says. Turns, turning back, the destination, lifts, escalators, stairs, ramps, entry
and exit draw them by default; straight on, level changes and transitions keep the Pointr
arrows. Every glyph is a named `@kozmos-ds/icons` export (`ElevatorUpAndDown`, `Shuttle`, …) and
a kebab-case `KozmosIcon` name on iOS and Android. Walking reuses the existing SDK web mark and
platform native marks.
Physical directions never mirror with reading direction. Unknown adapter values should retain
their instruction without inventing a turn; the host decides whether to continue guidance.

## Reproducible checks

Run from the repository root with the pinned tools and frozen dependencies. Stop any Storybook
consumer before rebuilding shared `dist`; a concurrent rebuild can remove files being served.

```sh
pnpm install --frozen-lockfile
pnpm icons:navigation:generate
pnpm icons:navigation:check
pnpm --filter "@kozmos-ds/react..." build
pnpm contracts:parity:check
pnpm components:contract:check
pnpm skills:build
pnpm skills:check
pnpm docs:snippets:check
pnpm docs:snippets:compile
pnpm --filter @kozmos-ds/icons test
pnpm --filter @kozmos-ds/react test
```

Start a fresh Storybook on an available port, then run the browser suites against that URL.
Changing a workspace package's exports may require clearing that preview's stale Vite cache.
Preserve the exact cache directory before regenerating it; do not remove unrelated previews.

```sh
pnpm --filter @kozmos-ds/docs storybook:react --port 6230
# In another terminal, after the preview is ready:
STORYBOOK_URL=http://127.0.0.1:6230 pnpm test:navigation
STORYBOOK_URL=http://127.0.0.1:6230 node scripts/check-navigation-glyphs.mjs
ADAPTIVE_BROWSER=firefox STORYBOOK_URL=http://127.0.0.1:6230 pnpm test:navigation
ADAPTIVE_BROWSER=webkit STORYBOOK_URL=http://127.0.0.1:6230 pnpm test:navigation
```

Use `node scripts/check-ios-poi.mjs` for actual pinned iOS simulator tests and read test names
back from its `.xcresult`. Run `swift test` separately for macOS; it compiles iOS-only cases out.
On Android, run `./gradlew verifyPaparazziDebug` from `packages/android` and inspect the JUnit
XML names, failures and skips. A successful process that selected zero tests proves nothing.

Before review readiness, run the candidate checklist in
[design system maintenance](design-system-maintenance.md), including the separate bundle workflow:

```sh
pnpm ci:local --workflow bundle-size.yml --job analyze-bundle
pnpm --filter @kozmos-ds/docs build-storybook
pnpm test:visual
```

Review intentional pixel changes before recording their exact stories with the pinned amd64
Docker renderer as described in [visual review](visual-review.md). Do not record web baselines
on a bare Mac or raise limits to hide growth. Regenerate documentation after builds, check it
again after hook formatting, and verify required PR checks on the final committed SHA.

## Separate acceptance and remaining scope

These components do not close live SDK search/routing integration, map reticle/camera behavior,
renderer sprites, physical accessibility, external Figma or Claude artifact adoption, or native
package-registry delivery. Host acceptance still needs offline/reconnect, changing buildings,
floors and locales, background/resume, location permission changes, long real venue names,
screen readers and hardware keyboards. Retain existing map provider attribution.

The broader backlog still includes inline itinerary endpoint Edit actions (GAP-104), a dedicated
Previous/Next actions slot for RouteSummary (the remaining part of GAP-110), the full
POIDetailPanel route-preview/details slot (GAP-111), and renderer styling ownership. Current
examples use the existing preview and setup components instead; they are not claimed to close
those APIs.
