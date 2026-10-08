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
public struct KozmosTabsList<Content: View>: View {
    let content: Content
    
    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            content
        }
        .padding(.horizontal, KozmosTabsMetrics.inset)
        .background(
            RoundedRectangle(cornerRadius: KozmosTabsMetrics.trackRadius)
                .fill(KozmosColors.primitivesColorsBackground100)
        )
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
public struct KozmosTabsTrigger: View {
    let value: String
    let title: String
    @Binding var selection: String
    @Environment(\.kozmosAnalytics) var trackEvent
    
    public init(value: String, title: String, selection: Binding<String>) {
        self.value = value
        self.title = title
        self._selection = selection
    }
    
    private var isSelected: Bool { selection == value }

    public var body: some View {
        Button(action: {
            trackEvent(KozmosAnalyticsEvent(eventName: "tab_switched", component: "Tabs", properties: ["value": value]))
            selection = value
        }) {
            Text(title)
                .font(KozmosTypography.subheadline)
                .fontWeight(.medium)
                // One line, as React's `whitespace-nowrap`.
                .lineLimit(1)
                .foregroundColor(isSelected ? KozmosColors.primitivesColorsForeground0 : KozmosColors.primitivesColorsForeground400)
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
                .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing75)
                .frame(maxWidth: .infinity, minHeight: KozmosTabsMetrics.segmentMinHeight)
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
