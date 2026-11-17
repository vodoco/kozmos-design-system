import SwiftUI
import XCTest
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// Decisions 188 and 191: a RadioGroup or SegmentedControl of a
/// multi-selection whose features chose different options has no option
/// selected, and shows and says "Multiple values" under its options, once; a
/// choice ends it, and "Reset to multiple values" brings it back. As React's
/// and Compose's do.
final class KozmosMixedGroupTests: XCTestCase {
    func testAMixedSegmentedControlShowsNoOptionChosen() {
        let mixed = KozmosSegmentedControl(selection: .constant(1), items: ["Hours", "Closed", "Always open"], mixed: true)
        XCTAssertEqual((0..<3).map { mixed.isSelected($0) }, [false, false, false])
        let chosen = KozmosSegmentedControl(selection: .constant(1), items: ["Hours", "Closed", "Always open"])
        XCTAssertEqual((0..<3).map { chosen.isSelected($0) }, [false, true, false])
    }

    #if os(iOS)
    private static let labels = ["Hours", "Closed", "Always open"]

    private enum Kind: CaseIterable { case radioGroup, segmentedControl }

    /// A group across a multi-selection, as Pointr Cloud's editors hold it:
    /// mixed until the visitor chooses, the reset offered after.
    private struct Edited: View {
        let kind: Kind
        var disabled = false
        @State var edit: Int?
        var body: some View {
            let mixed = edit == nil
            let reset = { edit = nil }
            switch kind {
            case .radioGroup:
                KozmosRadioGroup(mixed: mixed, onResetMixed: reset, disabled: disabled) {
                    ForEach(Array(KozmosMixedGroupTests.labels.enumerated()), id: \.offset) { index, label in
                        KozmosRadioGroupItem(
                            value: "\(index)",
                            label: label,
                            selection: Binding(get: { "\(edit ?? 0)" }, set: { edit = Int($0) }),
                            disabled: disabled
                        )
                    }
                }
            case .segmentedControl:
                KozmosSegmentedControl(
                    selection: Binding(get: { edit ?? 0 }, set: { edit = $0 }),
                    items: KozmosMixedGroupTests.labels,
                    size: .sm,
                    disabled: disabled,
                    mixed: mixed,
                    onResetMixed: reset
                )
            }
        }
    }

    @MainActor private func options(in window: UIWindow) -> [NSObject] {
        let found = elements(in: window)
        return Self.labels.compactMap { label in found.first { $0.accessibilityLabel == label } }
    }

    @MainActor private func chosen(in window: UIWindow) -> [String] {
        options(in: window).filter { $0.accessibilityTraits.contains(.selected) }.compactMap { $0.accessibilityLabel }
    }

    @MainActor private func said(_ words: String, in window: UIWindow) -> Int {
        elements(in: window).filter { $0.accessibilityLabel == words || $0.accessibilityValue == words }.count
    }

