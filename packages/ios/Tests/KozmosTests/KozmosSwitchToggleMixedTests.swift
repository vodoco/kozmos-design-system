import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// Decisions 188 to 190 (17 Nov 2026): a Switch and a ToggleButton standing
/// for several features that differ. A mixed switch is its track filled with
/// the theme fill as when on, no thumb, and Checkbox's white dash in its
/// middle; a mixed toggle is a dashed theme edge on the muted fill with a
/// dash before its label. iOS has no mixed state for a switch or a button
/// (UIKit's traits and SwiftUI's have none), so both say "Multiple values"
/// as their value, and the toggle is never selected. A tap turns either on.
///
/// The looks are drawn with `ImageRenderer` on a mid grey, light and dark, so
/// they run in `swift test` on a Mac as well; the hosted tests read what
/// VoiceOver is given, on the simulator.
final class KozmosSwitchToggleMixedTests: XCTestCase {
    private typealias RGBA = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    /// On a mid grey that is none of the parts' colours, so a white pixel
    /// can only be the dash or the thumb.
    @MainActor private func draw<V: View>(_ view: V, _ scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(
            view.padding(8).background(Color(white: 0.5)).environment(\.colorScheme, scheme),
            scale: 3)
    }

    // MARK: - What they say and do

    func testAMixedSwitchSaysMultipleValuesInPlaceOfOnOrOff() {
        XCTAssertEqual(KozmosSwitch(checked: .constant(true), mixed: true).stateWords, "Multiple values")
        XCTAssertEqual(KozmosSwitch(checked: .constant(false), mixed: true, mixedLabel: "Valeurs multiples").stateWords, "Valeurs multiples")
        XCTAssertEqual(KozmosSwitch(checked: .constant(true)).stateWords, "On")
    }

    func testTheResetIsOfferedOnceEditedAndNeverWhileDisabled() {
        XCTAssertFalse(KozmosSwitch(checked: .constant(false), mixed: true, onResetMixed: {}).showsReset)
        XCTAssertTrue(KozmosSwitch(checked: .constant(true), onResetMixed: {}).showsReset)
        XCTAssertFalse(KozmosSwitch(checked: .constant(true), disabled: true, onResetMixed: {}).showsReset)
        XCTAssertFalse(KozmosSwitch(checked: .constant(true)).showsReset)
        XCTAssertFalse(KozmosToggleButton(isOn: .constant(false), label: "Bold", mixed: true, onResetMixed: {}).showsReset)
        XCTAssertTrue(KozmosToggleButton(isOn: .constant(true), label: "Bold", onResetMixed: {}).showsReset)
    }

    // MARK: - What they draw

