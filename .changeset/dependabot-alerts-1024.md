---
---

Development tooling only: the pinned transitive dependencies move to their patched releases, body-parser 2.4.0 (with iconv-lite 0.7.3), follow-redirects 1.16.1 and undici 7.30.1, to clear four of the five Dependabot alerts opened on 22 and 23 October. They reach the repository only through Pact, axios and jsdom in `@kozmos-ds/react`'s development dependencies. No published package's dependencies change, and the tokens, icons, product-contracts and react builds are byte for byte the same.
