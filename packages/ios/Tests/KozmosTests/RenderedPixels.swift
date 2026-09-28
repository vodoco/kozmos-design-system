#if os(iOS)
import SnapshotTesting
import SwiftUI
import UIKit
import XCTest

/// What a test drew, readable in points: render a view to an image, then find
/// where pixels of a colour are. Measured, not reasoned about.
struct RenderedPixels {
    let width: Int
    let height: Int
    let scale: CGFloat
    /// The rendered image itself, for an attachment.
    let image: UIImage
    private let rgba: [UInt8]

    @MainActor
    static func render<V: View>(_ view: V, size: CGSize) async throws -> RenderedPixels {
        let controller = UIHostingController(rootView: view.frame(width: size.width, height: size.height))
        // ImageRenderer cannot capture ScrollView's UIKit-backed content; a
        // hosted snapshot can.
        let strategy = Snapshotting<UIViewController, UIImage>.image(size: size)
        let image = await withCheckedContinuation { continuation in
            strategy.snapshot(controller).run { continuation.resume(returning: $0) }
        }
        return try RenderedPixels(image, pointWidth: size.width)
    }

    init(_ image: UIImage, pointWidth: CGFloat) throws {
        self.image = image
        let cgImage = try XCTUnwrap(image.cgImage)
        width = cgImage.width
        height = cgImage.height
        scale = CGFloat(cgImage.width) / pointWidth
        var buffer = [UInt8](repeating: 0, count: width * height * 4)
        let context = try XCTUnwrap(CGContext(
            data: &buffer, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue))
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        rgba = buffer
    }

    /// The bounding box, in points, of the pixels inside `region` (in points)
    /// that match; nil when none does.
    func boundingBox(in region: CGRect, where matches: (UInt8, UInt8, UInt8) -> Bool) -> CGRect? {
        let x0 = max(0, Int(region.minX * scale)), x1 = min(width, Int(region.maxX * scale))
        let y0 = max(0, Int(region.minY * scale)), y1 = min(height, Int(region.maxY * scale))
        guard x0 < x1, y0 < y1 else { return nil }
        var minX = Int.max, minY = Int.max, maxX = -1, maxY = -1
        for y in y0..<y1 {
            for x in x0..<x1 {
                let i = (y * width + x) * 4
                if matches(rgba[i], rgba[i + 1], rgba[i + 2]) {
                    minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
                }
            }
        }
        guard maxX >= 0 else { return nil }
        return CGRect(x: CGFloat(minX) / scale, y: CGFloat(minY) / scale,
                      width: CGFloat(maxX - minX + 1) / scale, height: CGFloat(maxY - minY + 1) / scale)
    }

    /// How many pixels inside `region` (in points) match.
    func count(in region: CGRect, where matches: (UInt8, UInt8, UInt8) -> Bool) -> Int {
        let x0 = max(0, Int(region.minX * scale)), x1 = min(width, Int(region.maxX * scale))
        let y0 = max(0, Int(region.minY * scale)), y1 = min(height, Int(region.maxY * scale))
        guard x0 < x1, y0 < y1 else { return 0 }
        var found = 0
        for y in y0..<y1 {
            for x in x0..<x1 {
                let i = (y * width + x) * 4
                if matches(rgba[i], rgba[i + 1], rgba[i + 2]) { found += 1 }
            }
        }
        return found
    }

    /// The colour drawn at a point, in points.
    func color(at point: CGPoint) -> (r: UInt8, g: UInt8, b: UInt8) {
        let x = min(max(Int(point.x * scale), 0), width - 1), y = min(max(Int(point.y * scale), 0), height - 1)
        let i = (y * width + x) * 4
        return (rgba[i], rgba[i + 1], rgba[i + 2])
    }

    /// The theme fill of a pressed or primary button.
    static func isTheme(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { b > 120 && Int(b) > Int(r) + 60 && Int(b) > Int(g) + 40 }
    /// Body text, as opposed to the grey of a secondary label.
    static func isDarkText(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r < 80 && g < 80 && b < 90 }
    /// Anything drawn on a white background.
    static func isInk(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r < 235 || g < 235 || b < 235 }
}
#endif
