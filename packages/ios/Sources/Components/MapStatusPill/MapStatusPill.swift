import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

/// How a map status reads (decision 39). Mirrors React's `MapStatusPill.tone`.
///
/// The product chooses the tone and when the pill shows; Kozmos draws it.
public enum KozmosMapStatusPillTone: String, CaseIterable, Sendable {
    /// The words alone, for a status with nothing to mark.
    case neutral
    /// The system's arc, turning in the theme's blue: "Calculating Precise
    /// Position", "Preparing Content", "Calculating step-free route";
    /// "Walking improves accuracy" puts a walking figure in its place.
    case progress
    /// A check, and the words, in the success colour: "Established",
    /// "Up-to-date".
    case success
    /// A warning triangle in the danger colour; the words stay ink: "Failed
    /// to Calculate Precise Position".
    case danger
    /// The surface fills with Emotion/alert/fill, the SDK's bright amber, under
    /// its ink, Emotion/alert/onFill: "Turn Back".
    case warning
}

/// How loudly a change of words is announced. Mirrors React's
/// `MapStatusPill.live`, Alert's and Notice's three values.
public enum KozmosMapStatusPillLive: String, CaseIterable, Sendable {
    /// Nothing is announced, for words said somewhere else.
    case off
    /// Queued behind what VoiceOver is saying, as `role="status"` waits for a
    /// pause. The default, and right for every tone: none is an emergency.
    case polite
    /// Said at once, over what VoiceOver is saying, for a state that cannot
    /// wait.
    case assertive
}

/// What a tone resolves to, before any colour is chosen: kept apart from the
/// view so the ruling — decision 39's board — can be tested without drawing.
struct KozmosMapStatusPillAppearance: Equatable {
    enum Surface: Equatable { case page, warning }
    /// `ink` is the SDK's words, foreground/300; the others are Kozmos's
    /// emotion roles for text and glyphs on the page, and `onWarning` the
    /// alert fill's own ink, Emotion/alert/onFill.
    enum Ink: Equatable { case ink, themed, success, danger, onWarning }
    enum Mark: Equatable { case none, spinner, check, triangle }

    let surface: Surface
    let words: Ink
    let mark: Ink
    let ownMark: Mark

    init(surface: Surface, words: Ink, mark: Ink, ownMark: Mark) {
        self.surface = surface
        self.words = words
        self.mark = mark
        self.ownMark = ownMark
    }

    init(tone: KozmosMapStatusPillTone) {
        switch tone {
        case .neutral: self.init(surface: .page, words: .ink, mark: .ink, ownMark: .none)
        case .progress: self.init(surface: .page, words: .ink, mark: .themed, ownMark: .spinner)
        case .success: self.init(surface: .page, words: .success, mark: .success, ownMark: .check)
        case .danger: self.init(surface: .page, words: .ink, mark: .danger, ownMark: .triangle)
        case .warning: self.init(surface: .warning, words: .onWarning, mark: .onWarning, ownMark: .triangle)
        }
    }
}

/// What VoiceOver is told when the words change.
struct KozmosMapStatusPillAnnouncement: Equatable {
    let message: String
    /// Queued behind current speech (polite), or said over it (assertive).
    let queued: Bool
}

/// Proposes at most `cap` across to its one child and takes the child's size,
/// so the pill is as wide as its words up to the cap and never wider: a
/// `frame(maxWidth:)` would stretch it to the cap wherever more was offered.
struct KozmosCappedWidthLayout: Layout {
    let cap: CGFloat

    private func proposal(_ proposal: ProposedViewSize) -> ProposedViewSize {
        ProposedViewSize(width: min(proposal.width ?? cap, cap), height: proposal.height)
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        subviews.first?.sizeThatFits(self.proposal(proposal)) ?? .zero
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        subviews.first?.place(at: bounds.origin, anchor: .topLeading, proposal: self.proposal(proposal))
    }
}

/// One status on the map: a compact pill in one of five tones (decision 39).
///
/// Mirrors React's `MapStatusPill`. The SDK draws three parts for this —
/// PositionStatus, Downloading Content and the Turn Back indicator — and the
/// step-free route being calculated is a fourth (GAP-102); this draws them
/// all. The words, the tone and when it shows are the product's.
///
/// It wears the map controls' surface (decision 40): the page's own, opaque,
/// the Control corner, no edge in either theme (decision 47) and the map
/// controls' three shadows, at least 48 tall, 12 at the sides and 8 above and
/// below, a 24 mark 8 from the words. The words are the footnote style, the
/// SDK's 13, on 16pt lines as the web's and Compose's are, in foreground/300,
/// and wrap at a map control's longest, 256, rather than being cut.
///
/// VoiceOver reads it as its words; the mark is hidden. When the words change
/// it announces them, politely unless `live` says otherwise. With no words it
/// draws nothing and announces nothing, so a product can keep it where it
/// shows and change only its words.
public struct KozmosMapStatusPill: View {
    /// A map control's longest, as `KozmosMapControlButton`'s labelled width.
    static let maxWidth: CGFloat = 256
    /// The icons' 24, every map control's mark (the SDK's box is 28; Kozmos's
    /// icon and spinner scales go from 24 to 32).
    static var markSize: CGFloat { KozmosDimensions.primitivesLayoutSizing300 }

    private let text: String
    private let tone: KozmosMapStatusPillTone
    private let live: KozmosMapStatusPillLive
    private let showsIcon: Bool
    private let icon: AnyView?

