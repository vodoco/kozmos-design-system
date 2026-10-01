---
"@kozmos-ds/react": minor
---

Correct the declared Firefox minimum from 128 to 146. This is a breaking support-policy correction: the remaining scoped utility CSS requires native `@scope`, enabled by default in Firefox 146. Firefox 128 was incorrectly advertised as supported; Badge and Separator lose their styling there even though owned-CSS controls such as Button and Input still render correctly.

Consumers must use Firefox 146 or newer, or defer adoption while their browser requirements are reviewed. There is no legacy-browser polyfill or CSS fallback in this change. Existing published packages are not modified. Other declared browser minimums are unchanged, and this prerequisite does not certify every component or a product's embedded WebView. Add a manifest regression guard and exercise built scoped utility styles with nested themes in Firefox CI.
