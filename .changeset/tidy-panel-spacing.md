---
"@kozmos-ds/react": patch
---

Give AdaptiveMapShell a 16-unit gap below its fixed panel header and a 16-unit top inset in gripless sheets. Hosted surfaceless POI, browse and route components consume that supplied inset instead of doubling it. Content-fitted sheets include their border and do not retain empty height after the grip appears. SwiftUI and Compose source follow the same spacing contract.

Remove product-owned 16-unit spacer workarounds directly below panelHeader, and redundant top padding on outer content wrappers in gripless sheets or side panels. For example, a navigation panel wrapper using `p-4` becomes `px-4 pb-4`: the shell supplies its top 16. Bordered cards retain padding inside their own border; do not remove that padding. Publication, Figma regeneration and consuming-app adoption are separate steps.
