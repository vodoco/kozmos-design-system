---
"@kozmos-ds/react": patch
---

In `AdaptiveMapShell`'s panel, a hosted part paints no fill of its own: the panel's surface, solid or glass, is the one surface (decision 43).

- The panel sets `--kozmos-panel-part-fill` to `transparent` on itself, in a sheet and a side panel alike, for its header and its content.
- `BrowseCategoriesPanel` and `RoutePreviewPanel` paint nothing there. They filled their box with the background colour wherever they were, so on a glass panel each was an opaque block from under the grip's row down; the glass now shows through them. On a solid panel they look as they did, its fill being the same colour, and their text keeps the theme's foreground. On their own they keep the background colour.
- Their fill moves from `bg-background` to owned CSS (`kozmos-browse-categories`, `kozmos-route-preview`), which reads the property. A background class passed in `className` still outranks it.
