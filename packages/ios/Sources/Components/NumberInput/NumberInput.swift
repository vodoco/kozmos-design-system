import SwiftUI

public struct KozmosNumberInput: View {
    @Binding var value: Double?
    let label: String?
    let placeholder: String
    let disabled: Bool
    let readOnly: Bool
    let status: KozmosInputStatus
    let error: Bool
    let helperText: String?
    let errorMessage: String?
    let step: Double
    let min: Double?
    let max: Double?
    let showSteppers: Bool
    /// The field stands for several values that differ, and shows none
    /// (GAP-153): `KozmosMixedValue` has the whole of it.
    let mixed: Bool
    let mixedLabel: String
    let onResetMixed: (() -> Void)?
    let resetMixedLabel: String
    @AccessibilityFocusState private var fieldAccessibilityFocused: Bool
    @FocusState private var fieldFocused: Bool
    /// What the visitor types into a mixed field, kept as typed until the
    /// field loses focus (GAP-153): formatted from the product's first value,
    /// a "-" or a "-0." still being typed would be dropped ("-5" became 5).
    @State private var draft: String?
    /// A unit drawn inside the field after the value ("m"), never part of the
    /// value (GAP-098).
    let unit: String?
    /// The unit's spoken name ("metres"), in the product's language; `unit`
    /// when left out. VoiceOver hears it after the value, once.
    let unitLabel: String?

    public init(
        value: Binding<Double?>,
        label: String? = nil,
        placeholder: String = "",
        disabled: Bool = false,
        readOnly: Bool = false,
        status: KozmosInputStatus = .default,
        error: Bool = false,
        helperText: String? = nil,
        errorMessage: String? = nil,
        step: Double = 1,
        min: Double? = nil,
        max: Double? = nil,
        showSteppers: Bool = true,
        mixed: Bool = false,
        mixedLabel: String = KozmosMixedValue.label,
        onResetMixed: (() -> Void)? = nil,
        resetMixedLabel: String = KozmosMixedValue.resetLabel,
        unit: String? = nil,
        unitLabel: String? = nil
    ) {
        self._value = value
        self.label = label
        self.placeholder = placeholder
        self.disabled = disabled
        self.readOnly = readOnly
        self.status = status
        self.error = error
        self.helperText = helperText
        self.errorMessage = errorMessage
        self.step = step
        self.min = min
        self.max = max
        self.showSteppers = showSteppers
        self.mixed = mixed
        self.mixedLabel = mixedLabel
        self.onResetMixed = onResetMixed
        self.resetMixedLabel = resetMixedLabel
        self.unit = unit
        self.unitLabel = unitLabel
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label = label {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(labelColor)
            }

            HStack(spacing: 0) {
                if showSteppers {
                    stepButton(systemName: "minus", accessibilityLabel: "Decrease value") {
                        applyStep(-step)
                    }
                }

                // The unit sits inside the field's box, at its trailing end,
                // after the value: the text keeps clear of it at any length,
                // and it mirrors with the layout in right-to-left.
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                    TextField(
                        mixed ? mixedLabel : placeholder,
                        text: Binding(
                            // Mixed, it shows none of its own (GAP-153); the
                            // unit stays, to say what to type.
                            get: { draft ?? (mixed ? "" : formatValue(value)) },
                            set: { nextValue in
                                if let typed = Self.draftValue(nextValue, mixed: mixed, drafting: draft != nil) {
                                    draft = nextValue
                                    // A number, reported; "-", "." or "-." report nothing.
                                    if let number = typed { value = clamp(number) }
                                } else {
                                    value = parseValue(nextValue)
                                }
                            }
                        )
                    )
                    .focused($fieldFocused)
                    .onChange(of: fieldFocused) { focused in
                        if !focused { draft = nil }
                    }
                    .onChange(of: mixed) { nowMixed in
                        // Back to mixed (a reset): the typed text is gone.
                        if nowMixed { draft = nil }
                    }
                    .accessibilityFocused($fieldAccessibilityFocused)
                    .disabled(disabled || readOnly)
                    .multilineTextAlignment(showSteppers ? .center : .leading)
                    .foregroundColor(textColor)
                    .modifier(KozmosSpokenValue(hasUnit: hasUnit, value: spokenValue ?? ""))

                    if hasUnit, let unit {
                        Text(unit)
                            .foregroundColor(unitColor)
                            .lineLimit(1)
                            .fixedSize()
                            // Heard with the value, on the field: said here
                            // too, it is said twice.
                            .accessibilityHidden(true)
                    }
                }
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
                .frame(height: 44, alignment: .center)
                .background(fieldBackgroundColor)
                .overlay(
                    Rectangle()
                        .stroke(fieldBorderColor, lineWidth: 1)
                )
                .font(KozmosTypography.subheadline)

                if showSteppers {
                    stepButton(systemName: "plus", accessibilityLabel: "Increase value") {
                        applyStep(step)
                    }
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))

