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
        showSteppers: Bool = true
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

                TextField(
                    placeholder,
                    text: Binding(
                        get: { formatValue(value) },
                        set: { nextValue in value = parseValue(nextValue) }
                    )
                )
                .disabled(disabled || readOnly)
                .multilineTextAlignment(showSteppers ? .center : .leading)
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
                .frame(height: 44, alignment: .center)
                .background(fieldBackgroundColor)
                .overlay(
                    Rectangle()
                        .stroke(fieldBorderColor, lineWidth: 1)
                )
                .font(KozmosTypography.subheadline)
                .foregroundColor(textColor)

                if showSteppers {
                    stepButton(systemName: "plus", accessibilityLabel: "Increase value") {
                        applyStep(step)
                    }
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))

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
        .disabled(disabled || readOnly)
        .background(fieldBackgroundColor)
        .foregroundColor(stepperColor)
        .overlay(
            Rectangle()
                .stroke(fieldBorderColor, lineWidth: 1)
        )
        .accessibilityLabel(accessibilityLabel)
    }

    private func applyStep(_ delta: Double) {
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
        if disabled || readOnly { return KozmosColors.primitivesColorsForeground500 }
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
