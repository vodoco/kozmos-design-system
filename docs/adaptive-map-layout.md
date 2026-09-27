# Adaptive map layout: first pre-publication implementation

2026-09-17 · implemented on `astra/prepublish-foundations`, not published.

This is the React geometry foundation, not a claim of complete foldable-device support.
The TypeScript presentation contract is in `@kozmos-ds/product-contracts`; SwiftUI and Compose
still use their previous implementations. Theme/portal/CSS isolation is the next separate
foundation, not part of this change.

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

The bottom panel requests 48% of available height by default. `panelFraction` requests another
fraction, clamped to 12–88%. The shell reserves the measured natural height of top-bar/controls
and their gutters first; the actual panel can be smaller than requested. If no room remains,
`panelBounds` is null and panel content is hidden, still mounted. Hosts must use the resolved
snapshot, not reconstruct camera padding from the requested fraction. This corrects the first
implementation's 88% panel, which left controls clipped to zero height.

The shell does not add gestures, a drag handle or a modal focus trap. Those are separate
interaction decisions. Very small hosts or very tall custom chrome can still require compact
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
`pnpm test:adaptive` runs all fourteen checks per engine. See `foundation-audit-2026-09-17.md`.

## Before beta

1. Implement and verify the equivalent local-space/region contract in SwiftUI and Compose without
   regressing iOS detents or measured chrome. Test native rotation/recreation and restoration.
2. Connect a real Pointr map adapter and run POI/routing flows against installed package tarballs.
3. Validate actual keyboard, safe-area, fold/posture and accessibility scenarios on devices.
4. Complete theme/portal/CSS isolation, the API/export review and release safeguards from
   `prepublish-architecture-review-2026-09-17.md`.

No npm publication, release token, package version, Figma node or remote branch was changed.
