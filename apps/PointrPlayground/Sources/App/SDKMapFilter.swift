import Foundation

/// The quick-access tile's filter on the map, held with its inputs: the tile
/// chosen, the loaded places, the favourites and the bookmarks. The places are
/// plain values, so the rules are testable without a `PTRPoi`.
struct SDKMapFilter: Equatable {
    /// A loaded place as the filter needs it.
    struct Place: Equatable {
        let id: String
        let name: String
        /// Its tags and keywords (`SDKPOIAdapter.freeText`).
        let freeText: [String]
    }

    private(set) var category: QuickAccessCategory?
    private(set) var places: [Place] = []
    private(set) var favourites = Set<String>()
    private(set) var saved = Set<String>()
    /// The place whose card is open, if any.
    private(set) var openPlace: String?
    /// The places the map shows, by identifier: nil shows every place.
    private(set) var shown: Set<String>?

    /// A tile's places, on every floor, by name: its places by the stand-in
    /// word match (`QuickAccess.matches`), or the personal tiles by what this
    /// session has marked.
    func places(in category: QuickAccessCategory) -> [Place] {
        let matching: [Place]
        switch category.id {
        case QuickAccess.favouritesId: matching = places.filter { favourites.contains($0.id) }
        case QuickAccess.bookmarksId: matching = places.filter { saved.contains($0.id) }
        default: matching = places.filter { QuickAccess.matches(category, name: $0.name, freeText: $0.freeText) }
        }
        return matching.sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }
    }

    mutating func choose(_ category: QuickAccessCategory) {
        self.category = category
        let matching = places(in: category)
        shown = matching.isEmpty ? nil : Set(matching.map(\.id))
    }

    mutating func clearCategory() {
        category = nil
        shown = nil
    }

    mutating func load(_ places: [Place]) {
        self.places = places
    }

    mutating func toggleFavourite(_ id: String) {
        if !favourites.insert(id).inserted { favourites.remove(id) }
    }

    mutating func toggleSaved(_ id: String) {
        if !saved.insert(id).inserted { saved.remove(id) }
    }

    /// A place's card opened, or, with nil, closed.
    mutating func open(_ id: String?) {
        openPlace = id
    }
}
