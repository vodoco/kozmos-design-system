---
"@kozmos-ds/product-contracts": minor
---

`UserLocationState` gains `"heading-paused"` (decision 45): heading remembered while the map has been moved away from the visitor, the SDK's rotational Off. The next press goes straight back to `"heading"`, which is the product's to do. iOS has it as `KozmosUserLocationState.headingPaused` and Android as `KozmosUserLocationState.HeadingPaused`, with the same wire value.

It releases with `@kozmos-ds/react`, which draws it: react pins its siblings exactly, so the react that knows `"heading-paused"` needs this version, and the two go out together.
