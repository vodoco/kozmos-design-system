import SwiftUI

public struct KozmosMapInfoEntry: Identifiable, Equatable, Sendable {
    public let id: String
    public let label: String
    public let href: String?
    public init(id: String, label: String, href: String? = nil) { self.id = id; self.label = label; self.href = href }
    var destination: URL? { KozmosSafeLink.destination(href, contact: true) }
}
public struct KozmosMapInfoFAQ: Identifiable, Equatable, Sendable {
    public let id: String
    public let question: String
    public let answer: String
    public init(id: String, question: String, answer: String) { self.id = id; self.question = question; self.answer = answer }
}
public struct KozmosMapInfoVersion: Identifiable, Equatable, Sendable {
    public let id: String
    public let label: String
    public let value: String
    public init(id: String, label: String, value: String) { self.id = id; self.label = label; self.value = value }
}
/// Localized presentation data. The host owns legal copy, provider attribution and versions.
public struct KozmosMapInfoContent: Equatable, Sendable {
    public var title: String
    public var introduction: String?
    public var faqs: [KozmosMapInfoFAQ]
    public var credits: [KozmosMapInfoEntry]
    public var links: [KozmosMapInfoEntry]
    public var versions: [KozmosMapInfoVersion]
    public init(title: String, introduction: String? = nil, faqs: [KozmosMapInfoFAQ] = [], credits: [KozmosMapInfoEntry] = [], links: [KozmosMapInfoEntry] = [], versions: [KozmosMapInfoVersion] = []) {
        self.title = title; self.introduction = introduction; self.faqs = faqs; self.credits = credits; self.links = links; self.versions = versions
    }
}
enum KozmosMapInfoLayout {
    static let panelWidth: CGFloat = 384
    static func isWide(width: CGFloat) -> Bool { width >= 720 + panelWidth }
}

/// Content only: place in a scrollable host, or use KozmosMapInfo for presentation.
public struct KozmosMapInfoPanel: View {
    let content: KozmosMapInfoContent
    let brand: AnyView?
    let onClose: () -> Void
    let closeLabel: String
    let faqLabel: String
    let copyrightLabel: String
    let minimumHeight: CGFloat
    @State private var localSelection: String?
    let expandedFAQ: Binding<String?>?
    let expandedLabel: String
    let collapsedLabel: String
    private var selection: Binding<String?> { expandedFAQ ?? $localSelection }
    @AccessibilityFocusState private var closeFocused: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    public init(content: KozmosMapInfoContent, brand: AnyView? = nil, closeLabel: String = "Close information", faqLabel: String = "Frequently asked questions", copyrightLabel: String = "Copyright", minimumHeight: CGFloat = 0, expandedFAQ: Binding<String?>? = nil, expandedLabel: String = "Expanded", collapsedLabel: String = "Collapsed", onClose: @escaping () -> Void) {
        self.content = content; self.brand = brand; self.closeLabel = closeLabel; self.faqLabel = faqLabel; self.copyrightLabel = copyrightLabel; self.minimumHeight = minimumHeight; self.onClose = onClose
        self.expandedFAQ = expandedFAQ; self.expandedLabel = expandedLabel; self.collapsedLabel = collapsedLabel
    }
    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
                    if let brand { brand.frame(maxWidth: 160, maxHeight: 48, alignment: .leading) }
                    Text(verbatim: content.title).font(KozmosTypography.font(.title2).weight(.semibold)).accessibilityAddTraits(.isHeader)
                }
                Spacer(minLength: 8)
                KozmosIconButton(iconName: "xmark", action: onClose)
                    .accessibilityLabel(Text(verbatim: closeLabel))
                    .accessibilityFocused($closeFocused)
                    .keyboardShortcut(.cancelAction)
            }
            if let introduction = content.introduction, !introduction.isEmpty {
                Text(verbatim: introduction).font(KozmosTypography.subheadline).foregroundColor(KozmosColors.primitivesColorsForeground500)
            }
            if !content.faqs.isEmpty {
                Text(verbatim: faqLabel).font(KozmosTypography.subheadline.weight(.semibold)).accessibilityAddTraits(.isHeader)
                KozmosAccordion {
                    ForEach(content.faqs) { faq in
                        KozmosAccordionItem {
                            KozmosAccordionTrigger(value: faq.id, title: faq.question, selection: selection)
                                .accessibilityValue(Text(verbatim: selection.wrappedValue == faq.id ? expandedLabel : collapsedLabel))
                            KozmosAccordionContent(value: faq.id, selection: selection) {
                                Text(verbatim: faq.answer).font(KozmosTypography.subheadline).frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                }
            }
            if !content.credits.isEmpty || !content.links.isEmpty || !content.versions.isEmpty {
                Spacer(minLength: KozmosDimensions.primitivesLayoutSpacing400)
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    if !content.credits.isEmpty {
                        Text(verbatim: copyrightLabel).font(KozmosTypography.subheadline.weight(.semibold)).accessibilityAddTraits(.isHeader)
                        ForEach(content.credits) { entry in entryView(entry) }
                    }
                    ForEach(content.links) { entry in entryView(entry) }
                    ForEach(content.versions) { version in
                        Text(verbatim: "\(version.label): \(version.value)").font(KozmosTypography.caption).foregroundColor(KozmosColors.primitivesColorsForeground500)
                    }
                }
            }
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing300)
        .frame(minHeight: minimumHeight, alignment: .top)
        .frame(maxWidth: .infinity, alignment: .leading)
        .foregroundColor(KozmosColors.primitivesColorsForeground100)
        .background(KozmosColors.primitivesColorsBackground0)
        .transaction { if reduceMotion { $0.disablesAnimations = true } }
        .onAppear { closeFocused = true }
    }
    @ViewBuilder private func entryView(_ entry: KozmosMapInfoEntry) -> some View {
        if let url = entry.destination {
            Link(destination: url) { Text(verbatim: entry.label).underline() }
                .font(KozmosTypography.subheadline)
                .accessibilityAddTraits(.isLink).accessibilityRemoveTraits(.isButton)
        } else { Text(verbatim: entry.label).font(KozmosTypography.subheadline) }
    }
}

