// Card.mdx's SwiftUI snippet ("Title size"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct FormPanelHeader: View {
    var body: some View {
        KozmosCard(padding: .compact) {
            KozmosCardHeader(tone: .subtle) {
                KozmosCardTitle("Add beacon")
                KozmosCardDescription("Terminal A / Level 2")
            }
            KozmosCardContent {
                KozmosText("The form")
            }
        }
        KozmosCard(padding: .compact) {
            KozmosCardHeader {
                KozmosCardTitle("Lunch nearby", size: .sm)
            }
        }
    }
}