    @MainActor func testAMixedGroupSelectsNothingAndSaysMultipleValuesOnceUnderItsOptions() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        for kind in Kind.allCases {
            let window = host(Edited(kind: kind, edit: nil))
            defer { window.isHidden = true }
            let line = try await drawn("\(kind): the mixed line", in: window) {
                elements(in: window).first { $0.accessibilityLabel == "Multiple values" }
            }
            let options = try await drawn("\(kind): the options", in: window) {
                let found = self.options(in: window)
                return found.count == 3 ? found : nil
            }
            XCTAssertEqual(chosen(in: window), [], "\(kind): nothing selected while mixed; \(describe(elements(in: window)))")
            XCTAssertEqual(said("Multiple values", in: window), 1, "\(kind): said once")
            XCTAssertTrue(options.allSatisfy { $0.accessibilityFrame.maxY <= line.accessibilityFrame.minY + 0.5 },
                          "\(kind): the line is under the options")
            XCTAssertFalse(elements(in: window).contains { $0.accessibilityLabel == "Reset to multiple values" }, "\(kind): no reset while mixed")
        }
    }

    @MainActor func testAChoiceEndsItAndTheResetBringsItBack() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        for kind in Kind.allCases {
            let window = host(Edited(kind: kind, edit: nil))
            defer { window.isHidden = true }
            let closed = try await drawn("\(kind): Closed", in: window) {
                elements(in: window).first { $0.accessibilityLabel == "Closed" }
            }
            XCTAssertTrue(closed.accessibilityActivate(), "\(kind): Closed took no press")
            let reset = try await drawn("\(kind): the reset", in: window) {
                elements(in: window).first { $0.accessibilityLabel == "Reset to multiple values" }
            }
            XCTAssertEqual(chosen(in: window), ["Closed"], "\(kind): the choice shows")
            XCTAssertEqual(said("Multiple values", in: window), 0, "\(kind): no longer mixed")
            XCTAssertTrue(reset.accessibilityTraits.contains(.button), "\(kind): the reset is a button")

            XCTAssertTrue(reset.accessibilityActivate(), "\(kind): the reset took no press")
            _ = try await drawn("\(kind): the mixed line again", in: window) {
                elements(in: window).first { $0.accessibilityLabel == "Multiple values" }
            }
            XCTAssertEqual(chosen(in: window), [], "\(kind): nothing selected again")
            XCTAssertFalse(elements(in: window).contains { $0.accessibilityLabel == "Reset to multiple values" }, "\(kind): the reset goes")
        }
    }

    @MainActor func testNoResetWhileDisabled() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        for kind in Kind.allCases {
            let window = host(Edited(kind: kind, disabled: true, edit: 1))
            defer { window.isHidden = true }
            _ = try await drawn("\(kind): the options", in: window) {
                let found = self.options(in: window)
                return found.count == 3 ? found : nil
            }
            XCTAssertEqual(chosen(in: window), ["Closed"], "\(kind): its choice")
            XCTAssertFalse(elements(in: window).contains { $0.accessibilityLabel == "Reset to multiple values" }, "\(kind): no reset while disabled")
        }
    }

    @MainActor func testWithoutMixedTheGroupIsWhatItWas() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let views: [(String, AnyView)] = [
            ("RadioGroup", AnyView(KozmosRadioGroup {
                ForEach(Array(Self.labels.enumerated()), id: \.offset) { index, label in
                    KozmosRadioGroupItem(value: "\(index)", label: label, selection: .constant("1"))
                }
            })),
            ("SegmentedControl", AnyView(KozmosSegmentedControl(selection: .constant(1), items: Self.labels, size: .sm))),
        ]
        for (kind, view) in views {
            let window = host(view)
            defer { window.isHidden = true }
            _ = try await drawn("\(kind): the options", in: window) {
                let found = self.options(in: window)
                return found.count == 3 ? found : nil
            }
            XCTAssertEqual(chosen(in: window), ["Closed"], "\(kind): its choice")
            XCTAssertEqual(said("Multiple values", in: window), 0, "\(kind): nothing said of mixed")
        }
    }

    /// Waits until `find` finds what a test reads, however long a busy
    /// simulator takes to draw the view and build its accessibility tree.
    /// Polls every 50 ms for up to 10 s, then fails naming what was there.
    @MainActor private func drawn<T>(_ what: String, in window: UIWindow, _ find: () -> T?) async throws -> T {
        let deadline = Date().addingTimeInterval(10)
        while Date() <= deadline {
            if let found = find() { return found }
            try await Task.sleep(nanoseconds: 50_000_000)
        }
        return try XCTUnwrap(find(), "\(what) was never drawn: \(describe(elements(in: window)))")
    }

    @MainActor private func host<V: View>(_ view: V) -> UIWindow {
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 500))
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        return window
    }

    @MainActor private func describe(_ found: [NSObject]) -> String {
        found.map { "\($0.accessibilityLabel ?? "-")=\($0.accessibilityValue ?? "-")" }.joined(separator: ", ")
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
