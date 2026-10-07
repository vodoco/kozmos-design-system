---
"@kozmos-ds/product-contracts": minor
"@kozmos-ds/react": minor
---

Add optional `POIResultPresentation.summaryLanguage`, the BCP 47 tag for the language a result's summary is written in, when it differs from the interface language (GAP-125). The model writes the summary in the query's language, so a visitor who asks in Spanish on an English device gets a Spanish summary among English labels. POIResultCard sets it as the summary's `lang`, as it does `nameLanguage` on the name, in a card on its own, in POIResultList and in POIResultGroup, so a screen reader says the summary in its own language's voice (WCAG 3.1.2). With no tag the summary has no `lang` attribute, as before. Existing calls need no change. The SwiftUI and Compose contracts gain the same field, and their result cards now draw the summary and give VoiceOver and TalkBack both languages.
