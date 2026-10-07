---
"@kozmos-ds/react": patch
---

Right to left follows the reading direction, wherever the stylesheet goes.

- **Arrows and sides.** Right to left, Pagination's Previous and Next, the breadcrumb's separator, a submenu's arrow, a closed tree item's arrow and RoutePreviewPanel's Back now point to the start or the end edge rather than staying left or right, as SwiftUI's `.forward` and `.backward` symbols and Compose's AutoMirrored icons do. Their spacing (Pagination's link padding, Menu's inset, indicator and shortcut, Tree's text, actions and depth indent) follows the reading direction too, so nested tree rows indent from the start edge. Left-to-right layouts are unchanged.
- **Without `:dir()`.** The package's right-to-left rules, these and the ones it already had (POIMediaGallery's arrows, the gradient Progress track and its flow, the map overlay's and MapInfo's corners), read the nearest `dir` attribute through a `--kozmos-rtl` custom property instead of `:dir(rtl)`. Chrome and Edge match `:dir()` only from 120, below the package's declared 118, and a build that lowers CSS for those browsers (Vite 8's lightningcss) rewrites `:dir(rtl)` into `:lang()` guesses, which mirrored nothing on an English right-to-left page and everything on an Arabic left-to-right one. The only rules the stylesheet adds to elements it does not own set `--kozmos-rtl` on `[dir]` elements.
