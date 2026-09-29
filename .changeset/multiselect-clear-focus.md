---
"@kozmos-ds/react": patch
---

`MultiSelect` hands focus to its field when every choice is cleared. The clear button goes with the choices it clears, and a keyboard that pressed it lost focus to the page. The field now takes focus, with its list closed, since the visitor cleared the choice and did not ask for options; typing or an arrow key opens it, as before. Removing one chip still hands focus to the field, and a disabled or read-only field still offers nothing to clear.
