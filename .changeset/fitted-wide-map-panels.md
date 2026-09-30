---
"@kozmos-ds/react": patch
---

Fit wide AdaptiveMapShell panels to short content and bound long content above
the bottom control row. Keep bottom-start/end controls at the outer map edges
in LTR and RTL, rather than pushing them beside the panel. Bound corner popups
below short panels or in the clear map beside long panels.
Permit a shell-bound floor menu to move horizontally away from its trigger when a
same-side panel occupies that column, instead of overlapping the panel on web or
refusing to open on native.

SwiftUI and Compose mirror the layout policy. The iOS QA search header now uses
equal top and side padding on wide screens.
