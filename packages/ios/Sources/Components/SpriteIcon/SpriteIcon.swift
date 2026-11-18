import SwiftUI
import CoreGraphics
import ImageIO

/// The box a `KozmosSpriteIcon` is drawn in, square (decision 219).
public enum KozmosSpriteIconSize: CGFloat, CaseIterable {
    case s16 = 16
    case s20 = 20
    case s24 = 24
}

/// One cell of a MapLibre sprite atlas's index.
public struct KozmosSpriteCell: Equatable, Decodable {
    public let x: CGFloat
    public let y: CGFloat
    public let width: CGFloat
    public let height: CGFloat
    public let pixelRatio: CGFloat?
}

/// Reading a published atlas, apart from any view: MapLibre's suffix for a
/// screen, the index, and where a cell lands in its box.
public enum KozmosSprite {
    /// MapLibre's suffix: `@2x` on a 2x screen and above, none below.
    public static func suffix(forScale scale: CGFloat) -> String {
        scale >= 2 ? "@2x" : ""
    }

    /// The atlas's index, its cells by name.
    public static func index(from data: Data) throws -> [String: KozmosSpriteCell] {
        try JSONDecoder().decode([String: KozmosSpriteCell].self, from: data)
    }

    /// The cell's size in a `side` box, scaled to fit with its aspect ratio kept.
    public static func fittedSize(of cell: KozmosSpriteCell, in side: CGFloat) -> CGSize {
        let scale = side / max(cell.width, cell.height)
        return CGSize(width: cell.width * scale, height: cell.height * scale)
    }

    /// The cell cut from its atlas image, or nil where it falls outside it.
    public static func crop(_ atlas: CGImage, to cell: KozmosSpriteCell) -> CGImage? {
        atlas.cropping(to: CGRect(x: cell.x, y: cell.y, width: cell.width, height: cell.height))
    }
}

/// Atlases read once per URL and scale, shared by every icon.
actor KozmosSpriteAtlasCache {
    static let shared = KozmosSpriteAtlasCache()

    struct Atlas {
        let image: CGImage
        let cells: [String: KozmosSpriteCell]
    }

    private var loads: [String: Task<Atlas?, Never>] = [:]

    func atlas(base: String, suffix: String, session: URLSession = .shared) async -> Atlas? {
        let key = base + suffix
        if let load = loads[key] { return await load.value }
        let load = Task<Atlas?, Never> {
            guard let indexURL = URL(string: key + ".json"),
                  let imageURL = URL(string: key + ".png"),
                  let (indexData, _) = try? await session.data(from: indexURL),
                  let (imageData, _) = try? await session.data(from: imageURL),
                  let cells = try? KozmosSprite.index(from: indexData),
                  let source = CGImageSourceCreateWithData(imageData as CFData, nil),
                  let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
            else { return nil }
            return Atlas(image: image, cells: cells)
        }
        loads[key] = load
        return await load.value
    }
}

/// One cell of a published MapLibre sprite atlas, drawn as published
/// (GAP-150, decisions 86 and 219), as React's `SpriteIcon`: a taxonomy
/// type's full-colour bubble, glyph and marker dot, scaled to 16, 20 or 24
/// with its aspect ratio kept, never tinted. `sprite` is the atlas's
/// version-pinned base URL, to which `.json` and `.png` (`@2x` on a 2x
/// screen) are added; Kozmos names no version. Decorative unless `label`
/// names it. While the atlas loads, or where the cell is missing, it keeps
/// an empty box of its size.
public struct KozmosSpriteIcon: View {
    public let sprite: String
    public let name: String
    public let size: KozmosSpriteIconSize
    public let label: String?

    @Environment(\.displayScale) private var displayScale
    @State private var drawn: (image: CGImage, scale: CGFloat, cell: KozmosSpriteCell)?

    public init(sprite: String, name: String, size: KozmosSpriteIconSize = .s24, label: String? = nil) {
        self.sprite = sprite
        self.name = name
        self.size = size
        self.label = label
    }

    public var body: some View {
        let side = size.rawValue
        ZStack {
            if let drawn {
                let fitted = KozmosSprite.fittedSize(of: drawn.cell, in: side)
                Image(decorative: drawn.image, scale: drawn.scale)
                    .resizable()
                    .interpolation(.high)
                    .frame(width: fitted.width, height: fitted.height)
            }
        }
        .frame(width: side, height: side)
        .modifier(KozmosSpriteIconSemantics(label: label))
        .task(id: "\(sprite)|\(name)|\(KozmosSprite.suffix(forScale: displayScale))") {
            drawn = nil
            let suffix = KozmosSprite.suffix(forScale: displayScale)
            guard let atlas = await KozmosSpriteAtlasCache.shared.atlas(base: sprite, suffix: suffix),
                  let cell = atlas.cells[name],
                  let image = KozmosSprite.crop(atlas.image, to: cell)
            else { return }
            drawn = (image, cell.pixelRatio ?? (suffix.isEmpty ? 1 : 2), cell)
        }
    }
}

/// Named, one image VoiceOver reads by its label; otherwise hidden.
private struct KozmosSpriteIconSemantics: ViewModifier {
    let label: String?

    func body(content: Content) -> some View {
        if let label {
            content
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(label)
                .accessibilityAddTraits(.isImage)
        } else {
            content.accessibilityHidden(true)
        }
    }
}