    /// - Parameters:
    ///   - text: The product's words, in the visitor's language.
    ///   - tone: How the status reads. The product chooses it.
    ///   - showsIcon: Draw the tone's own mark. Off, the words stand alone.
    ///   - live: How loudly a change of words is announced.
    public init(
        _ text: String,
        tone: KozmosMapStatusPillTone = .neutral,
        showsIcon: Bool = true,
        live: KozmosMapStatusPillLive = .polite
    ) {
        self.text = text
        self.tone = tone
        self.live = live
        self.showsIcon = showsIcon
        self.icon = nil
    }

    /// The product's own mark in place of the tone's — "No Bluetooth" draws
    /// `KozmosIcon("bluetooth-off")`, and "Walking improves accuracy" the
    /// system's `figure.walk`. It is drawn at 24 in the tone's colour, which a
    /// `KozmosIcon` at its default colour takes too, and hidden from
    /// VoiceOver: the words say it.
    public init<Icon: View>(
        _ text: String,
        tone: KozmosMapStatusPillTone = .neutral,
        live: KozmosMapStatusPillLive = .polite,
        @ViewBuilder icon: () -> Icon
    ) {
        self.text = text
        self.tone = tone
        self.live = live
        self.showsIcon = true
        self.icon = AnyView(icon())
    }

    /// What is said when the words become `text`: nothing when off, and
    /// nothing for no words.
    static func announcement(_ text: String, live: KozmosMapStatusPillLive) -> KozmosMapStatusPillAnnouncement? {
        guard !text.isEmpty, live != .off else { return nil }
        return KozmosMapStatusPillAnnouncement(message: text, queued: live == .polite)
    }

    private var appearance: KozmosMapStatusPillAppearance { KozmosMapStatusPillAppearance(tone: tone) }

    private func color(_ ink: KozmosMapStatusPillAppearance.Ink) -> Color {
        switch ink {
        case .ink: return KozmosColors.primitivesColorsForeground300
        case .themed: return KozmosColors.semanticsEmotionThemedText
        case .success: return KozmosColors.semanticsEmotionSuccessText
        case .danger: return KozmosColors.semanticsEmotionDangerText
        // Black on the amber in both themes: the named pair's ink.
        case .onWarning: return KozmosColors.semanticsEmotionAlertOnfill
        }
    }

    /// The page's own surface, as the map controls'; Turn Back's is the named
    /// pair's fill, the SDK's bright amber in both themes.
    private var surfaceColor: Color {
        appearance.surface == .warning
            ? KozmosColors.semanticsEmotionAlertFill
            : KozmosColors.primitivesColorsBackground0
    }

    @ViewBuilder
    private var mark: some View {
        if let icon {
            icon
        } else if showsIcon {
            switch appearance.ownMark {
            case .none:
                EmptyView()
            case .spinner:
                // The system's arc, as a loading Button turns it; it rests
                // under Reduce Motion.
                KozmosSpinner(size: .md, color: color(appearance.mark))
            case .check:
                symbol("check")
            case .triangle:
                symbol("alert-triangle")
            }
        }
    }

    private var drawsMark: Bool {
        icon != nil || (showsIcon && appearance.ownMark != .none)
    }

    /// A Kozmos icon name, drawn as `KozmosIcon` draws it at `.lg`.
    private func symbol(_ name: String) -> some View {
        Image(systemName: KozmosIcon.symbolName(for: name))
            .font(.system(size: KozmosIconSize.lg.pointSize, weight: .medium))
    }

    private var pill: some View {
        let shape = RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
        let surface = surfaceColor
        return KozmosCappedWidthLayout(cap: Self.maxWidth) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                if drawsMark {
                    mark
                        .frame(width: Self.markSize, height: Self.markSize)
                        .foregroundColor(color(appearance.mark))
                        // A KozmosIcon passed at its default colour, such as
                        // No Bluetooth's bluetooth-off, takes the tone's too.
                        .environment(\.kozmosIconHostInk, color(appearance.mark))
                        .accessibilityHidden(true)
                }
                Text(text)
                    .font(KozmosTypography.footnote)
                    // The SDK's 13 on its 16, as the web's and Compose's
                    // words: footnote's own lines are 18 apart.
                    .lineSpacing(KozmosTypography.footnoteOn16ptLineSpacing)
                    .foregroundColor(color(appearance.words))
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
            .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
            .frame(minHeight: KozmosDimensions.primitivesLayoutSizing600)
        }
        .background(surface)
        .clipShape(shape)
        // No edge, and the map controls' one lift.
        .kozmosElevation(KozmosShadows.semanticsElevationMapControl, in: shape, fill: surface)
        .accessibilityElement(children: .combine)
    }

    public var body: some View {
        ZStack {
            if !text.isEmpty {
                pill
            }
        }
        .onAppear { post(Self.announcement(text, live: live)) }
        .onChange(of: text) { post(Self.announcement($0, live: live)) }
    }

    private func post(_ announcement: KozmosMapStatusPillAnnouncement?) {
        #if canImport(UIKit)
        guard let announcement else { return }
        UIAccessibility.post(
            notification: .announcement,
            argument: NSAttributedString(
                string: announcement.message,
                attributes: [.accessibilitySpeechQueueAnnouncement: announcement.queued]
            )
        )
        #endif
    }
}
