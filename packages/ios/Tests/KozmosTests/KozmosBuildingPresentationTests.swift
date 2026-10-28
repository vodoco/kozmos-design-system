import SwiftUI
import XCTest

@testable import Kozmos

#if os(iOS)
  import UIKit
#endif

/// The building and the site the live map reports (GAP-175): the web's
/// `BuildingPresentation` and `SitePresentation`, and the docs' example that
/// hands a building's floors to the floor selector.
final class KozmosBuildingPresentationTests: XCTestCase {
  private let floors = [
    KozmosFloorPresentation(id: "3", label: "Departures", shortLabel: "3"),
    KozmosFloorPresentation(id: "2", label: "Arrivals", shortLabel: "2"),
    KozmosFloorPresentation(id: "0", label: "Ground transport", shortLabel: "0"),
    KozmosFloorPresentation(id: "-1", label: "Car park", shortLabel: "P"),
  ]

  private var terminal: KozmosBuildingPresentation {
    KozmosBuildingPresentation(id: "t2", label: "Terminal 2", siteId: "airport", floors: floors)
  }

  func testABuildingCarriesWhatTheWebContractDoes() {
    XCTAssertEqual(terminal.id, "t2")
    XCTAssertEqual(terminal.label, "Terminal 2")
    XCTAssertEqual(terminal.siteId, "airport")
    // Top floor first, as given: the contract never reorders.
    XCTAssertEqual(terminal.floors.map(\.id), ["3", "2", "0", "-1"])
    // An untitled building is an empty label, not a missing one.
    XCTAssertEqual(KozmosBuildingPresentation(id: "b", label: "", siteId: "s", floors: []).label, "")
  }

  /// The level to start on (decision 141): Pointr's default, by its id in
  /// `floors`, which a building may leave out; the docs' `startFloor` falls
  /// back to the ground level the product names.
  func testABuildingNamesTheLevelToStartOn() {
    let marked = KozmosBuildingPresentation(
      id: "t2", label: "Terminal 2", siteId: "airport", floors: floors, defaultFloorId: "-1")
    XCTAssertEqual(marked.defaultFloorId, "-1")
    XCTAssertTrue(marked.floors.contains { $0.id == marked.defaultFloorId })
    // Left out, there is none.
    XCTAssertNil(terminal.defaultFloorId)
    // It is part of the value: a building with a default is another building.
    XCTAssertNotEqual(marked, terminal)
    XCTAssertEqual(startFloor(of: marked, ground: "0"), "-1")
    XCTAssertEqual(startFloor(of: terminal, ground: "0"), "0")
  }

  func testASiteCarriesItsBuildings() {
    let annex = KozmosBuildingPresentation(id: "t1", label: "Terminal 1", siteId: "airport", floors: [])
    let site = KozmosSitePresentation(id: "airport", label: "Airport", buildings: [terminal, annex])
    XCTAssertEqual(site.id, "airport")
    XCTAssertEqual(site.label, "Airport")
    XCTAssertEqual(site.buildings.map(\.id), ["t2", "t1"])
    XCTAssertTrue(site.buildings.allSatisfy { $0.siteId == site.id })
    // Identifiable and Hashable, for ForEach and selection.
    XCTAssertEqual(Set(site.buildings).count, 2)
    XCTAssertEqual(terminal, KozmosBuildingPresentation(id: "t2", label: "Terminal 2", siteId: "airport", floors: floors))
    XCTAssertNotEqual(terminal, annex)
  }

  #if os(iOS)
    /// What the selector chose, through the binding the docs' example takes.
    private final class Chosen {
      var current = "2"
      var floors: [String] = []
    }

    @MainActor private func elements(_ node: NSObject) -> [NSObject] {
      if node.accessibilityElementsHidden { return [] }
      if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
      if node.isAccessibilityElement { return [node] }
      let children: [NSObject]
      if let values = node.accessibilityElements as? [NSObject], !values.isEmpty {
        children = values
      } else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
        children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
      } else {
        children = (node as? UIView)?.subviews ?? []
      }
      return children.flatMap { elements($0) }
    }

    /// FloorSelector.mdx's example (DocSnippets/BuildingFloors.swift): the
    /// building's floors, top first, are the selector's levels in that order,
    /// and choosing one moves the selection.
    @MainActor func testTheDocsExampleDrawsTheBuildingsFloorsTopFirst() async throws {
      typealias Get = @convention(c) () -> Int32
      typealias Set = @convention(c) (Int32) -> Void
      let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
      let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
      let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
      let old = get()
      set(1)
      defer { set(old) }
      let chosen = Chosen()
      // Started where the docs start: the building's default, the second floor.
      let marked = KozmosBuildingPresentation(
        id: "t2", label: "Terminal 2", siteId: "airport", floors: floors, defaultFloorId: "2")
      chosen.current = startFloor(of: marked, ground: "0")
      XCTAssertEqual(chosen.current, "2")
      let selection = Binding(get: { chosen.current }, set: { chosen.current = $0; chosen.floors.append($0) })
      let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
      window.rootViewController = UIHostingController(
        rootView: BuildingFloors(building: marked, selectedFloor: selection))
      window.makeKeyAndVisible()
      defer { window.isHidden = true }
      for _ in 0..<10 { try? await Task.sleep(nanoseconds: 30_000_000) }
      let levels = elements(window).compactMap(\.accessibilityLabel).filter { label in
        floors.contains { label.hasPrefix($0.label) }
      }
      XCTAssertEqual(levels, ["Departures", "Arrivals", "Ground transport", "Car park"])
      let carPark = try XCTUnwrap(elements(window).first { $0.accessibilityLabel == "Car park" })
      XCTAssertTrue(carPark.accessibilityActivate())
      for _ in 0..<10 { try? await Task.sleep(nanoseconds: 30_000_000) }
      XCTAssertEqual(chosen.floors, ["-1"])
    }
  #endif
}
