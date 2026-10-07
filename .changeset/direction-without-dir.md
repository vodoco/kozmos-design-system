---
"@kozmos-ds/react": patch
---

Right to left works wherever the stylesheet goes. The package's right-to-left rules (the mirrored arrows of Breadcrumb, Menu, Tree, Pagination and RoutePreviewPanel, POIMediaGallery's arrows, the gradient Progress track and its flow, the map overlay's and MapInfo's corners) read the nearest `dir` attribute through a `--kozmos-rtl` custom property instead of `:dir(rtl)`. Chrome and Edge match `:dir()` only from 120, below the package's declared 118, and a build that lowers CSS for those browsers (Vite 8's lightningcss) rewrites `:dir(rtl)` into `:lang()` guesses, which mirrored nothing on an English right-to-left page and everything on an Arabic left-to-right one. Tree's depth indent is logical too, so nested rows indent from the start edge. The only rules the stylesheet adds to elements it does not own set `--kozmos-rtl` on `[dir]` elements.
