---
"@kozmos-ds/react": minor
---

`PaginationPrevious` and `PaginationNext` take `label`, the word drawn beside the chevron: "Previous" and "Next" by default, the words they drew before (GAP-182). A product that translates passes its own, with an `aria-label` in the same language: the links are still named "Go to previous page" and "Go to next page" by default, and `Pagination`'s landmark "pagination". Those three names already gave way to a caller's `aria-label`; the props now say so, with their defaults, and a test holds them. SwiftUI's and Compose's Previous and Next take `label` too. The Code Connect example draws the two parts with Figma's Previous Text and Next Text as their labels, where it rebuilt them from `PaginationLink`.
