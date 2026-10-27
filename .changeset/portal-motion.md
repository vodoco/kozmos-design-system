---
"@kozmos-ds/react": patch
---

The design config's reduced motion reaches the theme's portal. `DesignConfigProvider` marks its scope `data-kozmos-motion="reduced"` when its config reduces motion (`motion: "reduced"` or `accessibility.reduceMotion`), and every looping animation stops on that mark (GAP-50); but Popover, Dialog, Drawer and BottomSheet, Tooltip, Select, Menu and Combobox's list draw in the provider's portal, outside that scope, so a Spinner or Skeleton in one kept running. The portal of every `ThemeProvider` inside the config's provider now carries the same mark, kept in step as the config changes; a provider nested inside says its own config's. The theme, density, direction and tokens already reached the portal, and entry and exit animations were already cut by the config's motion scale; nothing else changes.
