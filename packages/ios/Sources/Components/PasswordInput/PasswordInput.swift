import SwiftUI

public struct KozmosPasswordInput: View {
    @Binding var text: String
    let label: String?
    let placeholder: String
    let disabled: Bool
    let readOnly: Bool
    let status: KozmosInputStatus
    let error: Bool
    let helperText: String?
    let errorMessage: String?
    let visible: Bool?
    let defaultVisible: Bool
    let showToggle: Bool
    let showPasswordLabel: String
    let hidePasswordLabel: String

    @State private var internalVisible: Bool

    public init(
        text: Binding<String>,
        label: String? = nil,
        placeholder: String = "",
        disabled: Bool = false,
        readOnly: Bool = false,
        status: KozmosInputStatus = .default,
        error: Bool = false,
        helperText: String? = nil,
        errorMessage: String? = nil,
        visible: Bool? = nil,
        defaultVisible: Bool = false,
        showToggle: Bool = true,
        showPasswordLabel: String = "Show password",
        hidePasswordLabel: String = "Hide password"
    ) {
        self._text = text
        self.label = label
        self.placeholder = placeholder
        self.disabled = disabled
        self.readOnly = readOnly
        self.status = status
        self.error = error
        self.helperText = helperText
        self.errorMessage = errorMessage
        self.visible = visible
        self.defaultVisible = defaultVisible
        self.showToggle = showToggle
        self.showPasswordLabel = showPasswordLabel
        self.hidePasswordLabel = hidePasswordLabel
        self._internalVisible = State(initialValue: defaultVisible)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label = label {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(labelColor)
            }

            HStack(spacing: 0) {
                Group {
                    if isVisible {
                        TextField(placeholder, text: $text)
                    } else {
                        SecureField(placeholder, text: $text)
                    }
                }
                .disabled(disabled || readOnly)
                .padding(.leading, KozmosDimensions.primitivesLayoutSpacing150)
                .padding(.trailing, showToggle ? 0 : KozmosDimensions.primitivesLayoutSpacing150)
                .frame(height: 44, alignment: .center)
                .font(KozmosTypography.subheadline)
                .foregroundColor(textColor)

                if showToggle {
                    Button(action: toggleVisibility) {
                        Image(systemName: isVisible ? "eye.slash" : "eye")
                            .font(.subheadline.weight(.semibold))
                            .frame(width: 44, height: 44)
                    }
                    .disabled(disabled || readOnly)
                    .foregroundColor(toggleColor)
                    .accessibilityLabel(isVisible ? hidePasswordLabel : showPasswordLabel)
                    .accessibilityAddTraits(isVisible ? .isSelected : [])
                }
            }
            .frame(maxWidth: .infinity, minHeight: 44, maxHeight: 44, alignment: .center)
            .background(fieldBackgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .stroke(fieldBorderColor, lineWidth: 1)
            )

            if let supportingText = supportingText, !supportingText.isEmpty {
                Text(supportingText)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(supportingTextColor)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var isVisible: Bool {
        visible ?? internalVisible
    }

    private func toggleVisibility() {
        guard visible == nil else { return }
        internalVisible.toggle()
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
        if effectiveStatus == .error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        return KozmosColors.primitivesColorsForeground0
    }

    private var toggleColor: Color {
        if disabled || readOnly { return KozmosColors.primitivesColorsForeground500 }
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
}
