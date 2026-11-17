import SwiftUI
import XCTest
@testable import Kozmos

#if os(iOS)
import Darwin
import UIKit
#endif

/// Decision 197 (GAP-218): a disabled Button is drawn from the disabled pair,
/// Semantics.Disabled, not at half. At half, a white label on the theme fill
/// read 2.24:1 on a white card. Every variant and emotion takes the pair's
/// foreground for its words, its mark and its spinner; a filled variant takes
/// the pair's fill under them; an outline keeps its ground and its edge takes
/// the foreground; ghost and link keep no fill; glass keeps the glass. A
/// loading part is disabled and draws the same. IconButton,
/// FloatingActionButton, SplitButton and MapControlButton follow it; a map
/// control's surface is its fill.
///
/// Each part is drawn on the page, background/0, in light and dark, and read
/// where it draws its own colour: the pixel is the token itself, so nothing
/// is drawn at half (half of the fill over the page is neither). Drawn
/// without a window by `DrawnPixels`, so these run in `swift test` on a Mac
/// as well as on the simulator; the hosted tests at the end read what UIKit
/// draws, button styles and `Menu` included.
final class KozmosDisabledPairTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    private static let schemes: [ColorScheme] = [.light, .dark]

    private static func hex(_ p: Pixel) -> String { String(format: "#%02X%02X%02X", p.r, p.g, p.b) }

    private static func near(_ a: Pixel, _ b: Pixel, within tolerance: Int) -> Bool {
        abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance && abs(Int(a.b) - Int(b.b)) <= tolerance
    }

    @MainActor private func draw<V: View>(_ view: V, _ scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(
            view
                .padding(16)
                .background(KozmosColors.primitivesColorsBackground0)
                .environment(\.colorScheme, scheme),
            scale: 3
        )
    }

    /// The point in `region` farthest from `colour`: where a word, a mark or
    /// an edge covers a pixel whole.
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

    /// The ink a part draws in `region`, on `ground`, is the disabled
    /// foreground; nil when it is.
    private static func inkProblem(_ name: String, _ scheme: ColorScheme, _ drawn: DrawnPixels, region: CGRect,
                                   on ground: Pixel, want: Pixel) -> String? {
        let point = inkPoint(in: drawn, region: region, awayFrom: ground)
        let ink = drawn.pixel(at: point)
        guard !near(ink, want, within: 4) else { return nil }
        return String(format: "%@, %@: its ink is %@, not the disabled foreground %@ (at %.1f,%.1f on %@)",
                      name, "\(scheme)", hex(ink), hex(want), point.x, point.y, hex(ground))
    }

    /// A filled part: a patch of its fill clear of its words is the disabled
    /// fill, whole, and its words are the disabled foreground.
    @MainActor private func filledProblems(_ name: String, _ view: AnyView, patch: (CGRect) -> CGRect) throws -> [String] {
        var problems: [String] = []
        for scheme in Self.schemes {
            let drawn = try draw(view, scheme)
            let fill = try DrawnPixels.resolved(KozmosColors.semanticsDisabledFill, in: scheme)
            let ink = try DrawnPixels.resolved(KozmosColors.semanticsDisabledForeground, in: scheme)
            // A few pixels of a shadow or an edge may match by chance: the
            // fill is a part's own size.
            guard let box = drawn.boundingBox(where: DrawnPixels.matches(fill, tolerance: 2)),
                  box.width > 16, box.height > 16 else {
                let page = drawn.pixel(at: CGPoint(x: 16 + 6, y: drawn.size.height / 2))
                problems.append("\(name), \(scheme): no pixel is the disabled fill \(Self.hex(fill)); it reads \(Self.hex(page))")
                continue
            }
            let region = patch(box)
            let area = Int(region.width * drawn.scale) * Int(region.height * drawn.scale)
            let matching = drawn.count(in: region, where: DrawnPixels.matches(fill, tolerance: 2))
            if matching != area {
                problems.append("\(name), \(scheme): \(matching) of \(area) pixels of its fill are the disabled fill \(Self.hex(fill))")
            }
            if let problem = Self.inkProblem(name, scheme, drawn, region: box.insetBy(dx: 2, dy: 2), on: fill, want: ink) {
                problems.append(problem)
            }
        }
        return problems
    }

    /// A part with no fill keeps the ground it has enabled (the page, on
    /// iOS), and its words are the disabled foreground. With `edge`, the
    /// colour an outline's edge is enabled, the edge is found where the
    /// enabled part draws it and read there: the disabled foreground.
    @MainActor private func unfilledProblems(_ name: String, edge: Color? = nil,
                                             _ make: (_ disabled: Bool) -> AnyView) throws -> [String] {
        var problems: [String] = []
        for scheme in Self.schemes {
            let enabled = try draw(make(false), scheme), drawn = try draw(make(true), scheme)
            let page = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme)
            let ink = try DrawnPixels.resolved(KozmosColors.semanticsDisabledForeground, in: scheme)
            let part = CGRect(origin: .zero, size: drawn.size).insetBy(dx: 16, dy: 16)
            var groundPoint = CGPoint(x: part.minX + 5, y: part.midY)
            if let edge {
                let colour = try DrawnPixels.resolved(edge, in: scheme)
                let step = 1 / enabled.scale
                let found = stride(from: step / 2, to: enabled.size.width / 2, by: step)
                    .map { CGPoint(x: $0, y: part.midY) }
                    .first { let p = enabled.pixel(at: $0); return Self.near(p, colour, within: 3) && p.a > 240 }
                if let point = found {
                    let now = drawn.pixel(at: point)
                    if !Self.near(now, ink, within: 4) {
                        problems.append(String(format: "%@'s edge, %@: %@, not the disabled foreground %@ (at %.1f,%.1f)",
                                               name, "\(scheme)", Self.hex(now), Self.hex(ink), point.x, point.y))
                    }
                    groundPoint = CGPoint(x: point.x + 5, y: part.midY)
                } else {
                    problems.append("\(name), \(scheme): the enabled part draws no edge in \(Self.hex(colour)) to read")
                }
            }
            // On a Mac a Button with no style of its own is AppKit's bordered
            // button, whose bezel AppKit draws lighter when disabled: the
            // ground is read where SwiftUI's own style is the borderless one.
            #if os(iOS)
            let was = enabled.pixel(at: groundPoint), ground = drawn.pixel(at: groundPoint)
            if !Self.near(ground, was, within: 2) {
                problems.append("\(name), \(scheme): its ground is \(Self.hex(ground)), not \(Self.hex(was)) as enabled")
            }
            #endif
            if let problem = Self.inkProblem(name, scheme, drawn, region: part.insetBy(dx: 8, dy: 4), on: page, want: ink) {
                problems.append(problem)
            }
        }
        return problems
    }

    private static let leading: (CGRect) -> CGRect = { CGRect(x: $0.minX + 4, y: $0.midY - 6, width: 8, height: 12) }
    private static let top: (CGRect) -> CGRect = { CGRect(x: $0.midX - 5, y: $0.minY + 4, width: 10, height: 6) }

    // MARK: Button

    /// Each filled variant, and an emotion on one, disabled: the disabled
    /// fill under the disabled foreground, in light and dark.
    @MainActor func testADisabledFilledButtonIsTheDisabledFillUnderTheDisabledForegroundInLightAndDark() throws {
        let buttons: [(String, AnyView)] = [
            ("default", AnyView(KozmosButton("Next", isDisabled: true, action: {}))),
            ("destructive", AnyView(KozmosButton("Delete", variant: .destructive, isDisabled: true, action: {}))),
            ("secondary", AnyView(KozmosButton("Later", variant: .secondary, isDisabled: true, action: {}))),
            ("subtle", AnyView(KozmosButton("Edit", variant: .subtle, isDisabled: true, action: {}))),
            ("subtle danger", AnyView(KozmosButton("Delete", variant: .subtle, emotion: .danger, isDisabled: true, action: {}))),
            ("themed", AnyView(KozmosButton("Next", emotion: .themed, isDisabled: true, action: {}))),
            ("success", AnyView(KozmosButton("Done", emotion: .success, isDisabled: true, action: {}))),
            ("informative", AnyView(KozmosButton("Details", emotion: .informative, isDisabled: true, action: {}))),
            ("alert", AnyView(KozmosButton("Check", emotion: .alert, isDisabled: true, action: {}))),
            ("neutral", AnyView(KozmosButton("Later", emotion: .neutral, isDisabled: true, action: {}))),
            ("destructive with a success emotion", AnyView(KozmosButton("Done", variant: .destructive, emotion: .success,
                                                                        isDisabled: true, action: {}))),
            ("default with an icon", AnyView(KozmosButton("Go", isDisabled: true, leadingIconName: "navigation-pointer-01", action: {}))),
            // Disabled from outside, as SwiftUI disables any control.
            ("default under .disabled", AnyView(KozmosButton("Next", action: {}).disabled(true))),
        ]
        var problems: [String] = []
        for (name, view) in buttons { problems += try filledProblems("a disabled \(name) Button", view, patch: Self.leading) }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// Outline keeps its ground and its edge takes the foreground; ghost and
    /// link gain no fill; each draws its words in the disabled foreground.
    @MainActor func testADisabledOutlineGhostOrLinkButtonKeepsItsGroundAndDrawsTheDisabledForegroundInLightAndDark() throws {
        let outline = KozmosColors.primitivesColorsForeground300
        let danger = KozmosColors.componentsSecondaryButtonsDangerButtonForegroundContentIdle
        var problems: [String] = []
        problems += try unfilledProblems("a disabled outline Button", edge: outline) {
            AnyView(KozmosButton("Directions", variant: .outline, isDisabled: $0, action: {}))
        }
        problems += try unfilledProblems("a disabled outline danger Button", edge: danger) {
            AnyView(KozmosButton("Delete", variant: .outline, emotion: .danger, isDisabled: $0, action: {}))
        }
        problems += try unfilledProblems("a disabled ghost Button") {
            AnyView(KozmosButton("Skip", variant: .ghost, isDisabled: $0, action: {}))
        }
        problems += try unfilledProblems("a disabled ghost success Button") {
            AnyView(KozmosButton("Skip", variant: .ghost, emotion: .success, isDisabled: $0, action: {}))
        }
        problems += try unfilledProblems("a disabled link Button") {
            AnyView(KozmosButton("Learn more", variant: .link, isDisabled: $0, action: {}))
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// Glass keeps the glass surface it stands on, as enabled, and draws its
    /// words in the disabled foreground.
    @MainActor func testADisabledGlassButtonKeepsTheGlassAndDrawsTheDisabledForegroundInLightAndDark() throws {
        var problems: [String] = []
        for scheme in Self.schemes {
            let enabled = try draw(KozmosButton("Share", variant: .glass, action: {}), scheme)
            let disabled = try draw(KozmosButton("Share", variant: .glass, isDisabled: true, action: {}), scheme)
            let ink = try DrawnPixels.resolved(KozmosColors.semanticsDisabledForeground, in: scheme)
            let part = CGRect(origin: .zero, size: disabled.size).insetBy(dx: 16, dy: 16)
            let point = CGPoint(x: part.minX + 6, y: part.midY)
            let was = enabled.pixel(at: point), now = disabled.pixel(at: point)
            // On a Mac AppKit's bordered bezel lies over the glass, and AppKit
            // draws it lighter when disabled (see `unfilledProblems`).
            #if os(iOS)
            if !Self.near(was, now, within: 2) {
                problems.append("a disabled glass Button, \(scheme): its surface is \(Self.hex(now)), not the glass's \(Self.hex(was))")
            }
            #endif
            if let problem = Self.inkProblem("a disabled glass Button", scheme, disabled, region: part.insetBy(dx: 8, dy: 4),
                                             on: now, want: ink) {
                problems.append(problem)
            }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// Loading, a Button is disabled and drawn as one: the same drawing as
    /// disabled and loading, the disabled fill, and its spinner and words in
    /// the disabled foreground.
    @MainActor func testALoadingButtonIsDrawnFromTheDisabledPairInLightAndDark() throws {
        var problems: [String] = []
        for scheme in Self.schemes {
            let loading = try draw(KozmosButton("Go", isLoading: true, action: {}), scheme)
            let both = try draw(KozmosButton("Go", isDisabled: true, isLoading: true, action: {}), scheme)
            if let difference = loading.largestDifference(from: both), difference > 2 {
                problems.append("a loading Button, \(scheme): drawn \(difference) levels off a disabled and loading one")
            }
        }
        problems += try filledProblems("a loading Button", AnyView(KozmosButton("Go", isLoading: true, action: {})), patch: Self.leading)
        problems += try filledProblems("a loading subtle Button",
                                       AnyView(KozmosButton("Go", variant: .subtle, isLoading: true, action: {})), patch: Self.leading)
        problems += try unfilledProblems("a loading outline Button", edge: KozmosColors.primitivesColorsForeground300) {
            AnyView(KozmosButton("Go", variant: .outline, isLoading: $0, action: {}))
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    // MARK: The rest of the family

    @MainActor func testADisabledOrLoadingIconButtonIsDrawnFromTheDisabledPairInLightAndDark() throws {
        var problems: [String] = []
        let filled: [(String, AnyView)] = [
            ("default", AnyView(KozmosIconButton(iconName: "plus", variant: .default, isDisabled: true, action: {}))),
            ("destructive", AnyView(KozmosIconButton(iconName: "trash", variant: .destructive, isDisabled: true, action: {}))),
            ("secondary", AnyView(KozmosIconButton(iconName: "plus", variant: .secondary, isDisabled: true, action: {}))),
            ("loading default", AnyView(KozmosIconButton(iconName: "plus", variant: .default, isLoading: true, action: {}))),
        ]
        for (name, view) in filled { problems += try filledProblems("a disabled \(name) IconButton", view, patch: Self.top) }
        problems += try unfilledProblems("a disabled ghost IconButton") {
            AnyView(KozmosIconButton(iconName: "plus", variant: .ghost, isDisabled: $0, action: {}))
        }
        problems += try unfilledProblems("a disabled link IconButton") {
            AnyView(KozmosIconButton(iconName: "plus", variant: .link, isDisabled: $0, action: {}))
        }
        problems += try unfilledProblems("a disabled outline IconButton", edge: KozmosColors.primitivesColorsForeground300) {
            AnyView(KozmosIconButton(iconName: "plus", variant: .outline, isDisabled: $0, action: {}))
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// The floating action button has no disabled parameter: SwiftUI's
    /// `.disabled` disables it, and it draws the pair.
    @MainActor func testADisabledFloatingActionButtonIsDrawnFromTheDisabledPairInLightAndDark() throws {
        let problems = try filledProblems("a disabled FloatingActionButton",
                                          AnyView(KozmosFloatingActionButton(action: {}).disabled(true)), patch: Self.top)
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// The action half, disabled with `.disabled`. `ImageRenderer` draws the
    /// menu half, a `Menu`, as a placeholder: the hosted test below reads it.
    @MainActor func testADisabledSplitButtonsActionHalfIsDrawnFromTheDisabledPairInLightAndDark() throws {
        let problems = try filledProblems("a disabled SplitButton's action half",
                                          AnyView(KozmosSplitButton(label: "Directions", mainAction: {}).disabled(true)),
                                          patch: Self.leading)
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// A map control's surface is its fill: disabled or loading, it is the
    /// disabled fill, and its mark and words the disabled foreground, tinted
    /// or filled, on, off or neither. An off toggle's words are already
    /// foreground/400, so the ink alone would not read as disabled.
    @MainActor func testADisabledOrLoadingMapControlIsDrawnFromTheDisabledPairInLightAndDark() throws {
        let controls: [(String, AnyView)] = [
            ("a disabled tinted control", AnyView(KozmosMapControlButton(label: "Zoom in", systemImage: "plus", isDisabled: true, action: {}))),
            ("a loading tinted control", AnyView(KozmosMapControlButton(label: "Follow", systemImage: "location", isLoading: true, action: {}))),
            ("a disabled tinted toggle that is on", AnyView(KozmosMapControlButton(label: "Focus", systemImage: "location",
                                                                                   pressed: true, isDisabled: true, action: {}))),
            ("a disabled tinted toggle that is off", AnyView(KozmosMapControlButton(label: "Focus", systemImage: "location",
                                                                                    pressed: false, isDisabled: true, action: {}))),
            ("a disabled filled control that is on", AnyView(KozmosMapControlButton(label: "Focus", systemImage: "location", emphasis: .filled,
                                                                                    pressed: true, isDisabled: true, action: {}))),
            ("a disabled filled control that is off", AnyView(KozmosMapControlButton(label: "Focus", systemImage: "location", emphasis: .filled,
                                                                                     pressed: false, isDisabled: true, action: {}))),
            ("a disabled labelled toggle that is off", AnyView(KozmosMapControlButton(label: "Focus", systemImage: "location", stateLabel: "Off",
                                                                                      presentation: .labelled, pressed: false,
                                                                                      isDisabled: true, action: {}))),
        ]
        var problems: [String] = []
        for (name, view) in controls {
            problems += try filledProblems(name, view) { CGRect(x: $0.minX + 3, y: $0.midY - 4, width: 4, height: 8) }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    // MARK: Hosted: what UIKit draws

    #if os(iOS)
    /// Hosted in UIKit, with the button styles SwiftUI picks there: the
    /// automatic style of an outline, ghost or link Button, the fill's of a
    /// filled one, and the `Menu` of SplitButton's menu half. None may dim
    /// the label again: the words are the disabled foreground itself.
    @MainActor func testHostedDisabledButtonsAndTheSplitButtonsMenuHalfDrawTheDisabledPairInLightAndDark() async throws {
        let size = CGSize(width: 240, height: 76)
        let parts: [(String, AnyView, Bool)] = [
            ("a disabled default Button", AnyView(KozmosButton("Next", isDisabled: true, action: {})), true),
            ("a disabled outline Button", AnyView(KozmosButton("Directions", variant: .outline, isDisabled: true, action: {})), false),
            ("a disabled ghost Button", AnyView(KozmosButton("Skip", variant: .ghost, isDisabled: true, action: {})), false),
            ("a disabled link Button", AnyView(KozmosButton("Learn more", variant: .link, isDisabled: true, action: {})), false),
            ("a disabled ghost IconButton", AnyView(KozmosIconButton(iconName: "plus", isDisabled: true, action: {})), false),
            ("a disabled FloatingActionButton", AnyView(KozmosFloatingActionButton(action: {}).disabled(true)), true),
        ]
        var problems: [String] = []
        for scheme in Self.schemes {
            let page = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme)
            let fill = try DrawnPixels.resolved(KozmosColors.semanticsDisabledFill, in: scheme)
            let ink = try DrawnPixels.resolved(KozmosColors.semanticsDisabledForeground, in: scheme)
            func host(_ view: AnyView) async throws -> RenderedPixels {
                try await RenderedPixels.render(
                    view.frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(KozmosColors.primitivesColorsBackground0)
                        .environment(\.colorScheme, scheme),
                    size: size)
            }
            func pixel(_ c: (r: UInt8, g: UInt8, b: UInt8)) -> Pixel { (c.r, c.g, c.b, 255) }
            /// The colour farthest from `ground` in `region`.
            func farthest(_ drawn: RenderedPixels, _ region: CGRect, from ground: Pixel) -> Pixel {
                var best: Pixel = ground, distance = -1
                let step = 1 / drawn.scale
                var y = region.minY + step / 2
                while y < region.maxY {
                    var x = region.minX + step / 2
                    while x < region.maxX {
                        let p = pixel(drawn.color(at: CGPoint(x: x, y: y)))
                        let d = max(abs(Int(p.r) - Int(ground.r)), abs(Int(p.g) - Int(ground.g)), abs(Int(p.b) - Int(ground.b)))
                        if d > distance { distance = d; best = p }
                        x += step
                    }
                    y += step
                }
                return best
            }
            let whole = CGRect(origin: .zero, size: size)
            for (name, view, filled) in parts {
                let drawn = try await host(view)
                let ground: Pixel
                let region: CGRect
                if filled {
                    guard let box = drawn.boundingBox(in: whole, where: { r, g, b in
                        Self.near((r, g, b, 255), fill, within: 2)
                    }), box.width > 16, box.height > 16 else {
                        problems.append("\(name), \(scheme), hosted: no pixel is the disabled fill \(Self.hex(fill))")
                        continue
                    }
                    ground = fill
                    region = box.insetBy(dx: 2, dy: 2)
                } else {
                    ground = page
                    region = whole.insetBy(dx: 8, dy: 8)
                }
                let found = farthest(drawn, region, from: ground)
                if !Self.near(found, ink, within: 4) {
                    problems.append("\(name), \(scheme), hosted: its ink is \(Self.hex(found)), not the disabled foreground \(Self.hex(ink))")
                }
            }
            // The SplitButton: both halves are the disabled fill, and the
            // menu half's chevron is the disabled foreground.
            let split = try await host(AnyView(KozmosSplitButton(label: "Directions", mainAction: {},
                                                                 menuItems: [("Share", {})]).disabled(true)))
            let fills = split.shapes(in: whole) { r, g, b in Self.near((r, g, b, 255), fill, within: 2) }
                .filter { $0.width > 20 && $0.height > 20 }
                .sorted { $0.minX < $1.minX }
            if fills.count != 2 {
                problems.append("a disabled SplitButton, \(scheme), hosted: \(fills.count) halves are the disabled fill \(Self.hex(fill)), not 2: \(fills)")
            }
            for (index, half) in fills.enumerated() {
                let found = farthest(split, half.insetBy(dx: 2, dy: 2), from: fill)
                if !Self.near(found, ink, within: 4) {
                    problems.append("a disabled SplitButton's \(index == 0 ? "action" : "menu") half, \(scheme), hosted: its ink is \(Self.hex(found)), not \(Self.hex(ink))")
                }
            }
        }
        XCTAssertTrue(problems.isEmpty, problems.joined(separator: "\n"))
    }

    /// Drawn from the pair, each part is still disabled: VoiceOver hears it
    /// dimmed (not enabled), and activating it does nothing.
    @MainActor func testEveryDisabledButtonFamilyPartIsStillHeardAsDimmedAndDoesNothing() async throws {
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
            ("Next", AnyView(KozmosButton("Next", isDisabled: true, action: ranAction("Button")))),
            ("Waiting", AnyView(KozmosButton("Waiting", variant: .outline, isLoading: true, action: ranAction("loading Button")))),
            ("Add", AnyView(KozmosIconButton(iconName: "plus", variant: .default, isDisabled: true, action: ranAction("IconButton"))
                .accessibilityLabel("Add"))),
            ("Add place", AnyView(KozmosFloatingActionButton(action: ranAction("FloatingActionButton"))
                .accessibilityLabel("Add place").disabled(true))),
            ("Directions", AnyView(KozmosSplitButton(label: "Directions", mainAction: ranAction("SplitButton")).disabled(true))),
            ("Zoom in", AnyView(KozmosMapControlButton(label: "Zoom in", systemImage: "plus", isLoading: true, action: ranAction("map control")))),
        ]
        var problems: [String] = []
        for part in parts {
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
            window.rootViewController = UIHostingController(rootView: part.view.frame(width: 340).offset(x: 20, y: 100))
            window.makeKeyAndVisible()
            for _ in 0..<10 { try? await Task.sleep(nanoseconds: 30_000_000) }
            guard let element = elements(window).first(where: { ($0.accessibilityLabel ?? "").hasPrefix(part.label) }) else {
                problems.append("\(part.label): no element is heard, among \(elements(window).compactMap(\.accessibilityLabel))")
                window.isHidden = true
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
