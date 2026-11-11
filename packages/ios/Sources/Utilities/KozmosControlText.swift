import SwiftUI

/// The words beside a Checkbox, Switch or default Radio: the label, and under
/// it the description (GAP-162, decision 132), as React's control draws them
/// — the description in the field message's muted ink, foreground/400.
struct KozmosControlText: View {
    let label: String?
    let description: String?
    let labelColor: Color
    let disabled: Bool

    var body: some View {
        if label != nil || description != nil {
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                if let label = label {
                    Text(label)
                        .font(KozmosTypography.subheadline)
                        .foregroundColor(labelColor)
                }
                if let description = description {
                    KozmosControlDescriptionText(description, disabled: disabled)
                }
            }
            .fixedSize(horizontal: false, vertical: true)
        }
    }
}

/// A control's description line: footnote, foreground/400, foreground/500
/// when the control is disabled.
struct KozmosControlDescriptionText: View {
    let text: String
    let disabled: Bool
    var alignment: TextAlignment = .leading

    init(_ text: String, disabled: Bool, alignment: TextAlignment = .leading) {
        self.text = text
        self.disabled = disabled
        self.alignment = alignment
    }

    var body: some View {
        Text(text)
            .font(KozmosTypography.footnote)
            .foregroundColor(disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground400)
            .multilineTextAlignment(alignment)
    }
}

extension View {
    /// A control with a description is still one element named by its
    /// label: the description is its hint, as React's is its
    /// `aria-describedby`, and never part of the name. Without a
    /// description nothing changes, so the name stays what the control's
    /// words, or a caller's own `accessibilityLabel`, make it.
    /// `nameFromLabel` names it by the label even with no description: a
    /// switch drawing its state in words keeps those words out of its name.
    @ViewBuilder
    func kozmosControlDescription(label: String?, description: String?, nameFromLabel: Bool = false) -> some View {
        if let description = description {
            self
                .accessibilityLabel(Text(label ?? ""))
                .accessibilityHint(Text(description))
        } else if nameFromLabel, let label = label {
            self.accessibilityLabel(Text(label))
        } else {
            self
        }
    }
}
