---
"@kozmos-ds/react": patch
---

RoutePreviewPanel's Back arrow now points to the start edge in right-to-left layouts. It stayed pointing left, away from where the reader came from; it is now mirrored right to left, as the SwiftUI and Compose panels draw it. Left-to-right layouts are unchanged.
