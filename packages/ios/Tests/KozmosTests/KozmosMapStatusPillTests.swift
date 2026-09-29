import XCTest
import SwiftUI
@testable import Kozmos

/// Decision 39 (Olcay, 2026-09-28), drawn: one status pill for the map —
/// PositionStatus, Downloading Content and Turn Back, and GAP-102's step-free
/// route being calculated — in five tones, on the map controls' surface
/// (decision 40): at least 48 tall, the page's own surface with no edge, the
/// map controls' three shadows, a 24 mark 12 in, the words 8 beyond it.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on a simulator. Each pill sits on the map's grey
/// (background/100), with room around it for its shadow. Colours are read
/// against the tokens as they resolve, never against a copy of their hex.
///
/// What VoiceOver hears is not read here: a SwiftUI text is an element of
/// its hosting view, not a view of its own, and XCTest reaches that tree
/// only through private API. The pill is one combined element with its
/// mark hidden, and what it announces, and how, is tested at the model.
final class KozmosMapStatusPillTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    // MARK: What a tone resolves to, before anything is drawn

    func testEachToneResolvesToTheBoardsMarkAndInk() {
        typealias A = KozmosMapStatusPillAppearance
        XCTAssertEqual(A(tone: .neutral), A(surface: .page, words: .ink, mark: .ink, ownMark: .none))
        XCTAssertEqual(A(tone: .progress), A(surface: .page, words: .ink, mark: .themed, ownMark: .spinner))
        XCTAssertEqual(A(tone: .success), A(surface: .page, words: .success, mark: .success, ownMark: .check))
        XCTAssertEqual(A(tone: .danger), A(surface: .page, words: .ink, mark: .danger, ownMark: .triangle))
        XCTAssertEqual(A(tone: .warning), A(surface: .warning, words: .onWarning, mark: .onWarning, ownMark: .triangle))
    }

    /// Polite unless the product asks otherwise: queued behind what VoiceOver
    /// is saying, the way `role="status"` waits for a pause. Assertive
    /// interrupts; off says nothing, and neither does a pill with no words.
    func testItIsAnnouncedPolitelyUnlessAskedAndNeverWithoutWords() {
        XCTAssertEqual(KozmosMapStatusPill.announcement("Established", live: .polite),
                       KozmosMapStatusPillAnnouncement(message: "Established", queued: true))
        XCTAssertEqual(KozmosMapStatusPill.announcement("Turn Back", live: .assertive),
                       KozmosMapStatusPillAnnouncement(message: "Turn Back", queued: false))
        XCTAssertNil(KozmosMapStatusPill.announcement("Up-to-date", live: .off))
        XCTAssertNil(KozmosMapStatusPill.announcement("", live: .polite))
        XCTAssertNil(KozmosMapStatusPill.announcement("", live: .assertive))
    }

    // MARK: Drawn

    @MainActor
    private func onTheMap<V: View>(_ pill: V, _ scheme: ColorScheme = .light) throws -> DrawnPixels {
        try DrawnPixels.draw(
            pill
                .padding(60)
                .background(KozmosColors.primitivesColorsBackground100)
                .environment(\.colorScheme, scheme)
                .environment(\.layoutDirection, .leftToRight),
            scale: 3
        )
    }

    @MainActor
    private func surfaceColor(_ tone: KozmosMapStatusPillTone, _ scheme: ColorScheme) throws -> Pixel {
        try DrawnPixels.resolved(
            tone == .warning ? KozmosColors.semanticsEmotionAlertFill : KozmosColors.primitivesColorsBackground0,
            in: scheme
        )
    }

    /// The pill's box: the pixels drawn in its surface's own colour.
    private func surfaceBox(_ drawn: DrawnPixels, _ surface: Pixel) throws -> CGRect {
        try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(surface, tolerance: 3)), "no surface was drawn")
    }

    private static func luminance(_ p: Pixel) -> Double {
        func channel(_ v: UInt8) -> Double {
            let c = Double(v) / 255
            return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * channel(p.r) + 0.7152 * channel(p.g) + 0.0722 * channel(p.b)
    }

    private static func contrast(_ a: Pixel, _ b: Pixel) -> Double {
        let (la, lb) = (luminance(a), luminance(b))
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }

    /// The pixel in `region` furthest in contrast from the surface: the core
    /// of a glyph or a word, where it is drawn at its full colour.
    private func core(_ read: (CGPoint) -> Pixel, in region: CGRect, step: CGFloat, on surface: Pixel) -> Pixel? {
        var best: Pixel?
        var bestRatio = 1.0
        var y = region.minY
        while y < region.maxY {
            var x = region.minX
            while x < region.maxX {
                let p = read(CGPoint(x: x, y: y))
                let ratio = Self.contrast(p, surface)
                if p.a > 240, ratio > bestRatio { best = p; bestRatio = ratio }
                x += step
            }
            y += step
        }
        return best
    }

    private func close(_ a: Pixel, _ b: Pixel, within tolerance: Int) -> Bool {
        abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance
            && abs(Int(a.b) - Int(b.b)) <= tolerance
    }

    private func describe(_ p: Pixel) -> String { "(\(p.r), \(p.g), \(p.b))" }

    /// The map controls' surface: 48 tall, as wide as its words and no wider,
    /// the page's own surface, opaque, and no edge — just inside its side the
    /// surface is still the surface.
    @MainActor func testItIsTheMapControls48TallSurfaceWithNoEdge() throws {
        let drawn = try onTheMap(KozmosMapStatusPill("Established", tone: .success))
        let surface = try surfaceColor(.success, .light)
        let box = try surfaceBox(drawn, surface)
        XCTAssertEqual(box.height, 48, accuracy: 1, "the pill is \(box.height) tall")
        XCTAssertLessThan(box.width, 140, "the pill is \(box.width) wide for one word: it does not hug its words")
        let inside = drawn.pixel(at: CGPoint(x: box.minX + 4, y: box.midY))
        XCTAssertTrue(close(inside, surface, within: 1), "the surface is not the page's own, opaque: \(describe(inside))")
        let edge = drawn.pixel(at: CGPoint(x: box.minX + 0.2, y: box.midY))
        XCTAssertTrue(close(edge, surface, within: 2), "an edge is drawn around the surface: \(describe(edge))")
    }

    /// The map controls' three shadows: 16 beside the pill (the 0 0 32 layer)
    /// and 30 below it (the 0 24 24 layer) the map is still darker than the
    /// bare map.
    @MainActor func testItCastsTheMapControlsThreeShadows() throws {
        let drawn = try onTheMap(KozmosMapStatusPill("Updating Route", tone: .progress))
        let box = try surfaceBox(drawn, try surfaceColor(.progress, .light))
        let bare = drawn.pixel(at: CGPoint(x: 2, y: 2))
        let beside = drawn.pixel(at: CGPoint(x: box.minX - 16, y: box.midY))
        let below = drawn.pixel(at: CGPoint(x: box.midX, y: box.maxY + 30))
        XCTAssertGreaterThanOrEqual(Int(bare.g) - Int(beside.g), 2, "no shadow 16 beside the pill: \(describe(beside))")
        XCTAssertGreaterThanOrEqual(Int(bare.g) - Int(below.g), 2, "no shadow 30 below the pill: \(describe(below))")
    }

    /// The SDK's anatomy: 12 in from the side, a 24 mark, 8, then the words.
    @MainActor func testTheMarkSits12InAndTheWords8BeyondIt() throws {
        let drawn = try onTheMap(KozmosMapStatusPill("Established", tone: .success))
        let surface = try surfaceColor(.success, .light)
        let box = try surfaceBox(drawn, surface)
        let ink = try DrawnPixels.resolved(KozmosColors.semanticsEmotionSuccessText, in: .light)
        let isInk = DrawnPixels.matches(ink, tolerance: 60)
        let mark = try XCTUnwrap(drawn.boundingBox(in: CGRect(x: box.minX, y: box.minY, width: 40, height: box.height), where: isInk),
                                 "no mark was drawn")
        XCTAssertGreaterThanOrEqual(mark.minX - box.minX, 12 - 0.5, "the mark is \(mark.minX - box.minX) from the side")
        XCTAssertLessThanOrEqual(mark.maxX - box.minX, 36 + 0.5, "the mark reaches \(mark.maxX - box.minX), past its 24")
        let words = try XCTUnwrap(drawn.boundingBox(in: CGRect(x: box.minX + 40, y: box.minY, width: box.width - 40, height: box.height),
                                                    where: isInk), "no words were drawn")
        XCTAssertGreaterThanOrEqual(words.minX - box.minX, 44 - 1, "the words start \(words.minX - box.minX) in, not 12 + 24 + 8")
        XCTAssertEqual(box.maxX - words.maxX, 12, accuracy: 2, "the words end \(box.maxX - words.maxX) from the side")
    }

    #if os(iOS)
    /// Every tone draws its words and its mark in its own colour, in both
    /// themes, and each reads on its surface: the words at 4.5:1 or more, the
    /// mark at 3:1 or more. The measured ratios are attached to the run.
    ///
    /// Hosted in UIKit, as a phone draws it, not through `ImageRenderer`:
    /// the renderer draws no words beside `KozmosSpinner`, whose turn starts
    /// with `withAnimation` in `onAppear` and takes the words' first
    /// appearance into that animation (measured 2026-09-28; the loading
    /// Button's hosted reference draws its label beside the same arc).
    @MainActor func testEachToneDrawsItsWordsAndMarkInItsColourAndTheyReadInBothThemes() async throws {
        // Turn Back reads the named pair, Emotion/alert/fill under onFill, and
        // its ratio is pinned: 10.56 in the light, 13.14 in the dark.
        let turnBack: [ColorScheme: Double] = [.light: 10.56, .dark: 13.14]
        let canvas = CGSize(width: 320, height: 160)
        var measured: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let words: [KozmosMapStatusPillTone: Color] = [
                .neutral: KozmosColors.primitivesColorsForeground300,
                .progress: KozmosColors.primitivesColorsForeground300,
                .success: KozmosColors.semanticsEmotionSuccessText,
                .danger: KozmosColors.primitivesColorsForeground300,
                .warning: KozmosColors.semanticsEmotionAlertOnfill,
            ]
            let marks: [KozmosMapStatusPillTone: Color] = [
                .progress: KozmosColors.semanticsEmotionThemedText,
                .success: KozmosColors.semanticsEmotionSuccessText,
                .danger: KozmosColors.semanticsEmotionDangerText,
                .warning: KozmosColors.semanticsEmotionAlertOnfill,
            ]
            for tone in KozmosMapStatusPillTone.allCases {
                let view = KozmosMapStatusPill("Wayfinding", tone: tone)
                    .frame(width: canvas.width, height: canvas.height)
                    .background(KozmosColors.primitivesColorsBackground100)
                    .environment(\.colorScheme, scheme)
                    .environment(\.layoutDirection, .leftToRight)
                let drawn = try await RenderedPixels.render(view, size: canvas)
                let read = { (point: CGPoint) -> Pixel in
                    let c = drawn.color(at: point)
                    return (c.r, c.g, c.b, 255)
                }
                let surface = try surfaceColor(tone, scheme)
                let isSurface = DrawnPixels.matches(surface, tolerance: 3)
                let box = try XCTUnwrap(drawn.boundingBox(in: CGRect(origin: .zero, size: canvas), where: { r, g, b in
                    isSurface(r, g, b, 255)
                }), "\(scheme) \(tone): no surface was drawn")
                XCTAssertEqual(box.height, 48, accuracy: 1, "\(scheme) \(tone): the pill is \(box.height) tall")
                let wordsStart = tone == .neutral ? box.minX + 12 : box.minX + 44
                let wordsRegion = CGRect(x: wordsStart, y: box.minY + 8, width: box.maxX - 12 - wordsStart, height: box.height - 16)
                let inWords = try XCTUnwrap(core(read, in: wordsRegion, step: 1 / drawn.scale, on: surface),
                                            "\(scheme) \(tone): no words were drawn")
                let wordsColour = try DrawnPixels.resolved(words[tone]!, in: scheme)
                XCTAssertTrue(close(inWords, wordsColour, within: 28),
                              "\(scheme) \(tone): the words drew \(describe(inWords)), not \(describe(wordsColour))")
                let wordsRatio = Self.contrast(inWords, surface)
                XCTAssertGreaterThanOrEqual(wordsRatio, 4.5, "\(scheme) \(tone): the words read at \(wordsRatio):1")
                if let pinned = tone == .warning ? turnBack[scheme] : nil {
                    XCTAssertEqual(wordsRatio, pinned, accuracy: 0.005,
                                   "\(scheme) Turn Back reads at \(wordsRatio):1, not its pinned \(pinned):1")
                }
                var line = "\(scheme) \(tone): words \(String(format: "%.2f", wordsRatio))"
                if let mark = marks[tone] {
                    let markRegion = CGRect(x: box.minX + 12, y: box.midY - 12, width: 24, height: 24)
                    let inMark = try XCTUnwrap(core(read, in: markRegion, step: 1 / drawn.scale, on: surface),
                                               "\(scheme) \(tone): no mark was drawn")
                    let markColour = try DrawnPixels.resolved(mark, in: scheme)
                    XCTAssertTrue(close(inMark, markColour, within: 28),
                                  "\(scheme) \(tone): the mark drew \(describe(inMark)), not \(describe(markColour))")
                    let markRatio = Self.contrast(inMark, surface)
                    XCTAssertGreaterThanOrEqual(markRatio, 3, "\(scheme) \(tone): the mark reads at \(markRatio):1")
                    line += ", mark \(String(format: "%.2f", markRatio))"
                } else {
                    // No mark: the words start where the mark would, 12 in.
                    let isWords = DrawnPixels.matches(wordsColour, tolerance: 60)
                    let drawnWords = try XCTUnwrap(drawn.boundingBox(in: box, where: { r, g, b in
                        isWords(r, g, b, 255)
                    }), "\(scheme) \(tone): no words")
                    XCTAssertEqual(drawnWords.minX - box.minX, 12, accuracy: 2,
                                   "\(scheme) \(tone): the words start \(drawnWords.minX - box.minX) in, after a mark it should not draw")
                }
                measured.append(line)
            }
        }
        let attachment = XCTAttachment(string: measured.joined(separator: "\n"))
        attachment.name = "map-status-pill-contrast"
        attachment.lifetime = .keepAlways
        add(attachment)
        print("map-status-pill contrast:\n" + measured.joined(separator: "\n"))
        XCTAssertEqual(measured.count, 10)
    }
    #endif

    /// As wide as its words up to a map control's longest, 256, then it wraps
    /// and grows taller: the product's words are never cut. Two lines fit the
    /// 48, as the SDK's two-line states do; a third grows the pill.
    @MainActor func testALongerStatusWrapsAtTheMapControlsLongestAndGrowsTaller() throws {
        let drawn = try onTheMap(KozmosMapStatusPill(
            "Failed to Calculate Precise Position. Walk to an open area, away from walls and pillars, and try again.",
            tone: .danger))
        let box = try surfaceBox(drawn, try surfaceColor(.danger, .light))
        XCTAssertLessThanOrEqual(box.width, 256 + 1, "the pill is \(box.width) wide, past a map control's longest")
        XCTAssertGreaterThan(box.width, 200, "the pill wrapped at \(box.width), short of its 256")
        // A third line, whatever the platform's footnote (13 on iOS, 10 on a
        // Mac), takes the pill past its 48.
        XCTAssertGreaterThan(box.height, 48 + 4, "the pill is \(box.height) tall: its words did not wrap onto a third line")
    }

    #if os(iOS)
    /// The words are the SDK's 13 on a 16 line, as the web's 13px on 16px and
    /// Compose's 13sp on 16sp: at the default text size their lines are 16
    /// apart, and each line is 16 tall, its leading split above and below as
    /// CSS splits it, so four lines make the pill 8 + 64 + 8. `footnote`'s own
    /// line is 15.5 (SF Pro at 13), and the lines sat 15.5 apart. The words
    /// have no descenders, so each line's lowest ink is its baseline.
    @MainActor func testTheWordsAre13On16Lines() throws {
        let words = "Turn back at the next hall and walk to the lift beside the main door in the atrium on the third level then look for the red sofas"
        let drawn = try DrawnPixels.draw(
            KozmosMapStatusPill(words, tone: .neutral)
                .padding(40)
                .environment(\.colorScheme, .light)
                .environment(\.layoutDirection, .leftToRight)
                .environment(\.dynamicTypeSize, .large),
            scale: 3
        )
        let lines = drawn.bands { r, g, b, a in a > 200 && r < 160 && g < 160 && b < 160 }
        XCTAssertGreaterThanOrEqual(lines.count, 3, "the words took \(lines.count) line(s): \(lines)")
        guard lines.count >= 3, let first = lines.first, let last = lines.last else { return }
        let apart = (last.maxY - first.maxY) / CGFloat(lines.count - 1)
        XCTAssertEqual(apart, 16, accuracy: 0.25, "\(lines.count) lines of the words sit \(apart) apart")
        let surface = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(
            try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: .light), tolerance: 1
        )), "no surface was drawn")
        XCTAssertEqual(surface.height, 8 + CGFloat(lines.count) * 16 + 8, accuracy: 0.34,
                       "\(lines.count) lines make the pill \(surface.height) tall")
    }
    #endif

    /// The product's mark takes the tone's place, at 24 and in the tone's
    /// colour; and a pill told to show none starts its words 12 in.
    @MainActor func testTheProductsMarkTakesTheTonesPlaceAndNoneCanBeShown() throws {
        let danger = try DrawnPixels.resolved(KozmosColors.semanticsEmotionDangerText, in: .light)
        let drawn = try onTheMap(KozmosMapStatusPill("No Bluetooth", tone: .danger) {
            // A solid square stands for the product's own asset, so its box
            // is the mark's box.
            Rectangle()
        })
        let box = try surfaceBox(drawn, try surfaceColor(.danger, .light))
        let mark = try XCTUnwrap(drawn.boundingBox(in: box, where: DrawnPixels.matches(danger, tolerance: 6)),
                                 "the product's mark is not drawn in the danger colour")
        XCTAssertEqual(mark.width, 24, accuracy: 1, "the product's mark is \(mark.width) wide")
        XCTAssertEqual(mark.height, 24, accuracy: 1, "the product's mark is \(mark.height) tall")
        XCTAssertEqual(mark.minX - box.minX, 12, accuracy: 1, "the product's mark is \(mark.minX - box.minX) from the side")

        let bare = try onTheMap(KozmosMapStatusPill("Up-to-date", tone: .success, showsIcon: false))
        let bareBox = try surfaceBox(bare, try surfaceColor(.success, .light))
        let ink = try DrawnPixels.resolved(KozmosColors.semanticsEmotionSuccessText, in: .light)
        let words = try XCTUnwrap(bare.boundingBox(in: bareBox, where: DrawnPixels.matches(ink, tolerance: 60)), "no words were drawn")
        XCTAssertEqual(words.minX - bareBox.minX, 12, accuracy: 2, "with no mark the words start \(words.minX - bareBox.minX) in")
    }

    /// Turn Back is the named pair (Olcay, 2026-09-28), Emotion/alert/fill
    /// under onFill, not a black picked per theme: the pill draws the pair,
    /// and the pair reads at its pinned 10.56:1 in the light and 13.14:1 in
    /// the dark.
    @MainActor func testTurnBackDrawsTheNamedAlertFillPairAtItsPinnedContrast() throws {
        for (scheme, pinned) in [(ColorScheme.light, 10.56), (.dark, 13.14)] {
            let fill = try DrawnPixels.resolved(KozmosColors.semanticsEmotionAlertFill, in: scheme)
            let ink = try DrawnPixels.resolved(KozmosColors.semanticsEmotionAlertOnfill, in: scheme)
            XCTAssertEqual(Self.contrast(ink, fill), pinned, accuracy: 0.005,
                           "\(scheme): Emotion/alert/onFill on fill reads at \(Self.contrast(ink, fill)):1")
            XCTAssertGreaterThan(Self.luminance(fill), 0.4, "\(scheme): the fill \(describe(fill)) is not a bright amber")

            let drawn = try onTheMap(KozmosMapStatusPill("Turn Back", tone: .warning, showsIcon: false), scheme)
            let box = try surfaceBox(drawn, fill)
            XCTAssertEqual(box.height, 48, accuracy: 1, "\(scheme): Turn Back is \(box.height) tall")
            let words = try XCTUnwrap(drawn.boundingBox(in: box, where: DrawnPixels.matches(ink, tolerance: 6)),
                                      "\(scheme): Turn Back's words are not drawn in Emotion/alert/onFill")
            XCTAssertEqual(words.minX - box.minX, 12, accuracy: 2, "\(scheme): the words start \(words.minX - box.minX) in")
        }
    }

    /// No Bluetooth passes Kozmos's own bluetooth-off by name, and it draws in
    /// the tone's colour, not the icon's own ink: a `KozmosIcon` left at its
    /// default colour takes the colour of the part it is in, as a Compose
    /// icon takes `LocalContentColor`. Pointr's outline spans 3 to 21 across
    /// and 2 to 22 down on its 24 grid, and its round line reaches 1 beyond.
    @MainActor func testKozmosBluetoothOffDrawsInTheTonesColour() throws {
        let danger = try DrawnPixels.resolved(KozmosColors.semanticsEmotionDangerText, in: .light)
        let drawn = try onTheMap(KozmosMapStatusPill("No Bluetooth", tone: .danger) {
            KozmosIcon("bluetooth-off", size: .lg)
        })
        let box = try surfaceBox(drawn, try surfaceColor(.danger, .light))
        let markArea = CGRect(x: box.minX, y: box.minY, width: 12 + 24, height: box.height)
        let mark = try XCTUnwrap(drawn.boundingBox(in: markArea, where: DrawnPixels.matches(danger, tolerance: 12)),
                                 "Kozmos's bluetooth-off is not drawn in the danger colour")
        XCTAssertEqual(mark.width, 20, accuracy: 1.5, "the mark is \(mark.width) wide")
        XCTAssertEqual(mark.height, 22, accuracy: 1.5, "the mark is \(mark.height) tall")
        XCTAssertEqual(mark.minX - box.minX, 12 + 2, accuracy: 1.5, "the mark starts \(mark.minX - box.minX) in")
    }

    /// With nothing to say it draws nothing, and takes no room.
    @MainActor func testWithNoWordsItDrawsNothing() throws {
        let drawn = try onTheMap(KozmosMapStatusPill("", tone: .progress))
        let surface = try surfaceColor(.progress, .light)
        XCTAssertNil(drawn.boundingBox(where: DrawnPixels.matches(surface, tolerance: 3)), "a pill with no words drew its surface")
        XCTAssertEqual(drawn.size.height, 120, accuracy: 1, "a pill with no words took \(drawn.size.height - 120) of room")
    }
}
