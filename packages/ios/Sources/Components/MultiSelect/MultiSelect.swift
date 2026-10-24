import SwiftUI

public struct KozmosMultiSelect: View {
    @Binding public var selectedValues: [String]
    @Binding public var searchValue: String
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

    @State private var isOpen: Bool

    public init(
        selectedValues: Binding<[String]> = .constant([]),
        searchValue: Binding<String> = .constant(""),
        options: [KozmosListboxOption],
        label: String? = nil,
        placeholder: String = "Select options",
        disabled: Bool = false,
        readOnly: Bool = false,
        status: KozmosInputStatus = .default,
        error: Bool = false,
        helperText: String? = nil,
        errorMessage: String? = nil,
        emptyText: String = "No results found",
        clearable: Bool = true,
        defaultOpen: Bool = false
    ) {
        self._selectedValues = selectedValues
        self._searchValue = searchValue
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
        self._isOpen = State(initialValue: defaultOpen)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label = label {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(labelColor)
            }

            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
                if !selectedOptions.isEmpty {
                    KozmosChipGroup(spacing: KozmosDimensions.primitivesLayoutSpacing75) {
                        ForEach(selectedOptions) { option in
                            KozmosChip(
                                text: option.label,
                                size: .sm,
                                selected: true,
                                disabled: disabled || readOnly,
                                onRemove: { remove(option.value) }
                            )
                        }
                    }
                }

                HStack(spacing: 0) {
                    TextField(selectedValues.isEmpty ? placeholder : "", text: $searchValue)
                        .disabled(disabled || readOnly)
                        .font(KozmosTypography.subheadline)
                        .foregroundColor(textColor)
                        .frame(height: 36)
                        .onTapGesture {
                            if !disabled && !readOnly { isOpen = true }
                        }
                        .onChange(of: searchValue) { _ in
                            if !disabled && !readOnly { isOpen = true }
                        }

                    if clearable && !selectedValues.isEmpty && !disabled && !readOnly {
                        Button(action: clearSelection) {
                            Image(systemName: "xmark")
                                .font(.subheadline.weight(.semibold))
                                .frame(width: 36, height: 36)
                        }
                        .buttonStyle(.plain)
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                        .accessibilityLabel("Clear selected options")
                    }

                    Button(action: toggleOpen) {
                        Image(systemName: "chevron.down")
                            .font(.subheadline.weight(.semibold))
                            .rotationEffect(.degrees(isOpen ? 180 : 0))
                            .frame(width: 36, height: 36)
                    }
                    .buttonStyle(.plain)
                    .disabled(disabled || readOnly)
                    .foregroundColor(KozmosColors.primitivesColorsForeground400)
                    .accessibilityLabel(isOpen ? "Close options" : "Open options")
                }
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
            .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing75)
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
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
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
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
                        selectedValues: $selectedValues,
                        multiple: true,
                        disabled: disabled,
                        maxHeight: 256
                    ) { _, _ in
                        searchValue = ""
                        isOpen = true
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

    private var selectedOptions: [KozmosListboxOption] {
        selectedValues.compactMap { value in options.first { $0.value == value } }
    }

    private var filteredOptions: [KozmosListboxOption] {
        let query = searchValue.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !query.isEmpty else { return options }
        return options.filter { option in
            option.label.lowercased().contains(query)
                || option.value.lowercased().contains(query)
                || (option.description?.lowercased().contains(query) ?? false)
        }
    }

    private func remove(_ value: String) {
        selectedValues.removeAll { $0 == value }
    }

    private func clearSelection() {
        selectedValues = []
        searchValue = ""
        isOpen = false
    }

    private func toggleOpen() {
        guard !disabled, !readOnly else { return }
        isOpen.toggle()
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
}
