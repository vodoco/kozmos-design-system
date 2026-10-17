# @kozmos-ds/pointr-map

Pointr's live map in Kozmos's map shell, for React. `PointrMap` loads the Pointr Web SDK
(MapLibre GL inside) from Pointr's CDN at run time, switches the SDK's own interface off, and draws
the map into a Kozmos `MapView` for `AdaptiveMapShell`'s `map` slot. Kozmos's parts draw everything
over it: the search, the results, the floors, the selection and the map's status.

**Private, and not released.** This is phase 1 of the plan for SDK-UI-007. The package is
`"private": true`, so Changesets and the release workflow never publish it, and it is not in
`release/plan.json`. Its first release is the owner's decision. It bundles nothing of the SDK.

## Use

```tsx
import * as React from "react";
import { AdaptiveMapShell, FloorSelector } from "@kozmos-ds/react";
import type {
  FloorPresentation,
  MapCollisionInsets,
  MapReadiness,
} from "@kozmos-ds/product-contracts";
import {
  PointrMap,
  type PointrBuildingPresentation,
  type PointrMapHandle,
} from "@kozmos-ds/pointr-map";

export function VenueMap({ cloudToken }: { cloudToken: string }) {
  const map = React.useRef<PointrMapHandle>(null);
  const [insets, setInsets] = React.useState<MapCollisionInsets>();
  const [status, setStatus] = React.useState<MapReadiness>("loading");
  const [building, setBuilding] = React.useState<PointrBuildingPresentation>();
  const [floor, setFloor] = React.useState<FloorPresentation>();
  return (
    <AdaptiveMapShell
      mapStatus={status}
      mapStatusContent={
        status === "loading" ? "Loading the map" : "The map could not load"
      }
      onCollisionInsetsChange={setInsets}
      map={
        <PointrMap
          ref={map}
          config={{
            baseUrl: "https://<environment>.pointr.cloud",
            auth: { cloudToken },
            site: "<site>",
          }}
          padding={insets}
          onStatusChange={setStatus}
          onBuildingChange={setBuilding}
          onLevelChange={setFloor}
          onPoiSelect={(item) => map.current?.flyToPoi(item.poi.id)}
        />
      }
      controlsBottomEnd={
        building && floor ? (
          <FloorSelector
            floors={[...building.floors]}
            selectedFloor={floor.id}
            onFloorSelect={(id) => map.current?.setLevel(id)}
          />
        ) : null
      }
    />
  );
}
```

- **Events** arrive as `@kozmos-ds/product-contracts` shapes: a POI as `{ poi: POIPresentation,
result: POIResultPresentation }` (what a `POIResultList` row takes) with its coordinates and
  level, a level as a `FloorPresentation`, top floor first. A product never touches an SDK class.
- **The handle**: `map()` (the MapLibre map, for `project` to place a `LocationPin`),
  `flyToPoi(id)` (changes level first, keeps the shell's padding), `setLevel(index or floor id)`,
  `search(query, { scope })` (a `SearchResponsePresentation` with `items`, numbered from 1).
- **Padding**: the shell's collision insets go to `map.setPadding`, and back again whenever the
  camera rests, because the SDK resets the padding to 0 when a POI is clicked.
- **Errors**: `onError` gets a `PointrMapError` and `onStatusChange` the shell's `mapStatus`. The
  message is for a developer; the product shows its own words, chosen by `code`:

| `code`     | Status        | What happened                                                                                           |
| ---------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| `config`   | `error`       | The config cannot start the SDK, or the Cloud refused its site or building                              |
| `instance` | `error`       | Another map holds the page's one Pointr map                                                             |
| `storage`  | `unsupported` | No `localStorage` (a sandbox without `allow-same-origin`); the SDK reads it unguarded                   |
| `webgl`    | `unsupported` | No WebGL context                                                                                        |
| `script`   | `error`       | The SDK's files did not load: the network, a blocked host or an integrity mismatch (offline: `offline`) |
| `csp`      | `error`       | A Content-Security-Policy blocked an SDK host or the map's `blob:` workers                              |
| `auth`     | `error`       | The keys or the cloud token were refused, or the token expired                                          |
| `data`     | `error`       | The site's data did not load, or the map was not ready in `readyTimeoutMs` (offline: `offline`)         |

A non-fatal error (`fatal: false`: a blocked tile host, a non-blocking SDK problem) leaves the
status as it was.

## Keys

- No identifier, key, token or environment URL is in this package, its tests or its bundle, and
  the adapter never logs one. Its tests run against a fake SDK, with no network.
- **Products** pass `auth: { cloudToken }`: a short-lived Pointr Cloud token from their own back
  end. The SDK reads the client and the environment from the token's claims (its `iss` replaces
  `baseUrl`), and no secret reaches the browser. An expired token is refused before anything loads.
