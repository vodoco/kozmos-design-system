import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

/// What a notice says about the risk or result it carries, React's
/// `NoticeTone` (GAP-160): `success` joins warning, info and critical.
public enum KozmosNoticeTone: String, CaseIterable, Sendable {
    case warning
    case info
    case critical
    case success

    /// The tone's own mark, Toast's for the same four tones: a triangle, an
    /// info circle, an alert circle, a check.
    public var markName: String {
        switch self {
        case .warning: return "alert-triangle"
        case .info: return "info-circle"
        case .critical: return "alert-circle"
        case .success: return "check"
        }
    }

    /// The edge and the 5% wash: React's `border-<tone>/50 bg-<tone>/5`, the
    /// emotion's fill step.
    var fill: Color {
        switch self {
        case .warning: return KozmosColors.primitivesColorsEmotionalAlert800
        case .info: return KozmosColors.primitivesColorsEmotionalInfo700
        case .critical: return KozmosColors.primitivesColorsEmotionalDanger600
        case .success: return KozmosColors.primitivesColorsEmotionalSuccess800
        }
    }

    /// The edge's strength: half the fill, critical's 60%, as React's.
    var edgeOpacity: Double { self == .critical ? 0.6 : 0.5 }

    /// The wash's strength, React's `/5`.
    static let washOpacity: Double = 0.05

    /// The words and marks: the emotion's text role, 4.5:1 on the page.
    var ink: Color {
        switch self {
        case .warning: return KozmosColors.semanticsEmotionAlertText
        case .info: return KozmosColors.semanticsEmotionInformativeText
        case .critical: return KozmosColors.semanticsEmotionDangerText
        case .success: return KozmosColors.semanticsEmotionSuccessText
        }
    }
}

/// Where the work the notice reports on has got, React's `NoticeStatus`
/// (GAP-160). Left out (`nil`), the notice reports no work.
public enum KozmosNoticeStatus: String, CaseIterable, Sendable {
    /// The system's loading arc turns where the mark is, and the notice is
    /// busy. It rests under Reduce Motion.
    case progress
    /// A check at the summary's inline end, in the tone's colour, in place of
    /// the mark at its start: "Geometry is set".
    case done
}

/// The mark at the summary's start, React's `icon`.
public enum KozmosNoticeIcon {
    /// The tone's own mark.
    case tone
    /// None, and no empty column: the detail and the action start where the
    /// summary does (GAP-118).
    case none
    /// A Kozmos icon by name, in the tone's colour.
    case named(String)
}

/// Where the mark sits beside the summary, React's `iconAlign`.
public enum KozmosNoticeIconAlign: String, CaseIterable, Sendable {
    /// On the summary's first line, for a summary that wraps.
    case start
    /// Centred on a one-line summary that holds a control (GAP-118).
    case center
}

/// How loudly the notice announces itself, React's `NoticeLiveness`.
public enum KozmosNoticeLive: String, CaseIterable, Sendable {
    case off
    /// Queued behind what VoiceOver is saying, React's `role="status"`.
    case polite
    /// Said at once, over it, React's `role="alert"`: an emergency only.
    case assertive
}

/// What a notice draws, resolved before anything is drawn, so the rules can
/// be tested without a window.
struct KozmosNoticeAppearance: Equatable {
    enum Lead: Equatable { case none, toneMark(String), named(String), spinner }

    let lead: Lead
    let trailingCheck: Bool
    let busy: Bool

    init(lead: Lead, trailingCheck: Bool, busy: Bool) {
        self.lead = lead
        self.trailingCheck = trailingCheck
        self.busy = busy
    }

    init(tone: KozmosNoticeTone, status: KozmosNoticeStatus?, icon: KozmosNoticeIcon) {
        switch status {
        case .progress:
            self.init(lead: .spinner, trailingCheck: false, busy: true)
        case .done:
            // The check moves to the end; a mark of the product's stays.
            if case .named(let name) = icon {
                self.init(lead: .named(name), trailingCheck: true, busy: false)
            } else {
                self.init(lead: .none, trailingCheck: true, busy: false)
            }
        case nil:
            switch icon {
            case .tone: self.init(lead: .toneMark(tone.markName), trailingCheck: false, busy: false)
            case .none: self.init(lead: .none, trailingCheck: false, busy: false)
            case .named(let name): self.init(lead: .named(name), trailingCheck: false, busy: false)
            }
        }
    }

