// Button.mdx's SwiftUI snippet ("Disabled"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Disabled, a Button is drawn from the disabled pair, not at half: the
// pair's fill under its foreground on a filled variant, its foreground alone
// on outline (its edge too), ghost, link and glass. It takes no touch, and
// VoiceOver hears it dimmed. Loading disables it and draws the same.
struct TourNextButton: View {
    let canContinue: Bool
    let next: () -> Void

    var body: some View {
        KozmosButton("Next", isDisabled: !canContinue, action: next)
    }
}
