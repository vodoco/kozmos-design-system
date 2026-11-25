---
"@kozmos-ds/styles": patch
---

ListItemStatus's check and dot no longer shrink (`flex-shrink: 0`), so where `@scope` is dropped, and the status's spoken label stays in the flow, they keep their 12 and 8 instead of drawing 0 wide (GAP-288). With `@scope`, nothing drawn changes.
