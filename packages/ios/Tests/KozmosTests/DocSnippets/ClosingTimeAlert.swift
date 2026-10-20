// Alert.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// KozmosAlertIcon draws its variant's symbol. The alert's own variant
// colours only its edge, so a warning passes .warning to both. It
// announces nothing: it is part of the page, as React's is by default.
struct ClosingTimeAlert: View {
    var body: some View {
        KozmosAlert {
            KozmosAlertIcon()
            KozmosAlertContent {
                KozmosAlertTitle("Heads up!")
                KozmosAlertDescription("The venue closes at 18:00 today.")
            }
        }
    }
}
