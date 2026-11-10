---
"@kozmos-ds/react": patch
---

MultiSelect keeps its active option where the visitor put it when a choice is made. It used to go back to the first enabled option after every choice, so ArrowDown, Enter, ArrowDown, Enter un-chose the first option instead of choosing a second. A choice made while text is typed clears the text and keeps the option just chosen active in the full list, so the visitor keeps their place; if the product has disabled that option, the next enabled one becomes active. New options or new typed text still make the first enabled option active. When the active option can no longer be chosen (reaching `maxSelected`, or the product disabling it), the next enabled option on from it becomes active.

Listbox likewise keeps its active option when the product holds the choice and passes its options as a new, equal array each render, or disables options to draw a limit. When the product disables the active option, the next enabled option on from it becomes active, or none when none is enabled.

MultiSelect and Combobox name no active option in the commit that opens their popup, whose list is drawn a commit later: `aria-activedescendant` now appears once the list is in the page, so no commit names an option that is not drawn (GAP-231).
