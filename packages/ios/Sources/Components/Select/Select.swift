import SwiftUI

public struct KozmosSelect<Trigger: View, Content: View>: View {
    let trigger: Trigger
    let content: Content
    /// The field stands for several values that differ (GAP-153). The
    /// trigger draws it (KozmosSelectField does); the Select offers the
    /// reset under it once it is no longer mixed.
    let mixed: Bool
    let disabled: Bool
    let onResetMixed: (() -> Void)?
    let resetMixedLabel: String

    public init(
        mixed: Bool = false,
        disabled: Bool = false,
        onResetMixed: (() -> Void)? = nil,
        resetMixedLabel: String = KozmosMixedValue.resetLabel,
        @ViewBuilder trigger: () -> Trigger,
        @ViewBuilder content: () -> Content
    ) {
        self.trigger = trigger()
        self.content = content()
        self.mixed = mixed
        self.disabled = disabled
        self.onResetMixed = onResetMixed
        self.resetMixedLabel = resetMixedLabel
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            Menu {
                content
            } label: {
                trigger
            }
            .disabled(disabled)

            if KozmosMixedValue.showsReset(mixed: mixed, onReset: onResetMixed, disabled: disabled) {
                KozmosMixedReset(label: resetMixedLabel) { onResetMixed?() }
            }
        }
    }
}

public extension KozmosSelect where Trigger == KozmosSelectField {
    /// A Select whose trigger is the closed field, as React's `SelectTrigger`
    /// and Compose's `KozmosSelectTrigger` draw it: the choice's words, or
    /// the placeholder until there is one, or, mixed, the mixed label.
    init(
        value: String?,
        placeholder: String,
        disabled: Bool = false,
        error: Bool = false,
        mixed: Bool = false,
        mixedLabel: String = KozmosMixedValue.label,
        onResetMixed: (() -> Void)? = nil,
        resetMixedLabel: String = KozmosMixedValue.resetLabel,
        @ViewBuilder content: () -> Content
    ) {
        self.init(
            mixed: mixed,
            disabled: disabled,
            onResetMixed: onResetMixed,
            resetMixedLabel: resetMixedLabel,
            trigger: {
                KozmosSelectField(
                    value: value, placeholder: placeholder, disabled: disabled,
                    error: error, mixed: mixed, mixedLabel: mixedLabel
                )
            },
            content: content
        )
    }
}

/// The closed field a KozmosSelect opens from: Figma's Select, which is its
/// Text-Input with a caret. 44 high with the control radius, the input
/// border on background/0, 12 in at each end; the choice in the field's
/// words, or the placeholder in foreground/400 until there is one, or, mixed
/// (GAP-153), the mixed label in the placeholder's colour; a chevron at the
/// end. In error it is edged in danger/600; disabled, it is background/100
/// with foreground/500 words. VoiceOver reads it as one element whose value
/// is the choice, the placeholder or the mixed label.
public struct KozmosSelectField: View {
    let value: String?
    let placeholder: String
    let disabled: Bool
    let error: Bool
    let mixed: Bool
    let mixedLabel: String

    public init(
        value: String?,
        placeholder: String,
        disabled: Bool = false,
        error: Bool = false,
        mixed: Bool = false,
        mixedLabel: String = KozmosMixedValue.label
    ) {
        self.value = value
        self.placeholder = placeholder
        self.disabled = disabled
        self.error = error
        self.mixed = mixed
        self.mixedLabel = mixedLabel
    }

    /// The words the field shows: mixed, the mixed label; else the choice,
    /// or the placeholder until there is one.
    var shownText: String {
        mixed ? mixedLabel : (value ?? placeholder)
    }

    /// Whether the words are the placeholder's, not a choice.
    var showsPlaceholder: Bool { mixed || value == nil }

    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            Text(shownText)
                .font(KozmosTypography.subheadline)
                .foregroundColor(textColor)
                .lineLimit(1)
                .frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: "chevron.down")
                .font(.footnote.weight(.semibold))
                .foregroundColor(placeholderColor)
                .accessibilityHidden(true)
        }
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
        .frame(height: 44)
        .background(
            disabled ? KozmosColors.primitivesColorsBackground100 : KozmosColors.primitivesColorsBackground0
        )
        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(
                    error ? KozmosColors.primitivesColorsEmotionalDanger600 : KozmosColors.primitivesColorsForeground500,
                    lineWidth: 1
                )
        )
        .accessibilityElement(children: .ignore)
        .accessibilityValue(shownText)
    }

    private var placeholderColor: Color {
        disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground400
    }

    private var textColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        if showsPlaceholder { return KozmosColors.primitivesColorsForeground400 }
        return error ? KozmosColors.primitivesColorsEmotionalDanger600 : KozmosColors.primitivesColorsForeground0
    }
}

public struct KozmosSelectItem: View {
    let value: String
    let label: String
    @Binding var selection: String
    @Environment(\.kozmosAnalytics) var trackEvent

    public init(value: String, label: String, selection: Binding<String>) {
        self.value = value
        self.label = label
        self._selection = selection
    }

    public var body: some View {
        Button(action: {
            trackEvent(KozmosAnalyticsEvent(eventName: "select_value_changed", component: "Select", properties: ["value": value]))
            selection = value
        }) {
            HStack {
                Text(label)
                if selection == value {
                    Image(systemName: "checkmark")
                }
            }
        }
    }
}
