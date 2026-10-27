---
"@kozmos-ds/react": minor
---

`Backdrop` is drawn in the theme's portal, as Popover and Dialog are. Rendered inside a box that isolates its stacking (MapView, site GAP-40), clips or transforms what it holds, a fixed `Backdrop` was trapped in it: drawn under a sticky Navbar or the shell's top bar and panel, so the page was not dimmed. It now covers the window from wherever it is rendered, and its cut-out still lets presses through to its target.

- **The DOM moves.** The backdrop's element, and its children (a step card), are in the provider's portal root, not in the markup it is rendered in; a product that queried it there finds it in the portal. Like every part drawn there, the element carries the provider's density (`data-kozmos-density`). Its own class, id, attributes and ref are unchanged, it adds no wrapper, and React still carries its children's events up the tree it is rendered in.
- **Inside a modal** (Dialog, Drawer, BottomSheet), which makes everything outside its content inert, it is drawn in the modal's content instead, as it was drawn in place before: it blocks presses on what it dims, its children take focus inside the modal's focus trap, and neither is hidden from readers.
- **`placement`** is new: `"fixed"` (the default) as above, or `"inline"`, drawn in place, `absolute` over the nearest positioned box, to dim one region (site GAP-34). **Migration:** a product that dimmed a region with `className="absolute"` passes `placement="inline"` now; a fixed backdrop given a positioning class (absolute, relative, static or sticky) warns once in development and says so.
- **Its ref** is set with the element, in the commit the element arrives in, as before. The cut-out is drawn once the portal exists.
- **Server rendering:** a fixed backdrop is no longer in the server's HTML; it is drawn a render or two after hydration, once the provider's portal exists. An inline one renders on the server as before.
- **Stacking:** a fixed backdrop and the popovers share the portal and the layer, so whichever opened last is on top: a Backdrop opened while a Popover, Menu or Tooltip is open dims it, and one opened after is above the backdrop. Drawn in the page before, the backdrop was under every popover.
