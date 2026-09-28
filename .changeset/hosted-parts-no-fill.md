---
"@kozmos-ds/react": patch
---

In `AdaptiveMapShell`'s panel, sheet or side, a hosted part paints no fill of its own: the panel's surface, solid or glass, is the one surface (decision 43).

- The panel sets `--kozmos-panel-part-fill` to `transparent` on its content and its header, in a sheet and a side panel alike.
- `BrowseCategoriesPanel` and `RoutePreviewPanel` paint nothing there. They filled their box with the background colour wherever they were, so on a glass panel each was an opaque block from under the grip's row down; the glass now shows through them. On a solid panel they look as they did, its fill being the same colour, and their text keeps the theme's foreground. On their own they keep the background colour.
- Their fill moves from `bg-background` to owned CSS (`kozmos-browse-categories`, `kozmos-route-preview`), which reads the property. A background class passed in `className` still outranks it.

On a glass surface, text that is muted elsewhere takes the foreground colour, so it reads at 4.5:1 over any map; the glass itself is unchanged (decision 48).

- `.kozmos-surface-glass` sets `--kozmos-surface-muted-foreground` to the foreground colour, and `.kozmos-surface-solid` resets it. Owned CSS reads it, falling back to the muted colour: the `kozmos-muted-text` class, and `POIDetailPanel`'s `sheet` presentation.
- The muted text a hosted part draws straight on the panel reads it: `RoutePreviewPanel`'s "To", its count of options and its status text; the empty states of `BrowseCategoriesPanel` and `POIResultList`; and, in `POIDetailPanel`'s `sheet` presentation, the level and hours line, the prices, the summaries' notes, the section headings and the gallery's position. Muted over a saturated map, they read as low as 3.6:1; they now read 9.7:1 or more, in light and dark.
- Muted text on a card of its own keeps its colour: a result, a route option, and a `panel` or `inline` details card.
