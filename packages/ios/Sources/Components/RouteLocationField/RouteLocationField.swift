import SwiftUI

public enum KozmosRouteLocationStatus: String, CaseIterable, Sendable {
    case idle, loading, ready, empty, error
}
public enum KozmosRouteLocationFilterMode: Sendable { case local, host }

/// A resolved place is separate from editable search text. The host owns search, identity and focus.
public struct KozmosRouteLocationField: View {
    private let label: String
    private let location: KozmosListboxOption?
    private let query: String
    private let options: [KozmosListboxOption]
    private let status: KozmosRouteLocationStatus
    private let statusText: String?
    private let placeholder: String
    private let clearLabel: String
    private let openLabel: String
    private let closeLabel: String
    private let mapLabel: String
    private let emptyText: String
    private let disabled: Bool
    private let filterMode: KozmosRouteLocationFilterMode
    private let onQueryChange: (String) -> Void
    private let onSelect: (KozmosListboxOption) -> Void
    private let onClear: () -> Void
    private let onChooseMap: (() -> Void)?

    public init(label: String, location: KozmosListboxOption?, query: String, options: [KozmosListboxOption],
                status: KozmosRouteLocationStatus = .idle, statusText: String? = nil,
                placeholder: String = "Search for a place", clearLabel: String = "Clear location",
                openLabel: String = "Open options", closeLabel: String = "Close options",
                mapLabel: String = "Select from the map", emptyText: String = "No locations found", disabled: Bool = false,
                filterMode: KozmosRouteLocationFilterMode = .local,
                onQueryChange: @escaping (String) -> Void, onSelect: @escaping (KozmosListboxOption) -> Void,
                onClear: @escaping () -> Void, onChooseMap: (() -> Void)? = nil) {
        self.label = label; self.location = location; self.query = query; self.options = options
        self.status = status; self.statusText = statusText; self.placeholder = placeholder; self.clearLabel = clearLabel
        self.mapLabel = mapLabel; self.emptyText = emptyText; self.disabled = disabled
        self.openLabel = openLabel; self.closeLabel = closeLabel
        self.filterMode = filterMode
        self.onQueryChange = onQueryChange; self.onSelect = onSelect; self.onClear = onClear; self.onChooseMap = onChooseMap
    }

    private var suggestions: [KozmosListboxOption] {
        guard status == .idle || status == .ready else { return [] }
        let counts = Dictionary(grouping: options, by: \.value).mapValues(\.count)
        return options.filter { !$0.value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && counts[$0.value] == 1 }
    }
    private var message: String? {
        if let statusText { return statusText }
        switch status {
        case .loading: return "Searching locations…"
        case .error: return "Locations are unavailable"
        case .empty: return emptyText
        default: return nil
        }
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            if let location {
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                        Text(label).font(KozmosTypography.subheadline).kozmosMutedText()
                            .frame(maxWidth: .infinity, alignment: .leading)
                        KozmosIconButton(iconName: "xmark", variant: .outline, isDisabled: disabled, action: onClear)
                            .accessibilityLabel(clearLabel)
                    }
                    VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                        Text(location.label).font(KozmosTypography.body.weight(.semibold))
                        if let description = location.description, !description.isEmpty {
                            Text(description).font(KozmosTypography.subheadline).kozmosMutedText()
                        }
                    }.fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(KozmosDimensions.primitivesLayoutSpacing150)
                .overlay(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl).stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1))
            } else {
                KozmosCombobox(value: Binding(get: { "" }, set: { id in
                    if !disabled, let option = suggestions.first(where: { $0.value == id && !$0.disabled }) { onSelect(option) }
                }), inputValue: Binding(get: { query }, set: onQueryChange), options: suggestions,
                    label: label, placeholder: placeholder, disabled: disabled, status: status == .error ? .error : .default,
                    helperText: message, emptyText: message ?? emptyText, clearable: false,
                    openLabel: openLabel, closeLabel: closeLabel, filterLocally: filterMode == .local)
                if !query.isEmpty { KozmosButton(clearLabel, variant: .outline, isDisabled: disabled, fillsWidth: true, action: onClear) }
            }
            if let onChooseMap { KozmosButton(mapLabel, variant: .outline, isDisabled: disabled, fillsWidth: true, action: onChooseMap) }
        }.foregroundColor(KozmosColors.primitivesColorsForeground100).frame(maxWidth: .infinity, alignment: .leading)
    }
}
