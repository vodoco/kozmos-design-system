---
"@kozmos-ds/react": patch
---

Three parts now show a prop change in the render that brings it, where for one commit they showed what was there before:

- **Combobox**: when the product changes `value`, or renames the chosen option, the field shows the new label at once. It showed the old label for one commit first. Text the product holds through `inputValue` is still the product's to change.
- **Combobox and MultiSelect**: made `disabled` or `readOnly` with the popup open, the field closes the popup at once. The popup stayed open, and could still be used, for one commit. Once the field can be used again, the popup stays closed until the visitor opens it, as before.
- **FloorSelector** (`collapsible`): when its floors are gone, or the map shell has no room for its column, the column closes at once. It stayed open for one commit. When it can open again, it waits for the visitor, as before.

Nothing else changes, and no prop changes.
