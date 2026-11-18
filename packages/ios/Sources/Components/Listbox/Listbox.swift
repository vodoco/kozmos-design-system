import SwiftUI

/// A picker command, never a selectable option or query value. IDs must be unique.
public struct KozmosPickerAction: Identifiable {
    public let id: String
    public let label: String
    public let disabled: Bool
    public let action: () -> Void
    public init(id: String, label: String, disabled: Bool = false, action: @escaping () -> Void) {
        self.id = id; self.label = label; self.disabled = disabled; self.action = action
    }
}

func validPickerActions(_ actions: [KozmosPickerAction]) -> [KozmosPickerAction] {
    let counts = Dictionary(grouping: actions, by: \.id).mapValues(\.count)
    return actions.filter { !$0.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && counts[$0.id] == 1 }
}

/// An option's leading Avatar (decision 215, GAP-282), as React's
/// `ComboboxOption.media`: its image, or its initials when it has none or
/// until it loads (by default the label's first letters).
public struct KozmosOptionMedia: Hashable {
    public let imageURL: URL?
    public let initials: String?

    public init(imageURL: URL? = nil, initials: String? = nil) {
        self.imageURL = imageURL
        self.initials = initials
    }

    /// A label's initials: the first letter of its first two words, "PC"
    /// for "Pointr Cloud", as React's.
    static func initials(of label: String) -> String {
        label.split(whereSeparator: \.isWhitespace).prefix(2)
            .compactMap { $0.first.map(String.init) }.joined().uppercased()
    }
}

public struct KozmosListboxOption: Identifiable, Hashable {
    public let id: String
    public let value: String
    public let label: String
    public let description: String?
    public let disabled: Bool
    /// A leading Avatar, drawn before the label (decision 215). Decoration:
    /// the label stays the option's name.
    public let media: KozmosOptionMedia?
    /// What the option shows at its end, before the check (GAP-260): a
    /// property's type. Muted, and said as the option's hint.
    public let trailing: String?

    public init(
        value: String,
        label: String,
        description: String? = nil,
        disabled: Bool = false,
        media: KozmosOptionMedia? = nil,
        trailing: String? = nil
    ) {
        self.id = value
        self.value = value
        self.label = label
        self.description = description
        self.disabled = disabled
        self.media = media
        self.trailing = trailing
    }
}

public struct KozmosListbox: View {
    @State private var contentHeight: CGFloat?
    public let options: [KozmosListboxOption]
    @Binding public var selectedValues: [String]
    public let multiple: Bool
    public let disabled: Bool
    public let maxHeight: CGFloat
    public let onValueChange: (([String], KozmosListboxOption) -> Void)?
    public let actions: [KozmosPickerAction]
    public let emptyText: String?
    /// Inside a Dialog, a Popover or a Card (GAP-271): the list draws no box
    /// of its own, so it is not a box inside the container's box.
    public let embedded: Bool
    /// The active option's value (GAP-260), for a product that moves it, as
    /// a search field driving the list with a hardware keyboard does: drawn
    /// with the hover fill, as React's active row. Nil, none.
    public let activeValue: String?

    /// - Parameter activeValue: The option the product has made active
    ///   (GAP-260), drawn with the hover fill; a chosen row keeps its own.
    /// - Parameter embedded: No box of its own (GAP-271): no surface, no
    ///   edge, no corners and no padding round the rows, for a list inside a
    ///   Dialog, a Popover or a Card, as Switch client's list of clients. The
    ///   rows are drawn as in every list. `false` by default.
    public init(
        options: [KozmosListboxOption],
        selectedValues: Binding<[String]> = .constant([]),
        multiple: Bool = false,
        disabled: Bool = false,
        maxHeight: CGFloat = 256,
        actions: [KozmosPickerAction] = [],
        emptyText: String? = nil,
        embedded: Bool = false,
        activeValue: String? = nil,
        onValueChange: (([String], KozmosListboxOption) -> Void)? = nil
    ) {
        self.activeValue = activeValue
        self.options = options
        self._selectedValues = selectedValues
        self.multiple = multiple
        self.disabled = disabled
        self.maxHeight = maxHeight
        self.onValueChange = onValueChange
        self.actions = actions; self.emptyText = emptyText
        self.embedded = embedded
    }

    /// The panel's surface: the popover's background, or none embedded.
    var surface: Color { embedded ? Color.clear : KozmosColors.primitivesColorsBackground0 }
    /// The panel's edge: 1 in the subtle border role, or none embedded.
    var edgeWidth: CGFloat { embedded ? 0 : 1 }
    /// The panel's corners: the control radius, or none embedded.
    var cornerRadius: CGFloat { embedded ? 0 : KozmosDimensions.semanticsRadiusControl }
    /// The room round the rows: 4, or none embedded.
    var contentPadding: CGFloat { embedded ? 0 : KozmosDimensions.primitivesLayoutSpacing50 }

