import SwiftUI
import XCTest
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// Decision 104 (21 Oct): iOS keeps the system date and time pickers, inside
/// Kozmos fields, as React's pickers sit in its fields: a label, a status, a
/// helper, disabled and read-only, and bounds (React's `min` and `max`). The
/// range's end cannot come before its start, nor its start after its end, as
/// React bounds each by the other; its summary is the locale's own interval,
/// with no fixed English "to"; and its fields draw Kozmos's calendar icon.
///
/// The system picker is a `UIDatePicker` in the hosted view, so its bounds,
/// mode and enabled state are read from it, and the summary from the
/// accessibility tree, with automation on. The picker's own name and hint, the
/// field's label and helper, are SwiftUI's on the `DatePicker` (`labelsHidden`
/// keeps the label for VoiceOver): an in-process walk cannot read a UIKit
/// control's accessibility, as it cannot read inside a SwiftUI scroll view, so
/// these tests check only that the drawn label and helper are not said apart.
final class KozmosTemporalFieldTests: XCTestCase {
    #if os(iOS)
    private static let calendar = Calendar(identifier: .gregorian)
    private static func day(_ d: Int, _ m: Int = 1) -> Date {
        calendar.date(from: DateComponents(timeZone: TimeZone(identifier: "UTC"), year: 2026, month: m, day: d, hour: 12))!
    }
    private let start = day(25), end = day(29), earliest = day(5), latest = day(20, 2)

    // MARK: The range

    @MainActor func testTheRangesEndCannotComeBeforeItsStartNorItsStartAfterItsEnd() async throws {
        try await host(KozmosDateRangePicker(startDate: .constant(start), endDate: .constant(end))) { window in
            let (from, to) = try self.rangePickers(in: window)
            XCTAssertEqual(to.minimumDate, self.start, "the end's earliest day is not the start")
            XCTAssertEqual(from.maximumDate, self.end, "the start's latest day is not the end")
        }
    }

    @MainActor func testTheRangeKeepsItsBounds() async throws {
        let range = KozmosDateRangePicker(startDate: .constant(start), endDate: .constant(end),
                                          minimumDate: earliest, maximumDate: latest)
        try await host(range) { window in
            let (from, to) = try self.rangePickers(in: window)
            XCTAssertEqual(from.minimumDate, self.earliest)
            XCTAssertEqual(to.maximumDate, self.latest)
        }
    }

    /// The summary is the locale's own interval: no "to", no fixed US order.
    @MainActor func testTheRangesSummaryIsTheLocalesOwnInterval() async throws {
        for identifier in ["de_DE", "en_GB", "ja_JP", "ar_EG"] {
            let locale = Locale(identifier: identifier)
            let range = KozmosDateRangePicker(startDate: .constant(start), endDate: .constant(end), showsCalendarPreview: true)
                .environment(\.locale, locale)
            var style = Date.IntervalFormatStyle(date: .abbreviated, time: .omitted)
            style.locale = locale
            let expected = (start..<end).formatted(style)
            try await host(range, automation: true) { window in
                let labels = self.elements(window).compactMap(\.accessibilityLabel)
                XCTAssertTrue(labels.contains(expected), "\(identifier): no summary \"\(expected)\" among \(labels)")
                XCTAssertFalse(labels.contains("to"), "\(identifier): a fixed English \"to\" among \(labels)")
            }
        }
    }

    // MARK: Date and time

    @MainActor func testADatePickerIsAKozmosFieldAroundTheSystemPicker() async throws {
        let field = KozmosDatePicker(selection: .constant(start), label: "Visit date", helperText: "Weekdays only",
                                     minimumDate: earliest, maximumDate: latest)
        try await host(field, automation: true) { window in
            let picker = try XCTUnwrap(self.datePickers(in: window).first)
            XCTAssertEqual(picker.minimumDate, self.earliest)
            XCTAssertEqual(picker.maximumDate, self.latest)
            XCTAssertTrue(picker.isEnabled)
            // The drawn label and helper are not said apart from the picker,
            // which they name and describe.
            let said = self.elements(window).compactMap(\.accessibilityLabel)
            XCTAssertFalse(said.contains("Visit date") || said.contains("Weekdays only"), "said apart from the picker: \(said)")
            XCTAssertGreaterThan(window.rootViewController!.view.sizeThatFits(CGSize(width: 390, height: 1000)).height, 44 + 30,
                                 "the label and the helper are not drawn around the field")
        }
    }

    @MainActor func testATimePickerIsAKozmosFieldAroundTheSystemPicker() async throws {
        let field = KozmosTimePicker(selection: .constant(start), label: "Arrival time", helperText: "Opening hours apply",
                                     minimumDate: earliest, maximumDate: latest)
        try await host(field, automation: true) { window in
            let picker = try XCTUnwrap(self.datePickers(in: window).first)
            XCTAssertEqual(picker.datePickerMode, .time)
            XCTAssertEqual(picker.minimumDate, self.earliest)
            XCTAssertEqual(picker.maximumDate, self.latest)
            let said = self.elements(window).compactMap(\.accessibilityLabel)
            XCTAssertFalse(said.contains("Arrival time") || said.contains("Opening hours apply"), "said apart from the picker: \(said)")
            XCTAssertGreaterThan(window.rootViewController!.view.sizeThatFits(CGSize(width: 390, height: 1000)).height, 44 + 30,
                                 "the label and the helper are not drawn around the field")
        }
    }

    /// Disabled and read-only, the system picker takes no change.
    @MainActor func testDisabledAndReadOnlyFieldsTakeNoChange() async throws {
        for (disabled, readOnly) in [(true, false), (false, true)] {
            try await host(VStack {
                KozmosDatePicker(selection: .constant(start), label: "Date", disabled: disabled, readOnly: readOnly)
                KozmosTimePicker(selection: .constant(start), label: "Time", disabled: disabled, readOnly: readOnly)
            }) { window in
                let pickers = self.datePickers(in: window)
                XCTAssertEqual(pickers.count, 2)
                XCTAssertTrue(pickers.allSatisfy { !$0.isEnabled }, "disabled \(disabled), read-only \(readOnly): a picker takes changes")
            }
        }
    }

    // MARK: - Hosting and reading

    @MainActor private func host<V: View>(_ view: V, automation: Bool = false, check: (UIWindow) async throws -> Void) async throws {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get(); if automation { set(1) }; defer { set(old) }
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = UIHostingController(rootView: view.frame(width: 358).environment(\.timeZone, TimeZone(identifier: "UTC")!))
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 400_000_000)
        try await check(window)
    }

    /// The system pickers in the hosted view, leading first.
    @MainActor private func datePickers(in view: UIView) -> [UIDatePicker] {
        func walk(_ v: UIView) -> [UIDatePicker] { ((v as? UIDatePicker).map { [$0] } ?? []) + v.subviews.flatMap(walk) }
        return walk(view).sorted { $0.convert($0.bounds, to: nil).minX < $1.convert($1.bounds, to: nil).minX }
    }

    @MainActor private func rangePickers(in window: UIWindow) throws -> (UIDatePicker, UIDatePicker) {
        let pickers = datePickers(in: window)
        XCTAssertEqual(pickers.count, 2, "the range's system pickers")
        return (try XCTUnwrap(pickers.first), try XCTUnwrap(pickers.last))
    }

    @MainActor private func elements(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        if let values = node.accessibilityElements as? [NSObject], !values.isEmpty { return values.flatMap { elements($0) } }
        if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            return (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }.flatMap { elements($0) }
        }
        return ((node as? UIView)?.subviews ?? []).flatMap { elements($0) }
    }
    #endif
}
