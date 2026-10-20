// Card.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The header, content and footer pad themselves by the card's padding:
// KozmosCard(padding: .compact) tightens all three.
struct TitledCard: View {
    var body: some View {
        KozmosCard {
            KozmosCardHeader {
                KozmosCardTitle("Card Title")
                KozmosCardDescription("Card Description")
            }
            KozmosCardContent {
                KozmosText("Card Content")
            }
            KozmosCardFooter {
                KozmosText("Card Footer")
            }
        }
    }
}
