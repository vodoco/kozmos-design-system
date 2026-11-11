---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Tree selects ranges, has sections, draws only the rows in view and puts a row's meta under its name (GAP-151 and GAP-107, decision 132).

- **A set of selected rows:** `selectionMode="multiple"` with `selectedIds`, `defaultSelectedIds` and `onSelectedIdsChange`. A click selects one row; Ctrl or Cmd with a click adds or takes away a row; Shift with a click selects the range from the last row chosen, and Ctrl or Cmd with Shift adds it. By keyboard, Shift with the arrows, Home and End selects as focus moves, Space adds or takes away the focused row, Shift+Space selects to it and Ctrl or Cmd+A selects every row. Ranges pass over disabled rows and section headings. The tree is `aria-multiselectable`. `"single"`, the default, is `selectedId` as before.
- **Sections:** a `TreeItem` with `section: true` is a heading, 11px in the theme's colour with its `count`, over its `children`, which are drawn at the section's own depth, in a `role="group"` named by it; the heading is hidden from a screen reader, and is never focused or selected. `textValue` gives an item's words where `name` is not text. `TreeSectionRow` is the heading for composed trees.
- **Only the rows in view:** `virtualized` (with `overscan`, 8) draws the rows in view and the focused row; the tree scrolls itself. Every row now carries `aria-setsize` and `aria-posinset` from the data, so the keyboard, type-ahead and a screen reader are right for rows out of view.
- **Type-ahead:** typing moves focus to the next row whose words start with what was typed; the same letter again moves on to the next. It runs after the product's own `onKeyDown` and not when that called `preventDefault()`, takes no key with Ctrl, Cmd or Alt and never `+`, `-` or `*`, and leaves a key that finds no row alone. `*` opens every row beside the focused one; PageUp and PageDown move by a page of rows.
- **Closing a parent** in a multiple tree, once the collapse takes effect, lets go of the rows it hides, in one `onSelectedIdsChange`; a single tree keeps its one selected row. Ctrl or Cmd+A selects the enabled rows in view. PageUp and PageDown move by the rows that fit the view less one.
- **`locale`** writes a section's count for a screen reader ("POI, 3,257"). Without it, the page's `lang` is read after mount; a server render and the first client render write en-US, so hydration agrees.
- **`scrollerRef`** is the box a virtualized tree scrolls in; `ref` stays the tree.
- **A Space within 500 ms of a typed letter** is part of the type-ahead word, as WAI-ARIA has it: it does not select. Pause, or press Space on its own, to select.
- **A section's count is heard:** its group is named "POI, 3,257".
- **A virtualized tree that is divided with a `bleed`** scrolls in a box inside the tree that reaches the bleed, so its strokes meet the panel's edges with no sideways scroll while the product's width and margin stay the tree's, and a virtualized tree draws its focus ring inside the row. One with no height of its own warns once in development.
- **A menu on a row:** `onItemContextMenu(item, event)`: a right click or the menu key on a row focuses it and selects it if it is not selected, for Kozmos's `ContextMenu` wrapped round the Tree.
- **Meta below the name:** `metaPlacement="below"` on Tree or a row draws `meta` on a line under the name, so the name keeps the row's width.

**Native migration (SwiftUI):** `KozmosTree` no longer draws a `List`, divided or not: every tree is Kozmos's own lazy rows, with no list separators, inset grouping or grouped background, as React draws it, so an undivided SwiftUI tree looks different. `Node.id` is a `String` (a UUID string when none is given), not a `UUID`: code that read `node.id` as a `UUID` must take a string. Both ship from the repository's source, not a registry, so they change at the commit an app pins. Compose's `TreeNode` gains `disabled`, last, and its open rows survive a rotation.

SwiftUI and Compose take the same (sections, a selection mode with a set of ids, `metaPlacement`, a menu per row, lazy rows). The Figma importer paints `Meta Below` and `Meta Text` on the three tree row sets and a new `TreeSection` set. Vue's `KozmosTree` takes `v-model:selectedIds`.
