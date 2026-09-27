# The search sheet, 20 September 2026

The coding agent, the last stage in Olcay's order, on his four answers: the prototype's category tile,
result row and search field on tokens, and the two parts the system lacked — the AI search button
with its ring from the theme ramp, and the location marker's halo. Unlike the earlier stages this
one changes the look of parts the system already had, on all three platforms. Branch
`claude/pointr-browse-repairs`, pushed.

| Commit               | What                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| `757f1ce`            | React: the tile, the row, the field, the marker; `AISearchButton`; the raw-radius ratchet 7 → 6  |
| `486b216`            | iOS: the same five parts and `KozmosAISearchButton`; five render tests, each failed once mutated |
| `0623479`            | Android: the same five and `KozmosAISearchButton`; a golden of the sheet's parts                 |
| `bdf97e9`, `1b5090e` | The Pointr QA app: the search row with the AI search, the current-floor dot, a margin            |
| the last             | This report, the guide, the index, the log                                                       |

## 1. What changed, against the prototype's numbers

| Part            | Prototype (measured)                                                                                                                | Now, on all three platforms                                                                                                                                                                                                                                                                                       | Before                                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Category tile   | 86.5 × 114; a 64 white square, radius 18, border, 24 icon; 11/400 label, two lines; 4 columns, gap 8                                | a 64 icon square at radius Control (16, the nearest token) with the container edge, the selection on the square; a 24 theme icon; a caption label of two lines; four across at gap 8                                                                                                                              | 112 tall at radius 20–24, a 40 icon, a 14-point label, 2–4 adaptive columns                                                             |
| Result row      | 370 × 80, radius 16, border; name 18/400; floor 14 grey with a 6 blue dot on the current floor; estimate 14 right; optional 48 logo | 80 tall at radius Control, no number; the name regular (18 on the web, the body face on iOS and Android); a 6 theme dot before the floor when the result is on the floor the map shows — `currentFloorId` on the card and the list; the estimate at the end; a 48 logo when there is one and nothing in its place | 96 tall at radius 20–24 with a numbered badge, a pin on the location line, a clock on the estimate, an initial where a logo was missing |
| Search field    | 312 × 44, radius 16, 18 icon, a 24 grey clear circle                                                                                | 44 tall at radius Control, an 18 icon, a 24 grey clear circle inside a 44 hit area (Android on a basic text field: Material's outlined one will not go below 56)                                                                                                                                                  | 56 tall, a 20 icon, a plain 44 clear button                                                                                             |
| Location marker | 18 dot with a 3 white border; a 48 pulsing ring; a 64 halo at 14 %                                                                  | the same three sizes on each platform's animation model                                                                                                                                                                                                                                                           | a 16–18 dot with a 2 border, a 24–40 pulse, a 36–56 ring                                                                                |
| AI search       | a 48 circle whose conic-gradient ring is a band 2.5 wide around a 43 white disc (first read as a 66 ring; re-measured on the 21st)  | `AISearchButton` / `KozmosAISearchButton`: a 48 circle, the ring a 2.5 band around a 43 disc, its gradient through the theme's own ramp — 300 to 600 and back, the first gradient made of tokens — with a 16 icon, named by its label; the gradient turns in place, 3.6 s a turn (since the 21st)                 | absent                                                                                                                                  |

The 18-point radius and the 11-point label have no token; the tile takes radius Control (16) and
the caption face (11 on iOS's `caption2`, 12 on the web's `text-xs`… written as 11 with a
14 line-height on the web, 11 on Android's `labelSmall`). The result rows stay buttons, as the
system's were; the prototype's are not.

## 2. Measured

- **iOS**, `KozmosSearchSheetTests`: the tile's icon 24 wide with the label under its square; the
  row 80 tall, a theme dot on the current floor and none on another; the clear circle 24 wide,
  centred in a 44 field; the marker's halo 64 and its dot 18 less the border; the AI ring 48 with a 2.5 band (66 until the 21st's re-measurement)
  wide around a white centre. Each failed once against a mutated part — the row at 96, the halo at
  36, the ring at 48, the clear circle at 36, the tile laid out sideways.
- **Web**: 22 unit tests on the seven components — the tile's classes, the row's height and the
  current-floor mark, the field's height and its clear control, the marker's three layers, the
  AI button's name, ring and silent icon.
- **Android**, `KozmosSearchSheetPaparazziTest`: one golden of the field with the AI search, four
  tiles (the first selected), two rows (the first on the current floor) and the marker.
- **Live**, the QA app on the iPhone 17 Pro: the search row with the AI search beside the field,
  the rows with the dot on the map's floor; the flow UI test passed on it.

## 3. Verified

| Check                                                               | Result                                                         |
| ------------------------------------------------------------------- | -------------------------------------------------------------- |
| Package, iOS 26.5 (baselines skipped); iOS 18.4 with the baselines  | 110, from 105; 112, from 107                                   |
| `node scripts/check-ios-poi.mjs`; the fixture playground build      | 52; succeeded                                                  |
| QA app unit tests; the flow UI test (twice, the last on the margin) | 40; passed                                                     |
| React unit tests on the seven components, lint, build, classes, raw | 22; clean; ok; ok; colour 19, radius 6 across 5, locked        |
| `docs:snippets:check`; Storybook docs check                         | 349 identifiers; 104 pages at two widths, 176 snippet sections |
| `test:navigation` on chromium; `test:poi-details` on chromium       | 20 of 20; 66 cases verified on chromium                        |
| Android, `verifyPaparazziDebug`                                     | passed; the new golden                                         |

Not done: category tiles in the QA app — PointrKit's `PTRPoi` carries no category (only
keywords; `PTRPoiCategory` is a separate list the app does not read yet), so the tiles are seen
in Storybook and in the fixture playground; the AI search's own flow (none in this milestone);
the Figma side of every part in this stage.

## 4. Change it yourself

| Behaviour               | iOS                                                                                        | Web                                                                                                | Android                                              |
| ----------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| The tile                | `CategoryTile/CategoryTile.swift`; the grid in `BrowseCategoriesPanel.swift` (`columns`)   | `CategoryTile/CategoryTile.tsx`; the grid in `BrowseCategoriesPanel.tsx`                           | `CategoryTile/CategoryTile.kt`; `GridCells.Fixed(4)` |
| The row and its dot     | `POIResultCard/POIResultCard.swift`: `currentFloorId`, `onCurrentFloor`, `logo`            | `POIResultCard/POIResultCard.tsx`; `POIResultList.tsx` passes `currentFloorId`                     | `POIResultCard/POIResultCard.kt`; `POIResultList.kt` |
| The field               | `SearchBar/SearchBar.swift`                                                                | `SearchBar/SearchBar.tsx`: `searchBarVariants`                                                     | `SearchBar/SearchBar.kt` (a `BasicTextField`)        |
| The marker              | `UserLocationMarker/UserLocationMarker.swift`                                              | `UserLocationMarker/UserLocationMarker.tsx`                                                        | `UserLocationMarker/UserLocationMarker.kt`           |
| The AI search           | `AISearchButton/AISearchButton.swift`                                                      | `AISearchButton/AISearchButton.tsx`; the ring in `owned-components.css` (`.kozmos-ai-search-ring`) | `AISearchButton/AISearchButton.kt`                   |
| The QA app's search row | `apps/PointrPlayground/…/SDKMapScreen.swift`: `topBar`, the result list's `currentFloorId` | —                                                                                                  | —                                                    |
| Tests                   | `KozmosSearchSheetTests.swift`                                                             | each part's `.test.tsx`                                                                            | `searchsheet/KozmosSearchSheetPaparazziTest.kt`      |
