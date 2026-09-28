---
"@kozmos-ds/react": patch
---

`AdaptiveMapShell`'s panel carries `data-slot="map-shell-panel"`, a short, stable name for a check that reads the panel's markup. Axe cuts every attribute value in a node's snippet to 20 characters once its opening tag passes 300, and the website's exclusion for the known nested-landmark finding (GAP-17), which read the panel's class, stopped matching when the panel's style grew. It now reads this attribute.
