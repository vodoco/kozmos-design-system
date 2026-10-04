---
"@kozmos-ds/react": patch
---

Reduce stylesheet size by sharing identical light/dark token declarations while retaining both selectors and their original specificity. Public token names, values, utility styles and component styles are unchanged. Include PostCSS helpers in the build cache inputs so compiler changes cannot restore stale stylesheets.