    /// Whether a column is kept for the mark, so the detail and the action
    /// line up under the summary.
    var drawsLead: Bool { lead != .none }
}

/// What VoiceOver is told when the notice appears or its words change.
struct KozmosNoticeAnnouncement: Equatable {
    let message: String
    let queued: Bool
}

/// A short notice that opens for the long version, React's `Notice`
/// (GAP-142, GAP-160).
///
/// One line: a mark, a sentence worth reading on its own, and, when there is
/// more, a "More" disclosure that reveals the detail in place. Tones are
/// warning, info, critical and success, each on a 5% wash of its colour with
/// a half-strength edge, the container corner, 12 at the sides and 8 above
/// and below. `status` reports work: `.progress` turns the loading arc where
/// the mark is, `.done` ends the summary in a check. `action` is a control
/// under the text, as "Call 112" on the emergency notice or "Set Building
/// Boundary" (GAP-033, MAP-587's Alert action).
///
/// VoiceOver reads the summary, then the detail when it shows; the marks are
/// hidden, as the words say what happened. It is announced politely when it
/// appears and when its summary changes, unless `live` says otherwise.
public struct KozmosNotice<Action: View>: View {
    private let summary: String
    private let detail: String?
    private let tone: KozmosNoticeTone
    private let status: KozmosNoticeStatus?
    private let icon: KozmosNoticeIcon
    private let iconAlign: KozmosNoticeIconAlign
    private let collapsible: Bool
    private let expandLabel: String
    private let live: KozmosNoticeLive
    private let isExpanded: Binding<Bool>?
    private let action: Action?
    @State private var uncontrolled: Bool

    /// - Parameters:
    ///   - summary: The one line that is always visible, informative alone.
    ///   - detail: The full wording, revealed on tap.
    ///   - tone: What the notice says about the risk or result.
    ///   - status: Where the work it reports on has got, or nil for none.
    ///   - icon: The mark at the start: the tone's, none, or one by name.
    ///   - iconAlign: On the first line, or centred on a one-line summary.
    ///   - collapsible: Whether the detail hides behind "More". An emergency
    ///     sets this false, so nothing has to be discovered.
    ///   - defaultExpanded: The starting state when `isExpanded` is nil.
    ///   - isExpanded: Controlled state, for a product that remembers it.
    ///   - expandLabel: The disclosure's words, "More" by default.
    ///   - live: How loudly it announces itself.
    ///   - action: A control under the text.
    public init(
        _ summary: String,
        detail: String? = nil,
        tone: KozmosNoticeTone = .warning,
        status: KozmosNoticeStatus? = nil,
        icon: KozmosNoticeIcon = .tone,
        iconAlign: KozmosNoticeIconAlign = .start,
        collapsible: Bool = true,
        defaultExpanded: Bool = false,
        isExpanded: Binding<Bool>? = nil,
        expandLabel: String = "More",
        live: KozmosNoticeLive = .polite,
        @ViewBuilder action: () -> Action
    ) {
        self.summary = summary
        self.detail = detail
        self.tone = tone
        self.status = status
        self.icon = icon
        self.iconAlign = iconAlign
        self.collapsible = collapsible
        self.expandLabel = expandLabel
        self.live = live
        self.isExpanded = isExpanded
        self.action = action()
        self._uncontrolled = State(initialValue: defaultExpanded)
    }

    static func announcement(_ summary: String, live: KozmosNoticeLive) -> KozmosNoticeAnnouncement? {
        guard !summary.isEmpty, live != .off else { return nil }
        return KozmosNoticeAnnouncement(message: summary, queued: live == .polite)
    }

    var appearance: KozmosNoticeAppearance {
        KozmosNoticeAppearance(tone: tone, status: status, icon: icon)
    }

    private var hasDetail: Bool { !(detail ?? "").isEmpty }
    private var open: Bool { isExpanded?.wrappedValue ?? uncontrolled }
    /// Not collapsible means always shown.
    private var detailVisible: Bool { hasDetail && (!collapsible || open) }

    private func toggle() {
        let next = !open
        if let isExpanded {
            isExpanded.wrappedValue = next
        } else {
            uncontrolled = next
        }
    }

