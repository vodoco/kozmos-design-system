// POIResultCard.mdx's Compose snippet ("The name's language and the
// summary's"), word for word below the package line: compiled here, so a
// renamed or removed parameter fails in this target rather than in a reader's
// project. POIResultCardDocSnippetTest draws it. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.poiresultcard.KozmosPOIResultCard
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation

// A result with the line the model wrote about it, in the language the visitor
// asked in. summaryLanguage is that language's BCP 47 tag, "es", or null when
// it is the interface's.
@Composable
fun ResultWithSummary(
    poi: KozmosPOIPresentation,
    // The result's number, counted from 1: the one its map marker shows.
    number: Int,
    summary: String,
    summaryLanguage: String?,
    onSelect: (String) -> Unit
) {
    KozmosPOIResultCard(
        poi = poi,
        result = KozmosPOIResultPresentation(
            poiId = poi.id,
            resultIndex = number,
            summary = summary,
            // TalkBack says the summary in this language's voice.
            summaryLanguage = summaryLanguage
        ),
        onSelect = onSelect
    )
}