/// Keeps the map mounted. Wide hosts reserve a logical-end pane; compact iOS
/// uses a full-screen system presentation, never a right-hand slide-in drawer.
public struct KozmosMapInfo<MapContent: View>: View {
    @Binding var isOpen: Bool
    let content: KozmosMapInfoContent
    let brand: AnyView?
    let triggerLabel: String
    let closeLabel: String
    let faqLabel: String
    let copyrightLabel: String
    let available: Bool
    let map: MapContent
    let expandedLabel: String
    let collapsedLabel: String
    @State private var selectedFAQ: String?
    @AccessibilityFocusState private var triggerFocused: Bool
    public init(isOpen: Binding<Bool>, content: KozmosMapInfoContent, brand: AnyView? = nil, available: Bool = true, triggerLabel: String = "Information", closeLabel: String = "Close information", faqLabel: String = "Frequently asked questions", copyrightLabel: String = "Copyright", expandedLabel: String = "Expanded", collapsedLabel: String = "Collapsed", @ViewBuilder map: () -> MapContent) {
        self._isOpen = isOpen; self.content = content; self.brand = brand; self.available = available; self.triggerLabel = triggerLabel; self.closeLabel = closeLabel; self.faqLabel = faqLabel; self.copyrightLabel = copyrightLabel; self.map = map()
        self.expandedLabel = expandedLabel; self.collapsedLabel = collapsedLabel
    }
    public var body: some View {
        GeometryReader { proxy in
            let wide = KozmosMapInfoLayout.isWide(width: proxy.size.width)
            let shown = isOpen && available
            HStack(spacing: 0) {
                map.frame(maxWidth: .infinity, maxHeight: .infinity)
                    .overlay(alignment: .topTrailing) {
                        if available {
                            KozmosMapControlButton(label: triggerLabel, systemImage: "info.circle", action: { isOpen.toggle() })
                                .accessibilityFocused($triggerFocused)
                                .padding(KozmosDimensions.primitivesLayoutSpacing200)
                                .opacity(shown ? 0 : 1)
                                .allowsHitTesting(!shown)
                                .accessibilityHidden(shown)
                        }
                    }
                if shown && wide { panel.frame(width: KozmosMapInfoLayout.panelWidth) }
            }
            #if os(iOS)
            .fullScreenCover(isPresented: Binding(get: { shown && !wide }, set: { if !$0 && !wide { isOpen = false } }), onDismiss: { if !isOpen { triggerFocused = true } }) { panel }
            #else
            .sheet(isPresented: Binding(get: { shown && !wide }, set: { if !$0 { isOpen = false } })) { panel }
            #endif
            .onChange(of: isOpen) { if !$0 { triggerFocused = true } }
        }
    }
    private var panel: some View {
        GeometryReader { proxy in
            ScrollView {
                KozmosMapInfoPanel(content: content, brand: brand, closeLabel: closeLabel, faqLabel: faqLabel, copyrightLabel: copyrightLabel, minimumHeight: proxy.size.height, expandedFAQ: $selectedFAQ, expandedLabel: expandedLabel, collapsedLabel: collapsedLabel, onClose: { isOpen = false })
            }.background(KozmosColors.primitivesColorsBackground0)
        }
    }
}