    private static var markSize: CGFloat { KozmosIconSize.sm.pointSize }
    private static var gap: CGFloat { KozmosDimensions.primitivesLayoutSpacing100 }
    /// Half the spacing scale's 4: a 16 mark centred on the summary's first line.
    private static var firstLineInset: CGFloat { KozmosDimensions.primitivesLayoutSpacing50 / 2 }
    /// The mark's column and its gap: the detail and the action start here.
    private static var leadInset: CGFloat { markSize + gap }

    @ViewBuilder
    private var lead: some View {
        switch appearance.lead {
        case .none:
            EmptyView()
        case .spinner:
            KozmosSpinner(diameter: Self.markSize, color: tone.ink)
        case .toneMark(let name), .named(let name):
            KozmosIcon(name, size: .sm)
        }
    }

    private var summaryRow: some View {
        HStack(alignment: iconAlign == .center ? .center : .top, spacing: Self.gap) {
            if appearance.drawsLead {
                lead
                    .frame(width: Self.markSize, height: Self.markSize)
                    // On the first line, as React's mt-0.5.
                    .padding(.top, iconAlign == .start ? Self.firstLineInset : 0)
                    .foregroundColor(tone.ink)
                    .environment(\.kozmosIconHostInk, tone.ink)
                    .accessibilityHidden(true)
            }
            Text(summary)
                .font(KozmosTypography.subheadline.weight(.semibold))
                .foregroundColor(tone.ink)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            if hasDetail && collapsible {
                Button(action: toggle) {
                    HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                        Text(expandLabel)
                            .font(KozmosTypography.caption.weight(.semibold))
                        KozmosIcon("chevron-down", size: .xs)
                            .rotationEffect(.degrees(open ? 180 : 0))
                    }
                    .foregroundColor(tone.ink)
                    .environment(\.kozmosIconHostInk, tone.ink)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(expandLabel)
                .accessibilityValue(open ? "Expanded" : "Collapsed")
            }
            if appearance.trailingCheck {
                KozmosIcon("check", size: .sm)
                    .padding(.top, iconAlign == .start ? Self.firstLineInset : 0)
                    .environment(\.kozmosIconHostInk, tone.ink)
                    .foregroundColor(tone.ink)
                    .accessibilityHidden(true)
            }
        }
    }

    public var body: some View {
        let shape = RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer, style: .continuous)
        VStack(alignment: .leading, spacing: 0) {
            summaryRow
            if detailVisible, let detail {
                Text(detail)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(tone.ink)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.leading, appearance.drawsLead ? Self.leadInset : 0)
                    .padding(.top, KozmosDimensions.primitivesLayoutSpacing75)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            if let action, Action.self != EmptyView.self {
                action
                    .padding(.leading, appearance.drawsLead ? Self.leadInset : 0)
                    .padding(.top, KozmosDimensions.primitivesLayoutSpacing150)
            }
        }
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
        .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tone.fill.opacity(KozmosNoticeTone.washOpacity), in: shape)
        .overlay(shape.strokeBorder(tone.fill.opacity(tone.edgeOpacity), lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityAddTraits(appearance.busy ? .updatesFrequently : [])
        .onAppear { post(Self.announcement(summary, live: live)) }
        .onChange(of: summary) { post(Self.announcement($0, live: live)) }
    }

    private func post(_ announcement: KozmosNoticeAnnouncement?) {
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

extension KozmosNotice where Action == EmptyView {
    /// A notice with no control under its text.
    public init(
        _ summary: String,
        detail: String? = nil,
        tone: KozmosNoticeTone = .warning,
        status: KozmosNoticeStatus? = nil,
        icon: KozmosNoticeIcon = .tone,
        iconAlign: KozmosNoticeIconAlign = .start,
        collapsible: Bool = true,
        defaultExpanded: Bool = false,
        isExpanded: Binding<Bool>? = nil,
        expandLabel: String = "More",
        live: KozmosNoticeLive = .polite
    ) {
        self.init(
            summary, detail: detail, tone: tone, status: status, icon: icon,
            iconAlign: iconAlign, collapsible: collapsible, defaultExpanded: defaultExpanded,
            isExpanded: isExpanded, expandLabel: expandLabel, live: live
        ) { EmptyView() }
    }
}
