---
"@kozmos-ds/icons": minor
---

Six icons from Pointr's icon library: `Merge` (GAP-223, decision 166: the union of two overlapping squares as one outline, MAP-619's Merge tool beside Split), `Combine`, `CutOut`, `SquareUp`, `Straighten` and `Simplify`. Each is a named export, drawn on the 24 grid at stroke 2 with round caps, like every Pointr outline.

The set is regenerated from the library as published on 19 Nov 2026. 108 existing outlines are exported differently by Figma, most as one path where they were several. 61 of them render identically. The other 47 differ only in a few antialiased pixels where strokes overlap; none is redrawn. SwiftUI and Compose draw eight of the 108 from the same path data: Bookmark, Eye, Stars01 and Plane among the 47, and Phone, Droplets01, MedicalCross and NavigationPointer01 (traced in the opposite direction) among the 61.

The library's new Map marks frame (snap points, crosshair, right-angle mark, rotation readouts) is map artwork in fixed colours at its own sizes, so it is not exported. Nor are five new editor icons the stroke-only wrapper cannot draw as Figma has them: `snap`, `edit-path`, `rotate`, `split` and `transparency`.
