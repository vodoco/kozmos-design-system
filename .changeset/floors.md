---
"@kozmos-ds/react": minor
"@kozmos-ds/product-contracts": minor
---

The levels say where the results are.

`FloorPresentation` gains `resultCount` (in the iOS and Android contracts too), and `FloorSelector`
marks each level that holds results and says so in the level's name, worded by
`resultCountLabel`. By default that is "1 result" or "3 results"; a count of zero or less is neither
drawn nor said.

```tsx
<FloorSelector
  floors={floors.map((floor) => ({ ...floor, resultCount: counts[floor.id] }))}
  resultCountLabel={(count) => t("floors.results", { count })}
/>
```
