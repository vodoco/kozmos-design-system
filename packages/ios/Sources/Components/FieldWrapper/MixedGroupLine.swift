import SwiftUI

/// What a mixed group of options draws under them (decisions 188 and 191): a
/// KozmosRadioGroup or KozmosSegmentedControl that stands for several values
/// shows `mixedLabel`, "Multiple values", in a field's helper text, the
/// subheadline in foreground/400. It is read after the options: an option
/// has no mixed state for VoiceOver to say.
struct KozmosMixedGroupLabel: View {
    let label: String

    init(_ label: String) {
        self.label = label
    }

    var body: some View {
        Text(label)
            .font(KozmosTypography.subheadline)
            .foregroundColor(KozmosColors.primitivesColorsForeground400)
            .fixedSize(horizontal: false, vertical: true)
    }
}
