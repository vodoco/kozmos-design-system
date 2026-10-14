---
"@kozmos-ds/react": patch
---

CategoryTile gives a name in Han, kana or Hangul a third line (decision 78, GAP-010), so a long word such as カスタマーサービス shows whole rather than cut at two lines; other scripts keep two. SwiftUI and Compose do the same.
