import SwiftUI

/// What a rating is measured on.
///
/// `stars` is an ordinal scale: choosing four means "at least four", so four
/// fill. `thumbs` is a choice between two, and exactly the one chosen fills —
/// a thumbs-up is not "two thumbs". The value is a number either way:
/// **0 is unanswered, 1 is down, 2 is up**, the same "1 is the lowest" rule
/// the stars follow.
public enum KozmosRatingVariant: Sendable, Hashable, CaseIterable {
    case stars
    case thumbs
}

/// Mirrors the React `Rating` and Compose's `KozmosRating`.
///
/// Every option is a Button. It was an `Image` with `.onTapGesture`, which
/// VoiceOver cannot activate and does not announce: the rating was invisible
/// to it, and unreachable by Switch Control and a keyboard.
public struct KozmosRating: View {
    @Binding var value: Int
    let variant: KozmosRatingVariant
    let max: Int
    let readOnly: Bool
    let label: String
    let itemLabel: (Int, Int, KozmosRatingVariant) -> String
    let valueLabel: (Int, Int, KozmosRatingVariant) -> String

    public init(
        value: Binding<Int>,
        variant: KozmosRatingVariant = .stars,
        max: Int = 5,
        readOnly: Bool = false,
        label: String = "Rating",
        itemLabel: @escaping (Int, Int, KozmosRatingVariant) -> String = KozmosRating.defaultItemLabel,
        valueLabel: @escaping (Int, Int, KozmosRatingVariant) -> String = KozmosRating.defaultValueLabel
    ) {
        self._value = value
        self.variant = variant
        self.max = variant == .thumbs ? 2 : max
        self.readOnly = readOnly
        self.label = label
        self.itemLabel = itemLabel
        self.valueLabel = valueLabel
    }

    public static func defaultItemLabel(_ item: Int, _ max: Int, _ variant: KozmosRatingVariant) -> String {
        variant == .thumbs ? (item == 1 ? "Poor" : "Good") : "Rate \(item) out of \(max) stars"
    }

    public static func defaultValueLabel(_ value: Int, _ max: Int, _ variant: KozmosRatingVariant) -> String {
        if value == 0 { return "Not rated" }
        return variant == .thumbs
            ? (value == 1 ? "Rated poor" : "Rated good")
            : "Rated \(value) out of \(max) stars"
    }

    private func filled(_ item: Int) -> Bool {
        variant == .thumbs ? item == value : item <= value
    }

    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            ForEach(1...max, id: \.self) { item in
                if readOnly {
                    face(item)
                } else {
                    Button {
                        // Choosing what is already chosen clears it, so a
                        // visitor who taps the wrong thumb can undo it without
                        // dismissing the whole dialog.
                        withAnimation { value = (item == value) ? 0 : item }
                    } label: {
                        face(item)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(itemLabel(item, max, variant))
                    .accessibilityAddTraits(item == value ? [.isButton, .isSelected] : .isButton)
                }
            }
        }
        // Read-only is not a control: it reads as one image with the rating as
        // its label, rather than as a row of things that cannot be pressed.
        .accessibilityElement(children: readOnly ? .ignore : .contain)
        .accessibilityLabel(readOnly ? valueLabel(value, max, variant) : label)
    }

    @ViewBuilder private func face(_ item: Int) -> some View {
        switch variant {
        case .stars:
            Image(systemName: filled(item) ? "star.fill" : "star")
                .foregroundColor(
                    filled(item)
                        ? KozmosColors.semanticsDataYellow
                        : KozmosColors.primitivesColorsForeground400
                )
                .font(KozmosTypography.title2)
        case .thumbs:
            Image(systemName: item == 1 ? "hand.thumbsdown" : "hand.thumbsup")
                .font(KozmosTypography.title3)
                .foregroundColor(
                    filled(item)
                        ? KozmosColors.primitivesColorsTheme600
                        : KozmosColors.primitivesColorsForeground400
                )
                .frame(width: 40, height: 40)
                .background(
                    Circle().fill(
                        filled(item)
                            ? KozmosColors.primitivesColorsTheme0
                            : KozmosColors.primitivesColorsBackground100
                    )
                )
                .overlay(
                    Circle().stroke(
                        filled(item) ? KozmosColors.primitivesColorsTheme600 : .clear,
                        lineWidth: 2
                    )
                )
                // 44 is the target even though the circle is 40.
                .frame(width: 44, height: 44)
        }
    }
}
