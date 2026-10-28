---
"@kozmos-ds/react": minor
"@kozmos-ds/product-contracts": minor
---

`AdaptiveMapShell` gets a `status` slot and two top corner slots, `controlsTopStart` and `controlsTopEnd`, which the shell places clear of its top bar, `controls` column, panel or sheet, credits, bottom corners and floor lists (GAP-123, SDK-UI-002, decision 119).

- **`status`** is the map's status, a `MapStatusPill` saying "Route updated" or "Calculating step-free route". It sits between the bottom corners, level with them. It is centred on the whole map, as the credits are, and the credits give way to it, directly above it. With no middle slot between the corners it rises above them, and the credits above it. A pill kept rendered with no words takes no room. With no room above the sheet the status is not drawn, and it still announces. It never pads the camera, so a status coming and going does not move the map.
- **`controlsTopStart` and `controlsTopEnd`** are the logical top corners, 16 under the top bar and mirrored in right to left, beside a side panel. Exit building goes at the start, as a recipe with a labelled `MapControlButton` (SDK-UI-006), and the map's information at the end. They share a row, or the start sits above the end when both do not fit. A `controls` column starts 16 below them. They share one landmark, `topControlsLabel` (default "Map top corner controls"). They pad the camera's top only with `controlsPadCamera`. With no room above the sheet they stay mounted and leave the region, as the bottom corners do.
- **What the shell reports.** `onLayoutChange().occlusions` reports the top corners' row as one `controls` rectangle, as it reports the bottom corners, and the status's slot as a new `status` kind, which `MapOcclusion` in `@kozmos-ds/product-contracts` now includes. A floor list opened in a bottom corner stays below the top corners.
- SwiftUI and Compose do not have these slots yet.
