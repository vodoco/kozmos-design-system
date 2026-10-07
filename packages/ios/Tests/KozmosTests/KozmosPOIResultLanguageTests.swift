import SwiftUI
import XCTest

@testable import Kozmos

#if os(iOS)
  import Darwin
  import UIKit
#endif

/// GAP-125 and GAP-004 on iOS: a result's authored name and its generated
/// summary can each be in a language other than the interface's, and
/// VoiceOver must say each in its own voice. MAP-474 US2-EC1: a visitor asks
/// in Spanish on an English device, and the model writes the summary in
/// Spanish while every fixed label stays English.
final class KozmosPOIResultLanguageTests: XCTestCase {
  private let poi = KozmosPOIPresentation(
    id: "lounge", name: "空港ラウンジ", categoryLabel: "Lounge", floorLabel: "Level 2",
    availabilityLabel: "Open")
  private let summary = "La más tranquila de las tres salas, antes del control."

  private func result(
    selected: Bool = false, available: Bool? = nil, summary: String? = nil,
    nameLanguage: String? = "ja", summaryLanguage: String? = "es"
  ) -> KozmosPOIResultPresentation {
    KozmosPOIResultPresentation(
      poiId: "lounge", resultIndex: 1, selected: selected, available: available,
      nameLanguage: nameLanguage, summary: summary ?? self.summary,
      summaryLanguage: summaryLanguage)
  }

  func testSelectionKeepsBothLanguages() {
    // `selecting` rebuilds the struct field by field: a field it does not
    // list is dropped on every selection change, as badge and actions were.
    let selected = result().selecting("lounge")
    XCTAssertTrue(selected.selected)
    XCTAssertEqual(selected.nameLanguage, "ja")
    XCTAssertEqual(selected.summaryLanguage, "es")
    XCTAssertNil(KozmosPOIResultPresentation(poiId: "p", resultIndex: 1).summaryLanguage)
  }

  func testTheSummaryIsHeardAfterWhereThePlaceIs() {
    // The web's order: the name, its category, where it is, the summary,
    // then whether it is open.
    let card = KozmosPOIResultCard(poi: poi, result: result(), onSelect: { _ in })
    XCTAssertEqual(
      card.accessibilityDescription,
      "空港ラウンジ, Lounge, Level 2, \(summary), Open")
    // A selection label still replaces the whole name, summary and all.
    let named = KozmosPOIResultCard(
      poi: poi, result: result(), selectionLabel: "Choose the lounge", onSelect: { _ in })
    XCTAssertEqual(named.accessibilityDescription, "Choose the lounge")
    // An empty summary is no summary: no empty phrase, no stray comma.
    let empty = KozmosPOIResultCard(poi: poi, result: result(summary: ""), onSelect: { _ in })
    XCTAssertEqual(empty.accessibilityDescription, "空港ラウンジ, Lounge, Level 2, Open")
  }

