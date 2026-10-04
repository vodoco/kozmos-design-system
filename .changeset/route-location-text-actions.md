---
"@kozmos-ds/react": minor
---

Add explicit Change and Cancel callbacks for host-controlled location editing. RouteLocationField uses text actions to distinguish clearing a search or changing a place from closing its containing panel; the map action uses a map-pin icon. Hosts without onEdit retain the original clearing callback. The React preview includes cancellable drafts and focus restoration; native parity remains pending design review.

Move map selection into the dropdown and offer an opt-in host-resolved current position independently of search results. Combobox supports keyboard-accessible popup commands separate from its selectable values; these never write a command label into the query. Current-position validation and lifecycle remain host-owned.
