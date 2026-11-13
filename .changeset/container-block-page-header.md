---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Container takes `block`, its top and bottom space, and `PageHeader` is new (GAP-116, GAP-036; decisions 132 and 135).

- **`block` on Container** (GAP-116): the clear space above and below the content, `"sm"` 16, `"md"` 24 or `"lg"` 32 (the layout spacing steps 200, 300 and 400), or `{ start, end }` for the top and the bottom apart, so a page column under a top bar takes its own space rather than a Box around it. Unset or `"none"`, a Container pads its sides only, as it always has; `inset` is unchanged. The space holds whatever the window does, and a caller's own `pt-*` or `pb-*` still wins. `ContainerBlock` and `ContainerBlockInset` are exported.
- **`PageHeader` is new** (GAP-036, decision 135): the top of a page, one part for every page. `title` is the page's one `h1`; `breadcrumb` sits above it, `info` (an info button) on its first line after it, `description` under it in the muted small text, and `actions` at the end of the title's line, centred on it, wrapping under the text where the page is too narrow for both (at the left in right to left). `tone="subtle"`, the default, paints a band across the page in theme 0, CardHeader's subtle strip's tint; `tone="default"` paints none. `size="md"`, the default, draws the title at Heading 3's 24/32, and `size="lg"` at Heading 2's 30/36, for a landing page. Its content sits in a Container with `block={{ start: "lg", end: "md" }}`, 32 above and 24 below, and takes Container's `inset` and `centered`. A slot not given draws nothing.

SwiftUI's `KozmosContainer(inset:block:)` takes `KozmosContainerBlock` (`.sm`, `.md`, `.lg`, or `.init(start:end:)`) and Compose's `KozmosContainer(inset, block = KozmosContainerBlock.Sm)` the same; both have `KozmosPageHeader`, with the title a heading, the band, the two sizes and the breadcrumb, info, description and actions slots (their actions wrap under the text where they don't fit beside it, as React's do, and an actions slot that draws nothing takes no room). The Figma importer paints Container's Block axis and a PageHeader set. Vue's bridge exports `KozmosPageHeader`, and `KozmosContainer` takes `block`.
