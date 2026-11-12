import SwiftUI

/// A field that stands for several values at once (GAP-153): a property of a
/// multi-selection whose features differ. KozmosInput, KozmosNumberInput,
/// KozmosSelect and KozmosCombobox take it, as React's fields do.
///
/// It is the product's state, as the selection is: `mixed` says the field
/// still stands for the several values, and the field shows none of its own,
/// `mixedLabel` in its place as its placeholder, which VoiceOver reads with
/// the empty field, once: no value of Kozmos's is set over the field's own,
/// so an empty field that is not mixed keeps its placeholder too. The
/// visitor's first edit comes through the field's binding, and the product
/// then clears `mixed`, so the field keeps its mixed state until it is
/// edited. `onResetMixed`, given for a field whose values differ, offers
/// `resetMixedLabel` under the field once it is no longer mixed; pressed, it
/// calls back for the product to drop the edit and set `mixed` again.
public enum KozmosMixedValue {
    /// What a mixed field shows and says: "Multiple values".
    public static let label = "Multiple values"
    /// The reset's words: "Reset to multiple values".
    public static let resetLabel = "Reset to multiple values"

    /// Whether the reset is drawn: given, the field no longer mixed, and the
    /// field usable.
    static func showsReset(
        mixed: Bool, onReset: (() -> Void)?, disabled: Bool, readOnly: Bool = false
    ) -> Bool {
        onReset != nil && !mixed && !disabled && !readOnly
    }
}

/// The reset under a field that is no longer mixed, as React draws it: a
/// text button at the field's leading edge, in the theme's colour at medium
/// weight, the size of the field's supporting text.
struct KozmosMixedReset: View {
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(KozmosTypography.subheadline.weight(.medium))
                .foregroundColor(KozmosColors.primitivesColorsTheme600)
                .fixedSize(horizontal: false, vertical: true)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(.isButton)
    }
}
