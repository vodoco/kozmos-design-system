// Card.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.card.KozmosCard
import com.kozmos.components.card.KozmosCardContent
import com.kozmos.components.card.KozmosCardDescription
import com.kozmos.components.card.KozmosCardFooter
import com.kozmos.components.card.KozmosCardHeader
import com.kozmos.components.card.KozmosCardTitle
import com.kozmos.components.text.KozmosText

// The header, content and footer pad themselves by the card's padding:
// KozmosCard(padding = KozmosCardPadding.Compact) tightens all three.
@Composable
fun TitledCard() {
    KozmosCard {
        KozmosCardHeader {
            KozmosCardTitle(title = "Card Title")
            KozmosCardDescription(description = "Card Description")
        }
        KozmosCardContent {
            KozmosText(text = "Card Content")
        }
        KozmosCardFooter {
            KozmosText(text = "Card Footer")
        }
    }
}
