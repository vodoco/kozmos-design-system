---
"@kozmos-ds/react": minor
---

`toast()` and `<Toaster>` (GAP-167, decision 119), on the Radix Toast the parts already use, with no new dependency. Mount one `Toaster` inside the ThemeProvider and call `toast(title, options)` from anywhere: an event handler, a request's callback, a module outside React. It returns the toast's id.

- **Tones.** `tone` is `neutral` (the default, no icon), `success`, `info`, `warning` or `critical`: Notice's tones, with the success GAP-160 asks of Notice. A tone is an icon at the inline start (the Alert set's icon for it in Figma), in the tone's text colour, which holds 3:1 on the toast's background; the surface stays the background (GAP-58). `Toast` takes the same optional `tone`; without it a toast is drawn exactly as before.
- **Announced.** Each toast once, by Radix's live region, which says its `aria-live` out loud (GAP-193), so a modal Select or Dialog that hides the page does not silence it: a `critical` toast assertively, every other tone politely, unless `live` says otherwise. Radix joined a toast's words with nothing between them ("Could not saveTry again."); the Toaster's are spaced. The toasts themselves are not live regions, so nothing is said twice.
- **Focus.** A toast never takes it. F8 (`hotkey`) moves focus to the toasts. Escape closes the focused toast, or, with focus anywhere else, the newest one (Radix's layers), and leaves focus where it is.
- **Time and the queue.** `duration` (5 seconds, or the call's own; `Infinity` keeps it) runs from when a toast is drawn and pauses while the toasts are hovered or focused. `limit` (3) show at once, oldest first; the rest wait their turn. A call with an existing `id` replaces that toast where it is and announces it again. `toast.dismiss(id)` closes one and `toast.dismiss()` all; `onDismiss` runs once, however a toast closes (its close button, a swipe, Escape, its action or the call).
- **Words.** `label` names the region ("Notifications ({hotkey})"), `toastLabel` comes before each announcement ("Notification"), `closeLabel` names each close button ("Dismiss notification"), and an action's `altText` is what a screen reader hears in place of its button.
- **Reduced motion.** Under `prefers-reduced-motion: reduce` or the design config's `motion: "reduced"`, which reaches the theme's portal, a Toaster's toast arrives, leaves and springs back without moving; a swipe still follows the finger.
- **Where it draws.** In its ThemeProvider's portal, in that provider's theme, direction, density and tokens, so a box it is rendered in (a map that isolates its stacking, a panel that clips) cannot trap it. A Toaster with an `id` draws the toasts whose `toaster` option names it; of two Toasters with one id, the first mounted draws and the other stays empty.
- **On the server.** `toast()` does nothing and a Toaster renders no toast, with no warning under React 18 or 19.

The existing parts work as they did: `Toast` gains only the optional `tone`. SwiftUI and Compose have no `toast()` and no tones yet.
