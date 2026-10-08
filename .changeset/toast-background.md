---
"@kozmos-ds/react": patch
---

`Toast` draws on the background, background/0 under the foreground ink, as SwiftUI and Compose do. It had a border and a shadow but no fill, so whatever was behind it showed through.
