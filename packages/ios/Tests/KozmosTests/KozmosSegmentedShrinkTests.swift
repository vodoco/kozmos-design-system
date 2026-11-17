import SwiftUI
import XCTest
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// GAP-267, decision 201: SegmentedControl's options keep 97, 117 or 137pt
/// by size when there is room, and shrink toward their words when the space
/// is short, never past them: no word is cut short or runs into the next
/// option's. Three small options took 3 × 97 + 8 and ran past a 296 column
/// (the opening hours editor's narrow day). Read from each option's
/// accessibility frame, where it is drawn, against its words: the label in
/// the option's font with its padding.
final class KozmosSegmentedShrinkTests: XCTestCase {
    #if os(iOS)
    private static let english = ["Hours", "Closed", "Always open"]
    private static let german = ["Öffnungszeiten", "Geschlossen", "Immer geöffnet"]

    /// An option's words: its label at `size` points, medium, with `padding` a side.
    @MainActor private func words(_ label: String, size: CGFloat, padding: CGFloat) -> CGFloat {
        let text = Text(label).font(.system(size: size, weight: .medium)).lineLimit(1).padding(.horizontal, padding)
        return UIHostingController(rootView: text).sizeThatFits(in: CGSize(width: CGFloat.infinity, height: .infinity)).width
    }

    /// The control in a column `width` wide; each option's drawn frame.
    @MainActor private func drawn(
        _ labels: [String], in width: CGFloat, size: KozmosSegmentedControlSize = .sm
    ) async throws -> (frames: [CGRect], window: UIWindow) {
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 640, height: 300))
        window.rootViewController = UIHostingController(
            rootView: KozmosSegmentedControl(selection: .constant(0), items: labels, size: size)
                .frame(width: width)
        )
        window.makeKeyAndVisible()
        let deadline = Date().addingTimeInterval(10)
        while Date() <= deadline {
            let found = elements(in: window)
            let frames = labels.compactMap { label in found.first { $0.accessibilityLabel == label }?.accessibilityFrame }
            if frames.count == labels.count { return (frames, window) }
            try await Task.sleep(nanoseconds: 50_000_000)
        }
        XCTFail("the options were never drawn")
        return ([], window)
    }

    /// Each option at least its words and none over the next.
    private func assertWordsWhole(_ frames: [CGRect], _ words: [CGFloat], _ what: String) {
        for (i, frame) in frames.enumerated() {
            XCTAssertGreaterThanOrEqual(frame.width, words[i] - 0.5, "\(what): option \(i + 1) is narrower than its words")
            if i + 1 < frames.count {
                XCTAssertLessThanOrEqual(frame.maxX, frames[i + 1].minX + 0.5, "\(what): option \(i + 1) runs into the next")
            }
        }
    }

    @MainActor func testWithRoomOptionsKeepTheirMinimumOrTheirWords() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        for (size, minimum, font, padding) in [
            (KozmosSegmentedControlSize.sm, CGFloat(97), CGFloat(12), CGFloat(12)),
            (.default, 117, 14, 16),
            (.lg, 137, 14, 20),
        ] {
            for labels in [Self.english, Self.german] {
                let (frames, window) = try await drawn(labels, in: 600, size: size)
                defer { window.isHidden = true }
                let words = labels.map { self.words($0, size: font, padding: padding) }
                print("measured \(size) \(labels[0]) 600: options \(frames.map(\.width)) pt, words \(words) pt")
                for (i, frame) in frames.enumerated() {
                    XCTAssertEqual(frame.width, max(minimum, words[i]), accuracy: 1, "\(size) \(labels[i])")
                }
                assertWordsWhole(frames, words, "\(size)")
            }
        }
    }

    @MainActor func testThreeSmallEnglishOptionsFitA296Column() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let (frames, window) = try await drawn(Self.english, in: 296)
        defer { window.isHidden = true }
        let words = Self.english.map { self.words($0, size: 12, padding: 12) }
        let widths = frames.map(\.width)
        print("measured en 296: options \(widths) pt, words \(words) pt")
        // The track's 4 of padding a side; the column's own edges.
        XCTAssertLessThanOrEqual(widths.reduce(0, +), 296 - 8 + 0.5, "the options take more than the track: \(widths)")
        XCTAssertLessThan(widths.min() ?? 0, 97, "no option gave up any of its 97: \(widths)")
        let column = window.convert(CGRect(x: (640 - 296) / 2, y: 0, width: 296, height: 1), to: nil)
        XCTAssertTrue(frames.allSatisfy { $0.minX >= column.minX - 0.5 && $0.maxX <= column.maxX + 0.5 },
                      "an option runs past the column: \(frames) in \(column)")
        assertWordsWhole(frames, words, "en 296")
    }

    @MainActor func testGermanSmallOptionsShrinkToTheirWords() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let (frames, window) = try await drawn(Self.german, in: 296)
        defer { window.isHidden = true }
        let words = Self.german.map { self.words($0, size: 12, padding: 12) }
        print("measured de 296: options \(frames.map(\.width)) pt, words \(words) pt")
        assertWordsWhole(frames, words, "de 296")
        if words.reduce(0, +) + 8 > 296 {
            // Wider than the column at their words: each keeps its words.
            for (i, frame) in frames.enumerated() {
                XCTAssertEqual(frame.width, words[i], accuracy: 1, Self.german[i])
            }
        } else {
            XCTAssertLessThanOrEqual(frames.map(\.width).reduce(0, +), 296 - 8 + 0.5)
        }
    }

    @MainActor private func elements(in node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        let children: [NSObject]
        if let items = node.accessibilityElements as? [NSObject], !items.isEmpty { children = items }
        else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        } else if let view = node as? UIView { children = view.subviews }
        else { children = [] }
        return children.flatMap { elements(in: $0) }
    }

    private static let accessibility = dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW)
    private func setAutomation(_ on: Int32) -> Int32? {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        guard let library = Self.accessibility,
              let get = dlsym(library, "_AXSAutomationEnabled"),
              let set = dlsym(library, "_AXSSetAutomationEnabled") else { return nil }
        let old = unsafeBitCast(get, to: Get.self)()
        unsafeBitCast(set, to: Set.self)(on)
        return old
    }
    #endif
}
