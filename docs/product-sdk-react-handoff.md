# React Product / SDK Handoff

This guide covers the React reference implementation added after the Web SDK
revamp audit. The source of truth for platform-neutral models is
`@kozmos-ds/product-contracts`; UI components are exported by `@kozmos-ds/react`.

## Ownership Boundary

The consuming app owns:

- API and map-SDK adapters.
- Selected POI, floor, category, marker, and route IDs.
- Localized labels, distances, durations, floor names, and status copy.
- Permissions, network, map readiness, route calculation, and action state.
- Real POI logos/media and their alternative text.

Kozmos components own presentation, responsive layout, accessibility semantics,
safe-area handling, and user-event callbacks. They do not query an API, move a
map camera, calculate a route, infer the selected floor, or fabricate content.

## Imports

```tsx
import type {
  FloorPresentation,
  POIPresentation,
  POIResultPresentation,
  RouteOptionPresentation,
} from "@kozmos-ds/product-contracts";
import {
  AdaptiveMapShell,
  FloorSelector,
  LocationPin,
  MapControlsGroup,
  POIDetailPanel,
  POIResultList,
  RoutePreviewPanel,
  getPOIResultDomId,
} from "@kozmos-ds/react";
```

## Keep List And Marker Selection Synchronized

Store one `selectedPoiId`. Derive both the result-card and pin states from that
ID; never maintain independent booleans.

```tsx
const [selectedPoiId, setSelectedPoiId] = useState<string>();

<POIResultList
  items={results}
  onSelect={setSelectedPoiId}
  resultCountLabel={copy.resultsCount(results.length)}
  selectedPoiId={selectedPoiId}
/>;

{
  results.map(({ poi, result }) => (
    <LocationPin
      key={poi.id}
      label={copy.markerLabel(
        poi,
        result.resultIndex,
        selectedPoiId === poi.id,
      )}
      number={result.resultIndex}
      onClick={() => setSelectedPoiId(poi.id)}
      resultId={getPOIResultDomId(poi.id)}
      selected={selectedPoiId === poi.id}
    />
  ));
}
```

The map adapter should also pan or change floor from this same state transition.
If the POI is on another floor, announce that change before switching floors.

## Compose The Adaptive Map Surface

```tsx
<AdaptiveMapShell
  style={{ height: "100dvh" }}
  collisionInsets={hostMinimumInsets}
  controls={
    <MapControlsGroup
      locationLabel={copy.focus}
      locationPresentation="labelled"
      locationState={locationState}
      locationStateLabel={copy.locationState(locationState)}
      onMyLocation={requestLocationFocus}
    />
  }
  map={<PointrMapRenderer adapter={mapAdapter} />}
  mapLabel={copy.mapLabel(activeFloor)}
  mapStatus={mapStatus}
  mapStatusContent={mapStatusMessage}
  panel={activePanel}
  panelLabel={activePanelLabel}
/>
```

The host must be explicitly sized: the shell now fills its parent without a 448px
minimum. The example above owns the viewport; an embedded module should fill its
bounded container instead. `onLayoutChange` reports shell-local renderer/panel bounds,
occlusions and map-local camera padding. An adapter must consume this output for
renderer resizing and camera padding; CSS alone cannot move SDK labels, routes,
attribution or marker collision boxes.

`collisionInsets` is the host's independent minimum padding, not feedback from the
shell's previous resolved output (feeding that back would retain old panel coverage
after a panel shrinks). Measured coverage is combined with the minimum and exposed via
the callback and `--kozmos-map-inset-*`. See `adaptive-map-layout.md` for usable-region,
safe-area and keyboard semantics. The native implementations have not yet adopted this
new React contract.

## Floors

Use stable IDs and localized labels:

```ts
const floors: FloorPresentation[] = [
  { id: "ground", label: t("floor.ground"), shortLabel: t("floor.gf") },
  { id: "first", label: t("floor.first"), shortLabel: t("floor.1f") },
];
```

