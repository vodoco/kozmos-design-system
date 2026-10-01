---
"@kozmos-ds/react": patch
---

Disable POI result-card actions when no `onAction` handler is supplied, matching iOS and Android. The actions remain visible but cannot produce analytics-only presses. Supply an `onAction` handler to make them actionable; an explicitly disabled action stays disabled.
