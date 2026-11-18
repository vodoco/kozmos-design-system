// DescriptionList.mdx's SwiftUI snippet ("Implementation"), word for word
// below this comment: compiled here, so a renamed or removed parameter fails
// in this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A unit's read-only view: each value under its label, with no field
// chrome. VoiceOver hears each item as its label, then its value.
struct UnitDetails: View {
    let copyFID: () -> Void

    var body: some View {
        KozmosDescriptionList {
            KozmosDescriptionListItem(label: "Name", value: "Bean & Leaf Café")
            KozmosDescriptionListItem(label: "Categories") {
                HStack {
                    KozmosBadge("Café", variant: .secondary)
                    KozmosBadge("Food", variant: .secondary)
                }
            }
            KozmosDescriptionListItem(label: "Featured", isOn: true)
            KozmosDescriptionListItem(label: "FID", value: "f-1042") {
                KozmosIconButton(iconName: "doc.on.doc", action: copyFID)
                    .accessibilityLabel("Copy FID")
            }
        }
    }
}
