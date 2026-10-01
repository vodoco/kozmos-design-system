---
"@kozmos-ds/react": patch
---

Give POIResultCard actions a 44px-equivalent minimum target instead of a fixed 40px height, allowing growth with larger text. SwiftUI and Compose source implementations and the Figma importer now use the same minimum painted height; SwiftUI includes padding in the tappable label and Android retains its larger platform touch-target policy. Selected results may be taller than before; handlers and disabled behavior are unchanged.
