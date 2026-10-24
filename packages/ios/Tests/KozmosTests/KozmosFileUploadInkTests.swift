#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// The file upload's mark and words are the muted colour, foreground/400, as
/// React draws them (`text-muted-foreground`, FileUpload.tsx) and Compose does.
/// SwiftUI left them to the button's default tint, the system blue (owner,
/// 24 Oct).
///
/// Hosted, as an app shows it, so the button takes the tint a hosting
/// controller gives it; light and dark. The ink is the pixel furthest from
/// the page, which is a glyph's core, since the dashed edge is the muted
/// colour at half. It is held to a swatch of the token within 10 a channel.
final class KozmosFileUploadInkTests: XCTestCase {
    private let size = CGSize(width: 390, height: 180)

    @MainActor private func render<V: View>(_ view: V, _ scheme: ColorScheme) async throws -> RenderedPixels {
        try await RenderedPixels.render(
            view.padding(16)
                .frame(width: size.width, height: size.height, alignment: .topLeading)
                .background(KozmosColors.primitivesColorsBackground0)
                .environment(\.colorScheme, scheme),
            size: size)
    }

    private func hex(_ c: (r: UInt8, g: UInt8, b: UInt8)) -> String { String(format: "#%02X%02X%02X", c.r, c.g, c.b) }

    @MainActor func testTheUploadMarkAndWordsAreTheMutedColour() async throws {
        var wrong: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            let swatch = try await render(KozmosColors.primitivesColorsForeground400, scheme)
                .color(at: CGPoint(x: size.width / 2, y: size.height / 2))
            let drawn = try await render(KozmosFileUpload(), scheme)
            var core = drawn.color(at: .zero)
            var furthest = -1
            for y in 0..<drawn.height {
                for x in 0..<drawn.width {
                    let c = drawn.color(at: CGPoint(x: (CGFloat(x) + 0.5) / drawn.scale, y: (CGFloat(y) + 0.5) / drawn.scale))
                    let sum = Int(c.r) + Int(c.g) + Int(c.b)
                    let depth = scheme == .dark ? sum : 765 - sum
                    if depth > furthest { furthest = depth; core = c }
                }
            }
            print("File upload iOS, \(scheme): the mark and words are \(hex(core)), foreground/400 \(hex(swatch))")
            if abs(Int(core.r) - Int(swatch.r)) > 10 || abs(Int(core.g) - Int(swatch.g)) > 10 || abs(Int(core.b) - Int(swatch.b)) > 10 {
                wrong.append("\(scheme): the mark and words are \(hex(core)), not foreground/400 \(hex(swatch))")
            }
        }
        XCTAssertEqual(wrong, [])
    }
}
#endif
