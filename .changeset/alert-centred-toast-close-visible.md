---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": patch
---

A title-less Alert's description, straight after the icon, is now centred on it with a margin of -2 above and below rather than lifted 3 with a transform. The transform moved the words but left their box behind, so they had 13px above them and 19px below; they now have 14px above and 14px below, on one line or several, in every variant. A titled Alert and one with no icon are drawn as before (GAP-269). The icon and the room for it now sit at the inline start (`start-4`, `ps-7`, they were `left-4` and `pl-7`), so in a right-to-left Alert the icon is at the right, beside the words. SwiftUI's and Compose's alerts centre one line of words on the icon the same way.

ToastClose takes `visible`: `"hover"`, the default and what it did before, shows the close only while the toast is hovered or the button has focus, where the primary input can hover (on a touch screen, where nothing hovers, it now shows the whole time); `"always"` shows it the whole time the toast shows, so a visitor who never hovers it still sees how to close it. The Toaster takes `closeVisible` for every toast it draws, and `toast()` takes `closeVisible` for one, which wins over the Toaster's (GAP-268). SwiftUI's and Compose's toasts have no hover: their close already shows the whole time, as `"always"` does.
