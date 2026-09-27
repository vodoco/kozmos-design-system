---
"@kozmos-ds/react": minor
"@kozmos-ds/icons": minor
---

The map's controls take the product's words, the location control shows its mode, and step-free
has a control of its own.

**Every label is the product's.** `MapControlsGroup` gains `zoomInLabel`, `zoomOutLabel` and
`compassResetLabel` (`locationLabel` already existed), `UserLocationMarker` gains `label`, and
`FloorSelector` gains `previousFloorLabel` and `nextFloorLabel`. The defaults stay English: a design
system has no locale of its own, and the product now has somewhere to put one.

**The location control draws each mode.** A mark per `locationState` — `off`, `locating`,
`following`, `heading`, `permission-denied`, `stale`, `unavailable` — replaceable with
`locationIcons`. `locationRevealOnChange` shows the mode's label when it changes, and
`locationLabelPlacement` puts that label `inline` or `stacked`. `@kozmos-ds/icons` gains
`LocationFollowing` and `LocationHeading`, which the control draws, so this react needs this icons.

```tsx
<MapControlsGroup
  locationState={locationState}
  locationRevealOnChange
  zoomInLabel={t("map.zoomIn")}
  zoomOutLabel={t("map.zoomOut")}
  onStepFreeChange={onRoute ? setStepFree : undefined}
  stepFree={stepFree}
  stepFreeLabel={t("map.stepFree")}
/>
```

**Step-free takes the location control's place on a route.** With `onStepFreeChange` the control
is a step-free toggle (`stepFree`, `stepFreeLabel`, `stepFreeOnLabel`, `stepFreeOffLabel`,
`stepFreeIcon`). It is keyed apart from the location control, so assistive technology meets a new
control rather than the old one changing its name.

**The marker admits it is elsewhere.** `UserLocationMarker` gains `offFloor` and `offFloorLabel`.
Off the level in view it is hollow, without its halo, ping or heading cone — shape carries the
state, not colour alone — where the map page used to hide it and the visitor lost their position.

**Pins sit on their place right to left.** `LocationPin` anchors to a physical origin, to match its
physical translate. In Arabic every pin drew one pin-width to the left of the place it marks.

**The map fills its shell.** `MapView` gains `variant="fill"`: no border, radius or 400px minimum,
and `role="group"` rather than a second landmark inside `AdaptiveMapShell`'s map region. The
default, `"framed"`, draws what it always drew. The labels beside map controls keep their gap right
to left.
