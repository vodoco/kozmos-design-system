# Spike: Pointr's map in AdaptiveMapShell

16 October 2026, Pointr Web SDK 10.13.0 (MapLibre GL inside), time-boxed. Not
production code and not part of `@kozmos-ds/react`. No identifiers are in any
file here: every page and script reads them at run time.

## What is here

| File                         | What                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------- |
| `pointr-sdk.ts`              | loads the SDK's script and stylesheet from its CDN once; the API the spike uses |
| `PointrMap.tsx`              | the adapter: the SDK's map with its UI off, for the shell's `map` slot          |
| `PointrMapShell.stories.tsx` | AdaptiveMapShell with a Pointr map, SearchBar, POIResultList, floors, zoom      |
| `pointr-map-plain.html`      | the SDK alone on a plain page (questions 1 and 2)                               |
| `pointr-map-snippet.html`    | the sandbox check to paste into a Claude Design prototype (question 7)          |
| `serve.mjs`                  | a static server for this folder (127.0.0.1:6140 by default, never 6006)         |
| `drive.mjs`                  | drives a page in Playwright; identifiers go in by init script, logs redacted    |
| `csp-check.mjs`              | the snippet under four CSP headers and in sandboxed iframes                     |
| `spike-keys.mjs`             | reads the identifiers from the environment or a QA page, and redacts them       |

Run the stories with `KOZMOS_SPIKES=1 npx storybook dev -p 6142` in
`apps/docs`: `.storybook/main.ts` adds `spikes/` only under that flag, so no
build, visual review or catalogue ever sees a story that needs the network.
Identifiers: `POINTR_KEYS_FROM=<a QA page whose HTML has them>` or
`POINTR_BASE_URL`, `POINTR_CLIENT_ID` and `POINTR_LICENSE_KEY`; the story also
shows a form and keeps what is typed in the tab's sessionStorage.
Evidence lands in the git-ignored `test-results/pointr-spike/<run>/`.

Headless Chromium needs `--use-angle=swiftshader --enable-unsafe-swiftshader`
(drive.mjs passes them): without, MapLibre fails with "Could not create a
WebGL context" after every request has succeeded.

## Findings

1. **It renders on localhost and 127.0.0.1**, in Chromium, WebKit and Firefox.
   No CORS failure: every Pointr host answers `Access-Control-Allow-Origin: *`
   — the token `POST /api/v10/identity/clients/<id>/auth/token` on the
   environment's `*.pointr.cloud`, the published content and site tiles on
   `*.blob.core.windows.net`, outdoor tiles on `mapscdn.pointr.tech` and
   `api.maptiler.com`, the SDK's own files on `pointr-websdk.azureedge.net`.
   The only 4xx are 404s for empty vector tiles and a site with no sprite.
2. **Options turns off** search, POI details, zoom, language, navigation,
   accessibility, quick access and the app banner. **It does not turn off**:
   the watermark and its credits line (Cloud `sdk.isWhiteLabel`), the info
   button (Cloud `userInterface.isInfoButtonEnabled`), the onboarding card
   (Cloud `isOnboardingEnabledForSdk`, shown while localStorage `sessionCount`
   is 0), the level selector `#pointr-levels`, and the building's Exit button.
   The adapter hides the level selector, Exit and info with a stylesheet and
   counts a session for the onboarding. **The watermark must stay**: a
   MutationObserver watches it and its ancestors, and on any change to its
   opacity, display, visibility, transform, size or text it logs a warning and
   calls `destroyMap()`. Covering it with another element is not detected —
   on a phone the Kozmos sheet covers it — which is a licence question, not a
   technical one. The SDK hides MapLibre's own attribution control on every
   render; the watermark line carries the OSM and MapTiler credits.
3. **It lives in AdaptiveMapShell's `map` slot.** Measured in the story: the
   canvas fills the shell's map section (1280×800, then 900×640 after a
   resize; MapLibre's own ResizeObserver follows the container), drags pan it,
   the wheel zooms it, and the hit test at the panel's centre and the zoom
   button lands on Kozmos, not the map. The SDK's layers stack at z-index
   9999–10000, so the adapter isolates them (`isolation: isolate`).
   `onCollisionInsetsChange` goes to `map.setPadding`: 432 px on the right
   beside a side panel, 456 px at the bottom under a phone sheet. **The SDK
   resets padding to 0 when a POI is clicked**; the adapter puts the shell's
   back when the camera rests (`idle`), which was measured.
