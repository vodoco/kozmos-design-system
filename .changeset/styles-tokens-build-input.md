---
"@kozmos-ds/styles": patch
---

`@kozmos-ds/styles` no longer installs `@kozmos-ds/tokens`. Its `style.css` carries the tokens built in, with no import left in it, so tokens is what its build reads, not something a product needs beside it: a dev dependency, not a dependency. A Vue product that installs `@kozmos-ds/styles` gets the stylesheet alone, and styles no longer pins a tokens version of its own.
