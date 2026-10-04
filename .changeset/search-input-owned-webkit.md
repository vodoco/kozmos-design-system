---
"@kozmos-ds/react": patch
---

Preserve SearchBar input styling in WebKit using component-owned CSS instead of native-control scoped utilities. Its input remains shrinkable and chrome-free, keeping the Core clear action inside narrow layouts at enlarged text sizes. The recipe uses a SearchBar-specific class so Core Search retains its independent bordered field styling. The existing callbacks and public API are unchanged; this does not introduce the separately planned Core decorated-field capability.