4. **The MapLibre map is reachable**:
   `PointrWebSDK.MapWidget.getInstance().getUiController().getMapViewController().getView().map`,
   created after the data loads (listen for the view's `map-ready`). It has
   `getCenter`, `flyTo`, `setPadding`, `project`, `queryRenderedFeatures`,
   `on`. `maplibregl` itself is not exposed, so there is no `Marker` class:
   the story draws a Kozmos `LocationPin` positioned with `map.project` on
   `move`, and it sits on the searched place. The widget also offers
   `search(query, site, building)`, `setLevel(level)`, `focusMap(building)`,
   `highlightPoi`, `unhighlight`, `getCurrentBuilding()`, `getCurrentLevel()`.
   `setLevel` takes only the SDK's own `Level` instances: the levels in a
   `current-building-changed` payload are plain objects and are refused.
5. **Events, confirmed in the browser** on the view (`view.on(name, fn)`):
   `map-ready`, `map-clicked` (features, point), `poi-clicked` (`{ poi }`,
   emitted with POI details off), `poi-highlighted`, `poi-unhighlighted`,
   `level-changed` (levelIndex), `current-building-changed`
   (`{ newCurrentBuilding }`), `current-site-changed` (`{ newSite }`), `zoom`,
   `zoom-changed`, `map-move-start`, `map-move-end`, `idle`; on the widget,
   `data-loaded`. A POI click still makes the SDK highlight it with its own
   pin and fly to it; the story takes the highlight off and flies itself.
   Elevators and stairs emit `map-clicked` but not `poi-clicked`.
6. **Lifecycle.** `MapWidget` is a singleton: a second constructor throws, a
   second `start()` works but leaves the old MapLibre map alive, and
   `destroy()` clears the instance and the DOM **without removing the map**
   (a leaked WebGL context each time). The adapter calls the view
   controller's `destroyMap()` first. Removing the map then loses the 3D
   buildings' WebGL context and the SDK's fallback throws an uncaught
   `TypeError … removeBuildingModelsLayer` on every unmount; the adapter sets
   the controller's `building3DModelsActive = false` first, and the three
   remounts measured (story switches and a StrictMode story) then raise no
   page error, each leaving one canvas and the previous map removed.
   Create–destroy–create while the first is still loading works, but the
   first instance's promise chain logs "Failed to load TypeError".
7. **Claude Design.** `pointr-map-snippet.html` reports, line by line, the
   stylesheet, the script, the token call, the data and the map, the hosts
   reached and every CSP violation. Measured with `csp-check.mjs`:
   - With no CSP and with the policy below, the map is ready, no violations.
   - `default-src 'self'` blocks the stylesheet and the script, and says so.
   - Without `worker-src blob:` the map never appears (MapLibre's workers).
   - The policy that works, exactly as tested (`'unsafe-inline'` is for the snippet's own
     inline script; the SDK needs no `unsafe-eval`):

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

   - In an iframe sandboxed without `allow-same-origin` the SDK fails at once
     (`localStorage` throws and `start()` reads it unguarded); the snippet puts
     a memory stand-in in its place. With the stand-in, `srcdoc` +
     `allow-scripts` is ready, but a cross-origin `src` + `allow-scripts`, and
     `srcdoc` + `allow-scripts allow-same-origin`, stall before the style
     loads with no error in the page, its worker or the network — unresolved.
     A cross-origin `src` with `allow-scripts allow-same-origin` is ready.
     Whether Claude Design's sandbox matches any of these is not known until
     the snippet runs there.

## What is not known

- Whether Claude Design's preview allows these hosts, blob workers and WebGL.
- Why two iframe shapes stall (item 7); whether real GPUs behave as SwiftShader.
- Whether the Cloud can turn off the info button, level selector and Exit per
  client, and whether white label is licensed for prototypes.
- Touch input (only mouse was driven), RTL, and the SDK's mobile mode, which
  it picks from the device, not the container's width.
- `mapLongClicked`, `routesShown`, `exit-clicked` and navigation events were
  not exercised; the SDK's own padding resets on mobile were read in the
  bundle, not measured.
