import SwiftUI
import Figma

// GAP-036: the PageHeader set. Its node id is a placeholder until the set is
// built in the live file, so this file stays out of figma.linked.config.json.
// Tone and Size are the variants; the booleans show the breadcrumb, the info
// button, the description and the actions.
struct KozmosPageHeaderConnect: FigmaConnect {
    let component = KozmosPageHeader<EmptyView, EmptyView, EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD"

    @FigmaEnum(
        "Tone",
        mapping: [
            "Subtle": KozmosPageHeaderTone.subtle,
            "Default": KozmosPageHeaderTone.default
        ]
    )
    var tone: KozmosPageHeaderTone = .subtle

    @FigmaEnum(
        "Size",
        mapping: [
            "Medium": KozmosPageHeaderSize.md,
            "Large": KozmosPageHeaderSize.lg
        ]
    )
    var size: KozmosPageHeaderSize = .md

    @FigmaString("Title Text")
    var title: String = "Settings"

    @FigmaBoolean("Description")
    var showDescription: Bool = true

    @FigmaString("Description Text")
    var descriptionText: String = "Manage the site's map, its levels and who can edit them."

    @FigmaBoolean("Breadcrumb")
    var showBreadcrumb: Bool = true

    @FigmaBoolean("Info")
    var showInfo: Bool = false

    @FigmaBoolean("Actions")
    var showActions: Bool = true

    var body: some View {
        KozmosPageHeader(
            self.title,
            description: self.showDescription ? self.descriptionText : nil,
            tone: self.tone,
            size: self.size,
            breadcrumb: {
                if self.showBreadcrumb {
                    KozmosBreadcrumb(items: ["Boston Logan Airport", "Settings"], onSelect: { _ in })
                }
            },
            info: {
                if self.showInfo {
                    KozmosIconButton(iconName: "info-circle") {}
                        .accessibilityLabel("About this page")
                }
            },
            actions: {
                if self.showActions {
                    KozmosButton("Save changes") {}
                }
            }
        )
    }
}
