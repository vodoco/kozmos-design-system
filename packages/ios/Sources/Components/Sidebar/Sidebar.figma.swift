import SwiftUI
import Figma

struct KozmosSidebarBasicConnect: FigmaConnect {
    let component = KozmosSidebar<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=752-6807"
    var variant = ["Content": "Basic"]

    // GAP-199: the room above the first slot.
    @FigmaEnum("Inset", mapping: ["Default": KozmosSidebarInset.`default`, "Flush": KozmosSidebarInset.flush])
    var inset: KozmosSidebarInset = .default

    var body: some View {
        KozmosSidebar(
            variant: .expanded,
            inset: self.inset,
            header: {
                Text("Header")
            },
            navigation: {
                AnyView(Text("Navigation"))
            },
            tools: {
                EmptyView()
            },
            footer: {
                Text("Footer")
            }
        )
    }
}

struct KozmosSidebarSectionsConnect: FigmaConnect {
    let component = KozmosSidebar<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=752-6807"
    var variant = ["Content": "Sections"]

    // GAP-199: the room above the first slot.
    @FigmaEnum("Inset", mapping: ["Default": KozmosSidebarInset.`default`, "Flush": KozmosSidebarInset.flush])
    var inset: KozmosSidebarInset = .default

    var body: some View {
        KozmosSidebar(
            variant: .expanded,
            inset: self.inset,
            header: {
                Text("Header")
            },
            navigation: {
                AnyView(
                    VStack(alignment: .leading) {
                        Text("Section")
                        Text("Navigation")
                    }
                )
            },
            tools: {
                EmptyView()
            },
            footer: {
                Text("Footer")
            }
        )
    }
}

struct KozmosSidebarToolsConnect: FigmaConnect {
    let component = KozmosSidebar<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=752-6807"
    var variant = ["Content": "Tools"]

    // GAP-199: the room above the first slot.
    @FigmaEnum("Inset", mapping: ["Default": KozmosSidebarInset.`default`, "Flush": KozmosSidebarInset.flush])
    var inset: KozmosSidebarInset = .default

    var body: some View {
        KozmosSidebar(
            variant: .expanded,
            inset: self.inset,
            header: {
                Text("Header")
            },
            navigation: {
                AnyView(
                    VStack(alignment: .leading) {
                        Text("Section")
                        Text("Navigation")
                    }
                )
            },
            tools: {
                Text("Tools")
            },
            footer: {
                Text("Footer")
            }
        )
    }
}

struct KozmosSidebarRailConnect: FigmaConnect {
    let component = KozmosSidebar<AnyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=752-6807"
    var variant = ["Content": "Rail"]

    // GAP-199: the room above the first slot.
    @FigmaEnum("Inset", mapping: ["Default": KozmosSidebarInset.`default`, "Flush": KozmosSidebarInset.flush])
    var inset: KozmosSidebarInset = .default

    var body: some View {
        KozmosSidebar(
            variant: .rail,
            inset: self.inset,
            header: {
                Text("Header")
            },
            navigation: {
                AnyView(Text("Navigation"))
            },
            tools: {
                EmptyView()
            },
            footer: {
                Text("Footer")
            }
        )
    }
}
