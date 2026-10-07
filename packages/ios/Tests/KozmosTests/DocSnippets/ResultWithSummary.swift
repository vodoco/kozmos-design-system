// POIResultCard.mdx's SwiftUI snippet ("The name's language and the
// summary's"), word for word below this comment: compiled here, so a renamed
// or removed parameter fails in this target rather than in a reader's
// project. KozmosPOIResultCardDocSnippetTests draws it. Change the two
// together.
import SwiftUI
import Kozmos

// A result with the line the model wrote about it, in the language the visitor
// asked in. summaryLanguage is that language's BCP 47 tag, "es", or nil when
// it is the interface's.
struct ResultWithSummary: View {
    let poi: KozmosPOIPresentation
    // The result's number, counted from 1: the one its map marker shows.
    let number: Int
    let summary: String
    let summaryLanguage: String?
    let onSelect: (String) -> Void

    var body: some View {
        KozmosPOIResultCard(
            poi: poi,
            result: KozmosPOIResultPresentation(
                poiId: poi.id,
                resultIndex: number,
                summary: summary,
                // VoiceOver says the summary in this language's voice.
                summaryLanguage: summaryLanguage
            ),
            onSelect: onSelect
        )
    }
}
