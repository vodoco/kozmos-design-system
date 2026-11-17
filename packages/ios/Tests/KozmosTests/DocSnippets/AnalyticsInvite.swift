// Dialog.mdx's SwiftUI snippet ("Media above the title"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// An illustration above the title, out to the dialog's edges and top corners.
// Left unnamed it is decorative; media(label:) names it as one image.
struct AnalyticsInvite: View {
    @State private var isPresented = true

    var body: some View {
        KozmosDialog(
            isPresented: $isPresented,
            title: "Interested in Analytics?",
            description: "See how people move through your buildings, floor by floor.",
            primaryActionTitle: "Contact sales",
            onPrimaryAction: { isPresented = false }
        )
        .media(bleeds: true) {
            Image("AnalyticsIllustration")
                .resizable()
                .scaledToFill()
                .frame(height: 160)
                .clipped()
        }
    }
}
