---
"@kozmos-ds/product-contracts": minor
---

`BuildingPresentation` and `SitePresentation` are new (GAP-175; decision 119): the building and the site the live map reports, for a product to name them, offer the site's other buildings and draw the building's floors.

- **`BuildingPresentation`**: `id`, `label` (already localized, as the venue titles it, empty when it has no title), `siteId` (the site it is in) and `floors`, its levels as `FloorPresentation`s, top floor first (decision 38), each once: FloorSelector takes them as they are. Optional `defaultFloorId` (decision 141) is the level to start on, Pointr's default for the building, by its id in `floors`, when the venue's data marks one; without it a product starts on the ground level, which only it can name.
- **`SitePresentation`**: `id`, `label` and `buildings`, in the order the venue's data gives them.
- SwiftUI and Compose have the same shapes, `KozmosBuildingPresentation` and `KozmosSitePresentation`, compared with the web's by `contracts:parity:check`.
- The private Pointr map adapter reports these: its own `PointrBuildingPresentation` and `PointrSitePresentation` are gone. It fills `defaultFloorId` from the level the venue's data marks as the default.

`@kozmos-ds/react` does not use them, so it needs no release of its own for them.
