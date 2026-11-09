---
"@kozmos-ds/react": patch
---

Combobox, MultiSelect and Listbox now move their active option in the render that brings new options or new typed text, not in an effect after it, so no commit's `aria-activedescendant` names the previous option, a disabled one or one that is not drawn. Tree moves its tab stop the same way when its visible items change, so every commit has exactly one, on a drawn, enabled item; a tab stop on an item that becomes disabled now moves too, where before the tree was left with none (GAP-231).
