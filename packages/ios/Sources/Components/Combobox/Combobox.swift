import SwiftUI

public struct KozmosCombobox: View {
    @Binding public var value: String
    @Binding public var inputValue: String
    public let options: [KozmosListboxOption]
    public let label: String?
    public let placeholder: String
    public let disabled: Bool
    public let readOnly: Bool
    public let status: KozmosInputStatus
    public let error: Bool
    public let helperText: String?
    public let errorMessage: String?
    public let emptyText: String
    public let clearable: Bool
    public let clearLabel: String
    public let openLabel: String
    public let closeLabel: String
    /// Disable only when the host already filtered/ranked the supplied options.
    public let filterLocally: Bool

    @State private var isOpen: Bool

    public init(
        value: Binding<String> = .constant(""),
        inputValue: Binding<String> = .constant(""),
        options: [KozmosListboxOption],
        label: String? = nil,
        placeholder: String = "Select option",
        disabled: Bool = false,
        readOnly: Bool = false,
        status: KozmosInputStatus = .default,
        error: Bool = false,
        helperText: String? = nil,
        errorMessage: String? = nil,
        emptyText: String = "No results found",
        clearable: Bool = true,
        defaultOpen: Bool = false,
        clearLabel: String = "Clear selection",
        openLabel: String = "Open options",
        closeLabel: String = "Close options",
        filterLocally: Bool = true
    ) {
        self._value = value
        self._inputValue = inputValue
        self.options = options
        self.label = label
        self.placeholder = placeholder
        self.disabled = disabled
        self.readOnly = readOnly
        self.status = status
        self.error = error
        self.helperText = helperText
        self.errorMessage = errorMessage
        self.emptyText = emptyText
        self.clearable = clearable
        self.clearLabel = clearLabel; self.openLabel = openLabel; self.closeLabel = closeLabel
        self._isOpen = State(initialValue: defaultOpen)
        self.filterLocally = filterLocally
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label = label {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(labelColor)
            }

            HStack(spacing: 0) {
                TextField(placeholder, text: $inputValue)
                    .accessibilityLabel(label ?? placeholder)
                    .disabled(disabled || readOnly)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(textColor)
                    .padding(.leading, KozmosDimensions.primitivesLayoutSpacing150)
                    .frame(height: 44)
                    .onTapGesture {
                        if !disabled && !readOnly { isOpen = true }
                    }
                    .onChange(of: inputValue) { _ in
                        if !disabled && !readOnly { isOpen = true }
                    }

                if clearable && !inputValue.isEmpty && !disabled && !readOnly {
                    Button(action: clearSelection) {
                        Image(systemName: "xmark")
                            .font(.subheadline.weight(.semibold))
                            .frame(width: 44, height: 44)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .foregroundColor(KozmosColors.primitivesColorsForeground500)
                    .accessibilityLabel(clearLabel)
                }

                Button(action: toggleOpen) {
                    Image(systemName: "chevron.down")
                        .font(.subheadline.weight(.semibold))
                        .rotationEffect(.degrees(isOpen ? 180 : 0))
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(disabled || readOnly)
                .foregroundColor(KozmosColors.primitivesColorsForeground500)
                .accessibilityLabel(isOpen ? closeLabel : openLabel)
            }
            .frame(maxWidth: .infinity, minHeight: 44, maxHeight: 44)
            .background(fieldBackgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .stroke(fieldBorderColor, lineWidth: 1)
            )

            if isOpen {
                if filteredOptions.isEmpty {
                    Text(emptyText)
                        .font(KozmosTypography.subheadline)
                        .foregroundColor(KozmosColors.primitivesColorsForeground500)
                        .padding(KozmosDimensions.primitivesLayoutSpacing150)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(KozmosColors.primitivesColorsBackground0)
                        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                        .overlay(
                            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                                .stroke(KozmosColors.semanticsBorderInput, lineWidth: 1)
                        )
                } else {
                    KozmosListbox(
                        options: filteredOptions,
                        selectedValues: listboxSelection,
                        multiple: false,
                        disabled: disabled,
                        maxHeight: 256
                    ) { _, option in
                        inputValue = option.label
                        isOpen = false
                    }
                }
            }

            if let supportingText = supportingText, !supportingText.isEmpty {
                Text(supportingText)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(supportingTextColor)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    var filteredOptions: [KozmosListboxOption] {
        guard filterLocally else { return options }
        let query = inputValue.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !query.isEmpty else { return options }
        return options.filter { option in
            option.label.lowercased().contains(query)
                || option.value.lowercased().contains(query)
                || (option.description?.lowercased().contains(query) ?? false)
        }
    }

    private var listboxSelection: Binding<[String]> {
        Binding(get: { value.isEmpty ? [] : [value] }, set: { value = $0.first ?? "" })
    }

    private func toggleOpen() {
        guard !disabled, !readOnly else { return }
        isOpen.toggle()
    }

    private func clearSelection() {
        value = ""
        inputValue = ""
        isOpen = false
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
            return KozmosColors.primitivesColorsForeground500
        }
    }

    private var textColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        if effectiveStatus == .error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        return KozmosColors.primitivesColorsForeground0
    }
}
