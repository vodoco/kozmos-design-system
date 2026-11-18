---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

A divided Tree and a Table draw no divider under a selected row (decision 207, GAP-250). Since decision 173 a selected row draws the hover fill, which in dark is the divider's own colour (background/200), so the divider under it could not be seen. Tree's divided rows and TableRow's `data-state="selected"` keep their 1px, drawn in no colour, so no row moves when the selection does; every other row keeps its divider. SwiftUI's and Compose's divided `KozmosTree` and Figma's tree rows draw it the same way.
