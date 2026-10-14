---
"@kozmos-ds/react": minor
---

The map shell's panel and the scroll regions inside it.

- **16 below the content's end** (GAP-085): AdaptiveMapShell's panel leaves 16px below its content, as it does above it, so a short result list ends 16px above the panel's edge, beside the map and in a sheet, where it sits above the device's safe area. It publishes `--kozmos-panel-inset-bottom`. The details card, the route preview and the category browser end with padding of their own and give it back, so they end where they did; a part that fills the panel (the assistant) gets none.
- **No lasting scrollbar on a phone** (decision 75, GAP-138): in a sheet, the panel's content, ManoeuvreCard's open itinerary and FloorSelector's level list draw no scrollbar at rest, as touch platforms don't. They still scroll by touch, wheel and keys.
- **Kozmos's thin scrollbar beside the map and alone** (GAP-139): the same regions draw a thin thumb in `--semantics-scrollbar-thumb` on a transparent track, kept off a rounded panel's corners in Chromium and Safari.

**What you'll see:** a fitted panel is 16px taller under a short list. A desktop panel's scrollbar is thin and grey instead of the browser's own. A phone layout drawn by a desktop browser shows no scrollbar in the sheet, the direction card or the level list.
