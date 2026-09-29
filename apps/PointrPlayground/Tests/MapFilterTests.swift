import XCTest
@testable import KozmosPointrQA

/// The map's quick-access filter against its inputs: the tile chosen, the
/// loaded places, the favourites and the bookmarks.
final class MapFilterTests: XCTestCase {
    private let favouritesTile = QuickAccess.category(id: QuickAccess.favouritesId)!
    private let bookmarksTile = QuickAccess.category(id: QuickAccess.bookmarksId)!
    /// A taxonomy tile made here, so the tests do not depend on the bundled
    /// file's words.
    private let coffee = QuickAccessCategory(id: "coffee", name: "Coffee", icon: .symbol("cup.and.saucer"),
                                             terms: ["coffee"], tint: .orange)

    private func place(_ id: String, _ name: String, tags: [String] = []) -> SDKMapFilter.Place {
        .init(id: id, name: name, freeText: tags)
    }

    private var venue: [SDKMapFilter.Place] {
        [place("dunkin", "Dunkin'", tags: ["coffee"]), place("gate-a1", "Gate A1"), place("alamo", "Alamo"),
         place("shuttle", "Airport Shuttle")]
    }

    private func loaded(favourites: [String] = [], saved: [String] = []) -> SDKMapFilter {
        var filter = SDKMapFilter()
        filter.load(venue)
        favourites.forEach { filter.toggleFavourite($0) }
        saved.forEach { filter.toggleSaved($0) }
        return filter
    }

    func testWithoutATileTheMapShowsEveryPlace() {
        XCTAssertNil(loaded(favourites: ["alamo"]).shown)
    }

    /// The review's scenario: favourite a place, open Favourites, open the
    /// place, remove its favourite, close it.
    func testRemovingTheLastFavouriteLeavesTheMapShowingNone() {
        var filter = loaded(favourites: ["alamo"])
        filter.choose(favouritesTile)
        XCTAssertEqual(filter.shown, ["alamo"])
        filter.toggleFavourite("alamo")
        XCTAssertEqual(filter.shown, [], "the map kept a place the list no longer has")
    }

    /// The same, with the place's card open as the favourite is removed: the
    /// place stays on the map under its card and leaves with it.
    func testAPlaceUnfavouritedWithItsCardOpenLeavesTheMapWithTheCard() {
        var filter = loaded(favourites: ["alamo"])
        filter.choose(favouritesTile)
        filter.open("alamo")
        filter.toggleFavourite("alamo")
        XCTAssertEqual(filter.shown, ["alamo"], "the place left the map under its open card")
        filter.open(nil)
        XCTAssertEqual(filter.shown, [], "the place stayed on the map after its card closed")
    }

    func testRemovingOneOfSeveralFavouritesLeavesTheOthers() {
        var filter = loaded(favourites: ["alamo", "dunkin"])
        filter.choose(favouritesTile)
        filter.toggleFavourite("dunkin")
        XCTAssertEqual(filter.shown, ["alamo"])
    }

    func testBookmarksFollowAsFavouritesDo() {
        var filter = loaded(saved: ["gate-a1"])
        filter.choose(bookmarksTile)
        filter.toggleSaved("shuttle")
        XCTAssertEqual(filter.shown, ["gate-a1", "shuttle"], "a new bookmark did not reach the map")
        filter.toggleSaved("gate-a1")
        filter.toggleSaved("shuttle")
        XCTAssertEqual(filter.shown, [], "the map kept bookmarks the list no longer has")
    }

    /// The venue's places arriving again with a tile chosen.
    func testPlacesLoadedWithATileChosenReachTheMap() {
        var filter = loaded()
        filter.choose(coffee)
        XCTAssertEqual(filter.shown, ["dunkin"])
        filter.load(venue + [place("peets", "Peet's", tags: ["coffee"])])
        XCTAssertEqual(filter.shown, ["dunkin", "peets"])
    }

    /// A tile with no places shows none: an empty set, not nil, which is every
    /// place.
    func testATileWithNoPlacesShowsNoneNotEveryPlace() {
        var filter = loaded()
        filter.choose(favouritesTile)
        XCTAssertNotNil(filter.shown, "no places became every place")
        XCTAssertEqual(filter.shown, [])
    }

    // MARK: As PointrKit is told

    /// Live on Design-QA, 2026-09-29: PointrKit 10.3.0 draws every place for an
    /// empty `poisToShow`, although its reference says a non-nil set shows only
    /// its places. A tile with no places hides every loaded place instead.
    func testATileWithNoPlacesHidesEveryLoadedPlace() {
        var filter = loaded()
        filter.choose(favouritesTile)
        XCTAssertEqual(filter.mapPlaces, .hide(Set(venue.map(\.id))), "an empty poisToShow, which PointrKit draws as every place")
    }

    /// The review's scenario to its end, as the map is told it: favourite,
    /// Favourites, open, unfavourite, close.
    func testTheLastFavouriteRemovedAndItsCardClosedHidesEveryPlace() {
        var filter = loaded(favourites: ["alamo"])
        filter.choose(favouritesTile)
        XCTAssertEqual(filter.mapPlaces, .only(["alamo"]))
        filter.open("alamo")
        filter.toggleFavourite("alamo")
        XCTAssertEqual(filter.mapPlaces, .only(["alamo"]), "the place left the map under its open card")
        filter.open(nil)
        XCTAssertEqual(filter.mapPlaces, .hide(Set(venue.map(\.id))), "the map was given an empty set, which it draws as every place")
    }

    /// Places arriving again while the tile has none are hidden too.
    func testPlacesLoadedWhileATileHasNoneAreHiddenToo() {
        var filter = loaded()
        filter.choose(favouritesTile)
        let more = venue + [place("peets", "Peet's", tags: ["coffee"])]
        filter.load(more)
        XCTAssertEqual(filter.mapPlaces, .hide(Set(more.map(\.id))))
    }

    func testWithoutATileTheMapIsToldEveryPlaceAndWithOneOnlyItsPlaces() {
        var filter = loaded(favourites: ["alamo"])
        XCTAssertEqual(filter.mapPlaces, .every)
        filter.choose(favouritesTile)
        XCTAssertEqual(filter.mapPlaces, .only(["alamo"]))
        filter.clearCategory()
        XCTAssertEqual(filter.mapPlaces, .every)
    }

    func testClearingTheTileShowsEveryPlaceAgain() {
        var filter = loaded(favourites: ["alamo"])
        filter.choose(favouritesTile)
        filter.clearCategory()
        XCTAssertNil(filter.shown)
    }

    /// Marking or opening places with no tile chosen leaves the map unfiltered.
    func testMarkingAPlaceWithoutATileLeavesTheMapUnfiltered() {
        var filter = loaded()
        filter.open("alamo")
        filter.toggleFavourite("alamo")
        filter.toggleSaved("alamo")
        XCTAssertNil(filter.shown)
    }

    /// The list and the map read the same places, whatever changed last.
    func testTheListAndTheMapShowTheSamePlaces() {
        var filter = loaded(favourites: ["alamo", "shuttle"])
        filter.choose(favouritesTile)
        filter.toggleFavourite("gate-a1")
        filter.toggleFavourite("alamo")
        XCTAssertEqual(filter.places(in: favouritesTile).map(\.name), ["Airport Shuttle", "Gate A1"])
        XCTAssertEqual(filter.shown, Set(filter.places(in: favouritesTile).map(\.id)))
    }
}
