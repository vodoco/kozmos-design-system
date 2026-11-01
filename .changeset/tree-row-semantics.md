---
"@kozmos-ds/react": patch
---

`TreeItemRow`, `TreeParentItemRow` and `TreeChildItemRow` are treeitems (GAP-204). A tree composed from them drew plain divs, so in `Tree`'s `role="tree"` container it had no items: axe failed it (aria-required-children, critical) and a screen reader heard an empty tree. Each row now carries `role="treeitem"` and its state from the props it already takes, with no new API:

- **`depth`** gives `aria-level`, one more (0 is level 1).
- **`expanded`** gives `aria-expanded`, on a row with children only.
- **`selected`** gives `aria-selected`, `"false"` when it is not.
- **`disabled`** gives `aria-disabled="true"`.

`Tree`'s own renderer draws the same row, so a tree from `data` keeps its one treeitem per row and gains `aria-level`, the level browsers already computed from its groups.

**A caller's own `role` or `aria-*` still wins**, so trees that pass them keep working. With a role other than `treeitem`, such as `role="none"` on a row inside a treeitem of the caller's own, the row adds no tree state.

**Composing a tree:** a `Tree` with children is the container, and an expanded parent's children go in a `<div role="group">` right after its row, at `depth` one more. Tree's docs show it. A composed tree has no keyboard of its own: Tree moves focus with the arrow keys only through `data`.

SwiftUI's and Compose's `KozmosTree` draw only from data and have no composed rows.
