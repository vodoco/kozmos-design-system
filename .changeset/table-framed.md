---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Table takes `framed`: a 1px border round the table and the control radius, 16, at its corners, as Figma, SwiftUI and Compose draw it (decision 159). The header and the rows are clipped inside the frame, and a caption sits inside it, at its foot. It is off by default, so existing tables do not change. `@kozmos-ds/vue`'s `KozmosTable` takes it as a boolean, bare or bound.
