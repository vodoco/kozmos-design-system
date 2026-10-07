---
"@kozmos-ds/react": patch
---

Progress fills from the inline start: right to left it now fills from the right, as SwiftUI's and Compose's bars do. Its indicator is as wide as the value instead of a full-width bar translated left. The native bars draw React's colours: SwiftUI theme 600 through `.tint` (it drew theme 500 through the deprecated `LinearProgressViewStyle(tint:)`), and Compose theme 600 on background 200 (theme 500 on background 300 read 2.56:1 against its track, 1.58:1 dark).
