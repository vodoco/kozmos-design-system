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
    public let popupActions: [KozmosPickerAction]
    private let expanded: Binding<Bool>?

    @State private var internalOpen: Bool
    @FocusState private var inputFocused: Bool
    @AccessibilityFocusState private var inputAccessibilityFocused: Bool
    /// Whether the field had keyboard focus while the popup was open: only
    /// then does a command hand it back.
    @State private var restoresInputFocus = false
    private var isOpen: Bool { (expanded?.wrappedValue ?? internalOpen) && !disabled && !readOnly }
    private func setOpen(_ next: Bool) {
        if let expanded { expanded.wrappedValue = next } else { internalOpen = next }
    }

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
        filterLocally: Bool = true,
        popupActions: [KozmosPickerAction] = [],
        expanded: Binding<Bool>? = nil
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
        self._internalOpen = State(initialValue: defaultOpen)
        self.filterLocally = filterLocally
        self.popupActions = popupActions; self.expanded = expanded
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label = label {
                // The field carries this name; heard here too, it is said twice.
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(labelColor)
                    .accessibilityHidden(true)
            }

            HStack(spacing: 0) {
                TextField(placeholder, text: editableInput)
                    .focused($inputFocused)
                    .accessibilityFocused($inputAccessibilityFocused)
                    .accessibilityLabel(label ?? placeholder)
                    .disabled(disabled || readOnly)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(textColor)
                    .padding(.leading, KozmosDimensions.primitivesLayoutSpacing150)
                    .frame(height: 44)
                    .onTapGesture {
                        if !disabled && !readOnly { setOpen(true) }
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
                if filteredOptions.isEmpty && popupActions.isEmpty {
                    if emptyText != supportingText {
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
                    }
                } else {
                    KozmosListbox(
                        options: filteredOptions,
                        selectedValues: listboxSelection,
                        multiple: false,
                        disabled: disabled || readOnly,
                        maxHeight: 256,
                        actions: popupActions.map { action in
                            KozmosPickerAction(id: action.id, label: action.label, disabled: action.disabled) {
                                guard !disabled, !readOnly, !action.disabled else { return }
                                // Focusing a field that did not have focus raises the keyboard
                                // over the map a command may be sending the visitor to.
                                if restoresInputFocus { inputFocused = true }
                                inputAccessibilityFocused = true
                                setOpen(false)
                                action.action()
                            }
                        },
                        emptyText: emptyText == supportingText ? nil : emptyText
                    ) { _, option in
                        guard !disabled, !readOnly, !option.disabled else { return }
                        inputValue = option.label
                        setOpen(false)
                    }
                }
            }

            if let supportingText = supportingText, !supportingText.isEmpty {
                Text(supportingText)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(supportingTextColor)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onChange(of: isOpen) { open in
            if open { restoresInputFocus = inputFocused }
        }
        .onChange(of: inputFocused) { focused in
            if focused && isOpen { restoresInputFocus = true }
        }
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

    // UIKit may write the unchanged text while focus moves away. Commands must
    // not look like a new host search request merely because they close a picker.
    // Open only for user edits, not host updates after selection or a command.
    private var editableInput: Binding<String> {
        Binding(get: { inputValue }, set: { next in
            guard !disabled, !readOnly, next != inputValue else { return }
            inputValue = next
            setOpen(true)
        })
    }

    private var listboxSelection: Binding<[String]> {
        Binding(get: { value.isEmpty ? [] : [value] }, set: {
            guard !disabled, !readOnly else { return }
            setOpen(false)
            value = $0.first ?? ""
        })
    }

    private func toggleOpen() {
        guard !disabled, !readOnly else { return }
        setOpen(!isOpen)
    }

    private func clearSelection() {
        guard !disabled, !readOnly else { return }
        value = ""
        inputValue = ""
        setOpen(false)
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
