---
"@kozmos-ds/react": patch
---

AdaptiveMapShell never clips the map credits into a scroll region. When an opened direction card and the sheet leave the attribution less room than its full height, MapAttribution's brand gives way first and the credits keep their full height, so nothing is cut off and no scroll area that a keyboard can't reach is left behind (GAP-135). The panel's sizing is unchanged.
