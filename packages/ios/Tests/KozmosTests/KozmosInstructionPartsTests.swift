#if os(iOS)
  import XCTest
  import SwiftUI
  import UIKit
  import Darwin
  @testable import Kozmos

  final class KozmosInstructionPartsTests: XCTestCase {
    @MainActor func testComponentsRetainForeignSpeechRangesAndActions() async throws {
      // Same test-only accessibility automation switch used by the existing native suite.
      typealias Get = @convention(c) () -> Int32
      typealias Set = @convention(c) (Int32) -> Void
      let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
      let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
      let set = unsafeBitCast(
        try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
      let old = get()
      set(1)
      defer { set(old) }
      let fixtures = [
        [
          KozmosInstructionPart(text: "عند 📍 "),
          KozmosInstructionPart(text: "Lumen Books", lang: "en-GB"),
          KozmosInstructionPart(text: " على يسارك", role: .secondary),
          KozmosInstructionPart(text: " انعطف يميناً"),
        ],
        [
          KozmosInstructionPart(text: "Biegen Sie bei "),
          KozmosInstructionPart(text: "Lumen Books", lang: "en-GB"),
          KozmosInstructionPart(text: " auf der linken Seite", role: .secondary),
          KozmosInstructionPart(text: " rechts ab"),
        ],
        [
          KozmosInstructionPart(text: "左側の", role: .secondary),
          KozmosInstructionPart(text: "Lumen Books", lang: "en-GB"),
          KozmosInstructionPart(text: "で右折してください"),
        ],
      ]
      for parts in fixtures {
        for kind in 0..<3 {
          var activations = 0
          let content: AnyView
          switch kind {
          case 0: content = AnyView(KozmosDirectionStep(type: .right, instruction: parts))
          case 1:
            content = AnyView(
              KozmosItinerary(
                origin: "Start",
                steps: [
                  KozmosItineraryStep(id: "one", instruction: parts, type: .right, isCurrent: true)
                ], destination: "End"))
          default:
            content = AnyView(
              KozmosManoeuvreCard(
                type: .right, instruction: parts, isExpanded: false, onToggle: { activations += 1 }
              ) { EmptyView() })
          }
          let sentence = parts.map(\.text).joined()
          let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
          window.rootViewController = UIHostingController(
            rootView: content.frame(width: 320).offset(x: 20, y: 100))
          window.makeKeyAndVisible()
          defer { window.isHidden = true }
          for _ in 0..<10 {
            RunLoop.main.run(until: Date().addingTimeInterval(0.03))
            await Task.yield()
          }
          let matches = elements(window).filter { $0.accessibilityLabel == sentence }
          XCTAssertEqual(
            matches.count, 1, "One complete instruction, not duplicate accessible fragments")
          let node = try XCTUnwrap(matches.first)
          let range = (sentence as NSString).range(of: "Lumen Books")
          let spoken = try XCTUnwrap(node.accessibilityAttributedLabel)
          XCTAssertEqual(
            spoken.attribute(.accessibilitySpeechLanguage, at: range.location, effectiveRange: nil)
              as? String, "en-GB")
          XCTAssertGreaterThan(node.accessibilityFrame.width, 250)
          XCTAssertGreaterThan(node.accessibilityFrame.minY, 100)
          if kind == 1 { XCTAssertTrue(node.accessibilityTraits.contains(.selected)) }
          if kind == 2 {
            XCTAssertTrue(node.accessibilityTraits.contains(.button))
            XCTAssertTrue(node.accessibilityActivate())
            XCTAssertEqual(activations, 1)
          }
        }
      }
    }

    func testInstructionDataAndSuffixDoNotChangeOrderingOrSpeechRanges() {
      let parts = [
        KozmosInstructionPart(text: "📍 "),
        KozmosInstructionPart(text: "Bean & Leaf Café", role: .secondary, lang: "en"),
        KozmosInstructionPart(text: " へ"),
      ]
      let step = KozmosItineraryStep(id: "one", instruction: parts, type: .right)
      XCTAssertEqual(step.instruction, "📍 Bean & Leaf Café へ")
      XCTAssertEqual(step.instructionParts, parts)
      let words = kozmosInstructionSpokenText(parts, suffix: ["", "20 m"])
      XCTAssertEqual(words.string, "📍 Bean & Leaf Café へ, 20 m")
      var range = NSRange()
      XCTAssertEqual(
        words.attribute(.accessibilitySpeechLanguage, at: 3, effectiveRange: &range) as? String,
        "en")
      XCTAssertEqual(range, NSRange(location: 3, length: ("Bean & Leaf Café" as NSString).length))
      XCTAssertEqual(kozmosInstructionDescription([], suffix: ["", "20 m"]), "20 m")
      XCTAssertEqual(
        KozmosItineraryStep(id: "old", instruction: "Turn right", type: .right).instruction,
        "Turn right")
    }

    @MainActor func testSpeechElementTracksHostMovementAndUpdatedInstruction() async throws {
      typealias Set = @convention(c) (Int32) -> Void
      typealias Get = @convention(c) () -> Int32
      let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
      let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
      let set = unsafeBitCast(
        try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
      let old = get()
      set(1)
      defer { set(old) }
      let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
      func content(_ name: String, width: CGFloat, y: CGFloat) -> AnyView {
        AnyView(
          KozmosDirectionStep(
            type: .right,
            instruction: [
              KozmosInstructionPart(text: "Bei "), KozmosInstructionPart(text: name, lang: "en-GB"),
            ]
          ).frame(width: width).offset(y: y))
      }
      let host = UIHostingController(rootView: content("First", width: 300, y: 0))
      window.rootViewController = host
      window.makeKeyAndVisible()
      defer { window.isHidden = true }
      for _ in 0..<10 {
        RunLoop.main.run(until: Date().addingTimeInterval(0.03))
        await Task.yield()
      }
      let first = try XCTUnwrap(elements(window).first { $0.accessibilityLabel == "Bei First" })
      let before = first.accessibilityFrame
      host.rootView = content("Second", width: 260, y: 90)
      for _ in 0..<10 {
        RunLoop.main.run(until: Date().addingTimeInterval(0.03))
        await Task.yield()
      }
      let after = try XCTUnwrap(elements(window).first { $0.accessibilityLabel == "Bei Second" })
      XCTAssertEqual(after.accessibilityFrame.minY - before.minY, 90, accuracy: 1)
      XCTAssertEqual(after.accessibilityFrame.width, 260, accuracy: 1)
      XCTAssertFalse(elements(window).contains { $0.accessibilityLabel == "Bei First" })
      XCTAssertEqual(
        after.accessibilityAttributedLabel?.attribute(
          .accessibilitySpeechLanguage, at: 4, effectiveRange: nil) as? String, "en-GB")
    }

    @MainActor func testSecondaryTextRendersWithSurfaceContrastAndLargeType() throws {
      for dark in [false, true] {
        for rtl in [false, true] {
          for surface in [KozmosSurfaceStyle.solid, .glass] {
            let parts =
              rtl
              ? [
                KozmosInstructionPart(text: "عند "),
                KozmosInstructionPart(text: "Lumen Books", lang: "en"),
                KozmosInstructionPart(text: " على يسارك", role: .secondary),
                KozmosInstructionPart(text: " انعطف يميناً"),
              ]
              : [
                KozmosInstructionPart(text: "Biegen Sie bei "),
                KozmosInstructionPart(text: "Marlow Pharmacy", lang: "en"),
                KozmosInstructionPart(text: " auf der linken Seite", role: .secondary),
                KozmosInstructionPart(text: " rechts ab"),
              ]
            let content = KozmosInstructionText(parts: parts)
              .font(KozmosTypography.title3.weight(.semibold))
              .foregroundColor(KozmosColors.primitivesColorsForeground100)
              .padding(16).frame(width: 320, height: 300, alignment: .topLeading)
              .background(KozmosColors.primitivesColorsBackground0)
              .environment(\.kozmosSurfaceStyle, surface)
              .environment(\.layoutDirection, rtl ? .rightToLeft : .leftToRight)
              .environment(\.colorScheme, dark ? .dark : .light)
              .environment(\.dynamicTypeSize, .xxxLarge)
            let renderer = ImageRenderer(content: content)
            renderer.scale = 3
            renderer.proposedSize = ProposedViewSize(width: 320, height: 300)
            let image = try XCTUnwrap(renderer.uiImage)
            let pixels = try RenderedPixels(image, pointWidth: 320)
            let attachment = XCTAttachment(image: pixels.image)
            attachment.name = "instruction-\(dark)-\(rtl)-\(surface)"
            attachment.lifetime = .keepAlways
            add(attachment)
            let ink = pixels.count(in: CGRect(x: 16, y: 16, width: 288, height: 260)) { r, g, b in
              dark ? (r > 160 && g > 160 && b > 160) : (r < 160 && g < 160 && b < 160)
            }
            XCTAssertGreaterThan(ink, 100, "The text must actually render")
            let primaryInk = pixels.count(
              in: CGRect(x: rtl ? 260 : 16, y: 16, width: 44, height: 30)
            ) { r, g, b in
              dark ? (r > 180 && g > 180 && b > 180) : (r < 60 && g < 60 && b < 60)
            }
            XCTAssertGreaterThan(
              primaryInk, 30,
              "Primary fragments must retain the theme foreground, not disappear on dark solid surfaces"
            )
          }
        }
      }
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
  }
#endif
