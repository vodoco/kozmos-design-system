import SwiftUI

public struct KozmosListboxOption: Identifiable, Hashable {
    public let id: String
    public let value: String
    public let label: String
    public let description: String?
    public let disabled: Bool

    public init(
        value: String,
        label: String,
        description: String? = nil,
        disabled: Bool = false
    ) {
        self.id = value
        self.value = value
        self.label = label
        self.description = description
        self.disabled = disabled
    }
}

public struct KozmosListbox: View {
    public let options: [KozmosListboxOption]
    @Binding public var selectedValues: [String]
    public let multiple: Bool
    public let disabled: Bool
    public let maxHeight: CGFloat
    public let onValueChange: (([String], KozmosListboxOption) -> Void)?

    public init(
        options: [KozmosListboxOption],
        selectedValues: Binding<[String]> = .constant([]),
        multiple: Bool = false,
        disabled: Bool = false,
        maxHeight: CGFloat = 256,
        onValueChange: (([String], KozmosListboxOption) -> Void)? = nil
    ) {
        self.options = options
        self._selectedValues = selectedValues
        self.multiple = multiple
        self.disabled = disabled
        self.maxHeight = maxHeight
        self.onValueChange = onValueChange
    }

    public var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                ForEach(options) { option in
                    Button(action: { commit(option) }) {
                        HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                                Text(option.label)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundColor(option.disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground0)
                                    .lineLimit(1)

                                if let description = option.description, !description.isEmpty {
                                    Text(description)
                                        .font(KozmosTypography.caption)
                                        .foregroundColor(KozmosColors.primitivesColorsForeground500)
                                        .lineLimit(1)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)

                            if selectedValues.contains(option.value) {
                                Image(systemName: "checkmark")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundColor(KozmosColors.primitivesColorsTheme500)
                                    .frame(width: 20, height: 20)
                            }
                        }
                        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
                        .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(rowBackground(for: option))
                        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                    }
                    .buttonStyle(.plain)
                    .disabled(disabled || option.disabled)
                    .accessibilityLabel([option.label, option.description].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: ", "))
                    .accessibilityAddTraits(selectedValues.contains(option.value) ? .isSelected : [])
                }
            }
            .padding(KozmosDimensions.primitivesLayoutSpacing50)
        }
        .frame(maxWidth: .infinity, maxHeight: maxHeight, alignment: .topLeading)
        .background(KozmosColors.primitivesColorsBackground0)
        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1)
        )
        .opacity(disabled ? 0.6 : 1)
    }

    private func commit(_ option: KozmosListboxOption) {
        guard !disabled, !option.disabled else { return }

        let nextValues: [String]
        if multiple {
            if selectedValues.contains(option.value) {
                nextValues = selectedValues.filter { $0 != option.value }
            } else {
                nextValues = selectedValues + [option.value]
            }
        } else {
            nextValues = [option.value]
        }

        selectedValues = nextValues
        onValueChange?(nextValues, option)
    }

    private func rowBackground(for option: KozmosListboxOption) -> Color {
        if selectedValues.contains(option.value) {
            return KozmosColors.primitivesColorsBackground100
        }
        return Color.clear
    }
}
