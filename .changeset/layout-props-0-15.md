---
"@kozmos-ds/react": minor
---

Four layout props, approved for 0.15.0 (decision 119):

- **`Navbar` `navigationAlign`** (GAP-196): `"start"`, `"center"` (the default, as before) or `"end"`, where the navigation sits in the room between the leading slots (logo, context, primary action) and the trailing ones (actions, utilities, account). Logical: `"end"` is the left in right to left. Pointr Cloud draws its main sections at the end.
- **`Sidebar` `inset`** (GAP-199): `"flush"` drops the 24 above the first slot, and on a rail with no header the navigation's 16 too, so the first item sits flush under a fixed header. An expanded sidebar keeps the navigation's 16, the room its items' focus rings take outside them. `"default"` is the sidebar as before.
- **`Drawer` `placement`** (GAP-198), as Backdrop's: `"inline"` draws the drawer in place, `absolute` against the nearest positioned box, so a panel sits in the region under a fixed header instead of covering it, and it is not modal unless `modal` says so: the header and the page stay usable and read. `"fixed"`, the default, is the drawer as before. BottomSheet, which is Drawer, takes it too. `DrawerPlacement` is exported.
- **`Tree` `divided`** (GAP-201), and on `TreeItemRow`, `TreeParentItemRow` and `TreeChildItemRow`: a 1px stroke in the border role under every row, edge to edge, square rows, and an open parent row on background 50; a selected row keeps its fill.

Nothing changes for a product that sets none of them.
