import SwiftUI

public struct KozmosTable<Data: RandomAccessCollection, RowContent: View>: View where Data.Element: Identifiable {
    let data: Data
    let rowContent: (Data.Element) -> RowContent
    /// A selectable table's selection (GAP-171), else nil.
    let selection: Binding<Set<Data.Element.ID>>?
    let selectAllLabel: String
    let rowSelectLabel: (Data.Element) -> String
    let selectionAnnouncement: (Int, Int) -> String

    public init(_ data: Data, @ViewBuilder rowContent: @escaping (Data.Element) -> RowContent) {
        self.data = data
        self.rowContent = rowContent
        self.selection = nil
        self.selectAllLabel = ""
        self.rowSelectLabel = { _ in "" }
        self.selectionAnnouncement = KozmosTableSelection.announcement
    }

    /// A table whose rows can be selected (GAP-171), React's `selectable`
    /// Table. Each row starts with a checkbox that selects it, named by
    /// `rowSelectLabel` (pass the row's own words: "Select Ada Lovelace");
    /// a first row holds a checkbox, `selectAllLabel`, that selects every
    /// row, mixed while some are, and clears them all when they all are. A
    /// selected row is drawn on the hover fill with no divider under it
    /// (decision 207). VoiceOver hears the count as the select-all box's
    /// value, and is told it when it changes: `selectionAnnouncement`, given
    /// the count and the rows, "No rows selected", "1 row selected" and "3
    /// rows selected" by default.
    ///
    /// `selection` holds the selected rows' ids. Selecting all adds this
    /// table's rows to it and clearing takes them out, so ids of rows it no
    /// longer draws are kept, as React's are.
    public init(
        _ data: Data,
        selection: Binding<Set<Data.Element.ID>>,
        selectAllLabel: String = "Select all rows",
        rowSelectLabel: @escaping (Data.Element) -> String = { _ in "Select row" },
        selectionAnnouncement: @escaping (Int, Int) -> String = KozmosTableSelection.announcement,
        @ViewBuilder rowContent: @escaping (Data.Element) -> RowContent
    ) {
        self.data = data
        self.rowContent = rowContent
        self.selection = selection
        self.selectAllLabel = selectAllLabel
        self.rowSelectLabel = rowSelectLabel
        self.selectionAnnouncement = selectionAnnouncement
    }

    private var rowIds: [Data.Element.ID] { data.map(\.id) }

    public var body: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            if let selection {
                selectAllRow(selection)
            }
            ForEach(data) { item in
                if let selection {
                    selectableRow(item, selection)
                } else {
                    VStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
                        rowContent(item)
                        Divider().overlay(KozmosColors.semanticsBorderSubtle)
                    }
                }
            }
        }
        .background(KozmosColors.primitivesColorsBackground0)
        .cornerRadius(KozmosDimensions.semanticsRadiusControl)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(KozmosColors.primitivesColorsBackground300, lineWidth: 1)
        )
    }

    /// The first row: the checkbox that selects every row, its state from
    /// how many are, and the count as its value.
    @ViewBuilder
    private func selectAllRow(_ selection: Binding<Set<Data.Element.ID>>) -> some View {
        let ids = rowIds
        let count = ids.filter { selection.wrappedValue.contains($0) }.count
        let words = selectionAnnouncement(selection.wrappedValue.count, ids.count)
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            HStack {
                KozmosCheckbox(
                    checked: Binding(
                        get: { KozmosTableSelection.headerState(selected: count, total: ids.count) },
                        set: { next in
                            selection.wrappedValue = KozmosTableSelection.selectingAll(
                                next == .checked, rows: ids, in: selection.wrappedValue)
                        }
                    ),
                    label: selectAllLabel,
                    disabled: ids.isEmpty
                )
                .accessibilityValue(Text(verbatim: words))
                Spacer(minLength: 0)
            }
            .padding(.horizontal)
            Divider().overlay(KozmosColors.semanticsBorderSubtle)
        }
        .onChange(of: selection.wrappedValue.count) { _ in
            KozmosTableSelection.announce(selectionAnnouncement(selection.wrappedValue.count, ids.count))
        }
    }

    /// A row with its checkbox first, on the hover fill while selected, with
    /// no divider under it then (decision 207); its 1pt stays, clear, so no
    /// row moves when the selection does.
    @ViewBuilder
    private func selectableRow(_ item: Data.Element, _ selection: Binding<Set<Data.Element.ID>>) -> some View {
        let selected = selection.wrappedValue.contains(item.id)
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
                KozmosCheckbox(
                    checked: Binding(
                        get: { selection.wrappedValue.contains(item.id) },
                        set: { on in
                            if on { selection.wrappedValue.insert(item.id) } else { selection.wrappedValue.remove(item.id) }
                        }
                    )
                )
                .accessibilityLabel(Text(verbatim: rowSelectLabel(item)))
                .padding(.leading)
                rowContent(item)
            }
            .background(KozmosTableSelection.fill(selected: selected))
            Divider()
                .overlay(KozmosColors.semanticsBorderSubtle)
                .opacity(KozmosTableSelection.dividerOpacity(selected: selected))
        }
    }
}

