import SwiftUI
import XCTest

@testable import Kozmos

#if os(iOS)
  import UIKit
#endif

/// The product's own actions, with their own words and icons (GAP-028 on a
/// result, GAP-130 on the details card): the contract, as the web's
/// `POIHostActionPresentation` defines it, and the parts that draw it.
final class KozmosPOIHostActionsTests: XCTestCase {
  private let reserve = KozmosPOIHostActionPresentation(
    id: "reserve", label: "Reserve a table", iconName: "calendar")

  func testAHostActionCarriesWhatTheWebContractDoes() {
    let plain = KozmosPOIHostActionPresentation(id: "menu", label: "See the menu")
    XCTAssertEqual(plain.id, "menu")
    XCTAssertEqual(plain.label, "See the menu")
    XCTAssertNil(plain.iconName)
    XCTAssertFalse(plain.disabled)
    XCTAssertEqual(reserve.iconName, "calendar")
  }

  func testJSONMayLeaveOutTheIconAndDisabled() throws {
    let decoded = try JSONDecoder().decode(
      KozmosPOIHostActionPresentation.self,
      from: Data(#"{"id":"open-in-app","label":"Open in app"}"#.utf8))
    XCTAssertEqual(decoded, KozmosPOIHostActionPresentation(id: "open-in-app", label: "Open in app"))
    let details = try JSONDecoder().decode(
      KozmosPOIDetailsPresentation.self,
      from: Data(#"{"hostActions":[{"id":"open-in-app","label":"Open in app","disabled":true}]}"#.utf8))
    XCTAssertEqual(details.hostActions.map(\.id), ["open-in-app"])
    XCTAssertTrue(details.hostActions[0].disabled)
    // Every existing caller and payload leaves them out.
    XCTAssertTrue(KozmosPOIDetailsPresentation().hostActions.isEmpty)
    XCTAssertTrue(try JSONDecoder().decode(KozmosPOIDetailsPresentation.self, from: Data("{}".utf8)).hostActions.isEmpty)
    XCTAssertTrue(KozmosPOIResultPresentation(poiId: "p", resultIndex: 1).hostActions.isEmpty)
  }

  func testSelectingKeepsTheHostActions() {
    // `selecting` rebuilds the struct by hand: a field it does not carry is
    // dropped on every selection change.
    let result = KozmosPOIResultPresentation(poiId: "p", resultIndex: 1, hostActions: [reserve])
    XCTAssertEqual(result.selecting("p").hostActions, [reserve])
    XCTAssertEqual(result.selecting("q").hostActions, [reserve])
  }

  #if os(iOS)
    private let poi = KozmosPOIPresentation(
      id: "trattoria", name: "Trattoria Uno", categoryLabel: "Restaurant", floorLabel: "Level 2",
      actions: [.navigate, .share])

    private func result(selected: Bool = true, available: Bool? = nil, menuDisabled: Bool = false)
      -> KozmosPOIResultPresentation
    {
      KozmosPOIResultPresentation(
        poiId: poi.id, resultIndex: 1, selected: selected, available: available,
        actions: [
          KozmosPOIResultActionPresentation(action: .navigate, label: "Go", primary: true),
          KozmosPOIResultActionPresentation(action: .details, label: "Details"),
        ],
        hostActions: [
          reserve, KozmosPOIHostActionPresentation(id: "menu", label: "See the menu", disabled: menuDisabled),
        ])
    }

    @MainActor private func withAutomation(_ body: @MainActor () async throws -> Void) async throws {
      typealias Get = @convention(c) () -> Int32
      typealias Set = @convention(c) (Int32) -> Void
      let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
      let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
      let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
      let old = get()
      set(1)
      defer { set(old) }
      try await body()
    }

    @MainActor private func host<V: View>(_ content: V) async -> UIWindow {
      let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
      window.rootViewController = UIHostingController(
        rootView: ScrollView { content.frame(width: 390) })
      window.makeKeyAndVisible()
      for _ in 0..<10 { try? await Task.sleep(nanoseconds: 30_000_000) }
      return window
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

    /// The labels of the buttons VoiceOver reaches, in its order.
    @MainActor private func buttons(_ window: UIWindow) -> [String] {
      elements(window).filter { $0.accessibilityTraits.contains(.button) }.compactMap(\.accessibilityLabel)
    }

    @MainActor private func element(_ label: String, in window: UIWindow) throws -> NSObject {
      try XCTUnwrap(elements(window).first { $0.accessibilityLabel == label }, "no \(label)")
    }

    /// After the card's own actions, in the order given, each said by its
    /// label alone: the icon is not read.
    @MainActor func testTheCardDrawsThemAfterItsOwnActionsInOrder() async throws {
      try await withAutomation {
        let window = await host(
          KozmosPOIResultCard(
            poi: poi, result: result(), onSelect: { _ in }, onAction: { _, _ in },
            onHostAction: { _, _ in }))
        defer { window.isHidden = true }
        XCTAssertEqual(Array(buttons(window).suffix(4)), ["Go", "Details", "Reserve a table", "See the menu"])
      }
    }

    /// A press reaches `onHostAction` with the action's id and the POI's,
    /// never `onAction` or `onSelect`, and sends React's event.
    @MainActor func testAPressReportsTheIdAndSendsOneEvent() async throws {
      try await withAutomation {
        var hosted: [[String]] = []
        var actions = 0
        var selections = 0
        var events: [KozmosAnalyticsEvent] = []
        let window = await host(
          KozmosPOIResultCard(
            poi: poi, result: result(), onSelect: { _ in selections += 1 },
            onAction: { _, _ in actions += 1 }, onHostAction: { hosted.append([$0, $1]) }
          )
          .environment(\.kozmosAnalytics) { events.append($0) })
        defer { window.isHidden = true }
        XCTAssertTrue(try element("Reserve a table", in: window).accessibilityActivate())
        XCTAssertEqual(hosted, [["reserve", "trattoria"]])
        XCTAssertEqual(actions, 0)
        XCTAssertEqual(selections, 0)
        XCTAssertEqual(events.map(\.eventName), ["poi_result_action"])
        let properties = try XCTUnwrap(events.first?.properties)
        guard case .string(let action)? = properties["action"], case .string(let id)? = properties["hostActionId"],
          case .string(let poiId)? = properties["poiId"], case .int(let index)? = properties["resultIndex"]
        else { return XCTFail("the event's properties are \(properties)") }
        XCTAssertEqual([action, id, poiId], ["host", "reserve", "trattoria"])
        XCTAssertEqual(index, 1)
      }
    }

    /// Without a handler they are drawn disabled, as the card's own are, and
    /// one marked disabled stays disabled with one.
    @MainActor func testWithoutAHandlerTheyAreDisabled() async throws {
      try await withAutomation {
        var hosted = 0
        var events: [KozmosAnalyticsEvent] = []
        let bare = await host(
          KozmosPOIResultCard(poi: poi, result: result(), onSelect: { _ in })
            .environment(\.kozmosAnalytics) { events.append($0) })
        XCTAssertTrue(try element("Reserve a table", in: bare).accessibilityTraits.contains(.notEnabled))
        _ = try element("Reserve a table", in: bare).accessibilityActivate()
        bare.isHidden = true
        let handled = await host(
          KozmosPOIResultCard(
            poi: poi, result: result(menuDisabled: true), onSelect: { _ in },
            onHostAction: { _, _ in hosted += 1 }))
        defer { handled.isHidden = true }
        XCTAssertFalse(try element("Reserve a table", in: handled).accessibilityTraits.contains(.notEnabled))
        XCTAssertTrue(try element("See the menu", in: handled).accessibilityTraits.contains(.notEnabled))
        _ = try element("See the menu", in: handled).accessibilityActivate()
        XCTAssertEqual(hosted, 0)
        XCTAssertTrue(events.isEmpty)
      }
    }

    /// Shown only on the selected, available result, as the card's own are.
    @MainActor func testOnlyTheSelectedAvailableResultShowsThem() async throws {
      try await withAutomation {
        for (name, given) in [("unselected", result(selected: false)), ("unavailable", result(available: false))] {
          let window = await host(
            KozmosPOIResultCard(poi: poi, result: given, onSelect: { _ in }, onHostAction: { _, _ in }))
          XCTAssertFalse(buttons(window).contains("Reserve a table"), name)
          window.isHidden = true
        }
      }
    }

    /// The list and the group hand `onHostAction` to their cards.
    @MainActor func testTheListAndTheGroupHandOnTheHandler() async throws {
      try await withAutomation {
        var hosted: [String] = []
        let item = KozmosPOIResultListItem(poi: poi, result: result())
        let list = await host(
          KozmosPOIResultList(
            items: [item], resultCountLabel: "1 result", selectedPoiId: poi.id, onSelect: { _ in },
            onHostAction: { id, poiId in hosted.append("list:\(id):\(poiId)") }))
        XCTAssertTrue(try element("Reserve a table", in: list).accessibilityActivate())
        list.isHidden = true
        let group = await host(
          KozmosPOIResultGroup(
            items: [item], selectedPoiId: poi.id, onSelect: { _ in },
            onHostAction: { id, poiId in hosted.append("group:\(id):\(poiId)") }))
        defer { group.isHidden = true }
        XCTAssertTrue(try element("Reserve a table", in: group).accessibilityActivate())
        XCTAssertEqual(hosted, ["list:reserve:trattoria", "group:reserve:trattoria"])
      }
    }

    private let labels: [KozmosPOIAction: String] = [.navigate: "Go", .share: "Share"]
    private let details = KozmosPOIDetailsPresentation(
      supplementaryActions: [KozmosPOIDetailAction(action: "call", label: "Call")],
      hostActions: [
        KozmosPOIHostActionPresentation(
          id: "open-in-app", label: "Get live directions in Pointr Express", iconName: "phone"),
        KozmosPOIHostActionPresentation(id: "feedback", label: "Report a problem"),
      ])

    /// The details card draws them last in its strip, after the
    /// supplementary actions, and a press reaches `onHostAction` alone.
    @MainActor func testTheDetailsCardDrawsThemLastAndReportsTheId() async throws {
      try await withAutomation {
        var hosted: [[String]] = []
        var others = 0
        let window = await host(
          KozmosPOIDetailPanel(
            poi: poi, actionLabels: labels, onAction: { _, _ in others += 1 }, details: details,
            onSupplementaryAction: { _, _ in others += 1 }, onHostAction: { hosted.append([$0, $1]) }))
        defer { window.isHidden = true }
        let strip = buttons(window).filter {
          ["Go", "Share", "Call", "Get live directions in Pointr Express", "Report a problem"].contains($0)
        }
        XCTAssertEqual(strip, ["Go", "Share", "Call", "Get live directions in Pointr Express", "Report a problem"])
        XCTAssertTrue(try element("Get live directions in Pointr Express", in: window).accessibilityActivate())
        XCTAssertEqual(hosted, [["open-in-app", "trattoria"]])
        XCTAssertEqual(others, 0)
      }
    }

    /// Without a handler they are disabled; their state is their own, by id,
    /// and a message is drawn under the strip.
    @MainActor func testTheDetailsCardHonoursHandlerStateAndMessage() async throws {
      try await withAutomation {
        let bare = await host(
          KozmosPOIDetailPanel(poi: poi, actionLabels: labels, onAction: { _, _ in }, details: details))
        XCTAssertTrue(try element("Report a problem", in: bare).accessibilityTraits.contains(.notEnabled))
        bare.isHidden = true
        var hosted = 0
        let window = await host(
          KozmosPOIDetailPanel(
            poi: poi, actionLabels: labels, onAction: { _, _ in }, details: details,
            hostActionStates: [
              "feedback": KozmosPOIActionState(disabled: true),
              "open-in-app": KozmosPOIActionState(message: "Pointr Express is not installed.", messageTone: .error),
            ],
            onHostAction: { _, _ in hosted += 1 }))
        defer { window.isHidden = true }
        XCTAssertTrue(try element("Report a problem", in: window).accessibilityTraits.contains(.notEnabled))
        XCTAssertFalse(
          try element("Get live directions in Pointr Express", in: window).accessibilityTraits.contains(.notEnabled))
        _ = try element("Report a problem", in: window).accessibilityActivate()
        XCTAssertEqual(hosted, 0)
        XCTAssertNotNil(
          elements(window).first { $0.accessibilityLabel == "Pointr Express is not installed." },
          "the message is drawn")
      }
    }

    /// The docs' two examples (DocSnippets/ResultWithReservation.swift and
    /// DetailsWithHandOff.swift), drawn and pressed: each reaches the product.
    @MainActor func testTheDocsExamplesReachTheProduct() async throws {
      try await withAutomation {
        var reserved: [String] = []
        let card = await host(
          ResultWithReservation(
            poi: poi, number: 1, reserveLabel: "Reserve a table", onSelect: { _ in },
            onReserve: { reserved.append($0) }))
        XCTAssertTrue(try element("Reserve a table", in: card).accessibilityActivate())
        card.isHidden = true
        var handedOff: [String] = []
        let panel = await host(
          DetailsWithHandOff(
            poi: poi, actionLabels: labels, handOffLabel: "Open in Pointr Express", onAction: { _, _ in },
            onHandOff: { handedOff.append($0) }))
        defer { panel.isHidden = true }
        XCTAssertTrue(try element("Open in Pointr Express", in: panel).accessibilityActivate())
        XCTAssertEqual(reserved, ["trattoria"])
        XCTAssertEqual(handedOff, ["trattoria"])
      }
    }
  #endif
}
