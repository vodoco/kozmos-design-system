import SwiftUI

public enum KozmosMenuContentType: String, CaseIterable {
    case basic
    case checkbox
    case radio
    case submenu
}

public struct KozmosMenuItem: Identifiable, Hashable {
    public let id: String
    public let text: String
    public let shortcut: String?
    public let isChecked: Bool
    public let isSelected: Bool
    public let submenuItems: [String]
    /// The item leaves the app (decision 152, as `KozmosLink`'s `external`):
    /// Pointr's new-tab icon, `link-external-01`, at the row's end, and
    /// `externalLabel` as VoiceOver's hint. Opening is still the caller's,
    /// in `onItemSelect`.
    public let external: Bool
    /// What VoiceOver says after the item when `external`, as a hint:
    /// "Opens in your browser" by default. Empty, it says nothing more.
    public let externalLabel: String

    public init(
        id: String? = nil,
        text: String,
        shortcut: String? = nil,
        isChecked: Bool = false,
        isSelected: Bool = false,
        submenuItems: [String] = [],
        external: Bool = false,
        externalLabel: String = "Opens in your browser"
    ) {
        self.id = id ?? text
        self.text = text
        self.shortcut = shortcut
        self.isChecked = isChecked
        self.isSelected = isSelected
        self.submenuItems = submenuItems
        self.external = external
        self.externalLabel = externalLabel
    }
}

public struct KozmosMenuContent: Hashable {
    public let label: String?
    public let items: [KozmosMenuItem]
    public let contentType: KozmosMenuContentType

    public init(
        label: String? = nil,
        items: [KozmosMenuItem],
        contentType: KozmosMenuContentType = .basic
    ) {
        self.label = label
        self.items = items
        self.contentType = contentType
    }
}

public struct KozmosMenu: View {
    let title: String
    let content: KozmosMenuContent
    let onItemSelect: (KozmosMenuItem) -> Void
    
    public init(title: String, items: [String], onSelect: @escaping (String) -> Void) {
        self.title = title
        self.content = KozmosMenuContent(items: items.map { KozmosMenuItem(text: $0) })
        self.onItemSelect = { item in onSelect(item.text) }
    }

    public init(
        title: String,
        content: KozmosMenuContent,
        onItemSelect: @escaping (KozmosMenuItem) -> Void = { _ in }
    ) {
        self.title = title
        self.content = content
        self.onItemSelect = onItemSelect
    }
    
    /// The rows the menu draws, which `kozmosContextMenu` draws too.
    var rows: KozmosMenuRows {
        KozmosMenuRows(content: content, onItemSelect: onItemSelect)
    }

    public var body: some View {
        Menu(title) {
            rows
        }
    }
}

/// A menu's rows: its label and its items, as `KozmosMenu` and
/// `kozmosContextMenu` both draw them, inside SwiftUI's `Menu` and
/// `.contextMenu`, which the system draws.
struct KozmosMenuRows: View {
    let content: KozmosMenuContent
    let onItemSelect: (KozmosMenuItem) -> Void

    @Environment(\.layoutDirection) private var layoutDirection
    @Environment(\.displayScale) private var displayScale
    /// The new-tab icon's side: the body text's size, as a link's icon is.
    @ScaledMetric(relativeTo: .body) private var iconSide: CGFloat = 17

    var body: some View {
        if let label = content.label {
            Text(label)
                .font(KozmosTypography.caption)
                .foregroundColor(KozmosColors.primitivesColorsForeground500)
            Divider().overlay(KozmosColors.semanticsBorderSubtle)
        }

        ForEach(content.items) { item in
            menuRow(for: item)
                .modifier(KozmosMenuExternalHint(item: item))
        }
    }

