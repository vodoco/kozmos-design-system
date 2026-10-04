# Adaptive map layout

Current baseline: React 0.8.0, release commit
`152a31349db8832d8b87a9d5ea52e229fca245b5`, published 2026-10-02. 0.8.0 adds the shell-owned
16-unit gap below a fixed panel header and the top inset of gripless sheets
([AdaptiveMapShell](../packages/react/src/components/AdaptiveMapShell/AdaptiveMapShell.mdx)).

This describes the React geometry contract, not complete foldable-device support.
The TypeScript presentation contract is in `@kozmos-ds/product-contracts` 0.7.0. SwiftUI and
Compose now share logical corner slots, attribution placement and content-fitting panels,
but report edge insets rather than React's full rectangle snapshots. Their source is in the
release commit; no native registry package was published. See the
[SDK coverage plan](sdk-module-primitives.md) for target-specific limits and
[embedding guide](embedding-isolation.md) for the separate shipped theme/portal/CSS boundary.

## Host responsibilities

Give `AdaptiveMapShell` a definite height. Its default is now `height: 100%`, with no 448px
minimum. An embedded flex/grid parent also needs a bounded height and `min-height: 0` where
appropriate. Existing callers relying on the old implicit minimum must set a height.

The shell owns geometry, not the map engine. Supply the real renderer in `map`; the adapter
owns renderer resize, camera padding, camera/selection state and SDK-specific collision APIs.
The browser fixture's labelled renderer slot is instrumentation, not an implemented map.

```tsx
import type { ReactNode } from "react";
import { AdaptiveMapShell } from "@kozmos-ds/react";
import type { AdaptiveMapLayoutSnapshot } from "@kozmos-ds/react";

export function MapHost({
  renderer,
  details,
  updateRenderer,
}: {
  renderer: ReactNode;
  details: ReactNode;
  updateRenderer: (layout: AdaptiveMapLayoutSnapshot) => void;
}) {
  return (
    <AdaptiveMapShell
      style={{ height: "100dvh" }}
      map={renderer}
      panel={details}
      onLayoutChange={updateRenderer}
    />
  );
}
```

## Coordinate and exclusion contract

- All React input rectangles are physical, **shell-local CSS pixels**, never screen coordinates
  or device pixels. The origin is the shell's inner padding box, excluding its border; dimensions
  come from `clientWidth/clientHeight`. Convert platform/browser information at the host boundary.
- `safeAreaInsets` excludes edges from layout. It is merged with CSS `env(safe-area-inset-*)`
  using maximums, not addition. For a keyboard, pass only the overlap with the shell. If the
  browser already shortened the host, do not subtract keyboard height again.
- `usableRegions` supplies hinge-free rectangles. Omitted means one continuous region; an
  explicit empty array means no usable region. The host must update these rectangles on resize
  and posture change. Regions are clipped to the shell's safe bounds; invalid/empty regions
  are discarded. Unsupported device APIs fall back to omitting the input.
- `onLayoutChange` reports renderer `mapBounds`, `panelBounds`, physical `occlusions`, settled
  `presentation` and `collisionInsets`. Bounds are shell-local; padding is **relative to the
  reported map rectangle**. Subtract `mapBounds.x/y` when converting occlusions to renderer-local
  rectangles. Ignore the initial zero-size geometry until the host has measurable dimensions.
- `collisionInsets` is minimum host camera padding. It is combined with measured panel, top-bar
  and control coverage using maximums. `onCollisionInsetsChange` and the existing
  `--kozmos-map-inset-*` variables expose the resolved result. Opposing edges saturate at the map
  dimension; an entirely covered map has no usable camera area, not negative space.
- Four edge values are conservative camera padding, not an exact representation of internal
  obstructions. Use `occlusions` where the engine supports them. A panel in another region does
  not add camera padding to the map region.

## Current React policy

`panelPresentation="auto"` uses a side panel when the chosen local region is at least 720×160px;
otherwise it uses a docked bottom panel. Width is capped at 416px and 42% of the local region.
These are implementation thresholds, not names for device models or universal native breakpoints.
The host can request `"side"` or `"bottom"` explicitly.

The bottom sheet defaults to collapsed, medium and large detents, resting at medium (54%).
Collapsed requests 20% subject to header/peek minimums; large requests 94%.
`panelFraction` is a single-detent shorthand, clamped to 12–94%; `panelSizing="content"`
uses a content-sized detent. The shell reserves the measured natural height of top-bar/controls
and their gutters first; the actual panel can be smaller than requested. If no room remains,
`panelBounds` is null and panel content is hidden, still mounted. Hosts must use the resolved
snapshot, not reconstruct camera padding from the requested fraction. This corrects the first
implementation's 88% panel, which left controls clipped to zero height.

