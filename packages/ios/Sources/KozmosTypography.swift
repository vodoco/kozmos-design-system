import SwiftUI
#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif

/// One place that decides what the design system renders text in.
///
/// Every component used to reach for `.font(.subheadline)` directly, which was
/// not wrong — it is the platform UI font, and that is the intent — but it left
/// the decision spread across ninety-odd call sites with nothing naming it. The
/// same choice was being made three times over: web asked for `"Readex Pro",
/// sans-serif` and, because nothing has ever loaded Readex Pro, rendered generic
/// sans-serif; Android took Roboto by default; this package took SF Pro. Three
/// platforms, three fonts, no decision recorded anywhere.
///
/// System-first is now deliberate. These wrappers resolve to the platform's own
/// UI font and keep Dynamic Type intact, because `Font.system(_:)` scales with
/// the reader's text-size setting exactly as the bare styles did.
///
/// Nothing here has ever bundled a font file, which is why an App Clip can drop
/// the brand font without the design system noticing.
///
/// To render a brand font instead, this is the only file that changes:
///
/// ```swift
/// public static var brandFamily: String?   // e.g. "Readex Pro", once bundled
///
/// public static func font(_ style: Font.TextStyle) -> Font {
///     guard let family = brandFamily else { return .system(style) }
///     // relativeTo keeps Dynamic Type working; size is the style's own.
///     return .custom(family, size: pointSize(for: style), relativeTo: style)
/// }
/// ```
///
/// A brand font also needs its metrics measured against the system font, or the
/// same point size renders visibly different: run
/// `node scripts/measure-font-metrics.mjs <brand> <fallback>` and apply the
/// scale it reports. Guessing that ratio is how text ends up subtly wrong on
/// every screen at once.
public enum KozmosTypography {
    /// The platform UI font at a Dynamic Type style.
    public static func font(_ style: Font.TextStyle) -> Font {
        .system(style)
    }

    public static var body: Font { font(.body) }
    public static var headline: Font { font(.headline) }
    public static var subheadline: Font { font(.subheadline) }
    public static var footnote: Font { font(.footnote) }
    public static var caption: Font { font(.caption) }
    public static var caption2: Font { font(.caption2) }
    public static var title2: Font { font(.title2) }
    public static var title3: Font { font(.title3) }

    /// What SwiftUI adds between lines of `caption2` to set them 14pt apart at
    /// the default text size, as React's 11px labels sit on 14px lines: 14
    /// less caption2's own line, 13.1pt of SF Pro at 11pt. From the next size
    /// up caption2's own line is taller than 14 (18pt for its 13pt) and
    /// SwiftUI sets the lines by it, so the line grows with the text without
    /// this growing too. The rail's labels and BottomNavigation's use it.
    static let caption2On14ptLineSpacing: CGFloat = {
        #if canImport(UIKit)
        let caption2 = UIFont.preferredFont(
            forTextStyle: .caption2,
            compatibleWith: UITraitCollection(preferredContentSizeCategory: .large)
        )
        return max(0, 14 - caption2.lineHeight)
        #else
        let caption2 = NSFont.preferredFont(forTextStyle: .caption2)
        return max(0, 14 - (caption2.ascender - caption2.descender + caption2.leading))
        #endif
    }()

    /// What SwiftUI adds between lines of `footnote` to set them 16pt apart
    /// at the default text size, as the map status pill's words are 13px on
    /// 16px lines on the web and 13sp on 16sp in Compose. SwiftUI sets
    /// footnote's lines 18pt apart — SF Pro's 15.5pt line at 13pt and the
    /// style's own 2.5pt of leading, measured on iOS 26.5 — so this is less
    /// than nothing, and brings them 2pt closer. It is the same at every text
    /// size, so the lines still grow with the text.
    static let footnoteOn16ptLineSpacing: CGFloat = {
        #if canImport(UIKit)
        let footnote = UIFont.preferredFont(
            forTextStyle: .footnote,
            compatibleWith: UITraitCollection(preferredContentSizeCategory: .large)
        )
        return 16 - (footnote.lineHeight + footnote.leading)
        #else
        let footnote = NSFont.preferredFont(forTextStyle: .footnote)
        return 16 - (footnote.ascender - footnote.descender + footnote.leading)
        #endif
    }()
}
