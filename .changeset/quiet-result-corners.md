---
"@kozmos-ds/react": minor
"@kozmos-ds/tokens": minor
---

Make the approved SDK result presentation the default: shared neutral selected/hover surfaces, combined numbered Featured and badge tabs, matching corner radii, wrapping names and an outlined navigation icon on Go actions. Grouped and standalone results share the treatment. `presentationStyle="legacy"` preserves the prior appearance for staged migration; numbering remains opt-in and product-supplied.

Add themed result surface tokens. SwiftUI and Compose source implementations adopt the same default and add directly composable expandable result groups. Existing callbacks and positional native calls remain supported. Review changed card heights and accessible names; SDK sprite integration and physical accessibility acceptance are separate from this source change.
