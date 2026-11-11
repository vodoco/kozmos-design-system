---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Tree selects ranges, has sections, draws only the rows in view and puts a row's meta under its name (GAP-151 and GAP-107, decision 132).

- **A set of selected rows:** `selectionMode="multiple"` with `selectedIds`, `defaultSelectedIds` and `onSelectedIdsChange`. A click selects one row; Ctrl or Cmd with a click adds or takes away a row; Shift with a click selects the range from the last row chosen, and Ctrl or Cmd with Shift adds it. By keyboard, Shift with the arrows, Home and End selects as focus moves, Space adds or takes away the focused row, Shift+Space selects to it and Ctrl or Cmd+A selects every row. Ranges pass over disabled rows and section headings. The tree is `aria-multiselectable`. `"single"`, the default, is `selectedId` as before.
- **Sections:** a `TreeItem` with `section: true` is a heading, 11px in the theme's colour with its `count`, over its `children`, which are drawn at the section's own depth, in a `role="group"` named by it; the heading is hidden from a screen reader, and is never focused or selected. `textValue` gives an item's words where `name` is not text. `TreeSectionRow` is the heading for composed trees.
- **Only the rows in view:** `virtualized` (with `overscan`, 8) draws the rows in view and the focused row; the tree scrolls itself. Every row now carries `aria-setsize` and `aria-posinset` from the data, so the keyboard, type-ahead and a screen reader are right for rows out of view.
- **Type-ahead:** typing moves focus to the next row whose words start with what was typed.
- **A menu on a row:** `onItemContextMenu(item, event)`: a right click or the menu key on a row focuses it and selects it if it is not selected, for Kozmos's `ContextMenu` wrapped round the Tree.
- **Meta below the name:** `metaPlacement="below"` on Tree or a row draws `meta` on a line under the name, so the name keeps the row's width.

SwiftUI and Compose take the same (sections, a selection mode with a set of ids, `metaPlacement`, a menu per row, lazy rows). The Figma importer paints `Meta Below` and `Meta Text` on the three tree row sets and a new `TreeSection` set. Vue's `KozmosTree` takes `v-model:selectedIds`.
