import SwiftUI
import XCTest
@testable import Kozmos

/// Decisions 79 and 81 (Olcay, 15 Oct 2026): a featured place is a tile
/// holding its logo, `markerContent`, with no accent colour. The logo is
/// scaled to fit inside the 3 rim, never cropped, and clipped to the inner
/// radius, 13. A disabled marker is drawn at half, once, as a whole. VoiceOver
/// hears one element per marker, named by `label` and, on a tile,
/// `featuredLabel`, and never the logo on its own; a place, by its label alone.
///
/// The drawn tests use `DrawnPixels`, so they run in `swift test` on a Mac as
/// well as on the simulator; the hosted VoiceOver test runs on the simulator.
/// Against the pin before these decisions (with `place`, `onOpen` and
/// `openLabel` added and ignored) each fails: the record is in the change
/// that added them.
final class KozmosLocationPinFeaturedTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    /// Nothing in Kozmos is this green: what the logo draws.
    private static let logo: Pixel = (0, 0xFF, 0, 255)
    private static let logoColor = Color(.sRGB, red: 0, green: 1, blue: 0)
    private static let isLogo = DrawnPixels.matches(logo, tolerance: 8)

    @MainActor private func draw<V: View>(_ view: V, in scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(view.environment(\.colorScheme, scheme), scale: 3)
    }

    /// A logo twice as wide as it is tall, as an image: `width` × `width / 2`
    /// pixels of the logo's green.
    private static func wideLogo(width: Int = 200) throws -> CGImage {
        let height = width / 2
        let context = try XCTUnwrap(CGContext(
            data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
            space: CGColorSpace(name: CGColorSpace.sRGB)!,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue))
        context.setFillColor(CGColor(srgbRed: 0, green: 1, blue: 0, alpha: 1))
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        return try XCTUnwrap(context.makeImage())
    }

    /// A logo that fills what it is offered fills the area inside the rim,
    /// 38 (46 selected), with its corners clipped to the inner radius; the
    /// rim still shows round it. A wide image logo is scaled to fit that
    /// area, whole, not cropped to fill it.
    @MainActor func testTheLogoFitsInsideTheRimUncroppedAndClippedToItsInnerCorners() throws {
        let wide = try Self.wideLogo()
        for scheme in [ColorScheme.light, .dark] {
            for (selected, inner) in [(false, CGFloat(38)), (true, 46)] {
                let name = "\(scheme), selected \(selected)"
                let filling = try draw(KozmosLocationPin(selected: selected, featured: true,
                                                         markerContent: AnyView(Self.logoColor)), in: scheme)
                guard let box = filling.boundingBox(where: Self.isLogo) else {
                    XCTFail("\(name): a filling logo draws nothing")
                    continue
                }
                // A radius-13 corner leaves 13 × (1 - 1/√2) ≈ 3.8 clear along
                // the diagonal: 2 in from each side is outside it.
                let corners = [
                    CGPoint(x: box.minX + 2, y: box.minY + 2), CGPoint(x: box.maxX - 2, y: box.minY + 2),
                    CGPoint(x: box.minX + 2, y: box.maxY - 2), CGPoint(x: box.maxX - 2, y: box.maxY - 2),
                ].filter { let p = filling.pixel(at: $0); return Self.isLogo(p.r, p.g, p.b, p.a) }.count
                // ...and 6 in from each side is inside it.
                let inside = filling.pixel(at: CGPoint(x: box.minX + 6, y: box.minY + 6))
                print("Decision 79 iOS, \(name): a filling logo is \(box.width) x \(box.height), \(corners) of its corners drawn")
                XCTAssertEqual(box.width, inner, accuracy: 0.8, "\(name): the logo does not fill the \(inner) inside the rim")
                XCTAssertEqual(box.height, inner, accuracy: 0.8, "\(name): the logo does not fill the \(inner) inside the rim")
                XCTAssertEqual(corners, 0, "\(name): the logo is not clipped to the inner radius")
                XCTAssertTrue(Self.isLogo(inside.r, inside.g, inside.b, inside.a), "\(name): the logo is clipped too far in")

                let fitted = try draw(KozmosLocationPin(selected: selected, featured: true,
                                                        markerContent: AnyView(Image(decorative: wide, scale: 1).resizable())),
                                      in: scheme)
                guard let image = fitted.boundingBox(where: Self.isLogo) else {
                    XCTFail("\(name): an image logo draws nothing")
                    continue
                }
                print("Decision 79 iOS, \(name): a 2:1 image logo is drawn \(image.width) x \(image.height)")
                XCTAssertEqual(image.width, inner, accuracy: 0.8, "\(name): a wide logo is not scaled to the \(inner) inside the rim")
                XCTAssertEqual(image.height, inner / 2, accuracy: 0.8, "\(name): a wide logo is cropped or stretched, not fitted")
            }
        }
    }

    /// The tile with no logo is empty: background/0 inside the rim.
    @MainActor func testWithNoLogoTheTileIsEmpty() throws {
        for scheme in [ColorScheme.light, .dark] {
            let background = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme)
            let pixels = try draw(KozmosLocationPin(number: 4, featured: true), in: scheme)
            let tile = try XCTUnwrap(pinRuns(pixels.pinRows(where: { _, _, _, a in a > 200 })).first, "\(scheme): nothing drawn")
            // 8 in from each side clears the rim and its 13 inner corners.
            let middle = CGRect(x: tile.minX + 8, y: tile.top + 8, width: tile.width - 16, height: tile.height - 16)
            let total = Int(middle.width * pixels.scale) * Int(middle.height * pixels.scale)
            let empty = pixels.count(in: middle, where: DrawnPixels.matches(background, tolerance: 4))
            print("Decision 79 iOS, \(scheme): \(empty) of \(total) pixels inside the rim are background/0")
            XCTAssertGreaterThanOrEqual(empty, total - 4, "\(scheme): the tile with no logo draws something inside its rim")
        }
    }

    /// A disabled marker is drawn at half, once, as a whole: no pixel is more
    /// opaque than half, as a number over its fill or a rim over a tile would
    /// be when each were dimmed on its own.
    @MainActor func testADisabledMarkerIsDrawnAtHalfOnce() throws {
        let markers: [(String, KozmosLocationPin)] = [
            ("selected result", KozmosLocationPin(number: 8, selected: true, isDisabled: true)),
            ("featured with a logo", KozmosLocationPin(featured: true, isDisabled: true, markerContent: AnyView(Self.logoColor))),
            ("place", KozmosLocationPin(place: true, isDisabled: true)),
        ]
        for scheme in [ColorScheme.light, .dark] {
            for (name, pin) in markers {
                let pixels = try draw(pin, in: scheme)
                let whole = CGRect(origin: .zero, size: pixels.size)
                let half = pixels.count(in: whole, where: { _, _, _, a in a >= 120 && a <= 136 })
                let over = pixels.count(in: whole, where: { _, _, _, a in a > 136 })
                print("Decision 79 iOS, \(scheme), disabled \(name): \(half) pixels at half, \(over) over it")
                XCTAssertGreaterThan(half, 200, "\(scheme), \(name): the disabled marker is not drawn at half")
                XCTAssertEqual(over, 0, "\(scheme), \(name): parts of the disabled marker are dimmed on their own")
            }
        }
    }

    #if os(iOS)
    @MainActor private func withAutomation(_ body: () async throws -> Void) async throws {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get(); set(1); defer { set(old) }
        try await body()
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

    /// Hosted, as VoiceOver reads it: one element per marker, named by its
    /// label alone and, on a tile, the product's word for Featured; never a
    /// number the label does not hold, nor a logo on its own.
    @MainActor func testVoiceOverHearsEachMarkerByItsLabelAndATilesFeaturedWord() async throws {
        try await withAutomation {
            let pins = VStack(spacing: 24) {
                KozmosLocationPin(label: "Burger King", number: 3, featured: true, featuredLabel: "Destacado")
                KozmosLocationPin(label: "Boots", number: 5, featuredLabel: "Destacado")
                KozmosLocationPin(label: "Gate 12", number: 2, featured: true, place: true)
                KozmosLocationPin(label: "Pret", featured: true,
                                  markerContent: AnyView(Image(systemName: "cup.and.saucer.fill").accessibilityLabel("Pret logo")))
            }
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
            window.rootViewController = UIHostingController(rootView: pins.environment(\.colorScheme, .light))
            window.makeKeyAndVisible()
            defer { window.isHidden = true }
            try await Task.sleep(nanoseconds: 300_000_000)
            let labels = elements(window).compactMap(\.accessibilityLabel)
            print("Decision 79 iOS: VoiceOver reads \(labels)")
            XCTAssertEqual(labels, ["Burger King, Destacado", "Boots", "Gate 12", "Pret, Featured"], "VoiceOver reads \(labels)")
        }
    }
    #endif
}
