---
"@kozmos-ds/react": patch
---

Omit blank and duplicate Combobox popup command IDs rather than allowing ambiguous
keyboard activation. Commands remain distinct from selectable values even when
their string IDs match. Render matching empty-state/supporting messages once while
retaining field descriptions and nested-overlay Escape ownership. The entry made
active as the query changes is the first option that can be chosen, never a command,
so Enter on text that matches nothing chooses nothing; a command runs only when the
visitor moves to it. Enter ignores Safari's composition commit (keyCode 229).
