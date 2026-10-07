import XCTest
import SwiftUI
@testable import Kozmos

/// Where a component takes a theme other than the page's, it takes it for
/// itself only; where it dims, it dims with the scrim role in both themes.
final class KozmosThemeScopeTests: XCTestCase {
    #if os(iOS)
    /// The island takes the dark scheme for itself only. Until 2026-09-22 it
    /// set `.preferredColorScheme(.dark)`, which SwiftUI applies to the
    /// hosting controller: everything that controller hosts — the whole page
    /// the island sits on — turned dark with it.
    @MainActor func testTheIslandLeavesItsHostsSchemeAlone() async throws {
        let island = KozmosDynamicIsland(
            state: .compact,
            expandedContent: { Color.clear },
            compactLeading: { Color.clear },
            compactTrailing: { Color.clear },
            minimalContent: { Color.clear }
        )
        let controller = UIHostingController(rootView: VStack { KozmosColors.semanticsSurface0; island })
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 440, height: 240))
        window.overrideUserInterfaceStyle = .light
        window.rootViewController = controller
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        // A preference reaches the controller after a pass or two.
        for _ in 0..<10 {
            RunLoop.main.run(until: Date().addingTimeInterval(0.03))
            await Task.yield()
        }
        XCTAssertEqual(controller.overrideUserInterfaceStyle, .unspecified,
                       "the island overrode its host's interface style")
        XCTAssertEqual(controller.view.traitCollection.userInterfaceStyle, .light,
                       "the page hosting the island is no longer light")
    }

    /// What sits in the island reads from the dark scheme: a swatch of the
    /// theme's 600 draws its dark value, #5887F3, not its light one, #1051E8.
    /// (It was the themed button's fill until decision 59 made that one blue,
    /// #135BEC, in both themes.)
    @MainActor func testTheIslandsContentReadsTheDarkScheme() async throws {
        let island = KozmosDynamicIsland(
            state: .compact,
            expandedContent: { Color.clear },
            compactLeading: {
                KozmosColors.primitivesColorsTheme600.frame(width: 24, height: 24)
            },
            compactTrailing: { Color.clear },
            minimalContent: { Color.clear }
        )
        let size = CGSize(width: 440, height: 120)
        let pixels = try await RenderedPixels.render(
            ZStack { Color.white; island }.environment(\.colorScheme, .light),
            size: size
        )
        let near = { (r: UInt8, g: UInt8, b: UInt8, to: (Int, Int, Int)) -> Bool in
            abs(Int(r) - to.0) <= 12 && abs(Int(g) - to.1) <= 12 && abs(Int(b) - to.2) <= 12
        }
        let region = CGRect(origin: .zero, size: size)
        let dark = pixels.boundingBox(in: region) { near($0, $1, $2, (0x58, 0x87, 0xF3)) }
        let light = pixels.boundingBox(in: region) { near($0, $1, $2, (0x10, 0x51, 0xE8)) }
        XCTAssertNil(light, "the island's content drew the light scheme's fill at \(String(describing: light))")
        let swatch = try XCTUnwrap(dark, "the island's content did not draw the dark scheme's fill")
        XCTAssertEqual(swatch.width, 24, accuracy: 2, "the swatch is \(swatch)")
    }

    /// The backdrop dims white to half grey in both themes: the scrim role,
    /// black at half, as React, Figma, the dialog and the drawer draw it. It
    /// was background/900 at 40 % until 2026-09-22, which turns light in dark
    /// mode.
    @MainActor func testTheBackdropDimsWithTheScrimInBothThemes() async throws {
        for scheme in [ColorScheme.light, .dark] {
            let view = ZStack { Color.white; KozmosBackdrop() }.environment(\.colorScheme, scheme)
            let pixels = try await RenderedPixels.render(view, size: CGSize(width: 100, height: 100))
            let c = pixels.color(at: CGPoint(x: 50, y: 50))
            for (channel, value) in [("r", c.r), ("g", c.g), ("b", c.b)] {
                XCTAssertEqual(Int(value), 128, accuracy: 3,
                               "\(scheme): the backdrop over white is \(c) (\(channel)), not half black")
            }
        }
    }
    #endif
}
