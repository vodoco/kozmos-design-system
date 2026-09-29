import Kozmos

/// Where the shell's sheet rests as places open and close and routes begin and
/// end. The screen feeds it the session's selection and phase together, and
/// binds the shell's detent to it, so every transition is a value that can be
/// tested without SwiftUI or the SDK.
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
    /// Where the search sheet was when a place opened.
    private(set) var searchReturn: KozmosMapPanelDetent = .collapsed

    /// The session's selection and phase as they now are.
    mutating func update(_ new: Input) {
        let old = input
        input = new
        // The phase's handler, then the selection's, in the order the screen
        // declared them.
        if new.phase != old.phase {
            switch new.phase {
            case .directions: detent = .content
            case .routeSetup: detent = .medium
            case .browse: detent = searchReturn
            }
        }
        if new.selection != old.selection, new.phase == .browse {
            if new.selection != nil {
                searchReturn = detent
                detent = .medium
            } else {
                detent = searchReturn
            }
        }
    }
}
