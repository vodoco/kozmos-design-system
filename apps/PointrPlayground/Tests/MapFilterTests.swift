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

    /// PointrKit: "If non-nil, the map will only display the pois that match
    /// the identifiers from the set", and nil is every place. A tile with no
    /// places is an empty set.
    func testATileWithNoPlacesShowsNoneNotEveryPlace() {
        var filter = loaded()
        filter.choose(favouritesTile)
        XCTAssertNotNil(filter.shown, "no places became every place")
        XCTAssertEqual(filter.shown, [])
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
