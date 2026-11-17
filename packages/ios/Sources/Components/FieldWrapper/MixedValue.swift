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

extension View {
    /// Where VoiceOver goes back to after a reset: the control, held by
    /// `focused`. Set only when a reset is offered, so a control without one
    /// is the view it always was (an accessibility focus binding also keeps
    /// `ImageRenderer` from drawing the view at all).
    @ViewBuilder
    func kozmosResetFocus(_ focused: AccessibilityFocusState<Bool>.Binding, offered: Bool) -> some View {
        if offered {
            self.accessibilityFocused(focused)
        } else {
            self
        }
    }
}

/// The mixed mark (decisions 188 to 190): React's `Minus` icon at 16, a line
/// from 5 to 19 across the icon's 24, at its middle, stroked 2/24 of its
/// size with round caps. A mixed Checkbox draws it for its tick, a mixed
/// Switch in its track where the thumb was, a mixed ToggleButton before its
/// label. It frames itself at 16.
struct KozmosMixedDash: View {
    let color: Color

    var body: some View {
        KozmosMixedDashShape()
            .stroke(color, style: StrokeStyle(lineWidth: 4.0 / 3.0, lineCap: .round))
            .frame(width: 16, height: 16)
            .accessibilityHidden(true)
    }
}

struct KozmosMixedDashShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.minX + rect.width * 5 / 24, y: rect.midY))
        path.addLine(to: CGPoint(x: rect.minX + rect.width * 19 / 24, y: rect.midY))
        return path
    }

    /// A level line centred in its box reads the same either way.
    @available(iOS 17.0, macOS 14.0, macCatalyst 17.0, *)
    var layoutDirectionBehavior: LayoutDirectionBehavior { .fixed }
}
