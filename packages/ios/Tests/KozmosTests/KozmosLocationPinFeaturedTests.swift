import SwiftUI
import XCTest
@testable import Kozmos

/// Decisions 67 and 68 (Olcay, 2026-10-08), read off what is drawn and what
/// VoiceOver is told, in light and in dark:
///
/// - a featured pin shows the place's logo, `markerContent`, where the number
///   would be, and a star only when there is no logo; `markerContent` takes
///   the number's place on any pin, as React's does, and is clipped to the
///   disc inside the ring;
/// - off the floor, a featured pin is outlined with the accent's dashed ring,
///   and its star is drawn as an off-floor number is, in the foreground;
/// - `featuredLabel` is what VoiceOver hears for Featured, and a featured
///   pin's number, which it no longer shows, is not said.
///
/// The colours are written out: they are what the decisions say. The drawn
/// tests use `DrawnPixels`, so they run in `swift test` on a Mac as well as on
/// the simulator; the hosted VoiceOver test runs on the simulator. Before
/// these decisions `markerContent` and `featuredLabel` did not exist, so this
/// class did not compile; with both parameters added and ignored, it fails as
/// recorded in the change that added it.
final class KozmosLocationPinFeaturedTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    private static let accent: Pixel = (0xFA, 0xB7, 0x35, 255)
    private static let black: Pixel = (0, 0, 0, 255)
    private static let white: Pixel = (0xFF, 0xFF, 0xFF, 255)
    private static let themeFill: Pixel = (0x13, 0x5B, 0xEC, 255)
    /// Nothing in Kozmos is this green: what `markerContent` draws.
    private static let logo: Pixel = (0, 0xFF, 0, 255)
    private static let logoColor = Color(.sRGB, red: 0, green: 1, blue: 0)

    /// The pin on a mid grey, so its white or black ring shows in either
    /// theme, drawn at 3x so a stroke covers whole pixels.
    @MainActor private func draw<V: View>(_ view: V, in scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(
            view
                .padding(12)
                .background(Color(.sRGB, red: 0.5, green: 0.5, blue: 0.5))
                .environment(\.colorScheme, scheme),
            scale: 3
        )
    }

    /// How many separate runs of `matches` lie on a circle of `radius` points
    /// round `centre`.
    private func runs(_ pixels: DrawnPixels, around centre: CGPoint, radius: CGFloat,
                      where matches: (UInt8, UInt8, UInt8, UInt8) -> Bool) -> Int {
        let samples = (0..<720).map { step -> Bool in
            let angle = CGFloat(step) * .pi / 360
            let p = pixels.pixel(at: CGPoint(x: centre.x + radius * cos(angle), y: centre.y + radius * sin(angle)))
            return matches(p.r, p.g, p.b, p.a)
        }
        let starts = samples.indices.filter { samples[$0] && !samples[($0 + samples.count - 1) % samples.count] }.count
        return starts == 0 && samples.allSatisfy { $0 } ? 1 : starts
    }

    /// A featured pin with a logo shows the logo on the accent, and no star;
    /// a logo that fills its frame is clipped round, to the disc inside the
    /// ring, which still shows. A pin that is not featured shows
    /// `markerContent` in place of its number, and keeps its fill rather than
    /// going quiet, as on the web.
    @MainActor func testMarkerContentTakesTheNumbersPlaceAndAFeaturedPinShowsItNotTheStar() throws {
        let isLogo = DrawnPixels.matches(Self.logo, tolerance: 8)
        for scheme in [ColorScheme.light, .dark] {
            let square = AnyView(Rectangle().fill(Self.logoColor).frame(width: 12, height: 12))
            let featured = try draw(KozmosLocationPin(size: .lg, number: 8, featured: true, markerContent: square), in: scheme)
            let disc = featured.boundingBox(where: DrawnPixels.matches(Self.accent, tolerance: 4))
            let logoPixels = featured.count(in: CGRect(origin: .zero, size: featured.size), where: isLogo)
            let star = disc.map { featured.count(in: $0.insetBy(dx: $0.width * 0.15, dy: $0.height * 0.15),
                                                 where: DrawnPixels.matches(Self.black, tolerance: 24)) } ?? 0
            print("Decision 68 iOS, \(scheme): a featured pin with a logo draws \(logoPixels) logo pixels and \(star) black in its middle")
            XCTAssertNotNil(disc, "\(scheme): a featured pin with a logo draws no #FAB735")
            XCTAssertGreaterThan(logoPixels, 50, "\(scheme): a featured pin does not draw its logo")
            XCTAssertLessThanOrEqual(star * 100, logoPixels, "\(scheme): a featured pin with a logo still draws the star (\(star) black pixels)")

            // A logo that fills its frame: clipped round, so the corners of
            // its box are not drawn, and the ring (white in light, black in
            // dark) still shows round it.
            let filling = try draw(KozmosLocationPin(size: .lg, featured: true, markerContent: AnyView(Self.logoColor)), in: scheme)
            let ringColour = scheme == .dark ? Self.black : Self.white
            let ring = filling.count(in: CGRect(origin: .zero, size: filling.size), where: DrawnPixels.matches(ringColour, tolerance: 8))
            if let box = filling.boundingBox(where: isLogo) {
                let inset = box.width / 20
                let corners = [
                    CGPoint(x: box.minX + inset, y: box.minY + inset), CGPoint(x: box.maxX - inset, y: box.minY + inset),
                    CGPoint(x: box.minX + inset, y: box.maxY - inset), CGPoint(x: box.maxX - inset, y: box.maxY - inset),
                ].filter { let p = filling.pixel(at: $0); return isLogo(p.r, p.g, p.b, p.a) }.count
                let centre = filling.pixel(at: CGPoint(x: box.midX, y: box.midY))
                print("Decision 68 iOS, \(scheme): a filling logo is \(box.width) x \(box.height), \(corners) of its corners drawn; \(ring) ring pixels")
                XCTAssertTrue(isLogo(centre.r, centre.g, centre.b, centre.a), "\(scheme): a filling logo is not drawn at the pin's centre")
                XCTAssertEqual(corners, 0, "\(scheme): a filling logo is not clipped round (\(corners) of its box's corners drawn)")
                XCTAssertEqual(box.width, 36, accuracy: 1.5, "\(scheme): a filling logo is not the disc inside the 2pt ring: \(box)")
            } else {
                XCTFail("\(scheme): a filling logo draws nothing")
            }
            XCTAssertGreaterThan(ring, 50, "\(scheme): the ring does not show round a filling logo (\(ring) pixels)")

            // Not featured: the content stands in for the number, and the pin
            // keeps its fill (the theme fill, not the quiet surface).
            let plain = try draw(KozmosLocationPin(size: .lg, number: 8, markerContent: square), in: scheme)
            let fill = plain.boundingBox(where: DrawnPixels.matches(Self.themeFill, tolerance: 4))
            let plainLogo = plain.count(in: CGRect(origin: .zero, size: plain.size), where: isLogo)
            let number = fill.map { plain.count(in: $0.insetBy(dx: $0.width * 0.15, dy: $0.height * 0.15),
                                                where: DrawnPixels.matches(Self.white, tolerance: 24)) } ?? 0
            print("Decision 68 iOS, \(scheme): a numbered pin with markerContent draws \(plainLogo) logo pixels and \(number) white in its middle")
            XCTAssertNotNil(fill, "\(scheme): a pin showing markerContent is not filled")
            if let fill { XCTAssertGreaterThan(fill.width, 30, "\(scheme): a pin showing markerContent is quiet: \(fill)") }
            XCTAssertGreaterThan(plainLogo, 50, "\(scheme): a pin that is not featured does not draw its markerContent")
            XCTAssertLessThanOrEqual(number * 100, plainLogo, "\(scheme): markerContent does not take the number's place (\(number) white pixels)")
        }
    }

    /// Off the floor a featured pin is the outlined marker: the background
    /// inside the accent's dashed ring, eight dashes, and its star drawn as an
    /// off-floor number is, in the foreground (black in light, white in
    /// dark), never in the accent, which reads 1.9:1 on white.
    @MainActor func testOffTheFloorAFeaturedPinsRingIsTheDashedAccentAndItsStarTheForeground() throws {
        let isAccent = DrawnPixels.matches(Self.accent, tolerance: 24)
        for scheme in [ColorScheme.light, .dark] {
            let foreground = scheme == .dark ? Self.white : Self.black
            let surface = scheme == .dark ? Self.black : Self.white
            let pixels = try draw(KozmosLocationPin(size: .lg, number: 8, featured: true, offFloor: true), in: scheme)
            guard let ring = pixels.boundingBox(where: isAccent) else {
                XCTFail("\(scheme): an off-floor featured pin draws no #FAB735 ring")
                continue
            }
            // The 3pt ring's middle: 18.5 of the pin's 20 radius.
            let dashes = runs(pixels, around: CGPoint(x: ring.midX, y: ring.midY), radius: ring.width / 2 * 0.925, where: isAccent)
            let middle = ring.insetBy(dx: ring.width * 0.25, dy: ring.height * 0.25)
            let inked = pixels.count(in: middle, where: DrawnPixels.matches(foreground, tolerance: 24))
            let hollow = pixels.count(in: middle, where: DrawnPixels.matches(surface, tolerance: 4))
            let inAccent = pixels.count(in: middle, where: isAccent)
            let mark = pixels.boundingBox(in: middle, where: DrawnPixels.matches(foreground, tolerance: 4))
            print("Decision 68 iOS, \(scheme): off the floor, \(dashes) accent dashes; a \(mark.map { "\($0.width) x \($0.height)" } ?? "no") foreground mark (\(inked) pixels), \(hollow) surface and \(inAccent) accent pixels in the middle")
            XCTAssertEqual(dashes, 8, "\(scheme): the off-floor featured ring is not eight accent dashes")
            XCTAssertGreaterThan(hollow, 50, "\(scheme): the off-floor featured pin is filled")
            XCTAssertGreaterThan(inked, 8, "\(scheme): the off-floor star is not the foreground")
            if let mark {
                XCTAssertGreaterThanOrEqual(mark.width, mark.height * 0.85,
                                            "\(scheme): the off-floor mark is \(mark.width) x \(mark.height), a number's shape, not a star's")
            }
            XCTAssertLessThanOrEqual(inAccent * 100, inked, "\(scheme): the off-floor star is drawn in the accent")
        }
    }

    /// A disabled featured pin is dimmed once, as a whole, to half: its star
    /// reads half the disc it sits on (black at half over it), not a quarter
    /// (dimmed by the pin and again by the star), and a logo is half its own
    /// colour over the disc.
    @MainActor func testADisabledFeaturedPinDimsItsStarAndLogoOnce() throws {
        for scheme in [ColorScheme.light, .dark] {
            let star = try draw(KozmosLocationPin(size: .lg, featured: true, isDisabled: true), in: scheme)
            let logo = try draw(KozmosLocationPin(size: .lg, featured: true, isDisabled: true,
                                                  markerContent: AnyView(Rectangle().fill(Self.logoColor).frame(width: 12, height: 12))), in: scheme)
            // The pin's middle: the star or the logo, on the dimmed disc.
            let whole = CGRect(origin: .zero, size: star.size)
            let centre = CGPoint(x: whole.midX, y: whole.midY)
            // Beside the mark, inside the ring: the dimmed disc.
            let disc = star.pixel(at: CGPoint(x: centre.x - 15, y: centre.y))
            let mark = try XCTUnwrap(star.darkest(in: CGRect(x: centre.x - 6, y: centre.y - 6, width: 12, height: 12)))
            let drawnLogo = logo.pixel(at: centre)
            let once = 0.5 * 255 + 0.5 * Double(disc.g)
            print("Decision 68 iOS, \(scheme): disabled, the disc reads g \(disc.g), the star \(mark.g), the logo \(drawnLogo.g) (once \(Int(once)))")
            XCTAssertEqual(Double(mark.g), 0.5 * Double(disc.g), accuracy: Double(disc.g) * 0.1,
                           "\(scheme): a disabled featured pin's star is not dimmed once: g \(mark.g) on a disc of \(disc.g)")
            XCTAssertEqual(Double(drawnLogo.g), once, accuracy: 12,
                           "\(scheme): a disabled featured pin's logo is not dimmed once: g \(drawnLogo.g)")
        }
    }

    /// The star stands where the number would, as tall as the number's
    /// digits: within a quarter of the height of an 8 drawn in a pin of the
    /// same size (off the floor, where the number is the foreground on the
    /// background). At the number's own font, an SF Symbol stood half again
    /// as tall as the digits, and a third taller than Compose's star.
    @MainActor func testTheStarIsAsTallAsTheNumbersDigits() throws {
        for scheme in [ColorScheme.light, .dark] {
            let ink = scheme == .dark ? Self.white : Self.black
            let digit = try draw(KozmosLocationPin(size: .lg, number: 8, offFloor: true), in: scheme)
                .boundingBox(where: DrawnPixels.matches(ink, tolerance: 4))
            // Inside the accent disc: in dark the filled pin's ring is black too.
            let featured = try draw(KozmosLocationPin(size: .lg, featured: true), in: scheme)
            let disc = try XCTUnwrap(featured.boundingBox(where: DrawnPixels.matches(Self.accent, tolerance: 4)), "\(scheme): no accent disc")
            let star = featured.boundingBox(in: disc.insetBy(dx: disc.width * 0.15, dy: disc.height * 0.15),
                                            where: DrawnPixels.matches(Self.black, tolerance: 4))
            let (digitTall, starTall) = (digit?.height ?? 0, star?.height ?? 0)
            print("Decision 68 iOS, \(scheme): the star is \(star.map { "\($0.width) x \($0.height)" } ?? "nothing"), an 8 is \(digitTall) tall")
            XCTAssertGreaterThan(digitTall, 8, "\(scheme): no 8 drawn to measure against")
            XCTAssertEqual(starTall, digitTall, accuracy: digitTall * 0.25,
                           "\(scheme): the star is \(starTall) tall, not the digits' \(digitTall)")
        }
    }

    /// Decision 67: what VoiceOver is given. `featuredLabel` replaces
    /// "Featured", and a featured pin's number, which it no longer shows, is
    /// not said. Before it a featured pin said "Burger King, 3, Featured", in
    /// English whatever the product passed.
    func testFeaturedLabelReplacesFeaturedInTheDescription() {
        let cases: [(String, KozmosLocationPin, String)] = [
            ("translated", KozmosLocationPin(label: "Burger King", number: 3, featured: true, featuredLabel: "Destacado"), "Burger King, Destacado"),
            ("default", KozmosLocationPin(label: "Burger King", number: 3, featured: true), "Burger King, Featured"),
            ("off the floor", KozmosLocationPin(label: "Burger King", number: 3, featured: true, offFloor: true, featuredLabel: "Destacado"),
             "Burger King, Destacado, On another floor"),
            ("not featured", KozmosLocationPin(label: "Burger King", number: 3, featuredLabel: "Destacado"), "Burger King, 3"),
        ]
        for (name, pin, expected) in cases {
            XCTAssertEqual(pin.accessibilityDescription, expected, name)
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

    /// The same, hosted, as VoiceOver reads it: one element per pin, named
    /// with the product's word, and a logo in `markerContent` never read on
    /// its own.
    @MainActor func testVoiceOverHearsFeaturedLabelAndNeitherTheNumberNorTheLogo() async throws {
        try await withAutomation {
            let pins = VStack(spacing: 24) {
                KozmosLocationPin(label: "Burger King", number: 3, featured: true, featuredLabel: "Destacado")
                KozmosLocationPin(label: "Costa", number: 4, featured: true, offFloor: true, featuredLabel: "Destacado")
                KozmosLocationPin(label: "Boots", number: 5, featuredLabel: "Destacado")
                KozmosLocationPin(label: "Pret", featured: true,
                                  markerContent: AnyView(Image(systemName: "cup.and.saucer.fill").accessibilityLabel("Pret logo")))
            }
            let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
            window.rootViewController = UIHostingController(rootView: pins.environment(\.colorScheme, .light))
            window.makeKeyAndVisible()
            defer { window.isHidden = true }
            try await Task.sleep(nanoseconds: 300_000_000)
            let labels = elements(window).compactMap(\.accessibilityLabel)
            print("Decision 67 iOS: VoiceOver reads \(labels)")
            XCTAssertEqual(labels, ["Burger King, Destacado", "Costa, Destacado, On another floor", "Boots, 5", "Pret, Featured"],
                           "VoiceOver reads \(labels)")
        }
    }
    #endif
}