    @ViewBuilder
    private func menuRow(for item: KozmosMenuItem) -> some View {
        switch content.contentType {
        case .basic:
            Button {
                onItemSelect(item)
            } label: {
                if item.external {
                    Label { title(item) } icon: { newTabIcon }
                } else {
                    title(item)
                }
            }
        case .checkbox:
            Button {
                onItemSelect(item)
            } label: {
                Label(item.text, systemImage: item.isChecked ? "checkmark" : "square")
            }
        case .radio:
            Button {
                onItemSelect(item)
            } label: {
                Label(item.text, systemImage: item.isSelected ? "largecircle.fill.circle" : "circle")
            }
        case .submenu:
            if item.submenuItems.isEmpty {
                if item.external {
                    Button {
                        onItemSelect(item)
                    } label: {
                        Label { Text(item.text) } icon: { newTabIcon }
                    }
                } else {
                    Button(item.text) {
                        onItemSelect(item)
                    }
                }
            } else {
                Menu(item.text) {
                    ForEach(item.submenuItems, id: \.self) { submenuItem in
                        Button(submenuItem) {
                            onItemSelect(
                                KozmosMenuItem(
                                    id: "\(item.id)/\(submenuItem)",
                                    text: submenuItem
                                )
                            )
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func title(_ item: KozmosMenuItem) -> some View {
        HStack {
            Text(item.text)

            if let shortcut = item.shortcut {
                Spacer()
                Text(shortcut)
                    .foregroundColor(KozmosColors.primitivesColorsForeground500)
            }
        }
    }

    /// Pointr's new-tab icon as an image, the one thing besides text a
    /// system menu row draws: a template the menu tints as its words,
    /// pointing to the row's end (mirrored right to left).
    var newTabIcon: Image {
        KozmosNewTabImage.image(side: iconSide, scale: displayScale, mirrored: layoutDirection == .rightToLeft)
    }
}

/// An external item's hint, "Opens in your browser" or the product's words.
private struct KozmosMenuExternalHint: ViewModifier {
    let item: KozmosMenuItem

    func body(content: Content) -> some View {
        if item.external && !item.externalLabel.isEmpty {
            content.accessibilityHint(Text(verbatim: item.externalLabel))
        } else {
            content
        }
    }
}

/// `KozmosLink.newTabGlyph`, Pointr's `link-external-01`, drawn into a
/// bitmap: a system menu (UIMenu, NSMenu) draws a row's text and image and
/// nothing else, so a shape there is dropped. Stroked 2 on its 24 grid, as
/// the link's icon is, and a template, so the menu tints it as its text.
enum KozmosNewTabImage {
    static func cgImage(side: CGFloat, scale: CGFloat, mirrored: Bool) -> CGImage? {
        let pixels = max(1, Int((side * scale).rounded(.up)))
        guard let context = CGContext(
            data: nil, width: pixels, height: pixels, bitsPerComponent: 8, bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return nil }
        // Core Graphics counts up from the bottom; the glyph counts down.
        context.translateBy(x: 0, y: CGFloat(pixels))
        context.scaleBy(x: scale, y: -scale)
        if mirrored {
            context.translateBy(x: side, y: 0)
            context.scaleBy(x: -1, y: 1)
        }
        let outline = KozmosLink.newTabGlyph
            .path(in: CGRect(x: 0, y: 0, width: side, height: side))
            .strokedPath(KozmosPointrGlyph.style(size: side))
        context.addPath(outline.cgPath)
        context.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 1))
        context.fillPath()
        return context.makeImage()
    }

    static func image(side: CGFloat, scale: CGFloat, mirrored: Bool) -> Image {
        guard let drawn = cgImage(side: side, scale: max(scale, 1), mirrored: mirrored) else {
            return Image(systemName: "arrow.up.forward.square")
        }
        #if canImport(UIKit)
        return Image(uiImage: UIImage(cgImage: drawn, scale: max(scale, 1), orientation: .up)
            .withRenderingMode(.alwaysTemplate))
        #else
        return Image(decorative: drawn, scale: max(scale, 1)).renderingMode(.template)
        #endif
    }
}