The shell adds sheet drag/snap behavior and a handle when multiple distinct detents are
available; `panelHeader` stays above scrolling content. It does not make the browse sheet a
modal focus trap. MapInfo's compact full-screen modal is a separate composition.
Very small hosts or very tall custom chrome can still require compact
host content; scrolling a constrained slot is not proof of a usable touch target. If a focused
region becomes unavailable/hidden, focus continuity is a host workflow decision, not a promise
that the browser will keep focus on an invisible control.

When auto mode receives two disjoint usable regions, each at least 240×120px, map and panel occupy
separate regions. A horizontal separator puts the map above the panel. A vertical separator
respects logical `panelPlacement`, including RTL. Otherwise the largest usable region is chosen.
Explicit side/bottom overrides remain inside one region and never straddle a hinge.

Map and panel stay in the same React tree positions across these presentations. Input and POI
state, focus and the renderer instance survive resizing when the host keeps the same slot
components and keys. Native activity restoration, real camera continuity and browser keyboard
behavior on devices have not been verified by this change.

## Corners, content fitting and attribution in 0.7.0

Use `controlsBottomStart` and `controlsBottomEnd` instead of independently positioned
MapOverlay siblings when the corners need to negotiate space. They mirror in RTL, share a
bottom row when they fit and stack otherwise; unavailable regions stay mounted but hidden.
`bottomControlsPadCamera` is false by default. Full-width corner-envelope occlusions in React
are conservative, not individual control rectangles. Do not feed resolved insets back as inputs.

Wide search/details panels hug short content and cap long content above the footer band.
The optional measured `attribution` slot remains centered on the full map, not the space beside
a panel. Corners keep equal side/bottom insets. Only attribution lifts when the centered gap
cannot fit it. Bottom sheets reserve credits above them. MapInfo resizes the map host on wide
screens; it does not replace the shell's internal browse panel.

FloorSelector popups in registered corners use the available shell region, may move horizontally
beside a long same-side panel, scroll to selection, and dismiss if their region disappears.
This coordination does not automatically cover arbitrary custom portaled children. Actual SDK
camera padding, custom status overlays, device keyboard/IME and assistive technology remain
host acceptance work. See [the component reference](../packages/react/src/components/AdaptiveMapShell/AdaptiveMapShell.mdx).

## Verification and reproduction

```sh
pnpm install --frozen-lockfile
pnpm turbo run build --filter="./packages/*"
pnpm exec playwright install chromium webkit
pnpm test:adaptive
ADAPTIVE_BROWSER=webkit pnpm test:adaptive
pnpm --filter @kozmos-ds/react test
pnpm packages:install:check
```

`ADAPTIVE_BROWSER=chrome` optionally uses installed Chrome.
`ADAPTIVE_SCREENSHOTS=/absolute/output/directory` saves inspection screenshots.

The browser check bundles the **built package exports and shipped stylesheet**, with no source
alias. It exercises exported Input, Button, Stack and POIDetailPanel inside the shell. It checks
eight host configurations: narrow container, short landscape, RTL, vertical hinge, RTL hinge,
tabletop, keyboard exclusion and a 200px-high wide host. Each also checks POI/input state,
focus, mount count, resized bounds, live direction changes and stable layout notifications.
The initial three regressions were reproduced against the old shell before implementation.

The follow-up audit adds six browser checks: callback payload independence in both directions,
invalid host values versus CSS safe areas (including live changes), zero-width hosts, large-panel
control reachability, and enlarged text. Five assertions failed before their fixes; enlarged-text
coverage passed already. The geometry unit test for measured chrome reservation also failed first.
Those fourteen checks describe the initial fixture, not a promise of the current total.
Read names/counts from the current command output; run `pnpm test:map-controls` for the later
corner, popup, attribution and information-composition regressions as well.

## Remaining integration acceptance

1. Assess any need for full native rectangle/region contract parity; current native edge insets
   are not that contract. Test native rotation/recreation and restoration.
2. Complete real web/Android Pointr adapters and routing acceptance. The iOS QA Info flow has
   simulator evidence; this does not certify every SDK flow or a production app.
3. Validate actual keyboard, safe-area, fold/posture and accessibility scenarios on devices.
4. Verify the shipped theme/portal/CSS boundary against each supported host, browser/WebView
   floor and consumer. Keep publication evidence separate from production compatibility approval.

See [release evidence](release-process.md#080) for publication, package-consumer checks and
deployed documentation. Figma and consuming products require their own adoption evidence.
