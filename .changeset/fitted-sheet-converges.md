---
"@kozmos-ds/react": patch
---

A bottom sheet fitted to its content (`"content"` in `panelDetents`, or `panelSizing="content"`) now comes to rest in every engine when it holds `AICompanionPanel` (owner, 25 Oct). It measured the assistant at the height the sheet had given it, since the assistant fills its panel, so the sheet was fitted to itself.

- **The sheet fits the assistant as it lays out unstretched:** its header, its whole conversation and its input, between collapsed and large. One question and its answer under a grip came to 306px in a 390 by 800 shell, where the sheet stayed at the 192 it was first measured at.
- **The assistant then fills the sheet.** At the collapsed floor its input sits on the sheet's bottom edge, and at large only its thread scrolls.
- **It grows with the conversation,** and fits the same height whichever detent it comes from. Before, it kept its first height, unless it came down from a taller detent.
- **WebKit on a page with no doctype:** the sheet no longer grows to large and drops its grip. There the assistant's `height: 100%` resolves against the panel rather than the content box, so each measurement read the grip's row more, and the sheet grew 16px at a time, without waiting for a frame, until it reached large.
- **Other content is measured as before:** in Chromium, Firefox and WebKit a fitted list rests where it did.

The props are unchanged.
