import SwiftUI

public extension View {
    /// A context menu on the view (GAP-155): the same rows `KozmosMenu`
    /// draws, from the same `KozmosMenuContent`, opened as the system opens
    /// a context menu. A long press on touch; a secondary click on a pointer
    /// (iPad, Mac Catalyst, macOS). VoiceOver offers it as the element's
    /// menu. The system draws it, as it draws `KozmosMenu`.
    ///
    /// - Parameters:
    ///   - content: The menu's label and items, as `KozmosMenu` takes them.
    ///   - onItemSelect: Called with the item picked; the menu closes.
    func kozmosContextMenu(
        _ content: KozmosMenuContent,
        onItemSelect: @escaping (KozmosMenuItem) -> Void = { _ in }
    ) -> some View {
        modifier(KozmosContextMenuModifier(content: content, onItemSelect: onItemSelect))
    }
}

/// SwiftUI's `.contextMenu` with `KozmosMenu`'s rows.
struct KozmosContextMenuModifier: ViewModifier {
    let content: KozmosMenuContent
    let onItemSelect: (KozmosMenuItem) -> Void

    /// The rows the menu draws: `KozmosMenu`'s own.
    var rows: KozmosMenuRows {
        KozmosMenuRows(content: content, onItemSelect: onItemSelect)
    }

    func body(content view: Content) -> some View {
        view.contextMenu { rows }
    }
}
