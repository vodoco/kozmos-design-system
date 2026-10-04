import SwiftUI

/// A Pointr Icon Library outline that SF Symbols has no counterpart for,
/// drawn from Pointr's own path on the icons' 24 grid.
///
/// Used where an SF Symbol is absent or does not match the canonical outline.
/// Go uses the same northeast, unfilled pointer as React, not location.north.
struct KozmosPointrGlyph: Shape {
    /// Lines on the 24 grid: each run starts at its first point.
    let runs: [[CGPoint]]
    var canonicalPath: Path? = nil

    /// The names this draws, from `packages/icons/src/pointr/icons.generated.ts`.
    static func named(_ name: String) -> KozmosPointrGlyph? {
        switch name {
        case "navigation-pointer-01":
            return KozmosPointrGlyph(runs: [], canonicalPath: KozmosNavigationGlyphPaths.path(name))
        case "bluetooth-off":
            // M6 17L12 12V22L17.4398 17.4668M12 7V2L18 7L15.0817 9.43194M21 21L3 3
            return KozmosPointrGlyph(runs: [
                [CGPoint(x: 6, y: 17), CGPoint(x: 12, y: 12), CGPoint(x: 12, y: 22), CGPoint(x: 17.4398, y: 17.4668)],
                [CGPoint(x: 12, y: 7), CGPoint(x: 12, y: 2), CGPoint(x: 18, y: 7), CGPoint(x: 15.0817, y: 9.43194)],
                [CGPoint(x: 21, y: 21), CGPoint(x: 3, y: 3)],
            ])
        default:
            return nil
        }
    }

    func path(in rect: CGRect) -> Path {
        let scale = min(rect.width, rect.height) / 24
        if let canonicalPath {
            return canonicalPath.applying(CGAffineTransform(a: scale, b: 0, c: 0, d: scale, tx: rect.minX, ty: rect.minY))
        }
        var path = Path()
        for run in runs {
            guard let first = run.first else { continue }
            path.move(to: CGPoint(x: rect.minX + first.x * scale, y: rect.minY + first.y * scale))
            for point in run.dropFirst() {
                path.addLine(to: CGPoint(x: rect.minX + point.x * scale, y: rect.minY + point.y * scale))
            }
        }
        return path
    }

    /// Stroke 2 on the 24 grid, with round caps and joins, as every Pointr
    /// outline is: 2 × size / 24 at any size.
    static func style(size: CGFloat) -> StrokeStyle {
        StrokeStyle(lineWidth: KozmosDimensions.primitivesIconStrokeMd * size / 24, lineCap: .round, lineJoin: .round)
    }
}
