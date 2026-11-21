import SwiftUI
import Figma

// GAP-036: the PageHeader set. Its node id is the set built in the live file
// (2446:23074).
// Tone and Size are the variants; the booleans show the breadcrumb, the info
// button, the description and the actions.
struct KozmosPageHeaderConnect: FigmaConnect {
    let component = KozmosPageHeader<EmptyView, EmptyView, EmptyView>.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2446-23074"

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

    // Decision 210: a node beside the title and outside its heading, drawn
    // as a status Tag in the alert emotion.
    @FigmaBoolean("Show Title Addon")
    var showTitleAddon: Bool = false

    @FigmaString("Addon Text")
    var addonText: String = "Changes Awaiting Publish"

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
                    KozmosIconButton(iconName: "info.circle") {}
                        .accessibilityLabel("About this page")
                }
            },
            actions: {
                if self.showActions {
                    KozmosButton("Save changes") {}
                }
            }
        )
        .titleAddon {
            if self.showTitleAddon {
                KozmosTag(self.addonText, emotion: .alert)
            }
        }
    }
}
