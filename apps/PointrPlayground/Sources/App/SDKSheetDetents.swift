import Kozmos

/// Where the shell's sheet rests as places open and close and routes begin and
/// end. The screen feeds it the session's selection and phase together, and
/// binds the shell's detent to it, so every transition is a value that can be
/// tested without SwiftUI or the SDK.
///
/// Two returns are kept, each captured once and restored once:
/// - **The search sheet's**, where it rested when a place opened from it.
///   Captured only when a place opens with none open, kept while another
///   place replaces it and through its routes, restored when the place closes.
/// - **The card's**, where it rested when its route began. Restored when the
///   route is cancelled or ends and the card comes back.
///
/// A place opens at half height; the starting-point picker needs its list, at
/// half height too; the directions hold a summary and a row of buttons, and
/// rest fitted to them so the map has the rest.
struct SDKSheetDetents: Equatable {
    /// The session's side: what is selected, and the routing phase.
    struct Input: Equatable {
        var selection: String?
        var phase: SDKSession.Phase
    }

    /// The shell's detent. The screen binds the shell to it, so the visitor's
    /// drags land here too.
    var detent: KozmosMapPanelDetent = .collapsed
    /// The selection and phase as last fed.
    private(set) var input = Input(selection: nil, phase: .browse)
    /// Where the search sheet returns when the place closes; nil while no
    /// place is open.
    private(set) var searchReturn: KozmosMapPanelDetent?
    /// Where the card returns when its route is cancelled or ends; nil outside
    /// a route.
    private(set) var cardReturn: KozmosMapPanelDetent?

    /// The session's selection and phase as they now are, in one step: a place
    /// tapped on the map mid-route changes both at once.
    mutating func update(_ new: Input) {
        let old = input
        input = new
        switch (old.selection, new.selection) {
        case (nil, .some):
            // A place opens from the search sheet.
            searchReturn = detent
            cardReturn = nil
            if new.phase == .browse { detent = .medium }
        case let (.some(was), .some(now)) where was != now:
            // Another place replaces it: the search sheet's return stays, and
            // a route begun for the old place has ended with it.
            cardReturn = nil
            if new.phase == .browse { detent = .medium }
        case (.some, nil):
            // The place closes, mid-route or not: the search sheet returns.
            detent = searchReturn ?? detent
            searchReturn = nil
            cardReturn = nil
            return
        default:
            break
        }
        guard new.selection != nil, new.phase != old.phase else { return }
        switch new.phase {
        case .routeSetup, .directions:
            if old.phase == .browse, new.selection == old.selection { cardReturn = detent }
            detent = new.phase == .directions ? .content : .medium
        case .browse:
            // Back from a route to its place's card.
            if new.selection == old.selection { detent = cardReturn ?? .medium }
            cardReturn = nil
        }
    }
}
