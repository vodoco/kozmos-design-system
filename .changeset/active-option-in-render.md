---
"@kozmos-ds/react": patch
---

Combobox and MultiSelect now move their active option in the render that brings new options or new typed text, and Listbox in the render that brings new options, not in an effect after it, so no commit's `aria-activedescendant` names the previous option, a disabled one or one that is not drawn. Tree moves its tab stop the same way when its visible items change, so every commit has exactly one, on a drawn, enabled item. A tab stop on an item that becomes disabled, or on a disabled row that was clicked, now moves to an enabled item, where before the tree was left with none (GAP-231).
