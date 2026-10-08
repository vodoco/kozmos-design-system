import SwiftUI

public struct KozmosOTPInput: View {
    @Binding var value: String
    let length: Int
    let label: String?
    let disabled: Bool
    let readOnly: Bool
    let status: KozmosInputStatus
    let error: Bool
    let helperText: String?
    let errorMessage: String?
    @FocusState private var focusedField: Int?
    
    public init(
        length: Int = 6,
        value: Binding<String>,
        label: String? = nil,
        disabled: Bool = false,
        readOnly: Bool = false,
        status: KozmosInputStatus = .default,
        error: Bool = false,
        helperText: String? = nil,
        errorMessage: String? = nil
    ) {
        self._value = value
        self.length = max(length, 1)
        self.label = label
        self.disabled = disabled
        self.readOnly = readOnly
        self.status = status
        self.error = error
        self.helperText = helperText
        self.errorMessage = errorMessage
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label = label {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(labelColor)
            }

            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                ForEach(0..<length, id: \.self) { index in
                    textField(for: index)
                }
            }

            if let supportingText = supportingText, !supportingText.isEmpty {
                Text(supportingText)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(supportingTextColor)
            }
        }
    }
    
    @ViewBuilder
    private func textField(for index: Int) -> some View {
        #if os(iOS) || os(tvOS)
        TextField("", text: binding(for: index))
            .keyboardType(.numberPad)
            .multilineTextAlignment(.center)
            .disabled(disabled || readOnly)
            .frame(width: 44, height: 50)
            .background(cellBackgroundColor)
            .cornerRadius(KozmosDimensions.semanticsRadiusControl)
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .stroke(cellBorderColor(for: index), lineWidth: focusedField == index ? 2 : 1)
            )
            .font(.subheadline.weight(.semibold))
            .foregroundColor(textColor)
            .focused($focusedField, equals: index)
        #else
        TextField("", text: binding(for: index))
            .multilineTextAlignment(.center)
            .disabled(disabled || readOnly)
            .frame(width: 44, height: 50)
            .background(cellBackgroundColor)
            .cornerRadius(KozmosDimensions.semanticsRadiusControl)
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .stroke(cellBorderColor(for: index), lineWidth: focusedField == index ? 2 : 1)
            )
            .font(.subheadline.weight(.semibold))
            .foregroundColor(textColor)
            .focused($focusedField, equals: index)
        #endif
    }
    
    private func binding(for index: Int) -> Binding<String> {
        return Binding<String>(
            get: {
                if index < value.count {
                    let stringIndex = value.index(value.startIndex, offsetBy: index)
                    return String(value[stringIndex])
                } else {
                    return ""
                }
            },
            set: { userChar in
                guard !disabled && !readOnly else { return }

                if userChar.isEmpty {
                    if index < value.count {
                        let stringIndex = value.index(value.startIndex, offsetBy: index)
                        value.remove(at: stringIndex)
                    }
                    if index > 0 {
                        focusedField = index - 1
                    }
                    return
                }

                let filteredCharacters = userChar.filter(\.isNumber)
                let replacement = Array(filteredCharacters.prefix(length - min(index, length)))
                guard !replacement.isEmpty else { return }

                var characters = Array(value.prefix(length))
                if index < characters.count {
                    let endIndex = min(characters.count, index + replacement.count)
                    characters.replaceSubrange(index..<endIndex, with: replacement)
                } else if index == characters.count {
                    characters.append(contentsOf: replacement)
                }

                value = String(characters.prefix(length))
                focusedField = min(index + replacement.count, length - 1)
            }
        )
    }

    private var effectiveStatus: KozmosInputStatus {
        error ? .error : status
    }

    private var supportingText: String? {
        errorMessage ?? helperText
    }

    private var cellBackgroundColor: Color {
        (disabled || readOnly) ? KozmosColors.primitivesColorsBackground100 : KozmosColors.primitivesColorsBackground0
    }

    private func cellBorderColor(for index: Int) -> Color {
        // The focused cell's edge is a ring on a surface: theme 600, as
        // every focus ring is (decision 59).
        if focusedField == index && !disabled && !readOnly {
            return KozmosColors.primitivesColorsTheme600
        }

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
            return KozmosColors.primitivesColorsForeground500
        }
    }

    private var textColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
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
