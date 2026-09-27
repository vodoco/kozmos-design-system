import SwiftUI
import XCTest

/// What a view draws, read back in points — with no window and no simulator.
///
/// `RenderedPixels` hosts a view in UIKit, so it is iOS-only and only runs
/// where someone points xcodebuild at a simulator. `ImageRenderer` draws on a
/// Mac as well, so a test built on this runs in `swift test`, which is what CI
/// runs. It draws only what SwiftUI draws itself — shapes, text, plain
/// buttons — which is all a placeholder or a floor's marker is. Where nothing
/// is drawn the pixel is clear, so a shape's corners can be told from its body.
struct DrawnPixels {
    let width: Int
    let height: Int
    let scale: CGFloat
    private let rgba: [UInt8]

    @MainActor
    static func draw<V: View>(_ view: V, scale: CGFloat = 2) throws -> DrawnPixels {
        let renderer = ImageRenderer(content: view)
        renderer.scale = scale
        let image = try XCTUnwrap(renderer.cgImage, "nothing was drawn")
        return try DrawnPixels(image, scale: scale)
    }

    private init(_ image: CGImage, scale: CGFloat) throws {
        self.scale = scale
        width = image.width
        height = image.height
        var buffer = [UInt8](repeating: 0, count: width * height * 4)
        let context = try XCTUnwrap(CGContext(
            data: &buffer, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue))
        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        rgba = buffer
    }

    /// The drawing's size, in points.
    var size: CGSize { CGSize(width: CGFloat(width) / scale, height: CGFloat(height) / scale) }

    /// The colour and coverage drawn at a point, in points.
    func pixel(at point: CGPoint) -> (r: UInt8, g: UInt8, b: UInt8, a: UInt8) {
        let x = min(max(Int(point.x * scale), 0), width - 1)
        let y = min(max(Int(point.y * scale), 0), height - 1)
        let i = (y * width + x) * 4
        return (rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3])
    }

    /// Whether something covers the point, rather than the clear it started as.
    func isDrawn(at point: CGPoint) -> Bool { pixel(at: point).a > 200 }

    /// The bounding box, in points, of the pixels that match; nil when none does.
    func boundingBox(where matches: (UInt8, UInt8, UInt8, UInt8) -> Bool) -> CGRect? {
        var minX = Int.max, minY = Int.max, maxX = -1, maxY = -1
        for y in 0..<height {
            for x in 0..<width {
                let i = (y * width + x) * 4
                if matches(rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]) {
                    minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y)
                }
            }
        }
        guard maxX >= 0 else { return nil }
        return CGRect(x: CGFloat(minX) / scale, y: CGFloat(minY) / scale,
                      width: CGFloat(maxX - minX + 1) / scale, height: CGFloat(maxY - minY + 1) / scale)
    }

    /// How many pixels inside `region` (in points) match.
    func count(in region: CGRect, where matches: (UInt8, UInt8, UInt8, UInt8) -> Bool) -> Int {
        let x0 = max(0, Int(region.minX * scale)), x1 = min(width, Int(region.maxX * scale))
        let y0 = max(0, Int(region.minY * scale)), y1 = min(height, Int(region.maxY * scale))
        guard x0 < x1, y0 < y1 else { return 0 }
        var found = 0
        for y in y0..<y1 {
            for x in x0..<x1 {
                let i = (y * width + x) * 4
                if matches(rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]) { found += 1 }
            }
        }
        return found
    }

    /// The largest difference, in any channel of any pixel, between two
    /// drawings of one size; nil when their sizes differ. Two renders of the
    /// same view are not bit-for-bit alike once anything else has been drawn:
    /// shadows and antialiased edges move by a level or two, so a comparison
    /// allows that much and no more.
    func largestDifference(from other: DrawnPixels) -> Int? {
        guard width == other.width, height == other.height else { return nil }
        var largest = 0
        for i in rgba.indices {
            largest = max(largest, abs(Int(rgba[i]) - Int(other.rgba[i])))
        }
        return largest
    }

    /// A token as it resolves in a colour scheme: drawn as a swatch and read
    /// back, so a test compares against the token and never against a copy of
    /// its hex.
    @MainActor
    static func resolved(_ color: Color, in scheme: ColorScheme) throws -> (r: UInt8, g: UInt8, b: UInt8, a: UInt8) {
        let swatch = try draw(Rectangle().fill(color).frame(width: 4, height: 4).environment(\.colorScheme, scheme))
        return swatch.pixel(at: CGPoint(x: 2, y: 2))
    }

    /// Opaque and close to a colour, channel by channel.
    static func matches(_ colour: (r: UInt8, g: UInt8, b: UInt8, a: UInt8), tolerance: Int = 6)
        -> (UInt8, UInt8, UInt8, UInt8) -> Bool {
        { r, g, b, a in
            a > 240
                && abs(Int(r) - Int(colour.r)) <= tolerance
                && abs(Int(g) - Int(colour.g)) <= tolerance
                && abs(Int(b) - Int(colour.b)) <= tolerance
        }
    }
}
