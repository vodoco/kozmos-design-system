---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Pointr Cloud's property editors (CLOUD-UI-004, decisions 177–181), in `@kozmos-ds/react/dashboard` with their rules in `dashboard.css`: `PropertyField`, the frame every property sits in (its name as caption, a named info button, a named red trash); `OpeningHoursEditor`, the seven days, each Hours, Closed or Always open, keyboard operable, overnight hours marked "+1 day"; `RatingEditor`, the rating, its max and its count checked against each other, with `validateRating` and a five-star preview to the nearest half; and `KeyValueList`, rows of a name, a type and a typed value that add, edit and delete by keyboard. Each keeps a multi-selection's mixed values (GAP-153).
