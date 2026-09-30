---
"@kozmos-ds/react": minor
"@kozmos-ds/tokens": minor
---

Add MapAttribution: provider-neutral, single-line horizontally scrollable credits with safe links and independently optional branding. The host supplies approved content and owns SDK provider resolution and map placement. Matching SwiftUI and Compose components accompany the web presentation.

Use compact text-height credit rows and 4-unit spacing across all three platforms, without map-button minimum heights.

Bundle the official Pointr logo by default on all three platforms. Supply brand to replace it for white-label use, or showBrand=false to hide branding without hiding credits. Artwork loads locally with no network dependency.

Encode the web artwork as a compact SVG data URL without changing the canonical image, and keep generated branding stable under repository formatting.

Default to transparent map appearance with tokenized grey text and a thin white halo across all three platforms. The optional surface appearance retains the opaque themed treatment. Preserve underlines, a single accessible label per credit, one-line scrolling and independent branding.
