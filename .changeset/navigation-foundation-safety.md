---
"@kozmos-ds/react": patch
---

Correct navigation foundations: join optional direction metrics without stray separators, scope route warning descriptions to each rendered instance, disable stale route options outside ready state, use the proper two-way swap symbol, and provide independent localized route field and action labels. Wayfinding swap analytics no longer includes raw origin/destination strings; consumers requiring location analytics must make their own explicit privacy decision. Native source mirrors metric, readiness and labeling corrections and normalizes non-finite progress safely; native source delivery is separate from npm publication.
