---
"@kozmos-ds/react": minor
---

Four layout props, approved for 0.15.0 (decision 119):

- **`Navbar` `navigationAlign`** (GAP-196): `"start"`, `"center"` (the default, as before) or `"end"`, where the navigation sits in the room between the leading slots (logo, context, primary action) and the trailing ones (actions, utilities, account). Logical: `"end"` is the left in right to left. Pointr Cloud draws its main sections at the end.
- **`Sidebar` `inset`** (GAP-199): `"flush"` drops the 24 above the first slot, and on a rail with no header the navigation's 16 too, so the first item sits flush under a fixed header. An expanded sidebar keeps the navigation's 16, the room its items' focus rings take outside them. `"default"` is the sidebar as before.
- **`Drawer` `placement`** (GAP-198), as Backdrop's: `"inline"` draws the drawer in place, `absolute` against the nearest positioned box, so a panel sits in the region under a fixed header instead of covering it. `"fixed"`, the default, is the drawer as before. BottomSheet, which is Drawer, takes it too. `DrawerPlacement` is exported.
  - **It floats** (decision 139): a right or left inline drawer sits 16 from its side and the region's top, 420 wide (or the region less 16 each side), as tall as its content up to 48 less than the region, then scrolls, with the container's corners all round. A top or bottom one stays at its edge.
  - **Not modal, the default inline, it is a panel, not a dialog:** a `complementary` landmark. It takes focus only when its `DrawerTrigger` opens it. Tab and Shift+Tab leave it. A press or focus outside leaves it open. Escape closes it only from inside. Closing leaves focus the user put elsewhere where it is. With `modal`, it is a dialog with its scrim over the region alone.
- **`Tree` `divided`** (GAP-201): a 1px stroke in the border role under every row, outside the row's height, and an open parent row on background 50. The hover and selected fills keep their corners over the surface, and the focus ring is drawn inside the row. `bleed` (a length, or pixels) takes the stroke and the surface past the tree to the panel's edges while the rows stay put. Rows composed in a divided Tree are divided too; `TreeItemRow`, `TreeParentItemRow` and `TreeChildItemRow` take `divided` of their own.

Nothing changes for a product that sets none of them.
