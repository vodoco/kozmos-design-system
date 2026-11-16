import SwiftUI

public struct KozmosList<Content: View>: View {
    let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        List {
            content
        }
        .listStyle(PlainListStyle())
    }
}

/// A row of a `KozmosList`. Its text alone, or, with any of its slots
/// (GAP-195, decision 135), React's ListItem filled in: a mark at the start,
/// centred on the title's line; the title with something beside it, a
/// description and a meta line under it; one control at the end. The
/// checklist row and the settings row are this row.
///
/// ```swift
/// KozmosListItem("Explore the map", description: "Pan, zoom and change levels.", meta: "2 min")
///     .leading { KozmosListItemStatus(.done) }
///     .titleAddon { KozmosTag("Viewer", variant: .secondary) }
///     .trailing { KozmosButton("Replay", size: .sm) {} }
/// ```
///
/// VoiceOver reads the slots in their order, so a status at the start is
/// heard before the title. `selected` tints the row theme 0, as a ticked
/// persona's row is; it is drawn only: the row's control says it is checked.
public struct KozmosListItem: View {
    let text: String
    let descriptionText: String?
    let metaText: String?
    let selected: Bool
    var leadingView: AnyView?
    var titleAddonView: AnyView?
    var metaView: AnyView?
    var trailingView: AnyView?

    /// - Parameters:
    ///   - text: The row's text, or its title once it has slots.
    ///   - description: Under the title, in the muted colour.
    ///   - meta: Under the description, smaller, in the muted colour.
    ///   - selected: Tinted, theme 0: a row whose box is ticked.
    public init(
        _ text: String,
        description: String? = nil,
        meta: String? = nil,
        selected: Bool = false
    ) {
        self.text = text
        self.descriptionText = description
        self.metaText = meta
        self.selected = selected
    }

    /// At the start, centred on the title's line: a `KozmosListItemStatus`,
    /// an icon, a persona's mark.
    public func leading<V: View>(@ViewBuilder _ content: () -> V) -> KozmosListItem {
        var copy = self
        copy.leadingView = AnyView(content())
        return copy
    }

    /// Beside the title: a role tag, an info button, a setting's state.
    public func titleAddon<V: View>(@ViewBuilder _ content: () -> V) -> KozmosListItem {
        var copy = self
        copy.titleAddonView = AnyView(content())
        return copy
    }

    /// Under the description, in place of `meta`'s words: a line of views.
    public func metaContent<V: View>(@ViewBuilder _ content: () -> V) -> KozmosListItem {
        var copy = self
        copy.metaView = AnyView(content())
        return copy
    }

    /// At the end, centred on the row: the row's one control.
    public func trailing<V: View>(@ViewBuilder _ content: () -> V) -> KozmosListItem {
        var copy = self
        copy.trailingView = AnyView(content())
        return copy
    }

    /// Whether the row draws its slots rather than its text alone.
    var isSlotted: Bool {
        descriptionText != nil || metaText != nil || selected || leadingView != nil
            || titleAddonView != nil || metaView != nil || trailingView != nil
    }

    public var body: some View {
        if isSlotted {
            slotted
        } else {
            Text(text)
        }
    }

    /// React's tint: theme 0, CardHeader's subtle strip.
    private var tint: Color { selected ? KozmosColors.primitivesColorsTheme0 : Color.clear }

    private var slotted: some View {
        HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            if let leadingView {
                // Centred on the title's 20 line.
                leadingView.frame(minHeight: 20)
            }
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    Text(text)
                        .font(KozmosTypography.subheadline.weight(.medium))
                        .foregroundColor(KozmosColors.primitivesColorsForeground0)
                        .fixedSize(horizontal: false, vertical: true)
                    if let titleAddonView { titleAddonView }
                }
                if let descriptionText {
                    Text(descriptionText)
                        .font(KozmosTypography.subheadline)
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                        .fixedSize(horizontal: false, vertical: true)
                }
                if let metaView {
                    metaView
                        .font(KozmosTypography.caption)
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                } else if let metaText {
                    Text(metaText)
                        .font(KozmosTypography.caption)
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            if let trailingView {
                trailingView.frame(maxHeight: .infinity, alignment: .center)
            }
        }
        .background(tint)
        .listRowBackground(selected ? KozmosColors.primitivesColorsTheme0 : nil)
    }
}

/// A checklist row's status (GAP-195): not started, in progress, or done.
public enum KozmosListItemStatusValue: Equatable {
    case todo, inProgress, done

    /// What VoiceOver reads by default, in English.
    public var defaultLabel: String {
        switch self {
        case .todo: return "Not started"
        case .inProgress: return "In progress"
        case .done: return "Done"
        }
    }
}

/// A checklist row's status mark, for `KozmosListItem.leading`: Stepper's
/// step marks at 20, as React's ListItemStatus draws them. Done is the theme
/// fill with a check; in progress a 2pt theme ring round an 8pt dot; not
/// started a 1pt ring in foreground 500. One element, read by its words,
/// "Done" by default: first in the row, so the status is heard with the
/// title.
public struct KozmosListItemStatus: View {
    let status: KozmosListItemStatusValue
    let label: String?

    public init(_ status: KozmosListItemStatusValue, label: String? = nil) {
        self.status = status
        self.label = label
    }

    var spokenLabel: String { label ?? status.defaultLabel }

    public var body: some View {
        ZStack {
            switch status {
            case .done:
                Circle().fill(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle)
                Image(systemName: "checkmark")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle)
            case .inProgress:
                Circle().strokeBorder(KozmosColors.primitivesColorsTheme600, lineWidth: 2)
                Circle()
                    .fill(KozmosColors.primitivesColorsTheme600)
                    .frame(width: 8, height: 8)
            case .todo:
                Circle().strokeBorder(KozmosColors.primitivesColorsForeground500, lineWidth: 1)
            }
        }
        .frame(width: 20, height: 20)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(verbatim: spokenLabel))
    }
}
