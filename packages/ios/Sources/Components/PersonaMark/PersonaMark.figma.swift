import SwiftUI
import Figma

// GAP-106: the PersonaMark set, built by the importer at 2446:23172. Form
// is the mark's form: Single is one persona's diamond, Group the diamonds of
// the personas a row is visible to. The colour is the persona's, product
// data that Figma holds as the diamond's fill, not as a property.
struct KozmosPersonaMarkSingleConnect: FigmaConnect {
    let component = KozmosPersonaMark.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2446-23172"
    var variant = ["Form": "Single"]

    var body: some View {
        KozmosPersonaMark(color: .orange)
    }
}

struct KozmosPersonaMarkGroupConnect: FigmaConnect {
    let component = KozmosPersonaMarkGroup.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2446-23172"
    var variant = ["Form": "Group"]

    var body: some View {
        KozmosPersonaMarkGroup([
            KozmosPersonaMarkPersona(name: "Customer", color: .orange),
            KozmosPersonaMarkPersona(name: "Visitor", color: .blue),
            KozmosPersonaMarkPersona(name: "Staff", color: .green),
        ])
    }
}
