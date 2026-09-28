import SwiftUI

public struct KozmosFeedbackCard: View {
    @Environment(\.kozmosAnalytics) private var trackEvent

    private let title: String
    private let description: String
    private let isSubmitting: Bool
    private let successMessage: String
    private let surface: KozmosSurfaceStyle
    private let onSubmitFeedback: ((Int, String) -> Void)?

    @State private var rating: Int
    @State private var comment: String
    @State private var submitted: Bool

    /// `surface` is what the card is made of, as React's `surface` prop: `.solid`
    /// (the default) or `.glass`, for a card over the map. Until 2026-09-22
    /// SwiftUI drew it solid only.
    public init(
        title: String = "Rate your experience",
        description: String = "How was your navigation today?",
        isSubmitting: Bool = false,
        successMessage: String = "Thank you for the feedback!",
        initialRating: Int = 0,
        initialComment: String = "",
        surface: KozmosSurfaceStyle = .solid,
        onSubmitFeedback: ((Int, String) -> Void)? = nil
    ) {
        self.surface = surface
        self.title = title
        self.description = description
        self.isSubmitting = isSubmitting
        self.successMessage = successMessage
        self.onSubmitFeedback = onSubmitFeedback
        self._rating = State(initialValue: initialRating)
        self._comment = State(initialValue: initialComment)
        self._submitted = State(initialValue: false)
    }

    public var body: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            if submitted {
                VStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 44, weight: .semibold))
                        .foregroundColor(KozmosColors.primitivesColorsEmotionalSuccess600)

                    Text(successMessage)
                        .font(.headline.weight(.semibold))
                        .foregroundColor(KozmosColors.primitivesColorsForeground100)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity, minHeight: 148)
            } else {
                VStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                    Text(title)
                        .font(.headline.weight(.semibold))
                        .foregroundColor(KozmosColors.primitivesColorsForeground100)

                    // Muted, and on glass the foreground colour (decision
                    // 48): the card's surface says which.
                    Text(description)
                        .font(KozmosTypography.subheadline)
                        .kozmosMutedText()
                        .multilineTextAlignment(.center)
                }

                KozmosRating(value: $rating)

                // Washed, as React's comment box is, not the outlined text
                // area: it was the standard one until 2026-09-22.
                KozmosWashedField(text: $comment, placeholder: "Tell us more about your experience...", multiline: true)
                    .frame(minHeight: 96)

                KozmosButton(
                    isSubmitting ? "Submitting..." : "Submit Feedback",
                    isDisabled: rating == 0 || isSubmitting
                ) {
                    trackEvent(KozmosAnalyticsEvent(eventName: "feedback_submitted", component: "FeedbackCard", properties: ["rating": String(rating)]))
                    onSubmitFeedback?(rating, comment)
                    submitted = true
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing300)
        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous))
        // The solid surface React's card sits on by default: the background
        // with the subtle border. It was the background at 90 % under a
        // near-black hairline at 8 % until 2026-09-22.
        .kozmosSurface(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous), style: surface)
        .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
    }
}