- **Prototypes** may pass `{ clientIdentifier, licenseKey }`, typed in at run time (a form, an
  environment variable), never written into source or a story.
- The SDK writes the client identifier and licence key to the console when it refuses them, so
  `PointrMap` refuses an incomplete config itself, first. Its messages go through a redaction that
  takes out the configured secrets, anything shaped like a token, and every URL's query.
- The SDK reads every option from the page's query string too (`?licenseKey=…` or
  `?ptrLicenseKey=…`), so a key in a page's address is a key in the page. The SDK's files are
  requested with `referrerpolicy="no-referrer"`, so the address does not reach the CDN.

## Content-Security-Policy

The policy the spike measured working (`'unsafe-inline'` was for the spike's own inline script;
the SDK needs no `unsafe-eval`). Without `worker-src blob:` the map never appears.

```text
default-src 'self'
script-src 'self' 'unsafe-inline' https://pointr-websdk.azureedge.net
style-src 'self' 'unsafe-inline' https://pointr-websdk.azureedge.net
font-src data:
img-src 'self' data: blob: https://pointr-websdk.azureedge.net https://*.blob.core.windows.net
connect-src 'self' data: https://*.pointr.cloud https://*.blob.core.windows.net https://pointr-websdk.azureedge.net https://mapscdn.pointr.tech https://api.maptiler.com
worker-src blob:
child-src blob:
```

## The SDK's version and integrity

`src/sdk-versions.ts` pins Pointr Web SDK 10.13.0 and the sha384 of its two files, which the
browser checks: a changed file on the CDN fails to load (`script`) instead of running. Pointr
publishes no hashes; these were computed from the files, never executed. To add a version, or to
recheck the table against the CDN (both need the network, so neither is a required check):

```sh
pnpm --filter @kozmos-ds/pointr-map integrity 10.14.0   # prints the entry for sdk-versions.ts
pnpm --filter @kozmos-ds/pointr-map integrity:check     # fails on a hash the CDN no longer matches
```

## Limits

- **One map a page.** `MapWidget` is a singleton and its views find their parts by fixed ids; a
  second `PointrMap` is refused with `instance`, and a widget the page made itself is left alone.
  Unmounting removes the MapLibre map (`destroyMap()`, with the 3D buildings' flag off first),
  then the widget; StrictMode and remounts leave one map. A config change starts the map again.
- **SDK internals.** The map accessor, the teardown flag, `UiController.showError` (where every
  failure after `start()` arrives: before the loading view it is the token's, after it the data's)
  and the chrome's ids are the SDK's internals, read from the 10.13.0 bundle. Each version bump
  runs the live check first.
- **Kozmos draws the interface.** Every `is…Enabled` option is off; the level selector, the Exit
  and info buttons are hidden by a stylesheet scoped to the map; the Cloud's first-visit card is
  skipped by counting a session; the SDK's highlight of a clicked POI is taken off; the SDK's own
  error page is not drawn. The watermark and its credits stay: the SDK removes the map when they
  are hidden.
- **The page's address wins.** The SDK lets a query parameter (`?isSearchEnabled=true`,
  `?ptrLevelIndex=2`, even `?container=…`) override what `PointrMap` passes it.
- The SDK's stylesheet sets `html, body { height: 100% }` and its own classes globally. Under an
  AMD or CommonJS loader the SDK's script sets no global (`script`).
- `setLevel` reaches only levels of the open building; `flyToPoi` only POIs the map has reported (a
  click or a search). A token the Cloud refuses while the data loads is reported as `data`.
- The SDK picks its mobile layout from the device, not the container. Touch, RTL (`language: "ar"`)
  and the SDK's navigation events were not exercised by the spike.
- **GAP-175**: the contracts have no building or site presentation, so `PointrBuildingPresentation`
  and `PointrSitePresentation` are this package's own, built from the contracts' shapes, until
  they do.

## Not done yet

- **Phase 2**, Storybook: stories behind `KOZMOS_SPIKES`-style gating, so no required build needs
  the network, and the key form.
- **Phase 3**, Claude Design: the snippet, then a page in "Consuming this system" once its sandbox
  is known to run it.
- **Phase 4**: the live workflow (a Playwright drive with the keys as secrets, run on demand and
  before each SDK version bump, with `integrity:check`) and the docs page.
- SwiftUI and Compose have a plan of their own, later.
