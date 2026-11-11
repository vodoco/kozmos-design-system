import SwiftUI

public struct KozmosTabs<Content: View>: View {
    @Binding var selection: String
    let content: Content
    
    public init(selection: Binding<String>, @ViewBuilder content: () -> Content) {
        self._selection = selection
        self.content = content()
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            content
        }
    }
}

/// How far a tab's segment sits inside the list's track, on every side: the
/// track's 4pt padding, React's `p-1`. The segment's corner is the track's
/// less this, so the two curves stay the same distance apart all the way
/// round (decision 65).
enum KozmosTabsMetrics {
    static let inset = KozmosDimensions.primitivesLayoutSpacing50
    static let trackRadius = KozmosDimensions.semanticsRadiusControl
    static let segmentRadius = trackRadius - inset
    /// The segment's least height: 36, in a 44pt track, the minimum touch
    /// target. React's list is 40; Figma's is 44, as here.
    static let segmentMinHeight: CGFloat = 36
}

/// The tabs' track: background/100 with the control radius, React's
/// `TabsList` (`bg-muted p-1 rounded-control`). Each trigger draws its own
/// segment 4pt inside it, so the track pads only its ends here.
///
/// VoiceOver reads it as React's `tablist`: a container whose tabs stay
/// elements of their own and, from iOS 17, a tab bar, so VoiceOver knows
/// the tabs as one set and each tab's place in it.
public struct KozmosTabsList<Content: View>: View {
    let content: Content
    
    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            content
        }
        // The row is as tall as its tallest tab, and each tab fills it
        // (decision 3): once one tab has an icon, every tab takes the
        // stacked height, so the raised segment fills the track whichever
        // tab is chosen. With no icon anywhere the tallest is 44, as before.
        .fixedSize(horizontal: false, vertical: true)
        .padding(.horizontal, KozmosTabsMetrics.inset)
        .background(
            RoundedRectangle(cornerRadius: KozmosTabsMetrics.trackRadius)
                .fill(KozmosColors.primitivesColorsBackground100)
        )
        .accessibilityElement(children: .contain)
        .modifier(KozmosTabBarTrait())
    }
}

/// Marks the list a tab bar where SwiftUI can name one, iOS 17 and macOS 14.
/// Before them the list is a plain container, and each tab still says
/// whether it is selected.
private struct KozmosTabBarTrait: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *) {
            content.accessibilityAddTraits(.isTabBar)
        } else {
            content
        }
    }
}

/// One tab. Selected, it is React's raised segment (decision 65): a
/// background/0 segment 4pt inside the track, its corner concentric with the
/// track's, lifted by the raised elevation, with foreground/0 words. The
/// other tabs' words are foreground/400 on the track. Nothing on tabs is the
/// theme's colour. Disabled, the plain style draws the tab at half, as
/// React's `disabled:opacity-50`.
///
/// The whole 44pt height of the track is the tab's target, the segment's 4pt
/// inset included.
///
/// With an `icon` (GAP-152), the icon sits 20pt square, 4pt over the title,
/// both centred, in the title's colour, and the track grows to hold the
/// taller segment. Every tab in that list takes the same height (decision
/// 3), so a tab with only words centres its title and its segment still
/// fills the track. The tab is still named by its title alone: the icon is
/// hidden from VoiceOver.
public struct KozmosTabsTrigger: View {
    let value: String
    let title: String
    @Binding var selection: String
    private let icon: AnyView?
    @Environment(\.kozmosAnalytics) var trackEvent
    
    public init(value: String, title: String, selection: Binding<String>) {
        self.value = value
        self.title = title
        self._selection = selection
        self.icon = nil
    }

    public init<Icon: View>(
        value: String,
        title: String,
        selection: Binding<String>,
        @ViewBuilder icon: () -> Icon
    ) {
        self.value = value
        self.title = title
        self._selection = selection
        self.icon = AnyView(icon())
    }
    
    private var isSelected: Bool { selection == value }

    private var ink: Color {
        isSelected ? KozmosColors.primitivesColorsForeground0 : KozmosColors.primitivesColorsForeground400
    }

    public var body: some View {
        Button(action: {
            trackEvent(KozmosAnalyticsEvent(eventName: "tab_switched", component: "Tabs", properties: ["value": value]))
            selection = value
        }) {
            VStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                if let icon {
                    icon
                        .frame(width: KozmosIconSize.md.pointSize, height: KozmosIconSize.md.pointSize)
                        // The title names the tab; an icon's own name would
                        // be read before it.
                        .accessibilityHidden(true)
                }
                Text(title)
                    .font(KozmosTypography.subheadline)
                    .fontWeight(.medium)
                    // One line, as React's `whitespace-nowrap`.
                    .lineLimit(1)
            }
                .foregroundColor(ink)
                // A KozmosIcon at `.default` takes the title's colour, as
                // React's icon is currentColor.
                .environment(\.kozmosIconHostInk, ink)
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
                .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing75)
                // `maxHeight` fills the list's row, whose height is its
                // tallest tab's: a tab with only words centres its title in
                // the height an icon tab beside it needs.
                .frame(maxWidth: .infinity, minHeight: KozmosTabsMetrics.segmentMinHeight, maxHeight: .infinity)
                .background {
                    if isSelected {
                        RoundedRectangle(cornerRadius: KozmosTabsMetrics.segmentRadius)
                            .fill(KozmosColors.primitivesColorsBackground0)
                            .kozmosElevation(KozmosShadows.semanticsElevationRaised)
                    }
                }
                .padding(.vertical, KozmosTabsMetrics.inset)
                .contentShape(Rectangle())
        }
        // The plain style draws a disabled tab at half, as React's
        // `disabled:opacity-50`; a second opacity here would dim it twice.
        .buttonStyle(.plain)
        // React's `aria-selected`: VoiceOver says "Selected" on this tab
        // alone. It stays a button, so a double tap still chooses it.
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
    }
}

public struct KozmosTabsContent<Content: View>: View {
    let value: String
    @Binding var selection: String
    let content: Content
    
    public init(value: String, selection: Binding<String>, @ViewBuilder content: () -> Content) {
        self.value = value
        self._selection = selection
        self.content = content()
    }
    
    public var body: some View {
        if selection == value {
            content
                .padding(.top, KozmosDimensions.primitivesLayoutSpacing100)
        }
    }
}
