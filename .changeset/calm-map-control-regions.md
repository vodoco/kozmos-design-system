---
"@kozmos-ds/react": patch
---

Give AdaptiveMapShell's controls and registered bottom corners distinct named accessibility regions. New optional controlsLabel and bottomControlsLabel props default to "Map controls" and "Map corner controls" and accept translated names. Child controls stay independently accessible, and hidden or omitted regions do not introduce navigable empty landmarks. SwiftUI and Compose source implementations expose equivalent named containers while preserving existing native call signatures. Layout and keyboard behavior are unchanged.