Pass `variant="vertical-list"`, `horizontal-list`, or `compact-stepper` to the
same `FloorSelector`. The `selectedFloor` value is the canonical floor ID, not a
display label.

## POI Detail Actions

`POIDetailPanel` renders only actions listed by `poi.actions`. Provide every
localized action label and controlled state:

```tsx
<POIDetailPanel
  actionLabels={copy.poiActions}
  actionStates={poiActionStates}
  onAction={(action, poiId) => dispatchPoiAction({ action, poiId })}
  onClose={closeDetails}
  poi={selectedPoi}
  presentation={isDesktop ? "panel" : "sheet"}
/>
```

Omit `poi.media` when real, licensed media is unavailable. The media gallery
then renders nothing; do not replace missing venue media with unrelated stock
photography.

## Routing

Route options must contain localized `durationLabel` and `distanceLabel` values.
Keep one selected option in route state and update the array after
`onOptionSelect`.

```tsx
<RoutePreviewPanel
  backLabel={t("back")}
  continueLabel={t("continue")}
  destinationName={destination.name}
  onBack={closeRoutePreview}
  onContinue={startRoute}
  onOptionSelect={selectRoute}
  options={routeOptions}
  optionsCountLabel={t("route.optionCount", { count: routeOptions.length })}
  selectedRouteAnnouncement={selectedRouteAnnouncement}
  status={routeReadiness}
  statusContent={routeStatusContent}
/>
```

The component never changes its own selected route. During `calculating`,
`no-route`, or `error`, continuation is disabled.

## Migration Notes

- Prefer `POIResultCard` for search/list results. Keep `POICard` for generic
  content-card use only.
- `POICard` secondary actions are now outside its primary selection button, so
  they cannot accidentally trigger card selection.
- `RouteSummary` no longer positions itself against the viewport. Place it with
  `MapOverlay`, `AdaptiveMapShell`, or application layout.
- `MapOverlay` no longer assumes MapLibre attribution dimensions. Supply actual
  collision insets from the renderer adapter.
- A button in a loading state is now reliably disabled even when an explicit
  `disabled={undefined}` value was supplied.

## Native Parity

SwiftUI and Compose now implement the same 22 Product / SDK components as React,
so `STATUS.md` reports the lane at 22/22 on all three platforms.

The presentation contracts are mirrored natively rather than re-derived:

- Swift: `packages/ios/Sources/ProductContracts/ProductContracts.swift`
  (`KozmosPOIPresentation`, `KozmosRouteOptionPresentation`, and so on).
- Kotlin: `packages/android/src/main/java/com/kozmos/contracts/ProductContracts.kt`
  (same names, `com.kozmos.contracts`).

Both carry the shared derivations the web components perform inline, so the
three platforms cannot drift on them:

- `locationLabel` joins floor and building with a space-padded middle dot
  (`" · "`).
- `logoFallbackInitial` is the single-character fallback when no logo is supplied.
- `isAvailable` treats only an explicit `false` as unavailable.
- `selecting(selectedPoiId)` re-derives a result's selected flag from the one
  canonical selection ID, matching the "keep list and marker synchronized" rule
  above.

Native ownership matches web: these components render supplied presentation
models and report events. They never query an API, move a map camera, calculate
a route, or fabricate content.

## Remaining Release Gates

- Integrate and test the actual app source and supported map renderer.
- Vue now wraps every React component via `createVueWrapper`; verify the
  adapter's SSR and bundle-size constraints before treating it as a shipped SDK.
- Create canonical Product / SDK Figma component sets and real Code Connect
  mappings. The lane is 0/22 linked on every platform, and the iOS/Android
  `.figma` files for DirectionStep, FloorSelector, LocationPin, MapView,
  POICard, and WayfindingCard are still `// Placeholder` stubs.
- Run screenshot tests at 320, 375/390, tablet, and desktop widths, plus dark
  theme, RTL, long copy, and 200% text.
- Run manual VoiceOver/TalkBack and keyboard/switch-control checks.
