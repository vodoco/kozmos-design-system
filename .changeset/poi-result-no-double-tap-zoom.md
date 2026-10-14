---
"@kozmos-ds/react": patch
---

A result's button sets `touch-action: manipulation` (GAP-144), so a double tap on a result on a mobile browser never zooms the page instead of opening its details. Pinch zoom still works. The rule is owned, so it holds in a host without `@scope`.