/// A selectable table's rules (GAP-171), as React's Table keeps them.
public enum KozmosTableSelection {
    /// What VoiceOver is told when the selection changes, by default:
    /// "No rows selected", "1 row selected", "3 rows selected".
    public static func announcement(count: Int, total: Int) -> String {
        switch count {
        case 0: return "No rows selected"
        case 1: return "1 row selected"
        default: return "\(count) rows selected"
        }
    }

    /// The select-all box: unchecked with none of the rows selected, checked
    /// with all of them, mixed between.
    public static func headerState(selected: Int, total: Int) -> KozmosCheckboxState {
        if selected == 0 || total == 0 { return .unchecked }
        return selected >= total ? .checked : .indeterminate
    }

    /// The selection after the select-all box is set: every row added, or
    /// every row taken out, and any other ids kept.
    public static func selectingAll<ID: Hashable>(_ on: Bool, rows: [ID], in selection: Set<ID>) -> Set<ID> {
        on ? selection.union(rows) : selection.subtracting(rows)
    }

    /// A row's fill: the hover fill while selected, as React's
    /// `data-state=selected` row's `bg-hover-fill`.
    static func fill(selected: Bool) -> Color {
        selected ? KozmosColors.semanticsHoverFill : Color.clear
    }

    /// The divider under a row: none under a selected one (decision 207),
    /// whose fill is the divider's own colour in dark.
    static func dividerOpacity(selected: Bool) -> Double {
        selected ? 0 : 1
    }

    static func announce(_ words: String) {
        #if canImport(UIKit)
        UIAccessibility.post(notification: .announcement, argument: words)
        #endif
    }
}

/// A row's highlight (GAP-276): `.new`, a row just added.
public enum KozmosTableRowHighlight: Hashable, Sendable {
    /// A row just added, so the eye finds it: the informative surface, held
    /// three deliberate durations and faded over a fourth.
    case new

    /// How long the tint holds, and how long it fades, in seconds: 3 × and
    /// 1 × `KozmosMotion`'s deliberate duration, 1.84 s in all. Under Reduce
    /// Motion it holds the whole 1.84 s and clears with no fade.
    func timing(reduceMotion: Bool) -> (hold: TimeInterval, fade: TimeInterval) {
        let deliberate = KozmosMotion.semanticsMotionDurationDeliberate
        return reduceMotion ? (deliberate * 4, 0) : (deliberate * 3, deliberate)
    }
}

public struct KozmosTableRow<Content: View>: View {
    let highlight: KozmosTableRowHighlight?
    let content: Content
    @State private var tinted = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    public init(@ViewBuilder content: () -> Content) {
        self.init(highlight: nil, content: content)
    }

    /// - Parameter highlight: `.new` for a row just added (GAP-276): it tints
    ///   in the informative surface when it appears and fades back, so the
    ///   eye finds it. `nil`, the default, draws the row as before.
    public init(highlight: KozmosTableRowHighlight?, @ViewBuilder content: () -> Content) {
        self.highlight = highlight
        self.content = content()
    }

    /// The row's fill: the informative surface while a highlight is shown,
    /// else none.
    static func fill(highlight: KozmosTableRowHighlight?, shown: Bool) -> Color {
        highlight != nil && shown ? KozmosColors.semanticsEmotionInformativeSurface : Color.clear
    }

    public var body: some View {
        HStack {
            content
        }
        .padding()
        .background(Self.fill(highlight: highlight, shown: tinted))
        .task(id: highlight) { await run() }
    }

    /// Shows the tint, holds it, then fades it with the standard curve, or,
    /// under Reduce Motion, clears it at once.
    @MainActor private func run() async {
        guard let highlight else {
            tinted = false
            return
        }
        let timing = highlight.timing(reduceMotion: reduceMotion)
        tinted = true
        try? await Task.sleep(nanoseconds: UInt64(timing.hold * 1_000_000_000))
        guard !Task.isCancelled else { return }
        if timing.fade > 0 {
            withAnimation(KozmosMotion.semanticsMotionEasingStandard.animation(duration: timing.fade)) { tinted = false }
        } else {
            tinted = false
        }
    }
}

public struct KozmosTableCell: View {
    let text: String
    
    public init(_ text: String) {
        self.text = text
    }
    
    public var body: some View {
        Text(text)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}
