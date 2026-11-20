import SwiftUI
import Figma

struct KozmosDialogBasicConnect: FigmaConnect {
    let component = KozmosDialog<EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=143-13060"
    var variant = ["Content": "Basic"]

    @FigmaString("Title Text")
    var title: String = "Edit profile"

    @FigmaString("Description Text")
    var description: String = "Make changes to your profile here."

    @FigmaString("Body Text")
    var bodyText: String = "Use dialog body content for a short task, form, or confirmation."

    var body: some View {
        KozmosDialog(
            isPresented: .constant(true),
            title: self.title,
            description: self.description,
            bodyText: self.bodyText
        )
    }
}

struct KozmosDialogFormConnect: FigmaConnect {
    let component = KozmosDialog<EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=143-13060"
    var variant = ["Content": "Form"]

    @FigmaString("Title Text")
    var title: String = "Edit profile"

    @FigmaString("Description Text")
    var description: String = "Make changes to your profile here."

    @FigmaString("Body Text")
    var bodyText: String = "Use dialog body content for a short task, form, or confirmation."

    var body: some View {
        KozmosDialog(
            isPresented: .constant(true),
            title: self.title,
            description: self.description,
            bodyText: self.bodyText,
            primaryActionTitle: "Save changes",
            onPrimaryAction: {}
        )
    }
}

struct KozmosDialogFooterConnect: FigmaConnect {
    let component = KozmosDialog<EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=143-13060"
    var variant = ["Content": "Footer"]

    @FigmaString("Title Text")
    var title: String = "Review changes"

    @FigmaString("Description Text")
    var description: String = "Confirm the details before continuing."

    @FigmaString("Body Text")
    var bodyText: String = "Use dialog body content for a short task, form, or confirmation."

    var body: some View {
        KozmosDialog(
            isPresented: .constant(true),
            title: self.title,
            description: self.description,
            bodyText: self.bodyText,
            primaryActionTitle: "Save changes",
            secondaryActionTitle: "Cancel",
            onPrimaryAction: {},
            onSecondaryAction: {}
        )
    }
}

// Decision 195, GAP-214: an illustration above the title, out to the
// dialog's edges and top corners.
struct KozmosDialogMediaConnect: FigmaConnect {
    let component = KozmosDialog<EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=143-13060"
    var variant = ["Content": "Media"]

    @FigmaString("Title Text")
    var title: String = "Edit profile"

    @FigmaString("Description Text")
    var description: String = "Make changes to your profile here."

    @FigmaString("Body Text")
    var bodyText: String = "Use dialog body content for a short task, form, or confirmation."

    var body: some View {
        KozmosDialog(
            isPresented: .constant(true),
            title: self.title,
            description: self.description,
            bodyText: self.bodyText
        )
        .media(bleeds: true) {
            Image("Illustration")
                .resizable()
                .scaledToFill()
                .frame(height: 160)
                .clipped()
        }
    }
}

// Decision 202, GAP-259: the window less 16 on each side, for media shown
// large.
struct KozmosDialogFullConnect: FigmaConnect {
    let component = KozmosDialog<EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=143-13060"
    var variant = ["Content": "Full"]

    @FigmaString("Title Text")
    var title: String = "Edit profile"

    @FigmaString("Description Text")
    var description: String = "Make changes to your profile here."

    @FigmaString("Body Text")
    var bodyText: String = "Use dialog body content for a short task, form, or confirmation."

    var body: some View {
        KozmosDialog(
            isPresented: .constant(true),
            title: self.title,
            description: self.description,
            bodyText: self.bodyText,
            size: .full
        )
    }
}
