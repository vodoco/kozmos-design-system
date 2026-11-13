import SwiftUI
import Figma

// GAP-106: a new set, so its node id is written once the importer has built
// it in the live file; until then this file stays out of
// figma.linked.config.json. Form is the mark's form: Single is one persona's
// diamond, Group the diamonds of the personas a row is visible to. The
// colour is the persona's, product data that Figma holds as the diamond's
// fill, not as a property.
struct KozmosPersonaMarkSingleConnect: FigmaConnect {
    let component = KozmosPersonaMark.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD"
    var variant = ["Form": "Single"]

    var body: some View {
        KozmosPersonaMark(color: .orange)
    }
}

struct KozmosPersonaMarkGroupConnect: FigmaConnect {
    let component = KozmosPersonaMarkGroup.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD"
    var variant = ["Form": "Group"]

    var body: some View {
        KozmosPersonaMarkGroup([
            KozmosPersonaMarkPersona(name: "Customer", color: .orange),
            KozmosPersonaMarkPersona(name: "Visitor", color: .blue),
            KozmosPersonaMarkPersona(name: "Staff", color: .green),
        ])
    }
}
