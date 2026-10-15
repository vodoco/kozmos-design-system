---
"@kozmos-ds/react": patch
---

LanguageSwitcher's menu opens straight above its trigger, from its start edge, over a side panel and anything else, as the Web SDK's does (decision 77, GAP-122). It kept to the map's popup region, which with a side panel open put it beside the panel, half way up the map. A long list stays above and scrolls in the room there rather than flipping below.
