---
"@kozmos/react": patch
---

Button keeps 8px between its icon and its label, as Figma's Button and iOS's
always have (GAP-56). `.kozmos-button` takes the spacing scale's 100 as a gap,
and the loading spinner loses its own `mr-2`, which spaced it on one side only:
in right-to-left the spinner touched the label. An icon passed to a Button no
longer needs `mr-2`; one that keeps it sits 16px away, so remove it.
