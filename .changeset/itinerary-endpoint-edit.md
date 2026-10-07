---
"@kozmos-ds/react": minor
---

Itinerary can end its From and To rows in a Change button, as the Web SDK's route card has Edit beside them (GAP-104). Pass `onEditOrigin`, `onEditDestination` or both; a row whose callback is left out draws nothing new, so existing lists, ManoeuvreCard's among them, are unchanged. The button shows `changeLabel` ("Change", RouteLocationField's verb) and is named for its endpoint with that verb first: `editOriginLabel` and `editDestinationLabel`, "Change start point" and "Change destination" by default, built from `changeLabel` when left out. It is a ghost button, 44 tall, on the name's first line at the row's inline end, and takes the next line when the name would keep under 80px beside it. SwiftUI and Compose take the same parameters after their released ones.