  #if os(iOS)
    /// Turns on the accessibility automation the native suite reads elements
    /// with, as KozmosInstructionPartsTests does.
    @MainActor private func withAutomation(_ body: @MainActor () async throws -> Void) async throws {
      typealias Get = @convention(c) () -> Int32
      typealias Set = @convention(c) (Int32) -> Void
      let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
      let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
      let set = unsafeBitCast(
        try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
      let old = get()
      set(1)
      defer { set(old) }
      try await body()
    }

    @MainActor private func host(_ content: AnyView) async -> UIWindow {
      let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
      window.rootViewController = UIHostingController(
        rootView: content.frame(width: 340).offset(x: 20, y: 100))
      window.makeKeyAndVisible()
      // Suspends rather than spinning the run loop from inside an async
      // function, which Swift 6 refuses: the main run loop lays the window
      // out while this waits.
      for _ in 0..<10 {
        try? await Task.sleep(nanoseconds: 30_000_000)
      }
      return window
    }

    /// [node]'s accessibility identifier. SwiftUI's elements answer to the
    /// selector without adopting UIAccessibilityIdentification, so a cast to
    /// it reads nil for them whatever they carry.
    @MainActor private func identifier(of node: NSObject) -> String? {
      let selector = NSSelectorFromString("accessibilityIdentifier")
      guard node.responds(to: selector) else { return nil }
      return node.perform(selector)?.takeUnretainedValue() as? String
    }

    /// Every identifier set on [node] or under it, containers included.
    @MainActor private func identifiers(_ node: NSObject) -> [String] {
      let own = identifier(of: node).map { [$0] } ?? []
      let children: [NSObject]
      if let values = node.accessibilityElements as? [NSObject], !values.isEmpty {
        children = values
      } else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
        children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
      } else {
        children = (node as? UIView)?.subviews ?? []
      }
      return own.filter { !$0.isEmpty } + children.flatMap { identifiers($0) }
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

    private func language(_ spoken: NSAttributedString, of words: String) -> String? {
      let range = (spoken.string as NSString).range(of: words)
      XCTAssertNotEqual(range.location, NSNotFound, "\"\(words)\" is not in \"\(spoken.string)\"")
      guard range.location != NSNotFound else { return nil }
      var effective = NSRange()
      let lang =
        spoken.attribute(
          .accessibilitySpeechLanguage, at: range.location, effectiveRange: &effective)
        as? String
      if lang != nil {
        XCTAssertEqual(effective, range, "The tag must cover \"\(words)\" exactly")
      }
      return lang
    }

    @MainActor func testVoiceOverSaysTheNameAndTheSummaryInTheirOwnLanguages() async throws {
      try await withAutomation {
        let item = KozmosPOIResultListItem(poi: poi, result: result())
        // The card alone, in a list, and as a group's row: each draws the
        // result through KozmosPOIResultCard, and each must keep the tags.
        for kind in 0..<3 {
          var selections: [String] = []
          let content: AnyView
          switch kind {
          case 0:
            content = AnyView(
              KozmosPOIResultCard(poi: poi, result: result(), onSelect: { selections.append($0) }))
          case 1:
            content = AnyView(
              KozmosPOIResultList(
                items: [item], resultCountLabel: "1 result", onSelect: { selections.append($0) }))
          default:
            content = AnyView(
              KozmosPOIResultGroup(
                items: [item], expanded: true, onSelect: { selections.append($0) }))
          }
          let window = await host(content)
          defer { window.isHidden = true }
          let sentence = "空港ラウンジ, Lounge, Level 2, \(summary), Open"
          let matches = elements(window).filter { $0.accessibilityLabel == sentence }
          XCTAssertEqual(matches.count, 1, "One element says the result, once (kind \(kind))")
          let node = try XCTUnwrap(matches.first)
          let spoken = try XCTUnwrap(node.accessibilityAttributedLabel)
          XCTAssertEqual(language(spoken, of: summary), "es", "kind \(kind)")
          XCTAssertEqual(language(spoken, of: "空港ラウンジ"), "ja", "kind \(kind)")
          // The fixed labels are the interface's and carry no tag.
          XCTAssertNil(language(spoken, of: "Lounge, Level 2, "), "kind \(kind)")
          XCTAssertNil(language(spoken, of: ", Open"), "kind \(kind)")
          // It is the row: as wide as the card and below the offset, a
          // button, and activating it selects the result.
          XCTAssertGreaterThan(node.accessibilityFrame.width, 300)
          XCTAssertGreaterThan(node.accessibilityFrame.minY, 100)
          XCTAssertTrue(node.accessibilityTraits.contains(.button))
          XCTAssertTrue(node.accessibilityActivate())
          XCTAssertEqual(selections, ["lounge"])
          // Nothing else says the name or the summary a second time.
          let repeated = elements(window).filter {
            $0 !== node
              && (($0.accessibilityLabel ?? "").contains(summary)
                || ($0.accessibilityLabel ?? "").contains("空港ラウンジ"))
          }
          XCTAssertEqual(repeated.count, 0, "kind \(kind)")
        }
      }
    }

    @MainActor func testTheLanguageElementIsTheRowVoiceOverAlreadyKnew() async throws {
      // With a tag, a UIKit element says the row in place of SwiftUI's. Same
      // words, same traits (button, selected, dimmed when unavailable), same
      // identifier, so nothing but the voice changes.
      try await withAutomation {
        let states: [(String, Bool, Bool?)] = [
          ("at rest", false, nil), ("selected", true, nil), ("unavailable", false, false),
        ]
        for (name, selected, available) in states {
          @MainActor func read(_ tagged: Bool) async throws -> (
            String?, UIAccessibilityTraits, String?, [String]
          ) {
            let card = KozmosPOIResultCard(
              poi: poi,
              result: result(
                selected: selected, available: available,
                nameLanguage: tagged ? "ja" : nil, summaryLanguage: tagged ? "es" : nil),
              onSelect: { _ in })
            let window = await host(AnyView(card))
            defer { window.isHidden = true }
            let found = elements(window).first {
              $0.accessibilityLabel == card.accessibilityDescription
            }
            let node = try XCTUnwrap(found, "\(name), tagged: \(tagged)")
            return (
              node.accessibilityLabel, node.accessibilityTraits, identifier(of: node),
              identifiers(window)
            )
          }
          let plain = try await read(false)
          let tagged = try await read(true)
          XCTAssertEqual(tagged.0, plain.0, name)
          let traits: [(String, UIAccessibilityTraits)] = [
            ("button", .button), ("selected", .selected), ("not enabled", .notEnabled),
            ("static text", .staticText),
          ]
          for (trait, value) in traits {
            XCTAssertEqual(
              tagged.1.contains(value), plain.1.contains(value), "\(name): \(trait)")
          }
          // The row carries the card's identifier, tagged or not, and it is
          // the only one: a product's UI test finds the row by it.
          XCTAssertEqual(plain.2, kozmosPOIResultIdentifier("lounge"), "\(name): identifier")
          XCTAssertEqual(tagged.2, plain.2, "\(name): identifier")
          XCTAssertEqual(plain.3, [kozmosPOIResultIdentifier("lounge")], "\(name): identifiers")
          XCTAssertEqual(tagged.3, plain.3, "\(name): identifiers")
        }
      }
    }

    @MainActor func testTheCardDrawsTheSummaryInTwoLinesAtMost() {
      // The web's GAP-029: a scanned card shows the summary, clamped to two
      // lines so a long one never pushes the results below it down. The
      // place has enough lines that the card's 80pt minimum takes none of
      // the summary's height.
      func height(_ summary: String?) -> CGFloat {
        let card = KozmosPOIResultCard(
          poi: KozmosPOIPresentation(
            id: "p", name: "Pharmacy", categoryLabel: "Health", floorLabel: "Level 2",
            availabilityLabel: "Open"),
          result: KozmosPOIResultPresentation(poiId: "p", resultIndex: 1, summary: summary),
          onSelect: { _ in })
        let host = UIHostingController(rootView: card.frame(width: 320))
        return host.sizeThatFits(in: CGSize(width: 320, height: 2000)).height
      }
      let none = height(nil)
      XCTAssertEqual(height(""), none, accuracy: 0.5, "An empty summary draws nothing")
      let one = height("Open late.") - none
      let two =
        height(String(repeating: "Abierto hasta medianoche, junto a la puerta B. ", count: 12)) - none
      XCTAssertGreaterThan(one, 10, "The summary must be drawn")
      XCTAssertGreaterThan(two, one * 1.5, "A long summary takes a second line")
      XCTAssertLessThan(two, one * 2.5, "…and no third")
    }
  #endif
}
