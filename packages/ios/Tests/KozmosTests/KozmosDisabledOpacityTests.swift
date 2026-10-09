import SwiftUI
import XCTest
@testable import Kozmos

#if os(iOS)
import Darwin
import UIKit
#endif

/// A disabled part is drawn once at its own strength: half, as React's
/// `disabled:opacity-50` and Compose's are, or the 0.4 and 0.6 a part names
/// for itself. SwiftUI's plain button style already draws a disabled
/// button's label at half (measured on iPhone 17 Pro, iOS 26.5, and on a
/// Mac), so a part that also set `.opacity` for disabled was dimmed twice:
/// a quarter, 0.2 or 0.3. The map controls were worse off: their surface is
/// four copies one over another, and an opacity spread over them left it at
/// 68% tinted and 94% filled.
///
/// Each part is drawn enabled and disabled on a mid grey, in light and in
/// dark, and read where it draws its own colour: how far the disabled pixel
/// has moved towards what is under it. Drawn without a window by
/// `DrawnPixels`, so these run in `swift test` on a Mac as well as on the
/// simulator.
final class KozmosDisabledOpacityTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    /// The page every part is drawn on: none of their colours.
    private static let grey = Color(.sRGB, red: 0.5, green: 0.5, blue: 0.5, opacity: 1)
    /// How far a reading may stray: a level or two of rounding on the
    /// smallest difference read is under 0.02.
    private static let tolerance = 0.04

    @MainActor private func draw<V: View>(_ view: V, _ scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(
            view
                .padding(16)
                .background(Self.grey)
                .environment(\.colorScheme, scheme),
            scale: 3
        )
    }

    /// How strongly a part is drawn at a pixel: 1 where it is drawn as it is
    /// enabled, 0.5 halfway from that to what is under it, 0.25 a quarter of
    /// the way. Read in the channel where the part and what is under it
    /// differ most; nil where they differ by under 40 levels, too little to
    /// read.
    private static func strength(enabled e: Pixel, disabled d: Pixel, under u: Pixel) -> Double? {
        let channels = [(Int(e.r), Int(d.r), Int(u.r)), (Int(e.g), Int(d.g), Int(u.g)), (Int(e.b), Int(d.b), Int(u.b))]
        guard let widest = channels.max(by: { abs($0.0 - $0.2) < abs($1.0 - $1.2) }),
              abs(widest.0 - widest.2) >= 40 else { return nil }
        return Double(widest.1 - widest.2) / Double(widest.0 - widest.2)
    }

    /// The point in `region` where the drawing is farthest from `colour`:
    /// where a mark or a word covers a pixel whole.
    private static func inkPoint(in drawn: DrawnPixels, region: CGRect, awayFrom colour: Pixel) -> CGPoint {
        var best = CGPoint(x: region.midX, y: region.midY), farthest = -1
        let step = 1 / drawn.scale
        var y = region.minY + step / 2
        while y < region.maxY {
            var x = region.minX + step / 2
            while x < region.maxX {
                let p = drawn.pixel(at: CGPoint(x: x, y: y))
                let distance = max(abs(Int(p.r) - Int(colour.r)), abs(Int(p.g) - Int(colour.g)), abs(Int(p.b) - Int(colour.b)))
                if p.a > 240, distance > farthest { farthest = distance; best = CGPoint(x: x, y: y) }
                x += step
            }
            y += step
        }
        return best
    }

    /// The box, in points, of the pixels within a level or three of `token`.
    @MainActor private static func box(of token: Color, in drawn: DrawnPixels, _ scheme: ColorScheme) throws -> CGRect {
        let colour = try DrawnPixels.resolved(token, in: scheme)
        return try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(colour, tolerance: 3)),
                             "\(scheme): nothing is drawn in \(Self.hex(colour))")
    }

    private static func hex(_ p: Pixel) -> String { String(format: "#%02X%02X%02X", p.r, p.g, p.b) }

    /// What is wrong with a reading, if anything.
    private static func problem(_ what: String, _ scheme: ColorScheme, at point: CGPoint,
                                enabled: DrawnPixels, disabled: DrawnPixels, under: Pixel,
                                expected: Double) -> String? {
        let e = enabled.pixel(at: point), d = disabled.pixel(at: point)
        guard let s = strength(enabled: e, disabled: d, under: under) else {
            return "\(scheme): \(what) at \(point) is \(hex(e)) enabled, too close to \(hex(under)) under it to read"
        }
        guard abs(s - expected) > tolerance else { return nil }
        return String(format: "%@: %@ is drawn at %.2f, not %.2f (%@ enabled, %@ disabled, over %@, at %.1f,%.1f)",
                      "\(scheme)", what, s, expected, hex(e), hex(d), hex(under), point.x, point.y)
    }

    /// A part whose fill lies on the page: read just inside the fill's
    /// leading edge, where nothing is drawn over it.
    @MainActor private func fillOnThePageProblems<V: View>(
        _ what: String, fill token: Color, inset: CGFloat = 4, _ make: (Bool) -> V
    ) throws -> [String] {
        try [ColorScheme.light, .dark].compactMap { scheme in
            let enabled = try draw(make(false), scheme), disabled = try draw(make(true), scheme)
            let fill = try Self.box(of: token, in: enabled, scheme)
            let point = CGPoint(x: fill.minX + inset, y: fill.midY)
            return Self.problem(what, scheme, at: point, enabled: enabled, disabled: disabled,
                                under: enabled.pixel(at: CGPoint(x: 2, y: 2)), expected: 0.5)
        }
    }

    // MARK: The map control

    /// The control, the plain style's half and its own half, was drawn at a
    /// quarter, its four stacked surfaces at 68%; filled, at 94%. Drawn at
    /// half as one, every pixel of it is halfway to the page: its surface at
    /// its leading edge and at its top, and its mark.
    @MainActor func testADisabledOrLoadingMapControlIsDrawnAtHalfAsOneInLightAndDark() throws {
        // Each control, and whether its mark is read as well as its surface.
        let controls: [(String, Bool, (Bool) -> AnyView)] = [
            ("a disabled tinted control", true, { AnyView(KozmosMapControlButton(label: "Zoom in", systemImage: "plus", isDisabled: $0, action: {})) }),
            ("a loading tinted control", false, { AnyView(KozmosMapControlButton(label: "Zoom in", systemImage: "plus", isLoading: $0, action: {})) }),
            ("a disabled filled control that is on", true, {
                AnyView(KozmosMapControlButton(label: "Zoom in", systemImage: "plus", emphasis: .filled, pressed: true, isDisabled: $0, action: {}))
            }),
            // Its mark is grey, too near the page's grey to read: its surface is read.
            ("a disabled filled control that is off", false, {
                AnyView(KozmosMapControlButton(label: "Zoom in", systemImage: "plus", emphasis: .filled, pressed: false, isDisabled: $0, action: {}))
            }),
        ]
        var problems: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            for (name, marked, make) in controls {
                let enabled = try draw(make(false), scheme), disabled = try draw(make(true), scheme)
                let page = enabled.pixel(at: CGPoint(x: 2, y: 2))
                // The 48 square, inside the 16 of grey round it.
                let control = CGRect(x: 16, y: 16, width: 48, height: 48)
                var points = [CGPoint(x: control.minX + 6, y: control.midY), CGPoint(x: control.midX, y: control.minY + 6)]
                if marked {
                    // The mark: a loading control draws the spinner there instead.
                    let surface = enabled.pixel(at: points[0])
                    points.append(Self.inkPoint(in: enabled, region: control.insetBy(dx: 18, dy: 18), awayFrom: surface))
                }
                problems += points.compactMap {
                    Self.problem(name, scheme, at: $0, enabled: enabled, disabled: disabled, under: page, expected: 0.5)
                }
            }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    // MARK: The segmented control

    /// Disabled, the track is drawn at half on the page, and the selected
    /// segment and its words at half on what is under them: each part at
    /// half, as Compose draws the control at half. An opacity round the
    /// whole control, over the plain style's half, drew the segment and its
    /// words at a quarter.
    @MainActor func testADisabledSegmentedControlIsDrawnAtHalfInLightAndDark() throws {
        var problems: [String] = []
        let make = { (disabled: Bool) in KozmosSegmentedControl(selection: .constant(0), items: ["One", "Two"], disabled: disabled) }
        for scheme in [ColorScheme.light, .dark] {
            let enabled = try draw(make(false), scheme), disabled = try draw(make(true), scheme)
            let page = enabled.pixel(at: CGPoint(x: 2, y: 2))
            let segment = try Self.box(of: KozmosColors.primitivesColorsBackground0, in: enabled, scheme)
            // In the 4 of track before the segment, and in the segment's own
            // padding before its words.
            let trackPoint = CGPoint(x: segment.minX - 2, y: segment.midY)
            let segmentPoint = CGPoint(x: segment.minX + 3, y: segment.midY)
            problems += [Self.problem("the track", scheme, at: trackPoint, enabled: enabled, disabled: disabled,
                                      under: page, expected: 0.5)].compactMap { $0 }
            problems += [Self.problem("the selected segment", scheme, at: segmentPoint, enabled: enabled, disabled: disabled,
                                      under: disabled.pixel(at: trackPoint), expected: 0.5)].compactMap { $0 }
            // The words, on the segment as it is drawn disabled.
            let words = Self.inkPoint(in: enabled, region: segment.insetBy(dx: 8, dy: 8), awayFrom: enabled.pixel(at: segmentPoint))
            problems += [Self.problem("the selected segment's words", scheme, at: words, enabled: enabled, disabled: disabled,
                                      under: disabled.pixel(at: segmentPoint), expected: 0.5)].compactMap { $0 }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    // MARK: Parts the plain style already draws at half

    @MainActor func testADisabledNavigationItemIsDrawnAtHalfInLightAndDark() throws {
        let problems = try fillOnThePageProblems("a disabled selected item's fill", fill: KozmosColors.primitivesColorsBackground100) {
            KozmosNavigationItem(label: "Home", selected: true, disabled: $0).frame(width: 200)
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    @MainActor func testADisabledCategoryTileIsDrawnAtHalfInLightAndDark() throws {
        let problems = try fillOnThePageProblems("a disabled tile's square", fill: KozmosColors.primitivesColorsBackground0, inset: 6) {
            KozmosCategoryTile(category: KozmosCategoryPresentation(id: "cafes", label: "Cafés"), isDisabled: $0, onSelect: { _ in }) {
                Image(systemName: "cup.and.saucer")
            }
            .frame(width: 96)
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    @MainActor func testADisabledRouteOptionCardIsDrawnAtHalfInLightAndDark() throws {
        let option = KozmosRouteOptionPresentation(
            id: "quickest", label: "Quickest", durationSeconds: 60, durationLabel: "1 min",
            distanceMetres: 80, distanceLabel: "80 m", preference: .quickest)
        let problems = try fillOnThePageProblems("a disabled option's card", fill: KozmosColors.primitivesColorsBackground0) {
            KozmosRouteOptionCard(option: option, isDisabled: $0, onSelect: { _ in }).frame(width: 240)
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    @MainActor func testADisabledPOIDetailActionIsDrawnAtHalfInLightAndDark() throws {
        let problems = try fillOnThePageProblems("a disabled primary action's fill",
                                                 fill: KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle) {
            POIDetailActionButton(label: "Directions", systemImage: "arrow.turn.up.right", primary: true,
                                  state: .init(disabled: $0), action: {})
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    // MARK: Parts that dim themselves

    /// The chip is drawn at half while disabled, its remove button with it,
    /// as React's is; the plain style drew the button's mark at half again,
    /// to a quarter.
    @MainActor func testADisabledChipsRemoveMarkIsDrawnAtHalfWithTheChipInLightAndDark() throws {
        var problems: [String] = []
        let make = { (disabled: Bool) in KozmosChip(text: "Cafés", disabled: disabled, onRemove: {}) }
        for scheme in [ColorScheme.light, .dark] {
            let enabled = try draw(make(false), scheme), disabled = try draw(make(true), scheme)
            // The remove button's 20 square ends the chip's 12 of padding
            // before the 16 of grey.
            let centre = CGPoint(x: enabled.size.width - 16 - 12 - 10, y: enabled.size.height / 2)
            // Beside the mark, in the button's own square: the chip.
            let beside = CGPoint(x: centre.x + 8, y: centre.y)
            let mark = Self.inkPoint(in: enabled, region: CGRect(x: centre.x - 5, y: centre.y - 5, width: 10, height: 10),
                                     awayFrom: enabled.pixel(at: beside))
            problems += [Self.problem("the remove mark", scheme, at: mark, enabled: enabled, disabled: disabled,
                                      under: disabled.pixel(at: beside), expected: 0.5)].compactMap { $0 }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// A disabled level is drawn at 0.4, as Compose's is, on the selector's
    /// panel; the plain style drew it at half again, to 0.2.
    @MainActor func testADisabledLevelIsDrawnAt04InLightAndDark() throws {
        var problems: [String] = []
        let make = { (disabled: Bool) in
            KozmosFloorSelector(floors: [
                KozmosFloorPresentation(id: "1", label: "First floor", shortLabel: "1F", disabled: disabled),
                KozmosFloorPresentation(id: "G", label: "Ground floor", shortLabel: "GF"),
            ], selectedFloor: .constant("G"), variant: .verticalList)
        }
        for scheme in [ColorScheme.light, .dark] {
            let enabled = try draw(make(false), scheme), disabled = try draw(make(true), scheme)
            // The panel, in its padding above the first level.
            let panel = CGPoint(x: enabled.size.width / 2, y: 16 + 3)
            let level = CGRect(x: 16 + 6, y: 16 + 6, width: enabled.size.width - 44, height: 36)
            let word = Self.inkPoint(in: enabled, region: level, awayFrom: enabled.pixel(at: panel))
            problems += [Self.problem("the disabled level's label", scheme, at: word, enabled: enabled, disabled: disabled,
                                      under: disabled.pixel(at: panel), expected: 0.4)].compactMap { $0 }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// A stepper button with no level to step to is drawn at 0.4, as
    /// Compose's is; the plain style drew it at half again, to 0.2. The up
    /// button steps to the first floor while there is one, and to nothing
    /// when the ground floor is the only one.
    @MainActor func testAStepperButtonWithNowhereToStepIsDrawnAt04InLightAndDark() throws {
        var problems: [String] = []
        let make = { (disabled: Bool) in
            KozmosFloorSelector(floors: (disabled ? [] : [KozmosFloorPresentation(id: "1", label: "First floor", shortLabel: "1F")])
                                + [KozmosFloorPresentation(id: "G", label: "Ground floor", shortLabel: "GF")],
                                selectedFloor: .constant("G"), variant: .compactStepper)
        }
        for scheme in [ColorScheme.light, .dark] {
            let enabled = try draw(make(false), scheme), disabled = try draw(make(true), scheme)
            let panel = CGPoint(x: enabled.size.width / 2, y: 16 + 3)
            let up = CGRect(x: 16 + 6, y: 16 + 6, width: enabled.size.width - 44, height: 36)
            let chevron = Self.inkPoint(in: enabled, region: up, awayFrom: enabled.pixel(at: panel))
            problems += [Self.problem("the up chevron with nowhere to step", scheme, at: chevron, enabled: enabled, disabled: disabled,
                                      under: disabled.pixel(at: panel), expected: 0.4)].compactMap { $0 }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    private static let poi = KozmosPOIPresentation(id: "gate-12", name: "Gate 12", floorLabel: "Level 1")

    /// An unavailable result's row is drawn at 0.6, as React's
    /// `disabled:opacity-60`, on the card; the plain style drew it at half
    /// again, to 0.3.
    @MainActor func testAnUnavailableResultIsDrawnAt06InLightAndDark() throws {
        var problems: [String] = []
        let make = { (unavailable: Bool) in
            KozmosPOIResultCard(poi: Self.poi, result: KozmosPOIResultPresentation(poiId: "gate-12", resultIndex: 0,
                                                                                 available: unavailable ? false : nil),
                                onSelect: { _ in })
                .frame(width: 320)
        }
        for scheme in [ColorScheme.light, .dark] {
            let enabled = try draw(make(false), scheme), disabled = try draw(make(true), scheme)
            let row = CGRect(x: 16, y: 16, width: 320, height: enabled.size.height - 32).insetBy(dx: 6, dy: 6)
            // The card, in the row's 16 of padding at the side of the name.
            let words = Self.inkPoint(in: enabled, region: row, awayFrom: enabled.pixel(at: CGPoint(x: 16 + 4, y: row.midY)))
            let card = CGPoint(x: 16 + 4, y: words.y)
            problems += [Self.problem("an unavailable result's words", scheme, at: words, enabled: enabled, disabled: disabled,
                                      under: disabled.pixel(at: card), expected: 0.6)].compactMap { $0 }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// A selected result's disabled outline action is drawn at half, as
    /// every disabled Button is; the plain style the card set round it drew
    /// it at half again, to a quarter.
    @MainActor func testADisabledResultActionIsDrawnAtHalfInLightAndDark() throws {
        var problems: [String] = []
        let make = { (disabled: Bool) in
            KozmosPOIResultCard(poi: Self.poi, result: KozmosPOIResultPresentation(
                poiId: "gate-12", resultIndex: 0, selected: true,
                actions: [KozmosPOIResultActionPresentation(action: .share, label: "Share", disabled: disabled)]),
                                onSelect: { _ in }, onAction: { _, _ in })
                .frame(width: 320)
        }
        for scheme in [ColorScheme.light, .dark] {
            let enabled = try draw(make(false), scheme), disabled = try draw(make(true), scheme)
            // The action row: a 44 button between 8s, at the card's foot,
            // clear of the divider above it.
            let actions = CGRect(x: 16 + 6, y: enabled.size.height - 16 - 56, width: 320 - 12, height: 52)
            let card = CGPoint(x: 16 + 4, y: actions.midY)
            let ink = Self.inkPoint(in: enabled, region: actions, awayFrom: enabled.pixel(at: card))
            problems += [Self.problem("a disabled outline action", scheme, at: ink, enabled: enabled, disabled: disabled,
                                      under: disabled.pixel(at: CGPoint(x: card.x, y: ink.y)), expected: 0.5)].compactMap { $0 }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    // MARK: Still disabled

    #if os(iOS)
    /// Drawn at half once, each part is still disabled: VoiceOver hears
    /// "dimmed" (not enabled) on it, and activating it does nothing. Read
    /// with the accessibility automation the suite reads elements with, as
    /// KozmosPOIResultLanguageTests does.
    @MainActor func testEachDisabledPartIsStillHeardAsDimmedAndDoesNothing() async throws {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get()
        set(1)
        defer { set(old) }

        var ran: [String] = []
        let ranAction = { (name: String) in { ran.append(name) } }
        let parts: [(label: String, view: AnyView)] = [
            ("Zoom in", AnyView(KozmosMapControlButton(label: "Zoom in", systemImage: "plus", isDisabled: true, action: ranAction("map control")))),
            ("Focus", AnyView(KozmosMapControlButton(label: "Focus", systemImage: "location", emphasis: .filled, pressed: true,
                                                     isDisabled: true, action: ranAction("filled map control")))),
            ("Two", AnyView(KozmosSegmentedControl(selection: .constant(0), items: ["One", "Two"], disabled: true))),
            ("Home", AnyView(KozmosNavigationItem(label: "Home", disabled: true, action: ranAction("navigation item")))),
            ("Cafés", AnyView(KozmosCategoryTile(category: KozmosCategoryPresentation(id: "cafes", label: "Cafés"), isDisabled: true,
                                                 onSelect: { _ in ran.append("category tile") }) { Image(systemName: "cup.and.saucer") })),
            ("Quickest", AnyView(KozmosRouteOptionCard(option: KozmosRouteOptionPresentation(
                id: "quickest", label: "Quickest", durationSeconds: 60, durationLabel: "1 min",
                distanceMetres: 80, distanceLabel: "80 m", preference: .quickest), isDisabled: true,
                                                       onSelect: { _ in ran.append("route option") }))),
            ("Directions", AnyView(POIDetailActionButton(label: "Directions", systemImage: "arrow.turn.up.right", primary: true,
                                                         state: .init(disabled: true), action: ranAction("detail action")))),
            ("Remove Cafés", AnyView(KozmosChip(text: "Cafés", disabled: true, onRemove: ranAction("chip remove")))),
            ("First floor", AnyView(KozmosFloorSelector(floors: [
                KozmosFloorPresentation(id: "1", label: "First floor", shortLabel: "1F", disabled: true),
                KozmosFloorPresentation(id: "G", label: "Ground floor", shortLabel: "GF"),
            ], selectedFloor: .constant("G"), variant: .verticalList))),
            ("Floor up", AnyView(KozmosFloorSelector(floors: [KozmosFloorPresentation(id: "G", label: "Ground floor", shortLabel: "GF")],
                                                     selectedFloor: .constant("G"), variant: .compactStepper))),
            ("Gate 12", AnyView(KozmosPOIResultCard(poi: Self.poi, result: KozmosPOIResultPresentation(poiId: "gate-12", resultIndex: 0, available: false),
                                                    onSelect: { _ in ran.append("unavailable result") }))),
            ("Share", AnyView(KozmosPOIResultCard(poi: Self.poi, result: KozmosPOIResultPresentation(
                poiId: "gate-12", resultIndex: 0, selected: true,
                actions: [KozmosPOIResultActionPresentation(action: .share, label: "Share", disabled: true)]),
                                                  onSelect: { _ in }, onAction: { _, _ in ran.append("result action") }))),
        ]
        var problems: [String] = []
        for part in parts {
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
            window.rootViewController = UIHostingController(rootView: part.view.frame(width: 340).offset(x: 20, y: 100))
            window.makeKeyAndVisible()
            for _ in 0..<10 { try? await Task.sleep(nanoseconds: 30_000_000) }
            guard let element = elements(window).first(where: { ($0.accessibilityLabel ?? "").hasPrefix(part.label) }) else {
                problems.append("\(part.label): no element is heard, among \(elements(window).compactMap(\.accessibilityLabel))")
                continue
            }
            if !element.accessibilityTraits.contains(.notEnabled) {
                problems.append("\(part.label): heard as enabled")
            }
            _ = element.accessibilityActivate()
            for _ in 0..<3 { try? await Task.sleep(nanoseconds: 30_000_000) }
            window.isHidden = true
        }
        if !ran.isEmpty { problems.append("activating a disabled part ran: \(ran)") }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
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
