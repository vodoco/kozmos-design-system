---
---

Development tooling only: the root `package.json`'s `pnpm.packageExtensions` gives framer-motion and 17 other packages whose declarations import React's types an optional `@types/react` peer, so pnpm links each with its importer's React types instead of whichever copy it hoisted, and the shared TypeScript setup of the Claude Design reader and the Vue contract maps only the subpaths React's types export. No package is added or removed and no published package's dependencies change; the tokens, icons, product-contracts, styles and react builds are byte for byte the same under either hoisted copy.
