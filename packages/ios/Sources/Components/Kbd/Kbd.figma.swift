import SwiftUI
import Figma

// GAP-156: Keys is the form. Single is one cap; Combination is caps joined by
// a "+", Modifier Text the first of `keys` and Key Text the last.
struct KozmosKbdSingleConnect: FigmaConnect {
    let component = KozmosKbd.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11942"
    var variant = ["Keys": "Single"]

    @FigmaString("Key Text")
    var key: String = "Esc"

    var body: some View {
        KozmosKbd(self.key)
    }
}

struct KozmosKbdCombinationConnect: FigmaConnect {
    let component = KozmosKbd.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2407-11942"
    var variant = ["Keys": "Combination"]

    @FigmaString("Key Text")
    var key: String = "C"

    @FigmaString("Modifier Text")
    var modifier: String = "Ctrl"

    // Code Connect fills a property given as a call's argument, or a bare
    // name as a declaration's value, never an array element:
    // `[self.modifier, self.key]` reached Dev Mode as `[modifier, key]`.
    var body: some View {
        let chordModifier = modifier
        let chordKey = key
        KozmosKbd(keys: [chordModifier, chordKey])
    }
}
