---
"@kozmos-ds/react": minor
---

`Backdrop` is drawn in the theme's portal, as Popover and Dialog are. Rendered inside a box that isolates its stacking (MapView, site GAP-40), clips or transforms what it holds, a fixed `Backdrop` was trapped in it: drawn under a sticky Navbar or the shell's top bar and panel, so the page was not dimmed. It now covers the window from wherever it is rendered, and its cut-out still lets presses through to its target.

- **The DOM moves.** The backdrop's element, and its children (a step card), are in the provider's portal root, not in the markup it is rendered in; a product that queried it there finds it in the portal. Like every part drawn there, the element carries the provider's density (`data-kozmos-density`). Its own class, id, attributes and ref are unchanged, it adds no wrapper, and React still carries its children's events up the tree it is rendered in.
- **`placement`** is new: `"fixed"` (the default) as above, or `"inline"`, drawn in place, `absolute` over the nearest positioned box, to dim one region (site GAP-34). A product that dimmed a region with `className="absolute"` passes `placement="inline"` now.
- The cut-out is drawn once the portal exists, a render after the backdrop mounts.
