---
"@kozmos-ds/react": patch
---

**Notice draws each tone's own mark.** Every tone drew the warning triangle by default, so an `info` notice read as a warning. `info` now draws an info circle and `critical` an alert circle, the marks Toast gives the same tones, and `warning` keeps the triangle. A caller's `icon` still wins, and `icon={null}` still draws none.
