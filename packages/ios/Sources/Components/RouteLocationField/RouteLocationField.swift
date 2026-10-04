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
    private let onEdit: (() -> Void)?
    private let changeLabel: String
    private let onCancelEdit: (() -> Void)?
    private let cancelEditLabel: String
    private let currentPosition: KozmosListboxOption?
    private let currentPositionLabel: String

    /// Retains the original trailing map-action closure binding.
    public init(label: String, location: KozmosListboxOption?, query: String, options: [KozmosListboxOption],
                status: KozmosRouteLocationStatus = .idle, statusText: String? = nil,
                placeholder: String = "Search for a place", clearLabel: String = "Clear location",
                openLabel: String = "Open options", closeLabel: String = "Close options",
                mapLabel: String = "Select from the map", emptyText: String = "No locations found", disabled: Bool = false,
                filterMode: KozmosRouteLocationFilterMode = .local,
                currentPosition: KozmosListboxOption? = nil, currentPositionLabel: String = "Current position",
                onQueryChange: @escaping (String) -> Void, onSelect: @escaping (KozmosListboxOption) -> Void,
                onClear: @escaping () -> Void, onChooseMap: (() -> Void)? = nil) {
        self.init(label: label, location: location, query: query, options: options, status: status,
            statusText: statusText, placeholder: placeholder, clearLabel: clearLabel, openLabel: openLabel,
            closeLabel: closeLabel, mapLabel: mapLabel, emptyText: emptyText, disabled: disabled,
            filterMode: filterMode, currentPosition: currentPosition, currentPositionLabel: currentPositionLabel,
            onQueryChange: onQueryChange, onSelect: onSelect, onClear: onClear,
            onChooseMap: onChooseMap, onEdit: nil)
    }

    /// Host-controlled edit mode. Pass nil explicitly to add only a cancel action.
    public init(label: String, location: KozmosListboxOption?, query: String, options: [KozmosListboxOption],
                status: KozmosRouteLocationStatus = .idle, statusText: String? = nil,
                placeholder: String = "Search for a place", clearLabel: String = "Clear location",
                openLabel: String = "Open options", closeLabel: String = "Close options",
                mapLabel: String = "Select from the map", emptyText: String = "No locations found", disabled: Bool = false,
                filterMode: KozmosRouteLocationFilterMode = .local,
                currentPosition: KozmosListboxOption? = nil, currentPositionLabel: String = "Current position",
                onQueryChange: @escaping (String) -> Void, onSelect: @escaping (KozmosListboxOption) -> Void,
                onClear: @escaping () -> Void, onChooseMap: (() -> Void)? = nil,
                onEdit: (() -> Void)?, changeLabel: String = "Change",
                onCancelEdit: (() -> Void)? = nil, cancelEditLabel: String = "Cancel") {
        self.label = label; self.location = location; self.query = query; self.options = options
        self.status = status; self.statusText = statusText; self.placeholder = placeholder; self.clearLabel = clearLabel
        self.mapLabel = mapLabel; self.emptyText = emptyText; self.disabled = disabled
        self.openLabel = openLabel; self.closeLabel = closeLabel
        self.filterMode = filterMode
        self.onQueryChange = onQueryChange; self.onSelect = onSelect; self.onClear = onClear; self.onChooseMap = onChooseMap
        self.onEdit = onEdit; self.changeLabel = changeLabel
        self.onCancelEdit = onCancelEdit; self.cancelEditLabel = cancelEditLabel
        self.currentPosition = currentPosition; self.currentPositionLabel = currentPositionLabel
    }

    private var popupActions: [KozmosPickerAction] {
        var result: [KozmosPickerAction] = []
        if let currentPosition, !currentPosition.disabled,
           !currentPosition.value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            result.append(.init(id: "current-position", label: currentPositionLabel) { onSelect(currentPosition) })
        }
        if let onChooseMap { result.append(.init(id: "choose-map", label: mapLabel, action: onChooseMap)) }
        return result
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
                HStack(alignment: .center, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                    VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                        Text(label).font(KozmosTypography.subheadline).kozmosMutedText()
                        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                            Text(location.label).font(KozmosTypography.body.weight(.semibold))
                            if let description = location.description, !description.isEmpty {
                                Text(description).font(KozmosTypography.subheadline).kozmosMutedText()
                            }
                        }
                    }.fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                    KozmosButton(onEdit == nil ? clearLabel : changeLabel, variant: .ghost,
                        isDisabled: disabled, action: onEdit ?? onClear)
                        .accessibilityLabel(onEdit == nil ? clearLabel : "\(changeLabel) \(label)")
                }
                .padding(KozmosDimensions.primitivesLayoutSpacing150)
                .overlay(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl).stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1))
            } else {
                KozmosCombobox(value: Binding(get: { "" }, set: { id in
                    if !disabled, let option = suggestions.first(where: { $0.value == id && !$0.disabled }) { onSelect(option) }
                }), inputValue: Binding(get: { query }, set: onQueryChange), options: suggestions,
                    label: label, placeholder: placeholder, disabled: disabled, status: status == .error ? .error : .default,
                    helperText: message, emptyText: message ?? emptyText, clearable: false,
                    openLabel: openLabel, closeLabel: closeLabel, filterLocally: filterMode == .local,
                    popupActions: popupActions)
                if !query.isEmpty { KozmosButton(clearLabel, variant: .outline, isDisabled: disabled, fillsWidth: true, action: onClear) }
                if let onCancelEdit { KozmosButton(cancelEditLabel, variant: .ghost, isDisabled: disabled, action: onCancelEdit) }
            }
        }.foregroundColor(KozmosColors.primitivesColorsForeground100).frame(maxWidth: .infinity, alignment: .leading)
    }
}
