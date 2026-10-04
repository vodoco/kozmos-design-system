---
"@kozmos-ds/react": patch
---

Omit blank and duplicate Combobox popup command IDs rather than allowing ambiguous
keyboard activation. Commands remain distinct from selectable values even when
their string IDs match. Render matching empty-state/supporting messages once while
retaining field descriptions and nested-overlay Escape ownership.