    public var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                if options.isEmpty, let emptyText {
                    Text(emptyText).font(KozmosTypography.subheadline)
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                        .padding(KozmosDimensions.primitivesLayoutSpacing150)
                }
                ForEach(options) { option in
                    Button(action: { commit(option) }) {
                        // With an Avatar the row's parts sit on its middle
                        // line; without, as they always have.
                        HStack(alignment: option.media == nil ? .top : .center, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                            if let media = option.media {
                                KozmosAvatar(imageURL: media.imageURL, fallbackText: media.initials ?? KozmosOptionMedia.initials(of: option.label))
                                    .accessibilityHidden(true)
                            }
                            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                                Text(option.label)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundColor(option.disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground0)
                                    .lineLimit(1)

                                if let description = option.description, !description.isEmpty {
                                    // Muted; on a disabled option, the disabled
                                    // label's colour, never darker than it.
                                    Text(description)
                                        .font(KozmosTypography.caption)
                                        .foregroundColor(option.disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground400)
                                        .lineLimit(1)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)

                            if let trailing = option.trailing, !trailing.isEmpty {
                                Text(trailing)
                                    .font(KozmosTypography.caption)
                                    .foregroundColor(option.disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground400)
                                    .lineLimit(1)
                                    .fixedSize()
                            }

                            if selectedValues.contains(option.value) {
                                // An icon on the row: theme 600 (decision 59).
                                Image(systemName: "checkmark")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundColor(KozmosColors.primitivesColorsTheme600)
                                    .frame(width: 20, height: 20)
                            }
                        }
                        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
                        .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
                        // 44pt tall at least, as React's rows are (decision 115),
                        // and all of the row takes a tap: on its clear fill an
                        // unselected row took one only on its words.
                        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                        .background(rowBackground(for: option))
                        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                        .contentShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                    }
                    .buttonStyle(.plain)
                    .disabled(disabled || option.disabled)
                    .accessibilityLabel(Self.accessibilityLabel(for: option))
                    .accessibilityAddTraits(selectedValues.contains(option.value) ? .isSelected : [])
                    // The trailing words describe the option, as React's
                    // aria-describedby: its name stays the label.
                    .accessibilityHint(Self.accessibilityHint(for: option))
                }
                ForEach(validPickerActions(actions)) { action in
                    KozmosButton(action.label, variant: .ghost, isDisabled: disabled || action.disabled,
                        fillsWidth: true) {
                        guard !disabled, !action.disabled else { return }
                        action.action()
                    }
                }
            }
            .padding(contentPadding)
            .background(GeometryReader { proxy in
                Color.clear.preference(key: KozmosListboxContentHeightKey.self, value: proxy.size.height)
            })
        }
        .frame(maxWidth: .infinity, maxHeight: min(contentHeight ?? maxHeight, maxHeight), alignment: .topLeading)
        .onPreferenceChange(KozmosListboxContentHeightKey.self) { contentHeight = $0 }
        .background(surface)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
        .overlay(
            RoundedRectangle(cornerRadius: cornerRadius)
                .stroke(KozmosColors.semanticsBorderSubtle, lineWidth: edgeWidth)
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

    /// A row's name: its label, then its description. The Avatar is not in
    /// it (decision 215): the label names the option.
    static func accessibilityLabel(for option: KozmosListboxOption) -> String {
        [option.label, option.description].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: ", ")
    }

    /// A row's hint: its trailing words (GAP-260), as React's aria-describedby.
    static func accessibilityHint(for option: KozmosListboxOption) -> String {
        option.trailing ?? ""
    }

    /// Which fill a row takes: chosen, active (GAP-260) or none.
    enum RowFill { case none, chosen, active }

    func rowFill(for option: KozmosListboxOption) -> RowFill {
        if selectedValues.contains(option.value) { return .chosen }
        // The active row, as React's: a chosen row keeps its own fill.
        if option.value == activeValue, !option.disabled { return .active }
        return .none
    }

    private func rowBackground(for option: KozmosListboxOption) -> Color {
        switch rowFill(for: option) {
        case .chosen: return KozmosColors.primitivesColorsBackground100
        case .active: return KozmosColors.semanticsHoverFill
        case .none: return Color.clear
        }
    }
}

/// Measure the content, not the viewport: short lists hug their rows and long
/// lists retain the caller's height cap and scrolling, including after filtering.
private struct KozmosListboxContentHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}
