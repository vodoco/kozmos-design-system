---
"@kozmos-ds/react": minor
---

**Analytics: one press, one event.** Where a component reports a press with its
own event, the Core Button inside it no longer also sends the generic
`Button:button_clicked`. Affected presses: SearchBar's clear (`search_cleared`),
POIResultCard's actions (`poi_result_action`), WayfindingCard's close and swap,
RoutingInputGroup's add, remove and swap, FeedbackCard's submit, SaveLocationCard's
save and route, SplitButton's main action, FloorSelector's levels and stepper
(`floor_selected`), FileUpload's remove and Dialog's close (`dialog_closed`).
Presses no component reports (a plain Button, SaveLocationCard's note edit,
SplitButton's menu, the collapsible floor tile) still send `button_clicked`.
Dashboards that counted `button_clicked` for those presses should count the
component's own event instead. No props change.
