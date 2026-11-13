---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

MapEditToolbar, a Dashboard module from `@kozmos-ds/react/dashboard` (CLOUD-UI-005, decisions 139 and 151): Pointr Cloud's map edit toolbar, one part for its seven geometry toolbars. A card 60 tall, padding 6 and 8, corner 16, of 56 × 48 items, each a 24 icon over an 11/14 label: tools, ToggleButtons with one at most pressed (`value`, `defaultValue`, `onValueChange`), actions (`onAction`) and dividers, passed as `items`, with a `field` for JSON mode's GeoJSON input. It is one tab stop (`role="toolbar"`): the arrow keys move between the items in the writing direction, Home and End go to the ends, and disabled items are skipped. On a narrow map, the items that do not fit go, from the end, into a More menu instead of off the screen. Its rules are in `dashboard.css`.
