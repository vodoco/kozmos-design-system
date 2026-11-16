import XCTest
import SwiftUI
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// `KozmosImageCropper` (GAP-273): an image framed to a ratio, its frame as
/// fractions of the image, moved by a drag, the keyboard or VoiceOver's
/// actions, zoomed by a pinch, the zoom row or swiping up and down, each
/// change said. The arithmetic is React's, number for number.
final class KozmosImageCropperTests: XCTestCase {
    /// A 1600 × 1200 image, as React's tests frame.
    let size = CGSize(width: 1600, height: 1200)

    func testASquareOfALandscapeImageStartsInTheMiddleAtZoom100() {
        let frame = KozmosImageCropFrame(imageSize: size, aspectRatio: 1, maxZoom: 4)
        let start = frame.normalise(nil)
        XCTAssertEqual(start.x, 0.125, accuracy: 1e-9)
        XCTAssertEqual(start.y, 0, accuracy: 1e-9)
        XCTAssertEqual(start.width, 0.75, accuracy: 1e-9)
        XCTAssertEqual(start.height, 1, accuracy: 1e-9)
        XCTAssertEqual(frame.status(start), KozmosImageCropperStatus(left: 13, top: 0, zoom: 100))
    }

    /// React's "moves the frame by arrow keys and zooms by plus and minus".
    func testPanAndZoomAsReactDoes() {
        let frame = KozmosImageCropFrame(imageSize: size, aspectRatio: 16.0 / 9.0, maxZoom: 4)
        var crop = frame.normalise(nil)
        crop = frame.pan(crop, dx: 0, dy: 1)
        XCTAssertEqual(frame.status(crop), KozmosImageCropperStatus(left: 0, top: 20, zoom: 100))
        // At the left edge already: it stays there.
        XCTAssertEqual(frame.pan(crop, dx: -1, dy: 0), crop)
        crop = frame.zoom(crop, to: frame.zoom(of: crop) * 1.25)
        XCTAssertEqual(frame.status(crop).zoom, 125)
        crop = frame.pan(crop, dx: 1, dy: 0)
        crop = frame.zoom(crop, to: frame.zoom(of: crop) / 1.25)
        crop = frame.zoom(crop, to: frame.zoom(of: crop) * 1.25)
        XCTAssertEqual(crop.width, 0.8, accuracy: 1e-9)
        XCTAssertEqual(crop.height, 0.6, accuracy: 1e-9)
        XCTAssertEqual(crop.x, 0.1, accuracy: 1e-9)
        XCTAssertEqual(crop.y, 0.275, accuracy: 1e-9)
    }

    func testZoomIsHeldBetweenOneAndMaxZoom() {
        let frame = KozmosImageCropFrame(imageSize: size, aspectRatio: 1, maxZoom: 2)
        let start = frame.normalise(nil)
        XCTAssertEqual(frame.zoom(of: frame.zoom(start, to: 9)), 2, accuracy: 1e-9)
        XCTAssertEqual(frame.zoom(of: frame.zoom(start, to: 0.2)), 1, accuracy: 1e-9)
    }

    /// A drag up by a tenth of the box moves the frame down a tenth of itself;
    /// a pinch to twice the size about the middle is zoom 200%.
    func testADragMovesTheFrameAgainstTheFingerAndAPinchZooms() {
        let wide = KozmosImageCropFrame(imageSize: size, aspectRatio: 16.0 / 9.0, maxZoom: 4)
        let dragged = wide.drag(wide.normalise(nil), dx: 0, dy: -0.1, scale: 1)
        XCTAssertEqual(dragged.y, 0.2, accuracy: 1e-9)
        let square = KozmosImageCropFrame(imageSize: size, aspectRatio: 1, maxZoom: 4)
        let pinched = square.drag(square.normalise(nil), dx: 0, dy: 0, scale: 2)
        XCTAssertEqual(pinched.width, 0.375, accuracy: 1e-9)
        XCTAssertEqual(pinched.x + pinched.width / 2, 0.5, accuracy: 1e-9)
    }

    /// A frame given in is held to the ratio and the image.
    func testAGivenFrameIsNormalised() {
        let frame = KozmosImageCropFrame(imageSize: size, aspectRatio: 16.0 / 9.0, maxZoom: 4)
        let given = frame.normalise(KozmosImageCrop(x: 0.9, y: 0.2, width: 0.5, height: 0.9))
        XCTAssertEqual(given.width, 0.5, accuracy: 1e-9)
        XCTAssertEqual(given.height, 0.375, accuracy: 1e-9)
        XCTAssertEqual(given.x, 0.5, accuracy: 1e-9)
        XCTAssertEqual(given.y, 0.2, accuracy: 1e-9)
    }

