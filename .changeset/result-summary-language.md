---
"@kozmos-ds/product-contracts": minor
"@kozmos-ds/react": minor
---

Add optional `POIResultPresentation.summaryLanguage`, the BCP 47 tag for the language a result's summary is written in, when it differs from the interface language (GAP-125). The model writes the summary in the query's language, so a visitor who asks in Spanish on an English device gets a Spanish summary among English labels. POIResultCard sets it as the summary's `lang`, as it does `nameLanguage` on the name, in a card on its own, in POIResultList and in POIResultGroup, so a screen reader says the summary in its own language's voice (WCAG 3.1.2). With no tag the summary has no `lang` attribute, as before. Existing calls need no change.

The card's name and summary now take their direction from their own words (`dir="auto"`), tagged or not: an Arabic or Hebrew summary in an English card runs right to left, with its full stop and a clamped summary's ellipsis at its end, and a Latin brand name in an Arabic card runs left to right. Their lines still start at the card's start, so text in the card's own direction draws as before.

The SwiftUI and Compose contracts gain the same field, and their result cards give VoiceOver and TalkBack both languages. **Native migration:** the SwiftUI and Compose `KozmosPOIResultCard` now draw `result.summary`, muted and two lines at most, after the location, which they did not before: a native card for a result that already passes `summary` is taller, so review native screenshot baselines and any layout that assumes a fixed row height, or leave `summary` unset to keep the old card. On Compose the row gives TalkBack its words as semantics text, never as a content description, and the texts drawn inside it are no longer read a second time: a product UI test that found a row with `onNodeWithContentDescription(...)` now finds it with `onNodeWithText(...)`, `substring = true` for one phrase.
