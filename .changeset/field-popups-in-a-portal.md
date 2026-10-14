---
"@kozmos-ds/react": patch
---

Combobox's overlay popup and MultiSelect's popup are drawn in the theme's portal under the field, so a panel, a sheet or a card that clips its overflow no longer cuts the list off. Focus stays in the field, which keeps its keyboard, Escape (IME and host vetoes included) and outside-press handling, and the popup is as wide as the field. MultiSelect's list is a layer, as Combobox's is, so a press on it works inside a modal Dialog or Drawer, and Escape on the field's own buttons closes the list before the dialog. The listbox itself is now the scroll region, in both layouts, rather than an unnamed wrapper around it (GAP-137), so axe's scrollable-region-focusable no longer fails on an open list that overflows. The scrollbar follows the presentation: none at rest in a map shell's sheet, Kozmos's thin one elsewhere. `@radix-ui/react-popper` and `@radix-ui/react-portal`, already installed with Popover and Select, become direct dependencies.
