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
  BuildingPresentation,
  FloorPresentation,
  MapCollisionInsets,
  MapReadiness,
} from "@kozmos-ds/product-contracts";
import { PointrMap, type PointrMapHandle } from "@kozmos-ds/pointr-map";

export function VenueMap({ cloudToken }: { cloudToken: string }) {
  const map = React.useRef<PointrMapHandle>(null);
  const [insets, setInsets] = React.useState<MapCollisionInsets>();
  const [status, setStatus] = React.useState<MapReadiness>("loading");
  const [building, setBuilding] = React.useState<BuildingPresentation>();
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
  `search(query, { scope })` (a `SearchResponsePresentation` with `items`, numbered from 1). A
  search covers the whole site, the contracts' default, and has no `appliedScope`;
  `{ scope: "building" }` holds it to the open building and says so in `appliedScope`. It rejects
  with a non-fatal `data` error when the SDK's search fails or the map is removed before it answers.
- **Padding**: the shell's collision insets go to `map.setPadding`, and back again whenever the
  camera rests, because the SDK resets the padding to 0 when a POI is clicked.
- **Errors**: `onError` gets a `PointrMapError` and `onStatusChange` the shell's `mapStatus`. The
  message is for a developer; the product shows its own words, chosen by `code`:

| `code`     | Status        | What happened                                                                                        |
| ---------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `config`   | `error`       | The config cannot start the SDK, the page's address would override its keys, or the Cloud refused it |
| `instance` | `error`       | Another map holds the page's one Pointr map                                                          |
| `storage`  | `unsupported` | No `localStorage` (a sandbox without `allow-same-origin`); the SDK reads it unguarded                |
| `webgl`    | `unsupported` | No WebGL context                                                                                     |
| `script`   | `error`       | The SDK's files did not load, or did not arrive in `readyTimeoutMs` (offline: `offline`)             |
| `csp`      | `error`       | A Content-Security-Policy blocked an SDK host or the map's `blob:` workers                           |
| `auth`     | `error`       | The keys or the cloud token were refused, or the token expired                                       |
| `data`     | `error`       | The site's data did not load, or the map was not ready in `readyTimeoutMs` (offline: `offline`)      |

A non-fatal error (`fatal: false`: a blocked tile host, a non-blocking SDK problem) leaves the
status as it was.

## Keys

- No identifier, key, token or environment URL is in this package, its tests or its bundle, and
  the adapter never logs one. Its tests run against a fake SDK, with no network.
- **Products** pass `auth: { cloudToken }`: a short-lived Pointr Cloud token from their own back
  end, and no secret reaches the browser. The SDK reads the client from the token's
  `clientIdentifiers`. `baseUrl` is still required: when the token carries an `iss`, the SDK goes
  there instead. An expired token is refused before anything loads.
- **A new token starts the map again.** `auth.cloudToken` is part of the config, and the SDK offers
  no way to hand a running map a new one, so a refreshed token restarts the map. A token that
  expires while the map is open makes the SDK's next requests fail, which arrives as `data`.
- **Prototypes** may pass `{ clientIdentifier, licenseKey }`, typed in at run time (a form, an
  environment variable), never written into source or a story.
- The SDK writes a client identifier or licence key it refuses into the console
  (`licenseKey(<the value>) is not valid`), so `PointrMap` refuses an incomplete config itself,
  first. Its messages go through a redaction that takes out the configured secrets, anything shaped
  like a token, and every URL's query.
- **The page's address is refused when it names the keys' host or the keys.** The SDK takes every
  one of its options from the page's query string over what it is given (`?<option>=`, or
  `?ptr<Option>=`, which wins), and its token request goes to `baseUrl` with the licence key in its
  body. So `PointrMap` refuses to start, with `config`, when the address (query or hash, any case)
  names `baseUrl`, `clientIdentifier`, `licenseKey` or `pointrCloudToken`, with or without `ptr`:
  a link could otherwise send the keys or the token to another host. The message names the
  parameters, never their values. The SDK's files are requested with
  `referrerpolicy="no-referrer"`, so the address does not reach the CDN.

## Content-Security-Policy

