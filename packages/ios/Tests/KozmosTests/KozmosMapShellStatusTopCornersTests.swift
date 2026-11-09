#if os(iOS)
import SwiftUI
import UIKit
import XCTest
@testable import Kozmos

/// GAP-123 (SDK-UI-002, decision 119): the shell's `status` slot and its two
/// top corners, as React's have been since 0.15.0 (#431). The status sits
/// between the bottom corners, level with them, centred on the map, and the
/// credits rise directly above it; with no room it is not drawn, and it never
/// pads the camera. The top corners sit 16 under the top bar at the logical
/// start and end, wrap the end under the start when both do not fit, push the
/// controls column 16 below them, and pad the camera's top only when asked.
/// Each case is drawn and every slot found where it was drawn, by a colour
/// nothing else here is.
final class KozmosMapShellStatusTopCornersTests: XCTestCase {
    private let phone = CGSize(width: 390, height: 800)
    private let wide = CGSize(width: 1024, height: 700)

    private static let magenta = Color(red: 1, green: 0, blue: 1)
    private static let green = Color(red: 0, green: 1, blue: 0)
    private static let blue = Color(red: 0, green: 0, blue: 1)
    private static let cyan = Color(red: 0, green: 1, blue: 1)
    private static let yellow = Color(red: 1, green: 1, blue: 0)
    private static let black = Color(red: 0, green: 0, blue: 0)

    private static func isMagenta(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 200 && g < 60 && b > 200 }
    private static func isGreen(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r < 60 && g > 200 && b < 60 }
    private static func isBlue(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r < 60 && g < 60 && b > 200 }
    private static func isCyan(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r < 60 && g > 200 && b > 200 }
    private static func isYellow(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 200 && g > 200 && b < 60 }
    private static func isBlack(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r < 30 && g < 30 && b < 30 }
    private static func isLight(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 150 && g > 150 && b > 150 }

    /// Holds what the shell reports, which a test reads after drawing.
    private final class Reported { var insets: KozmosMapCollisionInsets? }

    @MainActor private func render<V: View>(_ view: V, size: CGSize, _ name: String) async throws -> RenderedPixels {
        let pixels = try await RenderedPixels.render(view, size: size)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        return pixels
    }

