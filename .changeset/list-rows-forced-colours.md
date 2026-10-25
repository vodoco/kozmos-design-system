---
"@kozmos-ds/react": patch
---

In forced colours (Windows' high contrast), the list rows of `Combobox`, `MultiSelect`, `Select`, `Listbox` and the SDK's `LanguageSwitcher` mark the active row again. Forced colours drop the rows' fills and the keyboard's ring, so neither the pointer's row nor the keyboard's was marked, and every row drew a 2px outline round itself: each row's `outline-none` is a transparent outline, which forced colours paint. Now only the active row, under the pointer or the keyboard, draws an inset 2px outline in the system's `Highlight`, so nothing moves. The chosen row's check takes `CanvasText`, where Chromium kept its brand colour.
