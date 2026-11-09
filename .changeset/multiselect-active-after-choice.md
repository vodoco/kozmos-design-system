---
"@kozmos-ds/react": patch
---

MultiSelect keeps its active option where the visitor put it when a choice is made. It used to go back to the first option after every choice, so ArrowDown, Enter, ArrowDown, Enter un-chose the first option instead of choosing a second. New options or new typed text still make the first option active. When reaching `maxSelected` disables the active option, the next option on from it that can still be chosen becomes active. Listbox likewise keeps its active option when the product holds the choice and passes its options as a new, equal array each render.
