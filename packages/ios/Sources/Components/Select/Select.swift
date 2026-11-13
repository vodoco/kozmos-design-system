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
    @AccessibilityFocusState private var fieldAccessibilityFocused: Bool

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
            .accessibilityFocused($fieldAccessibilityFocused)

            if KozmosMixedValue.showsReset(mixed: mixed, onReset: onResetMixed, disabled: disabled) {
                KozmosMixedReset(label: resetMixedLabel) {
                    // The reset goes as the field turns mixed again: VoiceOver
                    // goes to the field, which says its several values.
                    fieldAccessibilityFocused = true
                    onResetMixed?()
                }
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
        label: String? = nil,
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
                    value: value, placeholder: placeholder, label: label,
                    disabled: disabled, error: error, mixed: mixed, mixedLabel: mixedLabel
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
/// with foreground/500 words. `label`, as KozmosInput's, is drawn over the
/// field and names it: VoiceOver reads one element, the property's name, then
/// its value, the choice, the placeholder or the mixed label.
public struct KozmosSelectField: View {
    let value: String?
    let placeholder: String
    let label: String?
    let disabled: Bool
    let error: Bool
    let mixed: Bool
    let mixedLabel: String

    public init(
        value: String?,
        placeholder: String,
        label: String? = nil,
        disabled: Bool = false,
        error: Bool = false,
        mixed: Bool = false,
        mixedLabel: String = KozmosMixedValue.label
    ) {
        self.value = value
        self.placeholder = placeholder
        self.label = label
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
        // Named only when given a label: an empty name hides nothing VoiceOver
        // would say, but it is no name either.
        if let label {
            column.accessibilityLabel(label)
        } else {
            column
        }
    }

    private var column: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(
                        disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground100
                    )
            }
            field
        }
        .accessibilityElement(children: .ignore)
        .accessibilityValue(shownText)
    }

    private var field: some View {
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
                    error ? KozmosColors.primitivesColorsEmotionalDanger600 : KozmosColors.semanticsBorderInput,
                    lineWidth: 1
                )
        )
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

/// One option. With a `count` (GAP-164), the count is the menu item's
/// subtitle: the system menu draws only text and images, so it is the
/// number under the label, not a drawn Counter. VoiceOver reads it with the
/// label, "Gates, 12", where the menu alone reads a subtitle's item by its
/// title. The count is never part of `label`, so a trigger that shows the
/// chosen option's `label` does not repeat it. Unset, the option is drawn
/// and read as it always was.
///
/// The count is written once, in the reader's own number format, grouped
/// ("1,234" in English, "1.234" in German), and the drawn subtitle and the
/// spoken name both take that one string, as React and Compose do.
///
/// Chosen or not, an option with a count is the same item, a title and a
/// subtitle; only the checkmark, the item's image, comes and goes. The menu
/// starts the subtitle where it starts the title, so a count never moves
/// when the choice does.
public struct KozmosSelectItem: View {
    let value: String
    let label: String
    let count: Int?
    @Binding var selection: String
    @Environment(\.kozmosAnalytics) var trackEvent
    
    public init(value: String, label: String, count: Int? = nil, selection: Binding<String>) {
        self.value = value
        self.label = label
        self.count = count
        self._selection = selection
    }

    /// The count as it is drawn and read: locale-grouped.
    var countText: String? { count.map { $0.formatted() } }
    
    public var body: some View {
        Button(action: {
            trackEvent(KozmosAnalyticsEvent(eventName: "select_value_changed", component: "Select", properties: ["value": value]))
            selection = value
        }) {
            if let countText {
                // Not in an HStack: a menu keeps a stack's first Text and
                // drops the rest, where it draws a second Text as the
                // subtitle.
                Text(label)
                Text(countText)
                if selection == value {
                    Image(systemName: "checkmark")
                }
            } else {
                HStack {
                    Text(label)
                    if selection == value {
                        Image(systemName: "checkmark")
                    }
                }
            }
        }
        .modifier(KozmosSelectItemCountLabel(label: label, countText: countText))
    }
}

/// The label and count as one name, "Gates, 12", only where there is a
/// count: an option without one keeps the name the menu gives it.
private struct KozmosSelectItemCountLabel: ViewModifier {
    let label: String
    let countText: String?

    func body(content: Content) -> some View {
        if let countText {
            content.accessibilityLabel("\(label), \(countText)")
        } else {
            content
        }
    }
}
