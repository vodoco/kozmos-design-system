---
"@kozmos-ds/react": patch
---

**ColorPicker** mirrors in a right-to-left field. Its swatch sits 8 in from the inline start and its open button 4 in from the inline end, each inside the 48 the text keeps at that end; right to left, both sat at the wrong end, with the swatch over the end of the text and the button over its start. The panel's hue and opacity gradients now run the same way as their sliders, from the inline start. Right to left, a native range has its lowest value at the right, and the gradients still ran left to right, so the opacity slider showed clear under a thumb set to opaque. Left to right, nothing changes.