            if KozmosMixedValue.showsReset(mixed: mixed, onReset: onResetMixed, disabled: disabled, readOnly: readOnly) {
                KozmosMixedReset(label: resetMixedLabel) {
                    fieldAccessibilityFocused = true
                    onResetMixed?()
                }
            }

            if let supportingText = supportingText, !supportingText.isEmpty {
                Text(supportingText)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(supportingTextColor)
            }
        }
    }

    private func stepButton(
        systemName: String,
        accessibilityLabel: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.subheadline.weight(.semibold))
                .frame(width: 44, height: 44)
        }
        .disabled(steppersDisabled)
        .background(fieldBackgroundColor)
        .foregroundColor(stepperColor)
        .overlay(
            Rectangle()
                .stroke(fieldBorderColor, lineWidth: 1)
        )
        .accessibilityLabel(accessibilityLabel)
    }

    /// Mixed (GAP-153), a step would start from nothing and write that number
    /// over every selected feature's own: the steppers wait for a typed edit.
    var steppersDisabled: Bool { disabled || readOnly || mixed || draft != nil }

    /// While mixed, or while the text typed out of mixed is kept: `.some` of
    /// the number the text is, or `.some(nil)` for text that is no number
    /// yet (reported as nothing). `nil` when the field is not drafting.
    static func draftValue(_ text: String, mixed: Bool, drafting: Bool) -> Double??
    {
        guard mixed || drafting else { return nil }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let number = Double(trimmed), number.isFinite else { return .some(nil) }
        return .some(number)
    }

    private func applyStep(_ delta: Double) {
        guard !steppersDisabled else { return }
        let base = value ?? 0
        value = clamp(base + delta)
    }

    private func parseValue(_ text: String) -> Double? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, let nextValue = Double(trimmed) else {
            return nil
        }
        return clamp(nextValue)
    }

    private func clamp(_ nextValue: Double) -> Double {
        var clampedValue = nextValue
        if let min = min {
            clampedValue = Swift.max(clampedValue, min)
        }
        if let max = max {
            clampedValue = Swift.min(clampedValue, max)
        }
        return clampedValue
    }

    private func formatValue(_ currentValue: Double?) -> String {
        guard let currentValue = currentValue else { return "" }
        if currentValue.truncatingRemainder(dividingBy: 1) == 0 {
            return String(Int(currentValue))
        }
        return String(currentValue)
    }

    /// What VoiceOver hears as the field's value: the value, then the unit's
    /// spoken name. Nil keeps the field's own value (none, or no unit).
    var spokenValue: String? {
        guard hasUnit, let unit else { return nil }
        // Mixed, the value said over the field is the mixed label, then the
        // unit: never the hidden value, and never empty over the placeholder.
        if mixed { return "\(mixedLabel), \(unitLabel ?? unit)" }
        guard let value else { return nil }
        return "\(formatValue(value)) \(unitLabel ?? unit)"
    }

    private var hasUnit: Bool { !(unit ?? "").isEmpty }

    private var unitColor: Color {
        disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground400
    }

    private var effectiveStatus: KozmosInputStatus {
        error ? .error : status
    }

    private var supportingText: String? {
        errorMessage ?? helperText
    }

    private var fieldBackgroundColor: Color {
        (disabled || readOnly) ? KozmosColors.primitivesColorsBackground100 : KozmosColors.primitivesColorsBackground0
    }

    private var fieldBorderColor: Color {
        switch effectiveStatus {
        case .error:
            return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning:
            return KozmosColors.primitivesColorsEmotionalAlert600
        case .success:
            return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default:
            return KozmosColors.primitivesColorsForeground500
        }
    }

    private var labelColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        switch effectiveStatus {
        case .error:
            return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning:
            return KozmosColors.primitivesColorsEmotionalAlert600
        case .success:
            return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default:
            return KozmosColors.primitivesColorsForeground100
        }
    }

    private var supportingTextColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        switch effectiveStatus {
        case .error:
            return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning:
            return KozmosColors.primitivesColorsEmotionalAlert600
        case .success:
            return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default:
            return KozmosColors.primitivesColorsForeground400
        }
    }

    private var textColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        return KozmosColors.primitivesColorsForeground0
    }

    private var stepperColor: Color {
        if steppersDisabled { return KozmosColors.primitivesColorsForeground500 }
        switch effectiveStatus {
        case .error:
            return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning:
            return KozmosColors.primitivesColorsEmotionalAlert600
        case .success:
            return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default:
            return KozmosColors.primitivesColorsForeground0
        }
    }
}

/// The field's spoken value with its unit. Keyed on the unit, which a
/// product sets once, never on the value: a branch that changed as the
/// visitor typed would make the field a new view and drop its focus.
private struct KozmosSpokenValue: ViewModifier {
    let hasUnit: Bool
    let value: String

    func body(content: Content) -> some View {
        if hasUnit {
            content.accessibilityValue(Text(value))
        } else {
            content
        }
    }
}
