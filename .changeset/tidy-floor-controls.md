---
"@kozmos-ds/react": minor
---

Refine the collapsible level switcher with floor-availability arrows and full-name hints. The whole tile opens the level list; arrows are non-interactive indicators. Preserve the 48px tile and close the list with one Escape even when a hint is open.

Make per-floor result counts opt-in with `showResultCounts` (default `false`). Hosts upgrading from 0.6.0 must explicitly enable it to retain badges in the expanded, vertical or horizontal lists. Hidden badges are also omitted from accessible names. The collapsed tile and compact stepper never display counts.

Add logical `top-start`, `top-end`, `bottom-start` and `bottom-end` MapOverlay positions that mirror in RTL while respecting physical collision insets. Existing web left/right positions remain physical. Corresponding SwiftUI and Compose source changes are included in the repository; native packages are not published to npm. Native left/right overlay positions now correctly stay physical in RTL—use start/end for mirroring.

Correct compact-stepper separators in RTL. Native selectors preserve missing selected IDs instead of substituting the first floor or emitting fabricated selections; stepping stays disabled until the host selects a supplied floor. The Android source API retains existing positional count-formatter calls without implicitly enabling counts.

Add independently measured logical `controlsBottomStart` and `controlsBottomEnd` slots to AdaptiveMapShell across React, SwiftUI and Compose. Opposite corners share a row when they fit and stack without shrinking controls when they do not. They clear the shell's panel and top controls, mirror in RTL, retain mounted state during resize, and become unavailable when the remaining vertical band cannot fit them. `bottomControlsPadCamera` is opt-in (false by default); React reports the region as a conservative controls occlusion regardless. The legacy controls slot remains supported.

Native shells now respect a bounded host shorter than 448pt/dp. Give native shells a bounded parent; the shell no longer forces that old minimum. Compose now reports measured panel/top-bar/safe-area camera padding rather than echoing caller insets alone. These changes are source-only for native consumers and are not native registry releases.

Bound expanded floor lists to the registered map-shell region, scroll long lists without shrinking targets, reveal the selected floor after measurement, and dismiss the popup when its region disappears. Preserve standalone viewport behavior and existing small-list geometry.
