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
    /// A read-only score that need not be whole, from `init(rating:)`; nil
    /// for the control.
    let rating: Double?
    let ratingLabel: (Double, Int) -> String

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
        self.rating = nil
        self.ratingLabel = KozmosRating.defaultRatingLabel
    }

    /// A read-only star rating of a score that need not be whole, an average
    /// of reviews: it is drawn to the nearest half (decision 181), 4.3 as 4.5,
    /// 4.2 as 4 and 4.25 as 4.5, and VoiceOver hears the rounded value,
    /// "Rated 4.5 out of 5 stars". Editing stays whole stars:
    /// `init(value:)` is the control.
    public init(
        rating: Double,
        max: Int = 5,
        label: String = "Rating",
        valueLabel: @escaping (Double, Int) -> String = KozmosRating.defaultRatingLabel
    ) {
        self._value = .constant(0)
        self.variant = .stars
        self.max = max
        self.readOnly = true
        self.label = label
        self.itemLabel = KozmosRating.defaultItemLabel
        self.valueLabel = KozmosRating.defaultValueLabel
        self.rating = rating
        self.ratingLabel = valueLabel
    }

    /// A score to the nearest half: the doubled value rounded half up, as
    /// React's `Math.round(value * 2) / 2` and Compose's are.
    public static func roundedToHalf(_ value: Double) -> Double {
        (value * 2 + 0.5).rounded(.down) / 2
    }

    /// How `init(rating:)` reads, given the rounded value: "Rated 4.5 out of
    /// 5 stars", or "Rated 4 out of 5 stars" when it is whole.
    public static func defaultRatingLabel(_ value: Double, _ max: Int) -> String {
        if value == 0 { return "Not rated" }
        return "Rated \(String(format: "%g", value)) out of \(max) stars"
    }

    /// The value the stars draw: a read-only score to the nearest half, the
    /// control's whole value as it is.
    var shown: Double {
        if let rating { return KozmosRating.roundedToHalf(rating) }
        return Double(value)
    }

    /// What VoiceOver hears for the whole row.
    var accessibilityText: String {
        if rating != nil { return ratingLabel(shown, max) }
        return readOnly ? valueLabel(value, max, variant) : label
    }

    /// Whether a star is filled only to its middle: a read-only score's half.
    func isHalf(_ item: Int) -> Bool {
        variant == .stars && Double(item) - 0.5 == shown
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
        variant == .thumbs ? item == value : Double(item) <= shown
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
        .accessibilityLabel(accessibilityText)
    }

    @ViewBuilder private func face(_ item: Int) -> some View {
        switch variant {
        case .stars where isHalf(item):
            // The empty star, and the filled one over it masked to its leading
            // half: an HStack lays out in the writing direction, so the mask
            // keeps the left half left to right and the right half right to
            // left. Same glyphs, size and colours as a full and an empty star.
            Image(systemName: "star")
                .foregroundColor(KozmosColors.primitivesColorsForeground400)
                .font(KozmosTypography.title2)
                .overlay(
                    Image(systemName: "star.fill")
                        .foregroundColor(KozmosColors.semanticsDataYellow)
                        .font(KozmosTypography.title2)
                        .mask(HStack(spacing: 0) { Rectangle(); Color.clear })
                )
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
                // 44 is the target even though the circle is 40, as React's
                // 44px button round its 40px face: without a content shape
                // the frame added nothing, and the target was the circle.
                .frame(width: 44, height: 44)
                .contentShape(Circle())
        }
    }
}
