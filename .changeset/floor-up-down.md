---
"@kozmos-ds/react": patch
---

`FloorSelector`'s compact stepper now calls its two buttons "Floor up" and "Floor down", as iOS and Android do. They were "Previous floor" and "Next floor". "Floor up" is the up chevron, which steps to the previous level in `floors`, so list the levels top first and up goes up.

This is a behaviour change products may match on in their own tests: a query such as `getByRole("button", { name: "Previous floor" })` no longer finds the button, so use the new names. A product that passes `previousFloorLabel` and `nextFloorLabel` keeps its own words.
