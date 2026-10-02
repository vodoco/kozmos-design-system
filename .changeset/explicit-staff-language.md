---
"@kozmos-ds/product-contracts": minor
"@kozmos-ds/react": minor
---

Add optional `POIResultPresentation.languageNotListed` and localized result-card/list/group disclosure. Only explicit `true` renders a note; missing data, authored-name language and interface language never imply staff-language availability. Existing calls stay unchanged. Native source mirrors the contract, and Swift selection copies now preserve the existing summary as well as the new language evidence.
