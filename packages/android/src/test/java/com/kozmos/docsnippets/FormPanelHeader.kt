// Card.mdx's Compose snippet ("Title size"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.card.KozmosCard
import com.kozmos.components.card.KozmosCardContent
import com.kozmos.components.card.KozmosCardDescription
import com.kozmos.components.card.KozmosCardHeader
import com.kozmos.components.card.KozmosCardHeaderTone
import com.kozmos.components.card.KozmosCardPadding
import com.kozmos.components.card.KozmosCardTitle
import com.kozmos.components.card.KozmosCardTitleSize
import com.kozmos.components.text.KozmosText

@Composable
fun FormPanelHeader() {
    KozmosCard(padding = KozmosCardPadding.Compact) {
        KozmosCardHeader(tone = KozmosCardHeaderTone.Subtle) {
            KozmosCardTitle(title = "Add beacon")
            KozmosCardDescription(description = "Terminal A / Level 2")
        }
        KozmosCardContent {
            KozmosText(text = "The form")
        }
    }
    KozmosCard(padding = KozmosCardPadding.Compact) {
        KozmosCardHeader {
            KozmosCardTitle(title = "Lunch nearby", size = KozmosCardTitleSize.Sm)
        }
    }
}
