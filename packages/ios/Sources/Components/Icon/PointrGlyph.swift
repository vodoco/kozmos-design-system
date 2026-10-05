import SwiftUI

/// A Pointr Icon Library outline that SF Symbols has no counterpart for,
/// drawn from Pointr's own path on the icons' 24 grid.
///
/// Used where an SF Symbol is absent or does not match the canonical outline.
/// Go uses the same northeast, unfilled pointer as React, not location.north.
/// Pointr's wayfinding artwork from Pointr Maps - Express is drawn here too:
/// solid shapes, which `painted(size:)` fills where it strokes an outline.
struct KozmosPointrGlyph: Shape {
    /// Lines on the 24 grid: each run starts at its first point.
    let runs: [[CGPoint]]
    var canonicalPath: Path? = nil
    /// A solid shape, filled with the nonzero rule as React fills it, rather
    /// than an outline stroked 2 on the grid.
    var isFilled = false

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
        case "log-in-01":
            // Node 1007:10044.
            return outline("M15 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11985 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H15M10 17L15 12L10 7M15 12L3 12")
        case "log-out-01":
            // Node 1007:10056.
            return outline("M16 7L21 12L16 17M21 12H9M9 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H9")
        case "arrow-up-right":
            // Node 1007:9346.
            return outline("M7 17L17 7M17 17V7H7")
        case "arrow-down-right":
            // Node 1007:9283.
            return outline("M7 7L17 17M7 17H17V7")
        default:
            return nil
        }
    }

    /// Pointr's wayfinding artwork, by its kind in the generated paths:
    /// filled when the source draws it solid, as all the Express glyphs are.
    static func wayfinding(_ kind: String) -> KozmosPointrGlyph? {
        guard let path = KozmosNavigationGlyphPaths.path(kind) else { return nil }
        return KozmosPointrGlyph(runs: [], canonicalPath: path, isFilled: KozmosNavigationGlyphPaths.filled.contains(kind))
    }

    /// The wayfinding artwork's names: the kebab case of the names
    /// `@kozmos-ds/icons` exports it under, which Compose's `KozmosIcon`
    /// accepts too. The directions draw fourteen of them: the first ten, and
    /// hard-left, hard-right, turn-back and arriving for the turns, turning
    /// back and the destination.
    static let wayfindingKinds: [String: String] = [
        "elevator-up": "lift-up", "elevator-down": "lift-down",
        "stairs-up": "stairs-up", "stairs-down": "stairs-down",
        "escalator-up": "escalator-up", "escalator-down": "escalator-down",
        "ramp-up": "ramp-up", "ramp-down": "ramp-down",
        "route-enter": "enter", "route-exit": "exit",
        "elevator-up-and-down": "wf-elevator-up-and-down",
        "escalator-no-direction": "wf-escalator-no-direction",
        "stairs-no-direction": "wf-stairs-no-direction",
        "ramp-no-direction": "wf-ramp-no-direction",
        "route-entrance-exit": "wf-entrance-exit",
        "hard-left": "wf-hard-left", "hard-right": "wf-hard-right",
        "turn-back": "wf-turn-back", "follow-the-line": "wf-follow-the-line",
        "arriving": "wf-arriving", "custom-transition": "wf-custom-transition",
        "security-control": "wf-security-control", "shuttle": "wf-shuttle",
    ]

    /// The wayfinding artwork a product draws by name.
    static func navigationArtwork(_ name: String) -> KozmosPointrGlyph? {
        wayfindingKinds[name].flatMap(wayfinding)
    }

    /// An outline from Pointr's path data, copied as `icons.generated.ts`
    /// spells it: absolute M, L, H, V, C and Z. Any other command gives nil,
    /// so an outline that needs one fails its test instead of drawing wrong.
    static func outline(_ data: String) -> KozmosPointrGlyph? {
        var commands: [(command: Character, values: [CGFloat])] = []
        var number = ""
        func flush() -> Bool {
            defer { number = "" }
            guard !number.isEmpty else { return true }
            guard let value = Double(number), !commands.isEmpty else { return false }
            commands[commands.count - 1].values.append(CGFloat(value))
            return true
        }
        for character in data {
            if character.isLetter {
                guard flush() else { return nil }
                commands.append((character, []))
            } else if character == " " || character == "," {
                guard flush() else { return nil }
            } else if character == "-" {
                // A minus starts the next number: "1-2" is two.
                guard flush() else { return nil }
                number = "-"
            } else {
                number.append(character)
            }
        }
        guard flush() else { return nil }

        var path = Path()
        var start = CGPoint.zero
        var current = CGPoint.zero
        for (command, values) in commands {
            let arity: Int
            switch command {
            case "M", "L": arity = 2
            case "H", "V": arity = 1
            case "C": arity = 6
            case "Z": arity = 0
            default: return nil
            }
            if arity == 0 {
                guard values.isEmpty else { return nil }
                path.closeSubpath()
                current = start
                continue
            }
            guard !values.isEmpty, values.count % arity == 0 else { return nil }
            for index in stride(from: 0, to: values.count, by: arity) {
                let v = Array(values[index..<index + arity])
                switch command {
                case "M" where index == 0:
                    current = CGPoint(x: v[0], y: v[1])
                    start = current
                    path.move(to: current)
                case "M", "L":
                    // Pairs after a move's first are lines, as SVG reads them.
                    current = CGPoint(x: v[0], y: v[1])
                    path.addLine(to: current)
                case "H":
                    current = CGPoint(x: v[0], y: current.y)
                    path.addLine(to: current)
                case "V":
                    current = CGPoint(x: current.x, y: v[0])
                    path.addLine(to: current)
                default:
                    current = CGPoint(x: v[4], y: v[5])
                    path.addCurve(to: current, control1: CGPoint(x: v[0], y: v[1]), control2: CGPoint(x: v[2], y: v[3]))
                }
            }
        }
        return KozmosPointrGlyph(runs: [], canonicalPath: path)
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

    /// The glyph as its artwork is drawn at a size: a solid shape filled, an
    /// outline stroked 2 on the grid.
    @ViewBuilder func painted(size: CGFloat) -> some View {
        if isFilled {
            fill()
        } else {
            stroke(style: Self.style(size: size))
        }
    }

    /// Stroke 2 on the 24 grid, with round caps and joins, as every Pointr
    /// outline is: 2 × size / 24 at any size.
    static func style(size: CGFloat) -> StrokeStyle {
        StrokeStyle(lineWidth: KozmosDimensions.primitivesIconStrokeMd * size / 24, lineCap: .round, lineJoin: .round)
    }
}
