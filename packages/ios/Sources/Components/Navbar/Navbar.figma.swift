import SwiftUI
import Figma

// NavigationAlign=Center only: SwiftUI centres the navigation and has no
// navigationAlign yet (GAP-196 is web and Figma first), so a Start or End
// instance shows no SwiftUI snippet rather than a centred one.

struct KozmosNavbarBasicConnect: FigmaConnect {
    let component = KozmosNavbar.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=752-6765"
    var variant = ["Content": "Basic", "NavigationAlign": "Center"]

    var body: some View {
        KozmosNavbar(
            logo: {
                Text("Logo")
            },
            context: {
                EmptyView()
            },
            navigation: {
                EmptyView()
            },
            primaryAction: {
                EmptyView()
            },
            actions: {
                EmptyView()
            },
            utilities: {
                EmptyView()
            },
            account: {
                EmptyView()
            }
        )
    }
}

struct KozmosNavbarActionsConnect: FigmaConnect {
    let component = KozmosNavbar.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=752-6765"
    var variant = ["Content": "Actions", "NavigationAlign": "Center"]

    var body: some View {
        KozmosNavbar(
            logo: {
                Text("Logo")
            },
            context: {
                EmptyView()
            },
            navigation: {
                EmptyView()
            },
            primaryAction: {
                EmptyView()
            },
            actions: {
                Text("Actions")
            },
            utilities: {
                EmptyView()
            },
            account: {
                EmptyView()
            }
        )
    }
}

struct KozmosNavbarContextualConnect: FigmaConnect {
    let component = KozmosNavbar.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=752-6765"
    var variant = ["Content": "Contextual", "NavigationAlign": "Center"]

    var body: some View {
        KozmosNavbar(
            logo: {
                Text("Logo")
            },
            context: {
                VStack(alignment: .leading) {
                    Text("Context")
                }
            },
            navigation: {
                Text("Navigation")
            },
            primaryAction: {
                KozmosButton("Primary action", action: {})
            },
            actions: {
                Text("Actions")
            },
            utilities: {
                Text("Utility")
            },
            account: {
                Text("Account")
            }
        )
    }
}
