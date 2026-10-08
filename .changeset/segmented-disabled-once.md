---
"@kozmos-ds/react": patch
---

A disabled `SegmentedControl` is dimmed once. The group draws itself at 50%, and its segments no longer halve themselves again, so they are at 50%, not 25%. This is how SwiftUI and Compose draw a disabled control. A segment disabled on its own, in an enabled control, still dims itself.