The policy the spike measured working, exactly as tested. Its `script-src 'unsafe-inline'` was for
the spike's own inline script, and the SDK needs no `unsafe-eval`. Without `worker-src blob:` the
map never appears. Whether the SDK itself needs `style-src 'unsafe-inline'` was not measured.
PointrMap's own rules (the hidden chrome) need it no longer: they go in a constructed stylesheet,
which applies under `style-src 'self'` in Chromium 145, WebKit 26.0 and Firefox 146 while an inline
`<style>` is blocked (measured on 20 Oct, on a local page). In a browser without constructed
stylesheets (Safari before 16.4) they are a `<style>` element carrying the `nonce` prop, so give
the page's nonce there.

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

How a violation is read: a report-only policy (`disposition: "report"`) blocks nothing and is no
error. A blocked `blob:` worker is the map's, and fatal until the map is drawn, when the browser
names the SDK's script as its source (Chromium and WebKit do), or, when it names no source (Firefox
146 does not, measured on 20 Oct), when it comes while the map loads: MapLibre makes its workers
after the SDK starts and before the map is drawn. One another script asked for is the page's and is
ignored, and so is one with no source before the SDK starts. In Firefox, a page's own worker
blocked while the map loads is therefore taken for the map's. Another blocked host is reported, not
fatal, and named if the map then times out; after the map is drawn, every violation is reported,
never fatal. Only violations fired at the document are seen: one inside a worker (MapLibre's tile
requests run in its workers) fires on the worker, so a blocked tile host there shows as missing
tiles, not as an error.

## The SDK's version and integrity

`src/sdk-versions.ts` pins Pointr Web SDK 10.13.0 and the sha384 of its two entry files,
`pointrwebsdk.js` and `css/pointr.css`, which the browser checks: a changed file on the CDN fails to
load (`script`) instead of running. The integrity covers those two files only, not what they fetch
afterwards (the CDN's images, the Cloud's data, the tiles). Pointr publishes no hashes; these were
computed from the files, never executed. To add a version, or to recheck the table against the CDN
(both need the network, so neither is a required check):

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
- **The page's address still wins for the rest.** Apart from the four refused above, a query
  parameter overrides what `PointrMap` passes the SDK: `?isSearchEnabled=true` turns the SDK's
  search back on, `?ptrLevelIndex=2` opens another level, `?container=…` moves the map to another
  element. They change what the map shows, not where the keys go.
- The SDK's stylesheet sets `html, body { height: 100% }` and its own classes globally while a map
  is mounted; it leaves with the last `PointrMap` and comes back with the next. The script and its
  `window.PointrWebSDK` stay for the page's life: a script that ran cannot be taken back. An SDK
  the page loaded itself is used when its version is the one asked for (or unknown), and gets the
  SDK's stylesheet if the page has none. Under an AMD or CommonJS loader the SDK's script sets no
  global (`script`).
- `setLevel` reaches only levels of the open building; `flyToPoi` only POIs the map has reported (a
  click or a search). A token the Cloud refuses while the data loads is reported as `data`.
- An SDK event `PointrMap` cannot read is a non-fatal `data` error, never an exception in the SDK.
  The SDK's own synchronous refusals inside `start()` (options its `validate()` refuses, an
  exception its own `catch` takes) reach its error page before `PointrMap` can intercept them, and
  arrive as the ready timeout; the pre-validation refuses every such config it knows of first.
- The SDK picks its mobile layout from the device, not the container. Touch, RTL (`language: "ar"`)
  and the SDK's navigation events were not exercised by the spike.
- **GAP-175**: the building and the site the map reports are the contracts' own
  `BuildingPresentation` and `SitePresentation` (`@kozmos-ds/product-contracts`), the shapes SwiftUI
  and Compose have too: a building's `label` is the Pointr Cloud's title, empty when it has none, and
  its `floors` are its levels top floor first, each once. The package's own
  `PointrBuildingPresentation` and `PointrSitePresentation` are gone.

## Not done yet

- **Phase 2**, Storybook: stories behind `KOZMOS_SPIKES`-style gating, so no required build needs
  the network, and the key form.
- **Phase 3**, Claude Design: the snippet, then a page in "Consuming this system" once its sandbox
  is known to run it.
- **Phase 4**: the live workflow (a Playwright drive with the keys as secrets, run on demand and
  before each SDK version bump, with `integrity:check`) and the docs page.
- SwiftUI and Compose have a plan of their own, later.
