import XCTest
import SwiftUI
import CoreGraphics
import ImageIO
@testable import Kozmos

/// GAP-150, decisions 86 and 219: SpriteIcon draws one cell of a published
/// MapLibre atlas as published, scaled with its aspect ratio kept, from the
/// @2x atlas on a 2x screen, and keeps an empty box for a missing cell.
final class KozmosSpriteIconTests: XCTestCase {
    /// The atlas cut from Pointr's 10.17.0 light sprite that the stories use.
    private static let fixture = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        .deletingLastPathComponent().deletingLastPathComponent()
        .appendingPathComponent("apps/docs/src/sprite-fixture")

    func testItPicksTheAt2xAtlasOnA2xScreen() {
        XCTAssertEqual(KozmosSprite.suffix(forScale: 1), "")
        XCTAssertEqual(KozmosSprite.suffix(forScale: 1.5), "")
        XCTAssertEqual(KozmosSprite.suffix(forScale: 2), "@2x")
        XCTAssertEqual(KozmosSprite.suffix(forScale: 3), "@2x")
    }

    func testACellKeepsItsAspectRatioInItsBox() {
        let square = KozmosSpriteCell(x: 0, y: 0, width: 90, height: 90, pixelRatio: 2)
        let tall = KozmosSpriteCell(x: 0, y: 0, width: 90, height: 110, pixelRatio: 2)
        XCTAssertEqual(KozmosSprite.fittedSize(of: square, in: 24), CGSize(width: 24, height: 24))
        let fitted = KozmosSprite.fittedSize(of: tall, in: 20)
        XCTAssertEqual(fitted.height, 20)
        XCTAssertEqual(fitted.width, 90 * 20 / 110, accuracy: 0.001)
    }

    func testTheCellIsCutFromThePublishedAtlasAsDrawn() throws {
        let index = try KozmosSprite.index(from: Data(contentsOf: Self.fixture.appendingPathComponent("sprite@2x.json")))
        let data = try Data(contentsOf: Self.fixture.appendingPathComponent("sprite@2x.png"))
        let source = try XCTUnwrap(CGImageSourceCreateWithData(data as CFData, nil))
        let atlas = try XCTUnwrap(CGImageSourceCreateImageAtIndex(source, 0, nil))
        let desk = try XCTUnwrap(index["desk"])
        let cell = try XCTUnwrap(KozmosSprite.crop(atlas, to: desk))
        XCTAssertEqual(cell.width, 90)
        XCTAssertEqual(cell.height, 90)
        // Drawn as published: the bubble's own blue at its left, not a tint.
        let pixel = try XCTUnwrap(Self.rgba(of: cell, x: 12, y: 45))
        XCTAssertGreaterThan(pixel.alpha, 200)
        XCTAssertGreaterThan(pixel.blue, pixel.red, "the desk bubble is blue")
        XCTAssertNil(index["not-in-the-atlas"])
    }

    func testTheAtlasIsReadOncePerURLAndScale() async throws {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [FixtureProtocol.self]
        let session = URLSession(configuration: configuration)
        FixtureProtocol.root = Self.fixture
        FixtureProtocol.requests = []
        let cache = KozmosSpriteAtlasCache()
        let first = await cache.atlas(base: "https://cdn.test/sprite", suffix: "@2x", session: session)
        let again = await cache.atlas(base: "https://cdn.test/sprite", suffix: "@2x", session: session)
        XCTAssertNotNil(first?.cells["atm"])
        XCTAssertNotNil(again)
        XCTAssertEqual(FixtureProtocol.requests.sorted(), ["/sprite@2x.json", "/sprite@2x.png"])
        let missing = await cache.atlas(base: "https://cdn.test/missing", suffix: "", session: session)
        XCTAssertNil(missing, "an atlas that cannot be read draws nothing")
    }

    #if os(iOS)
    @MainActor func testItKeepsAnEmptyBoxOfItsSizeWhileNothingIsDrawn() {
        for size in KozmosSpriteIconSize.allCases {
            let host = UIHostingController(rootView: KozmosSpriteIcon(sprite: "https://cdn.test/none", name: "atm", size: size))
            let drawn = host.sizeThatFits(in: CGSize(width: 200, height: 200))
            XCTAssertEqual(drawn, CGSize(width: size.rawValue, height: size.rawValue), "\(size)")
        }
    }
    #endif

    private static func rgba(of image: CGImage, x: Int, y: Int) -> (red: Int, green: Int, blue: Int, alpha: Int)? {
        var bytes = [UInt8](repeating: 0, count: 4)
        guard let context = CGContext(data: &bytes, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4,
                                      space: CGColorSpaceCreateDeviceRGB(),
                                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
        else { return nil }
        context.draw(image, in: CGRect(x: -x, y: -(image.height - y - 1), width: image.width, height: image.height))
        return (Int(bytes[0]), Int(bytes[1]), Int(bytes[2]), Int(bytes[3]))
    }
}

/// Serves the fixture atlas for https://cdn.test/sprite…; anything else is a 404.
final class FixtureProtocol: URLProtocol {
    nonisolated(unsafe) static var root = URL(fileURLWithPath: "/")
    nonisolated(unsafe) static var requests: [String] = []

    override class func canInit(with request: URLRequest) -> Bool { request.url?.host == "cdn.test" }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let path = request.url?.path ?? ""
        Self.requests.append(path)
        let file = Self.root.appendingPathComponent(String(path.dropFirst()))
        if path.hasPrefix("/sprite"), let data = try? Data(contentsOf: file) {
            client?.urlProtocol(self, didReceive: HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
        } else {
            client?.urlProtocol(self, didFailWithError: URLError(.fileDoesNotExist))
        }
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}