    private func box(_ pixels: RenderedPixels, _ size: CGSize, _ what: String,
                     _ matches: (UInt8, UInt8, UInt8) -> Bool) throws -> CGRect {
        try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: matches), "\(what) is not drawn")
    }

    /// The shell on a phone with no panel: the status, credits, both bottom
    /// corners and both top corners, each a block of its own colour.
    @ViewBuilder private func phoneShell(
        status: Bool = true,
        startWidth: CGFloat = 120,
        controls: Bool = false,
        padCamera: Bool = false,
        reported: Reported? = nil,
        direction: LayoutDirection = .leftToRight
    ) -> some View {
        KozmosAdaptiveMapShell(
            onCollisionInsetsChange: { reported?.insets = $0 },
            attribution: AnyView(Self.cyan.frame(height: 20)),
            topControlsPadCamera: padCamera,
            controlsBottomStart: { Self.yellow.frame(width: 44, height: 44) },
            controlsBottomEnd: { Self.yellow.frame(width: 44, height: 44) },
            status: { if status { Self.magenta.frame(width: 160, height: 32) } },
            controlsTopStart: { Self.green.frame(width: startWidth, height: 44) },
            controlsTopEnd: { Self.blue.frame(width: 44, height: 44) },
            map: { Color.red },
            mapStatusContent: { EmptyView() },
            controls: { if controls { Self.black.frame(width: 44, height: 88) } },
            panel: { EmptyView() }
        )
        .environment(\.horizontalSizeClass, .compact)
        .environment(\.layoutDirection, direction)
        .environment(\.colorScheme, .light)
    }

    // MARK: The status

    /// Level with the bottom corners, between them, centred on the map, and
    /// the credits directly above it, 16 up. Without a status the credits
    /// rest where the status is.
    @MainActor func testTheStatusSitsLevelWithTheBottomCornersAndTheCreditsRiseAboveIt() async throws {
        let pixels = try await render(phoneShell(), size: phone, "gap-123-status")
        let status = try box(pixels, phone, "the status", Self.isMagenta)
        let corners = try box(pixels, phone, "the bottom corners", Self.isYellow)
        let credits = try box(pixels, phone, "the credits", Self.isCyan)
        XCTAssertEqual(status.maxY, corners.maxY, accuracy: 1, "the status is not level with the corners: \(status) \(corners)")
        XCTAssertEqual(status.midX, phone.width / 2, accuracy: 1, "the status is not centred on the map: \(status)")
        XCTAssertEqual(status.minY - credits.maxY, 16, accuracy: 1, "the credits are not directly above the status: \(credits) \(status)")

        let alone = try await render(phoneShell(status: false), size: phone, "gap-123-no-status")
        let resting = try box(alone, phone, "the credits", Self.isCyan)
        XCTAssertEqual(resting.maxY, status.maxY, accuracy: 1, "without a status the credits rest where it sits")
    }

    /// With no room under the top corners for it and the credits, the status
    /// is not drawn, and the credits keep their place.
    @MainActor func testWithNoRoomTheStatusIsNotDrawn() async throws {
        let short = CGSize(width: 390, height: 130)
        let pixels = try await render(phoneShell(), size: short, "gap-123-status-no-room")
        XCTAssertNil(pixels.boundingBox(in: CGRect(origin: .zero, size: short), where: Self.isMagenta),
                     "a status with no room is drawn")
    }

    /// The status never pads the camera: the insets are the same with it.
    @MainActor func testTheStatusNeverPadsTheCamera() async throws {
        let with = Reported(), without = Reported()
        _ = try await render(phoneShell(reported: with), size: phone, "gap-123-insets-status")
        _ = try await render(phoneShell(status: false, reported: without), size: phone, "gap-123-insets-none")
        let a = try XCTUnwrap(with.insets), b = try XCTUnwrap(without.insets)
        XCTAssertEqual(a, b, "a status moved the camera: \(a) against \(b)")
    }

    /// Beside the map, a side panel the status and the credits do not reach
    /// keeps its height: with no credits, a narrow status centred on the map
    /// is clear of a panel at the edge.
    @MainActor func testASidePanelTheStatusDoesNotReachKeepsItsHeight() async throws {
        func shell(status: Bool) -> some View {
            KozmosAdaptiveMapShell(
                status: { if status { Self.magenta.frame(width: 160, height: 32) } },
                map: { Color.red },
                mapStatusContent: { EmptyView() },
                controls: { EmptyView() },
                panel: { Color.white.frame(height: 2000) }
            )
            .environment(\.horizontalSizeClass, .regular)
            .environment(\.layoutDirection, .leftToRight)
            .environment(\.colorScheme, .light)
        }
        let with = try await render(shell(status: true), size: wide, "gap-123-side-status")
        let without = try await render(shell(status: false), size: wide, "gap-123-side-none")
        let column = CGRect(x: wide.width - 100, y: 0, width: 1, height: wide.height)
        let a = try XCTUnwrap(with.boundingBox(in: column, where: Self.isLight)).maxY
        let b = try XCTUnwrap(without.boundingBox(in: column, where: Self.isLight)).maxY
        XCTAssertEqual(a, b, accuracy: 1, "a status the panel is clear of shortened it")
        XCTAssertNotNil(with.boundingBox(in: CGRect(origin: .zero, size: wide), where: Self.isMagenta), "the status is not drawn")
    }

    // MARK: The top corners

    /// 16 under the top edge, at the logical start and end, in one row.
    @MainActor func testTheTopCornersShareARowAtTheStartAndTheEnd() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let pixels = try await render(phoneShell(direction: direction), size: phone, "gap-123-top-\(direction)")
            let start = try box(pixels, phone, "the top start", Self.isGreen)
            let end = try box(pixels, phone, "the top end", Self.isBlue)
            XCTAssertEqual(start.minY, 16, accuracy: 1, "\(direction): the start is not 16 under the top: \(start)")
            XCTAssertEqual(end.minY, 16, accuracy: 1, "\(direction): the end is not in the start's row: \(end)")
            if direction == .leftToRight {
                XCTAssertEqual(start.minX, 16, accuracy: 1, "the start is not at the left: \(start)")
                XCTAssertEqual(end.maxX, phone.width - 16, accuracy: 1, "the end is not at the right: \(end)")
            } else {
                XCTAssertEqual(start.maxX, phone.width - 16, accuracy: 1, "right to left, the start is not at the right: \(start)")
                XCTAssertEqual(end.minX, 16, accuracy: 1, "right to left, the end is not at the left: \(end)")
            }
        }
    }

    /// When both do not fit one row, the start sits above the end, 16 apart.
    @MainActor func testTheEndWrapsUnderTheStart() async throws {
        let pixels = try await render(phoneShell(startWidth: 320), size: phone, "gap-123-top-wrapped")
        let start = try box(pixels, phone, "the top start", Self.isGreen)
        let end = try box(pixels, phone, "the top end", Self.isBlue)
        XCTAssertEqual(end.minY - start.maxY, 16, accuracy: 1, "the end is not under the start: \(start) \(end)")
        XCTAssertEqual(end.maxX, phone.width - 16, accuracy: 1, "the wrapped end left its side: \(end)")
    }

    /// The controls column starts 16 below the top corners.
    @MainActor func testTheControlsColumnStartsBelowTheTopCorners() async throws {
        let pixels = try await render(phoneShell(controls: true), size: phone, "gap-123-top-controls")
        let start = try box(pixels, phone, "the top start", Self.isGreen)
        let column = try box(pixels, phone, "the controls column", Self.isBlack)
        XCTAssertEqual(column.minY - start.maxY, 16, accuracy: 1, "the controls are not 16 below the corners: \(start) \(column)")
    }

    /// They pad the camera's top only when asked, to their bottom edge.
    @MainActor func testTheTopCornersPadTheCameraOnlyWhenAsked() async throws {
        let quiet = Reported(), padded = Reported()
        _ = try await render(phoneShell(reported: quiet), size: phone, "gap-123-top-quiet")
        _ = try await render(phoneShell(padCamera: true, reported: padded), size: phone, "gap-123-top-padded")
        XCTAssertEqual(try XCTUnwrap(quiet.insets).top, 0, accuracy: 0.5, "the corners padded the camera unasked")
        XCTAssertEqual(try XCTUnwrap(padded.insets).top, 16 + 44, accuracy: 0.5, "the corners did not pad the camera's top")
    }

    /// Their container is one, named, and their parts are still read.
    @MainActor func testTheTopCornersShareOneNamedContainer() async throws {
        let view = KozmosAdaptiveMapShell(
            topControlsLabel: "Kartenecken oben",
            controlsTopStart: { Button("Exit building") {} },
            controlsTopEnd: { Button("Map information") {} },
            map: { Color.red },
            mapStatusContent: { EmptyView() },
            controls: { EmptyView() },
            panel: { EmptyView() }
        )
        .environment(\.horizontalSizeClass, .compact)
        try await inspectAccessibility(view, size: phone) { window in
            let labels = accessibilityNodes(window).compactMap(\.accessibilityLabel)
            XCTAssertTrue(labels.contains("Kartenecken oben"), "the container is not named:\n\(describeAccessibility(window))")
            XCTAssertNoThrow(try accessibilityElement(named: "Exit building", in: window))
            XCTAssertNoThrow(try accessibilityElement(named: "Map information", in: window))
        }
    }
}
#endif
