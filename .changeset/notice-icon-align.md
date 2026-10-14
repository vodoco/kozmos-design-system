---
"@kozmos-ds/react": minor
---

`Notice` takes `iconAlign` (GAP-118): `start`, the default, keeps the icon on the first line of a summary that wraps; `center` centres it on a one-line summary that holds a control, such as "Not finding it? [Search with AI]". `icon={null}` or `icon={false}` now draws no icon and leaves no empty column: the summary, the detail and the action start at the notice's edge, where an 8px gap and a 24px indent were left before.
