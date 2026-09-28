---
"@kozmos-ds/react": patch
---

Decision 48 on every glass surface: text that is muted elsewhere takes the foreground colour on glass, so it reads at 4.5:1 over any map.

- The cards that take `surface` draw their muted text through `kozmos-muted-text`, which reads the glass surface's `--kozmos-surface-muted-foreground`. That covers `ManoeuvreCard`'s detail, `Itinerary`'s captions and origin (inside a glass manoeuvre card), `RouteSummary`'s distance, and the descriptions of `FeedbackCard` and `SaveLocationCard`. Muted over a saturated map they read 3.6:1 to 4.2:1; on glass they now read 9.7:1 or more. On a solid card they look as they did.
- `POIMediaGallery`'s position follows wherever the gallery sits, hosted on its own too.
- `POIDetailPanel`'s muted lines read the property directly. Its `panel` and `inline` presentations say they are a card of their own, so their text stays muted even on a glass sheet.
- In `AdaptiveMapShell`'s panel, `POIDetailPanel`'s summary strip paints no fill of its own (decision 43): across a glass sheet it was an opaque band. On its own it keeps its fill.