    #if os(iOS)
    @MainActor private func views<V: UIView>(_ type: V.Type, in view: UIView) -> [V] {
        if let match = view as? V { return [match] }
        return view.subviews.flatMap { views(type, in: $0) }
    }

    /// A host that keeps the frame, as a product does.
    private struct Host: View {
        @State var crop: KozmosImageCrop?
        var aspectRatio: Double = 1
        var label = "Image frame"
        var body: some View {
            KozmosImageCropper(
                image: Image(systemName: "photo"),
                imageSize: CGSize(width: 1600, height: 1200),
                crop: $crop,
                aspectRatio: aspectRatio,
                label: label
            )
            .frame(width: 300)
        }
    }

    @MainActor func testTheFrameIsOneAdjustableElementSayingWhereItIs() async throws {
        try await inspectAccessibility(Host()) { window in
            let cropper = try accessibilityElement(named: "Image frame", in: window)
            XCTAssertTrue(cropper.accessibilityTraits.contains(.adjustable), describeAccessibility(window))
            XCTAssertEqual(cropper.accessibilityValue, "Frame 13% from the left, 0% from the top, zoom 100%.")
            XCTAssertEqual(
                cropper.accessibilityHint,
                "Drag the image, or use the arrow keys to move the frame and plus and minus to zoom."
            )
            XCTAssertEqual(
                (cropper.accessibilityCustomActions ?? []).map(\.name),
                ["Move left", "Move right", "Move up", "Move down"]
            )
        }
    }

    @MainActor func testSwipingUpZoomsInAndAMoveActionMovesTheFrame() async throws {
        try await inspectAccessibility(Host()) { window in
            let cropper = try accessibilityElement(named: "Image frame", in: window)
            cropper.accessibilityIncrement()
            try await Task.sleep(nanoseconds: 200_000_000)
            var now = try accessibilityElement(named: "Image frame", in: window)
            XCTAssertEqual(now.accessibilityValue, "Frame 20% from the left, 10% from the top, zoom 125%.")
            let left = try XCTUnwrap(now.accessibilityCustomActions?.first { $0.name == "Move left" })
            _ = left.actionHandler?(left)
            try await Task.sleep(nanoseconds: 200_000_000)
            now = try accessibilityElement(named: "Image frame", in: window)
            // 0.2 less a tenth of 0.6.
            XCTAssertEqual(now.accessibilityValue, "Frame 14% from the left, 10% from the top, zoom 125%.")
            now.accessibilityDecrement()
            try await Task.sleep(nanoseconds: 200_000_000)
            now = try accessibilityElement(named: "Image frame", in: window)
            // Zoomed out about its middle, 0.44 across.
            XCTAssertEqual(now.accessibilityValue, "Frame 7% from the left, 0% from the top, zoom 100%.")
        }
    }

    @MainActor func testTheZoomRowIsNamedAndZoomOutIsUnavailableAtTheStart() async throws {
        try await inspectAccessibility(Host()) { window in
            let zoomOut = try accessibilityElement(named: "Zoom out", in: window)
            XCTAssertTrue(zoomOut.accessibilityTraits.contains(.notEnabled), describeAccessibility(window))
            let zoomIn = try accessibilityElement(named: "Zoom in", in: window)
            XCTAssertFalse(zoomIn.accessibilityTraits.contains(.notEnabled))
            // Between them, the zoom slider: UIKit's own, whose accessibility
            // this test's automation does not load, so it is found as a view.
            XCTAssertEqual(views(UISlider.self, in: window).count, 1, describeAccessibility(window))
        }
    }

    @MainActor func testTheFrameTakesTheRatioAndTheProductsName() async throws {
        try await inspectAccessibility(Host(aspectRatio: 16.0 / 9.0, label: "Kapak çerçevesi")) { window in
            let cropper = try accessibilityElement(named: "Kapak çerçevesi", in: window)
            let frame = cropper.accessibilityFrame
            XCTAssertEqual(frame.width / frame.height, 16.0 / 9.0, accuracy: 0.02)
            XCTAssertEqual(cropper.accessibilityValue, "Frame 0% from the left, 13% from the top, zoom 100%.")
        }
    }
    #endif
}
