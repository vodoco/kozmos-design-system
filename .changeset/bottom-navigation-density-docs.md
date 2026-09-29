---
"@kozmos-ds/react": patch
---

`BottomNavigation`'s `density` says what it does for the bar: `compact`, the default, is an item at least 64px tall and 6px in from its edges; `default` is at least 72px tall and 8px in. It was typed as `NavigationItemProps["density"]`, whose docs describe the rail's item and say the compact tile is retired; it is now `"default" | "compact" | null`, the same values.
