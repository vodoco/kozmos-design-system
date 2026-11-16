---
"@kozmos-ds/react": minor
---

Tree's rows can carry a checkbox, and its disclosure can sit at the row's end (GAP-277, MAP-32), for Pointr Cloud's Add New Access, which picks several clients or some of a client's sites at once.

- **`checkable`:** Checkbox's box before each row's icon. The checks are the tree's set of rows, as `selectionMode="multiple"` holds them: `selectedIds`, `defaultSelectedIds` and `onSelectedIdsChange`. The tree is `aria-multiselectable` and each row `aria-checked`, with no `aria-selected`. A click on a row, Space or Enter checks or clears it; the disclosure, Right and Left open and close it. Shift ranges and Ctrl or Cmd+A do not apply, and closing a parent keeps its rows' checks.
- **`checkRule`:** `"exclusive"`, the default, never checks a row together with a row above or below it: checking a client clears its sites, and checking a site clears its client, open or closed. `"independent"` leaves every other row as it is.
- **`disclosurePosition="end"`** on Tree, or on a composed row: the chevron after the row's meta and actions. `"start"`, the default, is as before.
- `TreeItemRow`, `TreeParentItemRow` and `TreeChildItemRow` take `checked` (the box and `aria-checked`) and `disclosurePosition`; a row's slots are given `checked`.
