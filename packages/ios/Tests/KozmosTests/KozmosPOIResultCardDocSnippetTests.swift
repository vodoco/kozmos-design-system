import SwiftUI
import XCTest

@testable import Kozmos

#if os(iOS)
  import Darwin
  import UIKit
#endif

/// POIResultCard.mdx's SwiftUI example (DocSnippets/ResultWithSummary.swift),
/// drawn as well as compiled (GAP-125): the summary it passes is drawn, and
/// VoiceOver says it in the language its `summaryLanguage` names, a Spanish
/// one and an Arabic one on an English card.
final class KozmosPOIResultCardDocSnippetTests: XCTestCase {
  private let poi = KozmosPOIPresentation(
    id: "quiet-lounge", name: "Quiet Lounge", categoryLabel: "Lounge", floorLabel: "Level 2",
    availabilityLabel: "Open")
  private let summaries = [
    ("es", "La más tranquila de las tres salas, antes del control de seguridad."),
    ("ar", "أهدأ الصالات الثلاث، قبل نقطة التفتيش الأمني."),
  ]

  #if os(iOS)
    @MainActor func testTheDocsSnippetDrawsItsSummary() {
      func height(_ summary: String) -> CGFloat {
        let snippet = ResultWithSummary(
          poi: poi, number: 1, summary: summary, summaryLanguage: "es", onSelect: { _ in })
        return UIHostingController(rootView: snippet.frame(width: 320))
          .sizeThatFits(in: CGSize(width: 320, height: 2000)).height
      }
      // An empty summary is no summary, so the difference is the summary's.
      let none = height("")
      for (language, summary) in summaries {
        XCTAssertGreaterThan(height(summary) - none, 10, "The \(language) summary must be drawn")
      }
    }

    @MainActor func testVoiceOverSaysTheDocsSnippetsSummaryInItsLanguage() async throws {
      try await withAutomation {
        for (language, summary) in summaries {
          var selections: [String] = []
          let window = await host(
            AnyView(
              ResultWithSummary(
                poi: poi, number: 1, summary: summary, summaryLanguage: language,
                onSelect: { selections.append($0) })))
          defer { window.isHidden = true }
          let rows = elements(window).filter { ($0.accessibilityLabel ?? "").contains(summary) }
          XCTAssertEqual(rows.count, 1, "One element says the \(language) summary")
          let row = try XCTUnwrap(rows.first)
          let spoken = try XCTUnwrap(row.accessibilityAttributedLabel)
          XCTAssertEqual(speechLanguage(spoken, of: summary), language)
          // The card's own words are the interface's and carry no tag.
          XCTAssertNil(speechLanguage(spoken, of: "Quiet Lounge, Lounge, Level 2, "), language)
          XCTAssertTrue(row.accessibilityActivate())
          XCTAssertEqual(selections, ["quiet-lounge"], language)
        }
      }
    }

    /// Turns on the accessibility automation the native suite reads elements
    /// with, as KozmosPOIResultLanguageTests does.
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
      for _ in 0..<10 {
        try? await Task.sleep(nanoseconds: 30_000_000)
      }
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

    /// The speech language over exactly `words` in `spoken`, or nil when none is set there.
    private func speechLanguage(_ spoken: NSAttributedString, of words: String) -> String? {
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
  #endif
}
