import Foundation

/// What the host asks PointrKit's map to show, as the two properties it has:
/// `poisToShow` and `poisToHide`.
enum SDKMapPlaces: Equatable {
    /// Every place: both properties nil.
    case every
    /// Only these places: `poisToShow`.
    case only(Set<String>)
    /// None of these places: `poisToHide`.
    case hide(Set<String>)

    /// A value for one of PointrKit's two properties.
    enum Write: Equatable {
        case show(Set<String>?)
        case hide(Set<String>?)
    }

    /// What to write to take the map from `old` to this.
    func writes(from old: SDKMapPlaces) -> [Write] {
        switch self {
        case .every: return [.show(nil), .hide(nil)]
        case .only(let ids): return [.show(ids), .hide(nil)]
        case .hide(let ids): return [.hide(ids), .show(nil)]
        }
    }
}

/// The quick-access tile's filter on the map, held with its inputs: the tile
/// chosen, the loaded places, the favourites and the bookmarks, and the place
/// whose card is open. What the map shows is worked out from those inputs
/// every time it is read, so no input can change without the map following,
/// and the results list reads the same places. The places are plain values,
/// so the rules are testable without a `PTRPoi`.
///
/// Nothing here moves the camera. Choosing a tile may take the map to the
/// level of its places (`SDKSession.choose(category:)`); a favourite, a
/// bookmark or the venue's places arriving again only change which places the
/// map shows.
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

    /// The places the map shows, by identifier: nil with no tile chosen, which
    /// is every place; otherwise exactly the tile's places. A tile with none is
    /// an empty set: none. `mapPlaces` is how PointrKit is told.
    ///
    /// The place whose card is open stays on the map while its card does, so
    /// removing its favourite does not take it from under the card; it leaves
    /// when the card closes. The list is not on screen while a card is.
    var shown: Set<String>? {
        category.map { category in
            var ids = Set(places(in: category).map(\.id))
            if let openPlace { ids.insert(openPlace) }
            return ids
        }
    }

    /// `shown` as PointrKit is told it. None is every loaded place hidden, not
    /// an empty `poisToShow`: PointrKit 10.3.0 draws an empty `poisToShow` as
    /// every place (measured on Design-QA, 2026-09-29), although its reference
    /// says a non-nil set shows only the places in it. The hidden set follows
    /// the places as they load.
    var mapPlaces: SDKMapPlaces {
        guard let shown else { return .every }
        return shown.isEmpty ? .hide(Set(places.map(\.id))) : .only(shown)
    }

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
    }

    mutating func clearCategory() {
        category = nil
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
