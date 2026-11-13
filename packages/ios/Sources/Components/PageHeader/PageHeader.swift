import SwiftUI

/// Whether a page header paints its band, as React's PageHeader `tone`.
public enum KozmosPageHeaderTone: Sendable, Hashable, CaseIterable {
    /// The band in the pale theme tint, theme 0, the tint of CardHeader's
    /// subtle strip (decision 135): the default.
    case subtle
    /// No band: the header sits on the screen's own background.
    case `default`
}

/// How large a page header's title is drawn, as React's PageHeader `size`.
/// Either way the title is the screen's heading.
public enum KozmosPageHeaderSize: Sendable, Hashable, CaseIterable {
    /// Heading 3's 24 (on a 32 line): a page within a section, such as
    /// Settings. The default.
    case md
    /// Heading 2's 30 (on a 36 line): a landing page, such as Home.
    case lg

    var level: KozmosHeadingLevel {
        switch self {
        case .md: return .h3
        case .lg: return .h2
        }
    }
}

/// The top of a page (GAP-036, decision 135): where it is (a breadcrumb), its
/// title with an info button beside it, a line that says what it is for, and
/// its actions, on a band across the screen. Its content sits in a
/// `KozmosContainer` with the block inset (GAP-116), 32 above and 24 below, so
/// it lines up with a container under it.
///
/// The breadcrumb is 8 above the title; the info button 8 after it, centred
/// on its first line; the description 4 under it, in the muted small text;
/// the actions 16 after the text, 8 apart, at the trailing end and centred on
/// the title's first line, so a 44 button makes the header no taller. Right
/// to left, the actions are at the left. VoiceOver reads the breadcrumb, the
/// title (a heading), the info button, the description, then the actions.
/// A slot left out draws nothing and takes no space.
public struct KozmosPageHeader<Breadcrumb: View, Info: View, Actions: View>: View {
    @ScaledMetric private var fontSize: CGFloat
    let title: String
    let description: String?
    let tone: KozmosPageHeaderTone
    let size: KozmosPageHeaderSize
    let inset: KozmosContainerInset
    let breadcrumb: Breadcrumb
    let info: Info
    let actions: Actions

    public init(
        _ title: String,
        description: String? = nil,
        tone: KozmosPageHeaderTone = .subtle,
        size: KozmosPageHeaderSize = .md,
        inset: KozmosContainerInset = .window,
        @ViewBuilder breadcrumb: () -> Breadcrumb = { EmptyView() },
        @ViewBuilder info: () -> Info = { EmptyView() },
        @ViewBuilder actions: () -> Actions = { EmptyView() }
    ) {
        self.title = title
        self.description = description
        self.tone = tone
        self.size = size
        self.inset = inset
        self.breadcrumb = breadcrumb()
        self.info = info()
        self.actions = actions()
        _fontSize = ScaledMetric(wrappedValue: size.level.fontSize, relativeTo: size.level.textStyle)
    }

    private var hasInfo: Bool { Info.self != EmptyView.self }
    private var hasActions: Bool { Actions.self != EmptyView.self }

    public var body: some View {
        KozmosContainer(inset: inset, block: .init(start: .lg, end: .md)) {
            // A stack's spacing skips a child that draws nothing, so a
            // breadcrumb left out, or one an `if` leaves out, takes no space.
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                breadcrumb
                row
            }
        }
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .background(tone == .subtle ? KozmosColors.primitivesColorsTheme0 : Color.clear)
    }

    @ViewBuilder private var row: some View {
        if hasActions {
            HStack(alignment: .kozmosPageHeaderTitleLine, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
                text
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityElement(children: .contain)
                    .accessibilitySortPriority(1)
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    actions
                }
                .fixedSize()
                .frame(height: 0)
                .alignmentGuide(.kozmosPageHeaderTitleLine) { dimensions in
                    dimensions[VerticalAlignment.center]
                }
            }
            // The actions spill up to the title's line, so VoiceOver, which
            // reads by position, read them before the description: the text
            // goes first, then the actions.
            .accessibilityElement(children: .contain)
        } else {
            text
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var text: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            titleLine
            if let description {
                Text(description)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(KozmosColors.primitivesColorsForeground400)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    @ViewBuilder private var titleLine: some View {
        let heading = Text(title)
            .font(.system(size: fontSize, weight: .bold))
            .foregroundColor(KozmosColors.primitivesColorsForeground100)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityAddTraits(.isHeader)
            .accessibilityHeading(.h1)
            // The centre of the title's first line: its ascent and a
            // descent of about a quarter of the size, halved.
            .alignmentGuide(.kozmosPageHeaderTitleLine) { dimensions in
                (dimensions[.firstTextBaseline] + fontSize * 0.24) / 2
            }
        if hasInfo {
            HStack(alignment: .kozmosPageHeaderTitleLine, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                heading
                info
                    .fixedSize()
                    .frame(height: 0)
                    .alignmentGuide(.kozmosPageHeaderTitleLine) { dimensions in
                        dimensions[VerticalAlignment.center]
                    }
            }
        } else {
            heading
        }
    }
}

extension VerticalAlignment {
    /// The centre of a page header title's first line, which its info button
    /// and actions are centred on.
    private enum KozmosPageHeaderTitleLine: AlignmentID {
        static func defaultValue(in dimensions: ViewDimensions) -> CGFloat {
            dimensions[VerticalAlignment.center]
        }
    }

    static let kozmosPageHeaderTitleLine = VerticalAlignment(KozmosPageHeaderTitleLine.self)
}
