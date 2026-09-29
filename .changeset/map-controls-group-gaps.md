---
"@kozmos-ds/react": patch
---

`MapControlsGroup` passes the presses in the gaps between its controls to the map (decision 46). Its box took every press in the 8px between the zoom pair, the compass and the location control; now only the controls take presses, so a press or a drag in a gap reaches the map beneath, as one in a `MapOverlay`'s room does. While the overlay holding the group overflows, a press in a gap is the overlay's, whose scroll box takes its room then, so a wheel there still scrolls it in every engine. The group keeps its role, its name and its controls' tab order. Its box is the owned `kozmos-map-controls-group` rule, and no longer carries `pointer-events-auto`.
