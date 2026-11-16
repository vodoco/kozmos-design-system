import XCTest
import SwiftUI
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// GAP-269: an alert's words have as much space below them as above.
///
/// React lifted a title-less description 3 with a transform, which left its
/// box behind, so the words had 13 above and 19 below. SwiftUI's alert put
/// the icon and the words at the top of a row as tall as the icon, and the
/// icon (title3) is taller than a line of the description (subheadline), so
/// a title-less description had the icon's extra height below it as well.
/// A title-less alert of one line now centres its words on the icon, as
/// React's does; a titled alert and a longer description stay at the top.
///
/// Measured, in a window, from each part's frame to the alert's edges.
final class KozmosAlertSpacingTests: XCTestCase {
    #if os(iOS)
    private typealias Variant = KozmosAlert<AnyView>.KozmosAlertVariant
    private let variants: [Variant] = [.default, .info, .success, .warning, .destructive]

    /// One line of description beside the icon, no title: as much space
    /// above the words as below, and the icon centred on them.
    @MainActor func testATitlelessDescriptionHasAsMuchSpaceBelowAsAbove() async throws {
        for variant in variants {
            let read = try await measure {
                alert(variant) {
                    KozmosAlertIcon().measured("icon")
                    KozmosAlertDescription("The merge is saved as a draft.").measured("words")
                }
            }
            let inset = read.inset("words")
            XCTAssertEqual(inset.top, inset.bottom, accuracy: 0.5, "\(variant): \(inset.top) above the words, \(inset.bottom) below")
            XCTAssertEqual(read["icon"].midY, read["words"].midY, accuracy: 0.5, "\(variant): the icon is not centred on the words")
        }
    }

    /// The same inside KozmosAlertContent, as the docs build it.
    @MainActor func testATitlelessDescriptionInContentHasAsMuchSpaceBelowAsAbove() async throws {
        let read = try await measure {
            KozmosAlert {
                KozmosAlertIcon().measured("icon")
                KozmosAlertContent {
                    KozmosAlertDescription("The merge is saved as a draft.")
                }
                .measured("words")
            }
        }
        let inset = read.inset("words")
        XCTAssertEqual(inset.top, inset.bottom, accuracy: 0.5, "\(inset.top) above the words, \(inset.bottom) below")
    }

    /// A titled alert, as before: the title and the icon at the top, 16 from
    /// the edge, and the words 16 from the bottom.
    @MainActor func testATitledAlertIsDrawnAsBefore() async throws {
        let read = try await measure {
            KozmosAlert {
                KozmosAlertIcon().measured("icon")
                KozmosAlertContent {
                    KozmosAlertTitle("Units merged")
                    KozmosAlertDescription("The merge is saved as a draft.")
                }
                .measured("words")
            }
        }
        XCTAssertEqual(read.inset("words").top, 16, accuracy: 0.5)
        XCTAssertEqual(read.inset("words").bottom, 16, accuracy: 0.5)
        XCTAssertEqual(read.inset("icon").top, 16, accuracy: 0.5)
    }

    /// A description of several lines starts at the top, 16 from either edge.
    @MainActor func testALongerDescriptionStartsAtTheTop() async throws {
        let read = try await measure {
            KozmosAlert {
                KozmosAlertIcon().measured("icon")
                KozmosAlertDescription(
                    "The merged unit keeps the first unit's name, its category and its opening hours; the others are kept in the merge history."
                )
                .measured("words")
            }
        }
        XCTAssertGreaterThan(read["words"].height, read["icon"].height, "the description is not longer than the icon")
        XCTAssertEqual(read.inset("words").top, 16, accuracy: 0.5)
        XCTAssertEqual(read.inset("words").bottom, 16, accuracy: 0.5)
        XCTAssertEqual(read.inset("icon").top, 16, accuracy: 0.5)
    }

    // MARK: - Measuring

    /// An alert of `variant`, whose variant type is the content's own.
    private func alert<C: View>(_ variant: Variant, @ViewBuilder _ content: () -> C) -> KozmosAlert<C> {
        let mapped: KozmosAlert<C>.KozmosAlertVariant
        switch variant {
        case .default: mapped = .default
        case .info: mapped = .info
        case .success: mapped = .success
        case .warning: mapped = .warning
        case .destructive: mapped = .destructive
        }
        return KozmosAlert(variant: mapped, content: content)
    }

    private struct Inset { let top: CGFloat; let bottom: CGFloat }

    private struct Frames {
        let frames: [String: CGRect]
        subscript(_ name: String) -> CGRect { frames[name] ?? .null }
        func inset(_ name: String) -> Inset {
            let alert = self["alert"], part = self[name]
            return Inset(top: part.minY - alert.minY, bottom: alert.maxY - part.maxY)
        }
    }

    /// Lays `content` out in a window, 320pt wide, and reads back every frame
    /// reported by `measured`; the alert is "alert".
    @MainActor private func measure<V: View>(@ViewBuilder _ content: () -> V) async throws -> Frames {
        let box = AlertFramesBox()
        let laid = content()
            .measured("alert")
            .frame(width: 320)
            .fixedSize(horizontal: false, vertical: true)
            .coordinateSpace(name: "root")
            .onPreferenceChange(AlertFramesKey.self) { box.frames = $0 }
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = UIHostingController(rootView: laid)
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 200_000_000)
        let frames = Frames(frames: box.frames)
        XCTAssertNotNil(frames.frames["alert"], "nothing was laid out")
        return frames
    }
    #endif
}

#if os(iOS)
private final class AlertFramesBox { var frames: [String: CGRect] = [:] }

private struct AlertFramesKey: PreferenceKey {
    static var defaultValue: [String: CGRect] = [:]
    static func reduce(value: inout [String: CGRect], nextValue: () -> [String: CGRect]) {
        value.merge(nextValue()) { $1 }
    }
}

private extension View {
    /// Reports this view's frame, in the window's laid-out root, as `name`.
    func measured(_ name: String) -> some View {
        background(GeometryReader { proxy in
            Color.clear.preference(key: AlertFramesKey.self, value: [name: proxy.frame(in: .named("root"))])
        })
    }
}
#endif