    @MainActor func testAMixedSwitchIsTheThemeFillWithACentredWhiteDashAndNoThumb() throws {
        for scheme in [ColorScheme.light, .dark] {
            let fill = try DrawnPixels.resolved(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle, in: scheme)
            let white = try DrawnPixels.resolved(KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle, in: scheme)
            let drawn = try draw(KozmosSwitch(checked: .constant(false), mixed: true), scheme)
            let track = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(fill)), "\(scheme): no theme fill")
            XCTAssertEqual(track.width, 46, accuracy: 1, "\(scheme): the track, edge and all")
            let dash = try XCTUnwrap(drawn.cropped(to: track).boundingBox(where: DrawnPixels.matches(white, tolerance: 40)),
                                     "\(scheme): no white in the track")
            // About 9.3 of 16 across and 1.3 tall; a thumb is a 20 disc.
            XCTAssertEqual(dash.width, 28.0 / 3.0, accuracy: 1.5, "\(scheme): the dash's length")
            XCTAssertLessThanOrEqual(dash.height, 2.5, "\(scheme): the white is a dash, not a thumb")
            XCTAssertEqual(dash.midX, track.width / 2, accuracy: 0.75, "\(scheme): centred across")
            XCTAssertEqual(dash.midY, track.height / 2, accuracy: 0.75, "\(scheme): on the middle line")
        }
    }

    @MainActor func testAnOnSwitchStillDrawsItsThumb() throws {
        let fill = try DrawnPixels.resolved(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle, in: .light)
        let drawn = try draw(KozmosSwitch(checked: .constant(true)), .light)
        let track = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(fill)))
        let white = try DrawnPixels.resolved(KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle, in: .light)
        let thumb = try XCTUnwrap(drawn.cropped(to: track).boundingBox(where: DrawnPixels.matches(white, tolerance: 40)))
        XCTAssertGreaterThanOrEqual(thumb.height, 18, "the thumb is a disc")
    }

    @MainActor func testAMixedToggleIsADashedThemeEdgeOnTheMutedFillWithADashBeforeItsLabel() throws {
        for scheme in [ColorScheme.light, .dark] {
            for variant in [KozmosToggleButton.Variant.default, .outline] {
                let name = "\(scheme) \(variant)"
                let edge = try DrawnPixels.resolved(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle, in: scheme)
                let muted = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground100, in: scheme)
                let ink = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground0, in: scheme)
                let drawn = try draw(KozmosToggleButton(isOn: .constant(false), label: "Bold", variant: variant, mixed: true), scheme)
                let fillBox = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(muted)), "\(name): no muted fill")
                let edgeBox = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(edge, tolerance: 40)), "\(name): no theme edge")
                XCTAssertLessThanOrEqual(edgeBox.minX, fillBox.minX + 0.5, "\(name): the edge rings the fill")
                XCTAssertGreaterThanOrEqual(edgeBox.maxX, fillBox.maxX - 0.5, "\(name): the edge rings the fill")
                // Dashed: along the middle of the top edge's 1pt line, the
                // theme fill comes and goes.
                let row = edgeBox.minY + 0.5
                var dashes = 0
                var inside = false
                var x = edgeBox.minX
                while x < edgeBox.maxX {
                    let p = drawn.pixel(at: CGPoint(x: x, y: row))
                    let on = DrawnPixels.matches(edge, tolerance: 60)(p.r, p.g, p.b, p.a)
                    if on && !inside { dashes += 1 }
                    inside = on
                    x += 1.0 / 3.0
                }
                XCTAssertGreaterThanOrEqual(dashes, 4, "\(name): the edge is dashed (\(dashes) dashes along its top)")
                // The first ink inside the fill is a level line: the dash.
                let inner = fillBox.insetBy(dx: 2, dy: 2)
                let lines = drawn.cropped(to: inner)
                let firstInk = try XCTUnwrap(lines.boundingBox(where: DrawnPixels.matches(ink, tolerance: 40)), "\(name): no ink")
                let dashColumn = lines.cropped(to: CGRect(x: firstInk.minX, y: 0, width: 4, height: inner.height))
                let dash = try XCTUnwrap(dashColumn.boundingBox(where: DrawnPixels.matches(ink, tolerance: 40)))
                XCTAssertLessThanOrEqual(dash.height, 2.5, "\(name): the first ink is a dash, \(dash.height) tall")
            }
        }
    }

    // MARK: - What VoiceOver is given

    #if os(iOS)
    private struct Product: View {
        @State var edit: Bool?
        var body: some View {
            VStack {
                KozmosSwitch(
                    checked: Binding(get: { edit ?? false }, set: { edit = $0 }),
                    label: "Step-free",
                    mixed: edit == nil,
                    onResetMixed: { edit = nil }
                )
                KozmosToggleButton(isOn: .constant(true), label: "Bold", mixed: true)
            }
        }
    }

    @MainActor func testVoiceOverHearsMultipleValuesAndATapTurnsTheSwitchOn() async throws {
        try await inspect(Product()) { window in
            let toggle = try await self.drawn("Bold", in: window)
            XCTAssertEqual(toggle.accessibilityValue, "Multiple values")
            XCTAssertFalse(toggle.accessibilityTraits.contains(.selected), "a mixed toggle is never selected")
            let mixed = try await self.drawn("Step-free", in: window)
            XCTAssertEqual(mixed.accessibilityValue, "Multiple values")
            XCTAssertTrue(mixed.accessibilityActivate())
            try await self.until("the switch turns on") {
                self.elements(window).first { $0.accessibilityLabel == "Step-free" }?.accessibilityValue == "On"
            }
            let reset = try await self.drawn("Reset to multiple values", in: window)
            XCTAssertTrue(reset.accessibilityActivate())
            try await self.until("the switch is mixed again") {
                self.elements(window).first { $0.accessibilityLabel == "Step-free" }?.accessibilityValue == "Multiple values"
            }
        }
    }

    @MainActor private func inspect<V: View>(_ view: V, check: (UIWindow) async throws -> Void) async throws {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get(); set(1); defer { set(old) }
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await check(window)
    }

    /// Waits, up to 10 s, until the element named `label` is in the tree.
    @MainActor private func drawn(_ label: String, in window: UIWindow) async throws -> NSObject {
        let deadline = Date().addingTimeInterval(10)
        while Date() <= deadline {
            if let found = elements(window).first(where: { $0.accessibilityLabel == label }) { return found }
            try await Task.sleep(nanoseconds: 50_000_000)
        }
        let names = elements(window).map { $0.accessibilityLabel ?? "-" }.joined(separator: ", ")
        return try XCTUnwrap(nil as NSObject?, "\(label) was never drawn among \(names)")
    }

    /// Waits until a change shows, for up to 10 s.
    @MainActor private func until(_ what: String, _ done: () -> Bool) async throws {
        let deadline = Date().addingTimeInterval(10)
        while !done() {
            if Date() > deadline { XCTFail("\(what) never happened"); return }
            try await Task.sleep(nanoseconds: 50_000_000)
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
    #endif
}
