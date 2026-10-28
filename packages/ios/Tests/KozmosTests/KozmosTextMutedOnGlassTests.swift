#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 48 for a product's own words (GAP-203): a `KozmosText` with the
/// muted tone reads the surface it sits on, as the parts' muted lines do
/// through `kozmosMutedText()`. On a glass `KozmosSurface` it draws the
/// foreground colour, so it reads at 4.5:1 over any map; on a solid one,
/// foreground/400. React's `Text color="muted"` does the same since #416
/// (`.kozmos-text-muted` reads `--kozmos-surface-muted-foreground`).
///
/// The surface sits over the glass stories' two saturated rooms, the theme's
/// blue and the warning amber. The text is found by its absence: the surface
/// drawn again with the text as spaces, which lay out as it does and draw
/// nothing, so the pixels that differ are its glyphs. The text's colour is
/// their core, the pixel furthest in luminance from what lies behind it, and
/// it is held to whichever of the two swatches, foreground/100 and
/// foreground/400, it is nearer. Hosted, so the glass's material is drawn as
/// on a device.
final class KozmosTextMutedOnGlassTests: XCTestCase {
    private let size = CGSize(width: 390, height: 200)
    private let words = "Updated 4 min ago · Level 2"

    private typealias RGB = (r: UInt8, g: UInt8, b: UInt8)

    /// A muted `KozmosText` on a surface of `style`, over the two rooms.
    private func scene(_ style: KozmosSurfaceStyle, _ scheme: ColorScheme, blank: Bool = false) -> some View {
        ZStack(alignment: .top) {
            HStack(spacing: 0) {
                KozmosColors.primitivesColorsTheme600
                KozmosColors.primitivesColorsEmotionalAlert800
            }
            KozmosText(blank ? String(repeating: " ", count: words.count) : words, tone: .muted)
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .kozmosSurface(RoundedRectangle(cornerRadius: 20, style: .continuous), style: style)
                .padding(16)
        }
        .frame(width: size.width, height: size.height)
        .environment(\.layoutDirection, .leftToRight)
        .environment(\.colorScheme, scheme)
    }

    @MainActor private func render<V: View>(_ view: V, _ name: String) async throws -> RenderedPixels {
        let pixels = try await RenderedPixels.render(view, size: size)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        return pixels
    }

    private static func luminance(_ c: RGB) -> Double {
        func channel(_ v: UInt8) -> Double {
            let c = Double(v) / 255
            return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
    }

    private static func contrast(_ a: RGB, _ b: RGB) -> Double {
        let (la, lb) = (luminance(a), luminance(b))
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }

    private static func distance(_ a: RGB, _ b: RGB) -> Int {
        abs(Int(a.r) - Int(b.r)) + abs(Int(a.g) - Int(b.g)) + abs(Int(a.b) - Int(b.b))
    }

    private func describe(_ c: RGB) -> String { "(\(c.r), \(c.g), \(c.b))" }

    /// The text's core colour, what lies behind its least contrasting pixel,
    /// their ratio and how many pixels differ; nil if nothing does.
    private func glyphs(_ drawn: RenderedPixels, _ blanked: RenderedPixels) -> (core: RGB, behind: RGB, ratio: Double, pixels: Int)? {
        var found: [(RGB, RGB)] = []
        for py in 0..<drawn.height {
            for px in 0..<drawn.width {
                let point = CGPoint(x: (CGFloat(px) + 0.5) / drawn.scale, y: (CGFloat(py) + 0.5) / drawn.scale)
                let (a, b) = (drawn.color(at: point), blanked.color(at: point))
                if max(abs(Int(a.r) - Int(b.r)), abs(Int(a.g) - Int(b.g)), abs(Int(a.b) - Int(b.b))) > 24 {
                    found.append((a, b))
                }
            }
        }
        guard let core = found.max(by: {
            abs(Self.luminance($0.0) - Self.luminance($0.1)) < abs(Self.luminance($1.0) - Self.luminance($1.1))
        }) else { return nil }
        let worst = found.min(by: { Self.contrast(core.0, $0.1) < Self.contrast(core.0, $1.1) })!
        return (core.0, worst.1, Self.contrast(core.0, worst.1), found.count)
    }

    /// Reads the muted text on `style` in both appearances: the colour it
    /// drew, and which swatch it is nearer.
    @MainActor private func reads(_ style: KozmosSurfaceStyle) async throws -> [String] {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let centre = CGPoint(x: size.width / 2, y: size.height / 2)
            let ink = try await render(
                KozmosColors.primitivesColorsForeground100.environment(\.colorScheme, scheme),
                "gap-203-ink-swatch-\(scheme)").color(at: centre)
            let muted = try await render(
                KozmosColors.primitivesColorsForeground400.environment(\.colorScheme, scheme),
                "gap-203-muted-swatch-\(scheme)").color(at: centre)
            let name = "gap-203-muted-text-\(style)-\(scheme)"
            let drawn = try await render(scene(style, scheme), name)
            let blanked = try await render(scene(style, scheme, blank: true), "\(name)-blank")
            guard let read = glyphs(drawn, blanked) else {
                wrong.append("\(style), \(scheme): the text drew nothing")
                continue
            }
            let (toInk, toMuted) = (Self.distance(read.core, ink), Self.distance(read.core, muted))
            print("GAP-203 iOS, muted KozmosText on \(style), \(scheme): \(describe(read.core)), \(read.pixels) pixels, \(String(format: "%.2f", read.ratio)):1 over \(describe(read.behind)); foreground/100 \(describe(ink)) is \(toInk) away, foreground/400 \(describe(muted)) \(toMuted)")
            switch style {
            case .glass:
                if toInk >= toMuted {
                    wrong.append("glass, \(scheme): drew \(describe(read.core)), nearer foreground/400 \(describe(muted)) than foreground/100 \(describe(ink))")
                }
                if read.ratio < 4.5 {
                    wrong.append("glass, \(scheme): \(String(format: "%.2f", read.ratio)):1 over \(describe(read.behind)), under 4.5:1")
                }
            case .solid:
                if toMuted >= toInk {
                    wrong.append("solid, \(scheme): drew \(describe(read.core)), nearer foreground/100 \(describe(ink)) than foreground/400 \(describe(muted))")
                }
            }
        }
        return wrong
    }

    /// On glass, muted text is the foreground colour, light and dark, and
    /// reads at 4.5:1 over either room.
    @MainActor func testOnGlassAMutedKozmosTextDrawsTheForegroundColour() async throws {
        let wrong = try await reads(.glass)
        XCTAssertTrue(wrong.isEmpty, wrong.joined(separator: "; "))
    }

    /// The guard: on a solid surface it keeps foreground/400, light and dark.
    @MainActor func testOnASolidSurfaceAMutedKozmosTextKeepsForeground400() async throws {
        let wrong = try await reads(.solid)
        XCTAssertTrue(wrong.isEmpty, wrong.joined(separator: "; "))
    }
}
#endif
